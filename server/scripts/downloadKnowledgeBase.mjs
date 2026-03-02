/**
 * Downloads battery regulation PDFs using Playwright Chromium (headed mode).
 *
 * Handles three download scenarios:
 *  1. EUR-Lex: WAF challenge → auto-solves → triggers browser download
 *  2. UNECE: CloudFlare CAPTCHA → pauses for human click → then downloads
 *  3. Direct PDFs: Simple navigation → save response body
 *
 * Usage: node server/scripts/downloadKnowledgeBase.mjs [--eurlex|--unece|--other|--all]
 *
 * Requires: npx playwright install chromium (run once from e2e/)
 */
import { chromium } from "playwright";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import { join, resolve } from "path";

const BASE_DIR = resolve("server/knowledge-base/pdfs");
const TIMEOUT = 90_000;
const DELAY_BETWEEN = 2_500;
const CAPTCHA_WAIT = 30_000; // 30s wait for human CAPTCHA solve

// ── Download definitions organized by site ──

const EURLEX = [
  { dir: "eu-battery-regulation", name: "EU_Battery_Regulation_2023_1542.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32023R1542" },
  { dir: "eu-battery-regulation", name: "EU_Batteries_Directive_2006_66_EC.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32006L0066" },
  { dir: "eu-battery-regulation", name: "EU_Delegated_Reg_Carbon_Footprint_2024_1781.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32024R1781" },
  { dir: "eu-battery-regulation", name: "EU_Delegated_Reg_Battery_Passport_2025_11.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32025R0011" },
  { dir: "eu-battery-regulation", name: "EU_Delegated_Reg_Battery_Passport_2025_598.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32025R0598" },
  { dir: "eu-battery-regulation", name: "EU_REACH_Regulation_1907_2006.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32006R1907" },
  { dir: "eu-battery-regulation", name: "EU_RoHS_Directive_2011_65.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32011L0065" },
  { dir: "eu-battery-regulation", name: "EU_Waste_Framework_Directive_2008_98.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32008L0098" },
  { dir: "eu-battery-regulation", name: "EU_End_of_Life_Vehicles_2023.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:52023PC0451" },
  { dir: "eu-battery-regulation", name: "EU_Type_Approval_2018_858.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32018R0858" },
  { dir: "eu-battery-regulation", name: "EU_General_Product_Safety_2023_988.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32023R0988" },
  { dir: "eu-battery-regulation", name: "EU_Conflict_Minerals_2017_821.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32017R0821" },
  { dir: "eu-battery-regulation", name: "EU_CSDDD_2024_1760.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32024L1760" },
  { dir: "eu-battery-regulation", name: "EU_Packaging_Waste_2025_40.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32025R0040" },
  { dir: "eu-battery-regulation", name: "EU_Low_Voltage_Directive_2014_35.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32014L0035" },
  { dir: "eu-battery-regulation", name: "EU_Machinery_Regulation_2023_1230.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32023R1230" },
  { dir: "eu-battery-regulation", name: "EU_ATEX_Directive_2014_34.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32014L0034" },
  { dir: "eu-battery-regulation", name: "EU_CLP_Regulation_1272_2008.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32008R1272" },
  { dir: "eu-battery-regulation", name: "EU_Seveso_III_2012_18.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32012L0018" },
  { dir: "eu-battery-regulation", name: "EU_WEEE_Directive_2012_19.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32012L0019" },
  { dir: "eu-battery-regulation", name: "EU_Critical_Raw_Materials_2024_1252.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32024R1252" },
  { dir: "eu-battery-regulation", name: "EU_Waste_Shipment_2024_1157.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32024R1157" },
  { dir: "eu-battery-regulation", name: "EU_Taxonomy_2020_852.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32020R0852" },
  { dir: "eu-battery-regulation", name: "EU_CSRD_2022_2464.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32022L2464" },
  { dir: "eu-battery-regulation", name: "EU_EMC_Directive_2014_30.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32014L0030" },
  { dir: "eu-battery-regulation", name: "EU_DoC_Framework_Decision_768_2008.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32008D0768" },
  { dir: "eu-battery-regulation", name: "EU_CO2_Standards_Cars_2023_851.pdf", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32023R0851" },
];

const UNECE = [
  { dir: "unece-homologation", name: "UNECE_R100_Rev3_EV_Safety.pdf", url: "https://unece.org/sites/default/files/2025-01/R100r3e.pdf" },
  { dir: "unece-homologation", name: "UNECE_R136_EV_Category_L.pdf", url: "https://unece.org/sites/default/files/2021-02/R136e.pdf" },
  { dir: "unece-homologation", name: "UNECE_GTR20_EV_Safety.pdf", url: "https://unece.org/sites/default/files/2022-04/ECE-TRANS-180-Add.20e.pdf" },
  { dir: "unece-homologation", name: "UNECE_GTR22_Battery_Durability.pdf", url: "https://unece.org/sites/default/files/2024-06/ECE-TRANS-180-Add.22e.pdf" },
  { dir: "unece-homologation", name: "UNECE_R10_EMC.pdf", url: "https://unece.org/sites/default/files/2021-10/R010r6e.pdf" },
  { dir: "unece-homologation", name: "UNECE_R94_Frontal_Collision.pdf", url: "https://unece.org/sites/default/files/2021-10/R094r4e.pdf" },
  { dir: "unece-homologation", name: "UNECE_R95_Lateral_Collision.pdf", url: "https://unece.org/sites/default/files/2021-10/R095r4e.pdf" },
  { dir: "unece-homologation", name: "UNECE_R34_Fire_Prevention.pdf", url: "https://unece.org/sites/default/files/2021-10/R034r3e.pdf" },
  { dir: "unece-homologation", name: "UNECE_R12_Steering_Protection.pdf", url: "https://unece.org/sites/default/files/2021-10/R012r4e.pdf" },
  { dir: "unece-homologation", name: "UNECE_R138_Quiet_Vehicles.pdf", url: "https://unece.org/sites/default/files/2021-10/R138r1e.pdf" },
  { dir: "unece-homologation", name: "UNECE_R155_Cybersecurity.pdf", url: "https://unece.org/sites/default/files/2021-03/R155e.pdf" },
  { dir: "unece-homologation", name: "UNECE_R156_Software_Update.pdf", url: "https://unece.org/sites/default/files/2021-03/R156e.pdf" },
  { dir: "unece-homologation", name: "UNECE_1958_Agreement_Rev3.pdf", url: "https://unece.org/sites/default/files/2021-03/1958-Agreement-Rev.3-E.pdf" },
  { dir: "unece-homologation", name: "UNECE_1998_Agreement.pdf", url: "https://unece.org/sites/default/files/2021-03/1998-Agreement-E.pdf" },
  { dir: "transport-safety", name: "UN_Manual_Tests_Criteria_Rev8.pdf", url: "https://unece.org/sites/default/files/2023-01/ST-SG-AC10-11-Rev8-EN.pdf" },
  { dir: "transport-safety", name: "UN_Model_Regulations_DG_Rev23.pdf", url: "https://unece.org/sites/default/files/2024-01/ST-SG-AC10-1-Rev23e_Vol1_Web.pdf" },
  { dir: "transport-safety", name: "ADR_2025_Volume_1.pdf", url: "https://unece.org/sites/default/files/2025-01/2412006_E_ECE_TRANS_352_Vol.I_WEB_0.pdf" },
  { dir: "transport-safety", name: "ADR_2025_Volume_2.pdf", url: "https://unece.org/sites/default/files/2025-01/2412010_E_ECE_TRANS_352_Vol.II_WEB.pdf" },
  { dir: "recycling", name: "Basel_Convention_Text_2025.pdf", url: "https://www.basel.int/Portals/4/download.aspx?e=UNEP-CHW-IMPL-CONVTEXT-2025.English.pdf" },
];

const OTHER = [
  { dir: "battery-passport", name: "BatteryPass_Content_Guidance_2023.pdf", url: "https://thebatterypass.eu/assets/images/content-guidance/pdf/2023_Battery_Passport_Content_Guidance.pdf" },
  { dir: "battery-passport", name: "JRC_Carbon_Footprint_EV_Batteries.pdf", url: "https://publications.jrc.ec.europa.eu/repository/bitstream/JRC134254/JRC134254_01.pdf" },
  { dir: "battery-passport", name: "JRC_Carbon_Footprint_Industrial_Batteries.pdf", url: "https://publications.jrc.ec.europa.eu/repository/bitstream/JRC134519/JRC134519_01.pdf" },
  { dir: "battery-passport", name: "JRC_Raw_Materials_Methodology.pdf", url: "https://publications.jrc.ec.europa.eu/repository/bitstream/JRC132889/JRC132889_01.pdf" },
  { dir: "supply-chain", name: "OECD_Due_Diligence_Minerals_Ed3.pdf", url: "https://www.oecd.org/daf/inv/mne/OECD-Due-Diligence-Guidance-Minerals-Edition3.pdf" },
  { dir: "supply-chain", name: "UN_Guiding_Principles_Business_HR.pdf", url: "https://www.ohchr.org/sites/default/files/documents/publications/guidingprinciplesbusinesshr_en.pdf" },
  { dir: "functional-safety", name: "NHTSA_EV_Battery_Testing_Research.pdf", url: "https://www.nhtsa.gov/sites/nhtsa.gov/files/documents/12848-lithiumionbatteryelectricvehicles_092717-v3-tag.pdf" },
  { dir: "functional-safety", name: "NREL_Battery_Thermal_Runaway.pdf", url: "https://www.nrel.gov/docs/fy22osti/82330.pdf" },
  { dir: "functional-safety", name: "JRC_Li_Ion_Battery_Safety.pdf", url: "https://publications.jrc.ec.europa.eu/repository/bitstream/JRC113320/kjna29384enn.pdf" },
  { dir: "functional-safety", name: "Batteries_Europe_Strategic_Agenda.pdf", url: "https://batterieseurope.eu/wp-content/uploads/2022/09/Batteries-Europe_Strategic-Research-Agenda_September-2022.pdf" },
  { dir: "supply-chain", name: "IEA_Global_EV_Outlook_2024.pdf", url: "https://iea.blob.core.windows.net/assets/a9e3544b-0b12-4e15-b407-65f5c8ce1b5f/GlobalEVOutlook2024.pdf" },
  { dir: "africa", name: "AU_Africa_Mining_Vision.pdf", url: "https://au.int/sites/default/files/documents/30995-doc-africa_mining_vision_english_1.pdf" },
  { dir: "africa", name: "AfCFTA_Agreement.pdf", url: "https://au.int/sites/default/files/treaties/36437-treaty-consolidated_text_on_cfta_-_en.pdf" },
  { dir: "africa", name: "IEA_Africa_Energy_Outlook_2022.pdf", url: "https://iea.blob.core.windows.net/assets/6fa5a6c0-ca73-4a7f-a243-fb5e83ecfb94/AfricaEnergyOutlook2022.pdf" },
  { dir: "africa", name: "IRENA_Renewable_Energy_Market_Africa_2022.pdf", url: "https://www.irena.org/-/media/Files/IRENA/Agency/Publication/2022/Jan/IRENA_Market_Africa_2022.pdf" },
];

// ── Helpers ──

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function isValidPdf(path) {
  try {
    const stats = statSync(path);
    if (stats.size < 5000) return false;
    const buf = readFileSync(path, { encoding: null });
    return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Download strategies per site type ──

async function downloadEurLex(context, item) {
  const destDir = join(BASE_DIR, item.dir);
  const destPath = join(destDir, item.name);
  ensureDir(destDir);

  if (existsSync(destPath) && isValidPdf(destPath)) {
    const size = statSync(destPath).size;
    console.log(`  SKIP (valid, ${(size / 1_048_576).toFixed(2)} MB)`);
    return { name: item.name, status: "skipped", size };
  }

  const page = await context.newPage();
  try {
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: TIMEOUT }),
      page.goto(item.url, { timeout: TIMEOUT }).catch(() => null),
    ]);

    if (download) {
      const tmpPath = await download.path();
      if (tmpPath) {
        copyFileSync(tmpPath, destPath);
        if (isValidPdf(destPath)) {
          const size = statSync(destPath).size;
          console.log(`  OK (${(size / 1_048_576).toFixed(2)} MB)`);
          await page.close();
          return { name: item.name, status: "ok", size };
        }
      }
    }
    console.log(`  FAIL (no valid download)`);
    await page.close();
    return { name: item.name, status: "failed" };
  } catch (err) {
    console.log(`  ERROR: ${err.message.slice(0, 80)}`);
    await page.close().catch(() => {});
    return { name: item.name, status: "error" };
  }
}

