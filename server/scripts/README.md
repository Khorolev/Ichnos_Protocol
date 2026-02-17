# Knowledge Extraction Scripts

Scripts for populating the Firestore `knowledge_base` collection that powers the RAG chatbot.

## Overview

The knowledge base stores documents with the following schema:

| Field            | Type      | Description                              |
|------------------|-----------|------------------------------------------|
| `title`          | string    | Concise title (auto-generated via xAI)   |
| `content`        | string    | Chunked text content                     |
| `category`       | string    | One of the valid categories (see below)  |
| `tags`           | string[]  | 3-5 keyword tags (auto-generated)        |
| `source_type`    | string    | `markdown`, `pdf`, `web`, or `seed`      |
| `heading_level`  | number    | Markdown heading depth (if applicable)   |
| `parent_section` | string    | Parent heading text (if applicable)      |
| `source_url`     | string    | Original URL (web extraction only)       |
| `created_at`     | timestamp | Document creation time                   |
| `updated_at`     | timestamp | Last update time                         |
| `created_by`     | string    | Script identifier (e.g. `seed-script`)   |

Four pipelines are available:

1. **Manual Seeding** - Hand-curated company knowledge
2. **Simple PDF Extraction** (Legacy) - Text-only PDFs via pdfjs-dist
3. **Complex PDF Extraction** (Marker + Markdown) - PDFs with tables, equations, diagrams
4. **Web Content Extraction** - Technical documentation from websites

---

## Pipeline 1: Manual Seeding

**Purpose**: Hand-curated company knowledge (services, pricing, architecture, team info).

```bash
node server/scripts/seedKnowledgeBase.js
```

**When to use**: Initial setup, company info updates, or adding curated content that doesn't come from external documents.

**Idempotency**: Skips documents that already exist (matched by `title`). Safe to re-run.

**Editing content**: Modify the `SEED_DOCUMENTS` array in `seedKnowledgeBase.js`.

---

## Pipeline 2: Simple PDF Extraction (Legacy)

**Purpose**: Text-only PDFs without complex formatting.

```bash
node server/scripts/extractPdfKnowledgeLegacy.js <file1.pdf> [file2.pdf ...]
```

**Technology**: pdfjs-dist for text extraction, paragraph-based chunking (200 words max).

**Limitations**:
- No table preservation
- No equation support
- No multi-column layout handling
- No diagram/image recognition

**When to use**: Simple regulatory documents, plain text specifications, or text-heavy PDFs without tables or figures.

> For PDFs with tables, equations, or complex layouts, use Pipeline 3 instead.

---

## Pipeline 3: Complex PDF Extraction (Marker + Markdown)

**Purpose**: PDFs with tables, equations, diagrams, and multi-column layouts.

This is a two-step process:

### Step 1: Convert PDF to Markdown

```bash
python server/scripts/python/convertPdfToMarkdown.py --input <file.pdf> --output-dir ./markdown_output
```

