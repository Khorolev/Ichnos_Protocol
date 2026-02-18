/**
 * Downloads all NHTSA EV Emergency Response Guides using Playwright.
 *
 * NHTSA blocks automated HTTP requests (403), so this script uses
 * headed Chromium to load the ERG page, scrape all PDF links, and
 * download each guide into functional-safety/nhtsa-emergency-response-guides/.
 *
 * Usage: node server/scripts/downloadNhtsaERG.mjs
 *
 * Requires: npx playwright install chromium (run once from e2e/)
 */
import { chromium } from "playwright";
import { existsSync, mkdirSync, statSync } from "fs";
import { join, resolve } from "path";

const DEST_DIR = resolve(
  "server/knowledge-base/pdfs/functional-safety/nhtsa-emergency-response-guides",
);
const ERG_URL = "https://www.nhtsa.gov/emergency-response-guides";
const PAGE_LOAD_WAIT = 15_000;
const DELAY_BETWEEN = 1_500;

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, "_").replace(/\s+/g, "_");
}

async function main() {
  ensureDir(DEST_DIR);

  console.log("\nNHTSA EV Emergency Response Guides Downloader");
  console.log(`Destination: ${DEST_DIR}\n`);

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    acceptDownloads: true,
    locale: "en-US",
    viewport: { width: 1920, height: 1080 },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const page = await context.newPage();

  console.log(`Loading ${ERG_URL} ...`);
  console.log("If the page requires interaction, do so in the browser.\n");

  await page.goto(ERG_URL, { waitUntil: "commit", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => null);
  await new Promise((r) => setTimeout(r, PAGE_LOAD_WAIT));

  // Scrape all PDF links from the page
  const pdfLinks = await page.evaluate(() => {
    const links = [];
    const anchors = document.querySelectorAll('a[href$=".pdf"]');
    anchors.forEach((a) => {
      const href = a.href;
      const text = a.textContent.trim() || a.getAttribute("title") || "";
      if (href && !links.some((l) => l.url === href)) {
        links.push({ url: href, text });
      }
    });
    return links;
  });

  if (pdfLinks.length === 0) {
    console.log("No PDF links found on page. The page may use dynamic loading.");
    console.log("Trying to scroll and expand all sections...\n");

    // Scroll to bottom to trigger lazy loading
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((r) => setTimeout(r, 5_000));

    // Try clicking any expand/show-more buttons
    const expandButtons = await page.$$('button, [role="button"], .accordion-trigger, details summary');
    for (const btn of expandButtons) {
      await btn.click().catch(() => null);
      await new Promise((r) => setTimeout(r, 500));
    }
    await new Promise((r) => setTimeout(r, 3_000));

    // Try broader PDF link search
    const allLinks = await page.evaluate(() => {
      const links = [];
      const anchors = document.querySelectorAll("a");
      anchors.forEach((a) => {
        const href = a.href || "";
        if (href.toLowerCase().includes(".pdf")) {
          const text = a.textContent.trim() || a.getAttribute("title") || "";
          if (!links.some((l) => l.url === href)) {
            links.push({ url: href, text });
          }
        }
      });
      return links;
    });
    pdfLinks.push(...allLinks);
  }

  if (pdfLinks.length === 0) {
    console.log("Still no PDF links found. The page structure may have changed.");
    console.log("Dumping page links for manual inspection:\n");

    const allAnchors = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a"))
        .map((a) => ({ href: a.href, text: a.textContent.trim().slice(0, 80) }))
        .filter((a) => a.href && !a.href.startsWith("javascript"));
    });
    allAnchors.slice(0, 50).forEach((a) => console.log(`  ${a.text} → ${a.href}`));

    await browser.close();
    return;
  }

  console.log(`Found ${pdfLinks.length} PDF links.\n`);

  const results = { ok: 0, failed: 0, skipped: 0 };

  for (let i = 0; i < pdfLinks.length; i++) {
    const link = pdfLinks[i];
    const urlParts = new URL(link.url);
    const filename = sanitizeFilename(decodeURIComponent(urlParts.pathname.split("/").pop()));
    const destPath = join(DEST_DIR, filename);

    console.log(`[${i + 1}/${pdfLinks.length}] ${filename}`);

    if (existsSync(destPath) && statSync(destPath).size > 5000) {
      const size = statSync(destPath).size;
      console.log(`  SKIP (exists, ${(size / 1_048_576).toFixed(2)} MB)`);
      results.skipped++;
      continue;
    }

    try {
      const dlPage = await context.newPage();
      let pdfBuffer = null;

      // Intercept the network response to capture raw PDF bytes
      // before the browser's PDF viewer renders them inline.
      // route.fetch() goes through the browser's network stack
      // (same cookies/session, no CORS restrictions).
      await dlPage.route("**/*", async (route) => {
        const response = await route.fetch();
        pdfBuffer = await response.body();
        await route.fulfill({ response });
      });

      await dlPage.goto(link.url, {
        waitUntil: "commit",
        timeout: 60_000,
      }).catch(() => null);

      await dlPage.close();

      if (pdfBuffer && pdfBuffer.length > 1000) {
        const { writeFileSync } = await import("fs");
        writeFileSync(destPath, pdfBuffer);
        console.log(`  OK (${(pdfBuffer.length / 1_048_576).toFixed(2)} MB)`);
        results.ok++;
      } else {
        console.log(`  FAIL (no data or too small: ${pdfBuffer?.length || 0} bytes)`);
        results.failed++;
      }
    } catch (err) {
      console.log(`  ERROR: ${err.message.slice(0, 80)}`);
      results.failed++;
    }

    if (i < pdfLinks.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN));
    }
  }

  await browser.close();

  console.log(`\n${"=".repeat(50)}`);
  console.log("DOWNLOAD SUMMARY");
  console.log(`${"=".repeat(50)}`);
  console.log(`  Downloaded:  ${results.ok}`);
  console.log(`  Skipped:     ${results.skipped}`);
  console.log(`  Failed:      ${results.failed}`);
  console.log(`  Total:       ${pdfLinks.length}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