async function downloadUnece(context, item, isFirstInBatch) {
  const destDir = join(BASE_DIR, item.dir);
  const destPath = join(destDir, item.name);
  ensureDir(destDir);

  if (existsSync(destPath) && isValidPdf(destPath)) {
    const size = statSync(destPath).size;
    console.log(`  SKIP (valid, ${(size / 1_048_576).toFixed(2)} MB)`);
    return { name: item.name, status: "skipped", size };
  }

  const page = await context.newPage();
  try {
    // Navigate and wait for CloudFlare challenge
    await page.goto(item.url, { waitUntil: "commit", timeout: TIMEOUT }).catch(() => null);

    if (isFirstInBatch) {
      // First UNECE URL: pause for human to solve CAPTCHA
      console.log(`  ⏳ CAPTCHA detected — please solve it in the browser (${CAPTCHA_WAIT / 1000}s)...`);
      await sleep(CAPTCHA_WAIT);
    } else {
      // Subsequent: shorter wait — CloudFlare cookie should persist
      await sleep(5_000);
    }

    // Check if download started
    const download = await page.waitForEvent("download", { timeout: 15_000 }).catch(() => null);
    if (download) {
      const tmpPath = await download.path();
      if (tmpPath) {
        copyFileSync(tmpPath, destPath);
        if (isValidPdf(destPath)) {
          const size = statSync(destPath).size;
          console.log(`  OK (${(size / 1_048_576).toFixed(2)} MB)`);
          await page.close();
          return { name: item.name, status: "ok", size };
        }
      }
    }

    // Try reading the response body directly (if PDF loaded inline)
    try {
      await page.waitForLoadState("networkidle", { timeout: 15_000 });
      const content = await page.content();
      if (content.includes("%PDF") || content.length < 1000) {
        // Try fetching directly via page context (cookies should be set)
        const resp = await page.evaluate(async (u) => {
          const r = await fetch(u);
          const buf = await r.arrayBuffer();
          return Array.from(new Uint8Array(buf));
        }, item.url);

        if (resp && resp.length > 5000 && resp[0] === 0x25) {
          writeFileSync(destPath, Buffer.from(resp));
          const size = resp.length;
          console.log(`  OK [fetch] (${(size / 1_048_576).toFixed(2)} MB)`);
          await page.close();
          return { name: item.name, status: "ok", size };
        }
      }
    } catch {
      // ignore
    }

    console.log(`  FAIL (CAPTCHA not solved or download blocked)`);
    await page.close();
    return { name: item.name, status: "failed" };
  } catch (err) {
    console.log(`  ERROR: ${err.message.slice(0, 80)}`);
    await page.close().catch(() => {});
    return { name: item.name, status: "error" };
  }
}