**Technology**: Python [Marker](https://github.com/VikParuchuri/marker) library for advanced PDF parsing.

**Setup**:
```bash
cd server/scripts/python
pip install -r requirements.txt
```

### Step 2: Process Markdown into Firestore

```bash
# Single file
node server/scripts/extractMarkdownKnowledge.js ./markdown_output/<file>.md

# With category override
node server/scripts/extractMarkdownKnowledge.js ./markdown_output/<file>.md --category batteries

# Batch process all .md files in a directory
node server/scripts/extractMarkdownKnowledge.js ./markdown_output/ --batch
```

**Chunking**: Heading-based (300 words max), preserves document structure and hierarchy.

**Advantages**:
- Preserves tables (converted to Markdown format)
- Preserves equations (LaTeX notation)
- Handles diagrams (OCR + image extraction)
- Maintains heading hierarchy for context

---

## Pipeline 4: Web Content Extraction

**Purpose**: Technical documentation from websites (Catena-X, GBA, standards bodies).

```bash
node server/scripts/extractWebKnowledge.js <url> [--category <name>] [--selector <css>]
```

**Technology**: HTML fetch, Turndown (HTML to Markdown), heading-based chunking.

### Examples

```bash
# Catena-X Battery Passport Standard (CX-0143)
node server/scripts/extractWebKnowledge.js \
  https://catenax-ev.github.io/docs/next/standards/CX-0143 \
  --category regulations

# Global Battery Alliance Battery Passport
node server/scripts/extractWebKnowledge.js \
  https://www.globalbattery.org/battery-passport/ \
  --category standards

# Extract only the main content area (skip nav/footer)
node server/scripts/extractWebKnowledge.js \
  https://example.com/docs/battery-spec \
  --selector "main article"
```

### Options

| Flag                | Description                                           |
|---------------------|-------------------------------------------------------|
| `--category <name>` | Override the auto-detected category                   |
| `--selector <css>`  | CSS selector to extract specific content (e.g. `main`, `article`) |

**Metadata**: Each document includes a `source_url` field, enabling the RAG chatbot to cite sources in responses.

---

## Valid Categories

Categories are auto-detected by the xAI metadata generator. Valid values (from `helpers/metadataGenerator.js`):

| Category           | Description                                  |
|--------------------|----------------------------------------------|
| `battery_passport` | Battery passport product and platform        |
| `batteries`        | Battery technology, regulation, lifecycle    |
| `homologation`     | Type approval, certification, testing        |
| `services`         | Ichnos Protocol consulting and services      |
| `general`          | Fallback for uncategorized content           |
| `regulations`      | EU Battery Regulation, standards compliance  |
| `standards`        | Industry standards (Catena-X, GBA, DIN SPEC) |
| `supply_chain`     | Supply chain due diligence, traceability     |

Override auto-detection with the `--category` flag on any extraction script.

---

## Periodic Updates Workflow

### Monthly/Quarterly Review

1. Check Catena-X, GBA, and regulatory sites for updated specifications
2. Re-run web extraction for updated pages:
   ```bash
   node server/scripts/extractWebKnowledge.js <url> --category regulations
   ```
3. Re-run the Marker pipeline for updated PDF specifications:
   ```bash
   python server/scripts/python/convertPdfToMarkdown.py --input updated-spec.pdf --output-dir ./markdown
   node server/scripts/extractMarkdownKnowledge.js ./markdown/updated-spec.md
   ```
4. Update seed documents if company info has changed:
   ```bash
   node server/scripts/seedKnowledgeBase.js
   ```

### Deduplication

Currently, re-running extraction creates new documents without deduplicating. Review and clean up via the Firestore console or a custom deduplication script (future enhancement).

---

## Troubleshooting

| Issue                        | Solution                                                                 |
|------------------------------|--------------------------------------------------------------------------|
| xAI API timeout              | Increase `XAI_TIMEOUT_MS` in `helpers/metadataGenerator.js` (default 15s) |
| Marker memory errors         | Reduce PDF size or process specific page ranges                          |
| Web extraction fails         | Check `--selector` CSS selector; verify the site allows scraping         |
| Firestore batch limit        | Handled automatically (500 docs per batch in `extractMarkdownKnowledge`) |
| Missing Node.js dependencies | Run `npm install` in `server/`                                           |
| Missing Python dependencies  | Run `pip install -r requirements.txt` in `server/scripts/python/`        |
| Empty chunks generated       | Minimum 20-word threshold filters noise; check source content quality    |

---

## File Structure

```
server/scripts/
├── README.md                          # This file
├── seedKnowledgeBase.js               # Pipeline 1: Manual company knowledge seeding
├── extractPdfKnowledgeLegacy.js       # Pipeline 2: Simple PDF text extraction
├── extractMarkdownKnowledge.js        # Pipeline 3: Markdown → Firestore (heading-based chunks)
├── extractWebKnowledge.js             # Pipeline 4: Web → Markdown → Firestore
├── downloadKnowledgeBase.mjs          # Utility: Download knowledge base from Firestore
├── helpers/
│   ├── metadataGenerator.js           # xAI metadata generation (shared by all pipelines)
│   └── markdownChunker.js             # Heading-based Markdown chunking (shared)
└── python/
    ├── convertPdfToMarkdown.py        # Marker: PDF → Markdown conversion
    ├── requirements.txt               # Python dependencies (marker-pdf, etc.)
    └── README.md                      # Python-specific documentation
```

---

## Quick Reference

| Pipeline        | Command                                                          | Use Case                          | Chunking          |
|-----------------|------------------------------------------------------------------|-----------------------------------|--------------------|
| Manual Seeding  | `node server/scripts/seedKnowledgeBase.js`                       | Company info, services, pricing   | Per document       |
| Simple PDF      | `node server/scripts/extractPdfKnowledgeLegacy.js <file.pdf>`    | Text-only PDFs                    | Paragraph (200w)   |
| Complex PDF     | `python .../convertPdfToMarkdown.py` + `node .../extractMarkdownKnowledge.js` | Tables, equations, diagrams | Heading (300w)     |
| Web Content     | `node server/scripts/extractWebKnowledge.js <url>`               | Catena-X, GBA, standards sites    | Heading (300w)     |
