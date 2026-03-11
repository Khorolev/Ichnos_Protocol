/**
 * Heading-based Markdown chunker for RAG knowledge extraction.
 *
 * Parses Markdown into tokens using the `marked` library and groups
 * content by heading hierarchy, preserving tables, code blocks, and
 * LaTeX equations within each chunk.
 *
 * @module markdownChunker
 */
import { marked } from "marked";

const MIN_WORDS = 20;

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function tokenToText(token) {
  if (token.type === "space") return "";
  return token.raw || "";
}

function splitTokensIntoSubchunks(tokens, maxWords) {
  const subchunks = [];
  let currentTokens = [];
  let wordCount = 0;

  for (const token of tokens) {
    const text = tokenToText(token);
    const words = countWords(text);

    if (wordCount + words > maxWords && currentTokens.length > 0) {
      subchunks.push(currentTokens.map(tokenToText).join("").trim());
      currentTokens = [];
      wordCount = 0;
    }

    currentTokens.push(token);
    wordCount += words;
  }

  if (currentTokens.length > 0) {
    subchunks.push(currentTokens.map(tokenToText).join("").trim());
  }

  return subchunks;
}

/**
 * Chunk Markdown content by heading hierarchy.
 *
 * @param {string} markdownText - Raw Markdown content
 * @param {number} [maxWords=300] - Maximum words per chunk
 * @returns {{content: string, headingLevel: number|null, parentSection: string|null, headingText: string}[]}
 */
function chunkMarkdownByHeadings(markdownText, maxWords = 300) {
  const tokens = marked.lexer(markdownText);
  const sections = [];
  let currentSection = { heading: null, level: null, tokens: [] };
  const headingStack = [];

  for (const token of tokens) {
    if (token.type === "heading") {
      if (currentSection.tokens.length > 0 || currentSection.heading) {
        sections.push(currentSection);
      }

      while (
        headingStack.length > 0 &&
        headingStack[headingStack.length - 1].level >= token.depth
      ) {
        headingStack.pop();
      }

      const parentSection =
        headingStack.length > 0
          ? headingStack[headingStack.length - 1].text
          : null;

      headingStack.push({ level: token.depth, text: token.text });

      currentSection = {
        heading: token.text,
        level: token.depth,
        parentSection,
        tokens: [token],
      };
    } else {
      currentSection.tokens.push(token);
    }
  }

  if (currentSection.tokens.length > 0 || currentSection.heading) {
    sections.push(currentSection);
  }

  const chunks = [];

  for (const section of sections) {
    const content = section.tokens.map(tokenToText).join("").trim();
    if (!content) continue;

    const wordCount = countWords(content);

    if (wordCount > maxWords) {
      const subChunks = splitTokensIntoSubchunks(
        section.tokens,
        maxWords,
      );
      for (let i = 0; i < subChunks.length; i++) {
        if (countWords(subChunks[i]) < MIN_WORDS) continue;
        chunks.push({
          content: subChunks[i],
          headingLevel: section.level,
          parentSection: section.parentSection || null,
          headingText: section.heading || "Untitled Section",
        });
      }
    } else {
      if (wordCount < MIN_WORDS) continue;
      chunks.push({
        content,
        headingLevel: section.level,
        parentSection: section.parentSection || null,
        headingText: section.heading || "Untitled Section",
      });
    }
  }

  return chunks;
}

export { chunkMarkdownByHeadings };
