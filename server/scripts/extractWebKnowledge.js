/**
 * Web Content Knowledge Extraction for RAG.
 *
 * Fetches HTML from a URL, converts to Markdown via Turndown,
 * chunks by heading hierarchy, generates metadata via xAI,
 * and writes documents via knowledgeRepository.createDocument.
 *
 * Usage:
 *   node scripts/extractWebKnowledge.js <url>
 *   node scripts/extractWebKnowledge.js <url> --category regulations
 *   node scripts/extractWebKnowledge.js <url> --selector "main,article"
 *   node scripts/extractWebKnowledge.js <url> --ignore-robots
 */
import "dotenv/config";
import TurndownService from "turndown";
import { createDocument } from "../src/repositories/knowledgeRepository.js";
import { extractBySelector } from "./helpers/domSelector.js";
import { checkRobotsTxt } from "./helpers/robotsCheck.js";
import { generateMetadata } from "./utils/generateMetadata.js";
import { chunkMarkdownByHeadings } from "./utils/chunkByHeadings.js";

const MAX_WORDS = 300;
const FETCH_TIMEOUT_MS = 30_000;
const USER_AGENT = "IchnosProtocol-KnowledgeBot/1.0";

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = {
    url: null,
    category: null,
    selector: null,
    ignoreRobots: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--category" && i + 1 < args.length) {
      result.category = args[++i];
    } else if (args[i] === "--selector" && i + 1 < args.length) {
      result.selector = args[++i];
    } else if (args[i] === "--ignore-robots") {
      result.ignoreRobots = true;
    } else if (!args[i].startsWith("--")) {
      result.url = args[i];
    }
  }

  return result;
}

function isValidUrl(str) {
  try {
    const parsed = new URL(str);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function convertHtmlToMarkdown(html, selector) {
  let content = html;

  if (selector) {
    const extracted = extractBySelector(html, selector);
    if (extracted) {
      console.log(`  Extracted content using selector: "${selector}"`);
      content = extracted;
    } else {
      console.log(`  Selector "${selector}" not found, using full page`);
    }
  }

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  return turndown.turndown(content);
}

async function processUrl(url, categoryOverride, selector) {
  const hostname = new URL(url).hostname;
  console.log(`\nFetching: ${url}`);

  const html = await fetchHtml(url);
  console.log(`  Received ${html.length} bytes of HTML`);

  const markdown = convertHtmlToMarkdown(html, selector);
  console.log(`  Converted to ${markdown.length} chars of Markdown`);

  const chunks = chunkMarkdownByHeadings(markdown, MAX_WORDS);
  console.log(`  Extracted ${chunks.length} chunks`);

  if (chunks.length === 0) {
    console.log("  No content chunks extracted.");
    return 0;
  }

  let count = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`  Chunk ${i + 1}/${chunks.length}: generating metadata...`);
    const metadata = await generateMetadata(chunk.content);

    await createDocument({
      title: metadata.title || chunk.headingText,
      content: chunk.content,
      category: categoryOverride || metadata.category,
      tags: metadata.tags,
      source_type: "web",
      source_url: url,
      heading_level: chunk.headingLevel,
      parent_section: chunk.parentSection,
      created_by: `web-extract:${hostname}`,
    });

    count++;
    console.log(
      `    -> "${metadata.title}" [${categoryOverride || metadata.category}]`,
    );
  }

  console.log(`  Wrote ${count} documents from ${hostname}`);
  return count;
}

function showUsage() {
  console.log(`Usage:
  node scripts/extractWebKnowledge.js <url> [options]

Options:
  --category <name>    Override auto-detected category
  --selector <css>     CSS selectors to extract (e.g. "main", "main,article")
  --ignore-robots      Skip robots.txt compliance check

Examples:
  node scripts/extractWebKnowledge.js https://example.com/docs
  node scripts/extractWebKnowledge.js https://example.com/docs --selector "main,article"
  node scripts/extractWebKnowledge.js https://example.com/docs --ignore-robots`);
}

async function main() {
  const { url, category, selector, ignoreRobots } = parseArgs(process.argv);

  if (!url) {
    showUsage();
    process.exit(1);
  }

  if (!isValidUrl(url)) {
    console.error("Error: invalid URL:", url);
    process.exit(1);
  }

  if (!ignoreRobots) {
    const { allowed, robotsUrl } = await checkRobotsTxt(url);
    if (!allowed) {
      console.error(
        `Error: robots.txt at ${robotsUrl} disallows access to this path.\n` +
          `Use --ignore-robots to override.`,
      );
      process.exit(1);
    }
  }

  await processUrl(url, category, selector);
  console.log("\nDone.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Extraction failed:", error.message);
    process.exit(1);
  });