async function downloadDirect(context, item) {
  const destDir = join(BASE_DIR, item.dir);
  const destPath = join(destDir, item.name);
  ensureDir(destDir);

  if (existsSync(destPath) && isValidPdf(destPath)) {
    const size = statSync(destPath).size;
    console.log(`  SKIP (valid, ${(size / 1_048_576).toFixed(2)} MB)`);
    return { name: item.name, status: "skipped", size };
  }

  const page = await context.newPage();
  try {
    // Try download event first
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: TIMEOUT }),
      page.goto(item.url, { timeout: TIMEOUT }).catch(() => null),
    ]).catch(() => [null]);

    if (download) {
      const tmpPath = await download.path();
      if (tmpPath) {
        copyFileSync(tmpPath, destPath);
        if (isValidPdf(destPath)) {
          const size = statSync(destPath).size;
          console.log(`  OK [download] (${(size / 1_048_576).toFixed(2)} MB)`);
          await page.close();
          return { name: item.name, status: "ok", size };
        }
      }
    }

    // Fallback: try reading body
    const response = await page.goto(item.url, {
      waitUntil: "networkidle",
      timeout: 60_000,
    }).catch(() => null);

    if (response && response.ok()) {
      try {
        const body = await response.body();
        if (body && body.length > 5000 && body[0] === 0x25) {
          writeFileSync(destPath, body);
          const size = body.length;
          console.log(`  OK [body] (${(size / 1_048_576).toFixed(2)} MB)`);
          await page.close();
          return { name: item.name, status: "ok", size };
        }
      } catch {
        // body not available
      }
      console.log(`  FAIL (${response.status()}, not PDF content)`);
    } else {
      console.log(`  FAIL (${response?.status() ?? "no response"})`);
    }

    await page.close();
    return { name: item.name, status: "failed" };
  } catch (err) {
    console.log(`  ERROR: ${err.message.slice(0, 80)}`);
    await page.close().catch(() => {});
    return { name: item.name, status: "error" };
  }
}

// ── Main ──

async function main() {
  const arg = process.argv[2] || "--all";
  let items = [];
  let strategy = "mixed";

  if (arg === "--eurlex") {
    items = EURLEX;
    strategy = "eurlex";
  } else if (arg === "--unece") {
    items = UNECE;
    strategy = "unece";
  } else if (arg === "--other") {
    items = OTHER;
    strategy = "other";
  } else {
    items = [...EURLEX, ...UNECE, ...OTHER];
    strategy = "mixed";
  }

  console.log(`\nBattery Regulations PDF Downloader (v3)`);
  console.log(`Mode: ${strategy} | Files: ${items.length} | Dest: ${BASE_DIR}\n`);

  if (strategy === "unece" || strategy === "mixed") {
    console.log("NOTE: UNECE uses CloudFlare CAPTCHA. A browser will open.");
    console.log("      When prompted, solve the CAPTCHA within 30 seconds.\n");
  }

  const browser = await chromium.launch({
    headless: false,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    acceptDownloads: true,
    locale: "en-US",
    viewport: { width: 1920, height: 1080 },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const results = { ok: 0, failed: 0, skipped: 0, error: 0 };
  const details = [];
  let firstUnece = true;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`[${i + 1}/${items.length}] ${item.dir}/${item.name}`);

    let result;
    const isUneceUrl = item.url.includes("unece.org");
    const isEurLexUrl = item.url.includes("eur-lex.europa.eu");

    if (isEurLexUrl) {
      result = await downloadEurLex(context, item);
    } else if (isUneceUrl) {
      result = await downloadUnece(context, item, firstUnece);
      if (firstUnece) firstUnece = false;
    } else {
      result = await downloadDirect(context, item);
    }

    results[result.status] = (results[result.status] || 0) + 1;
    details.push(result);

    if (i < items.length - 1) await sleep(DELAY_BETWEEN);
  }

  await browser.close();

  // ── Summary ──
  console.log(`\n${"=".repeat(50)}`);
  console.log(`DOWNLOAD SUMMARY`);
  console.log(`${"=".repeat(50)}`);
  console.log(`  Downloaded:  ${results.ok}`);
  console.log(`  Skipped:     ${results.skipped}`);
  console.log(`  Failed:      ${results.failed}`);
  console.log(`  Errors:      ${results.error || 0}`);
  console.log(`  Total:       ${items.length}\n`);

  const okList = details.filter((d) => d.status === "ok" || d.status === "skipped");
  if (okList.length > 0) {
    console.log("Available PDFs:");
    okList.forEach((d) =>
      console.log(`  + ${d.name} (${((d.size || 0) / 1_048_576).toFixed(2)} MB)`),
    );
  }

  const failedList = details.filter((d) => d.status === "failed" || d.status === "error");
  if (failedList.length > 0) {
    console.log("\nFailed (need manual download):");
    failedList.forEach((d) => console.log(`  - ${d.name}`));
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
