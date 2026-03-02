# Knowledge Base Scripts

Scripts for building and maintaining the Firestore `knowledge_base` collection that powers the RAG chatbot. Includes PDF downloading, conversion, chunking, metadata generation, and Firestore ingestion.

## Architecture Overview

```
                                    ┌──────────────────────────────┐
                                    │      Firestore               │
                                    │    knowledge_base collection │
                                    └──────────────┬───────────────┘
                                                   ▲
                                                   │ ingest
                         ┌─────────────────────────┼─────────────────────────┐
                         │                         │                         │
              ┌──────────┴──────────┐   ┌──────────┴──────────┐   ┌─────────┴─────────┐
              │  Pipeline 3 (Auto)  │   │  Pipeline 1 (Seed)  │   │  Pipeline 4 (Web) │
              │  PDF → MD → Ingest  │   │  Manual curation    │   │  URL → MD → Ingest│
              └──────────┬──────────┘   └─────────────────────┘   └───────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
  ┌──────┴───────┐ ┌─────┴──────┐ ┌──────┴───────┐
  │ Download PDFs│ │ Convert PDF│ │ Extract MD   │
  │ (Playwright) │ │ (Marker/Py)│ │ (Node.js)    │
  └──────────────┘ └────────────┘ └──────────────┘
```

### Data flow (Pipeline 3 — primary)

```
PDFs in knowledge-base/pdfs/<subdir>/
  ↓  convertPdfToMarkdown.py (Marker library)
Markdown in knowledge-base/markdown_output/<subdir>/
  ↓  extractMarkdownKnowledge.js (chunk + xAI metadata)
Firestore knowledge_base documents
```

---

## Quick Start — Process All PDFs

Run everything with a single command (no arguments needed):

```bash
bash server/scripts/runAllKnowledgePipeline.sh
```

This auto-discovers all subdirectories under `knowledge-base/pdfs/`, resolves categories automatically, and processes each one through the full PDF-to-Firestore pipeline. Safe to re-run — skips already-completed files.

---

## Firestore Document Schema

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

---

## Pipelines

### Pipeline 1: Manual Seeding

Hand-curated company knowledge (services, pricing, architecture, team info).

```bash
node server/scripts/seedKnowledgeBase.js
```

| Aspect | Detail |
|--------|--------|
| When to use | Initial setup, company info updates, curated content |
| Idempotency | Skips documents that already exist (matched by `title`) |
| Editing | Modify the `SEED_DOCUMENTS` array in `seedKnowledgeBase.js` |

---

### Pipeline 2: Simple PDF Extraction (Legacy)

Text-only PDFs without complex formatting.

```bash
node server/scripts/extractPdfKnowledgeLegacy.js <file1.pdf> [file2.pdf ...]
```

| Aspect | Detail |
|--------|--------|
| Technology | pdfjs-dist, paragraph-based chunking (200 words max) |
| Limitations | No tables, equations, multi-column, or image support |
| When to use | Simple text-heavy PDFs. For anything else, use Pipeline 3 |

---

### Pipeline 3: Automated PDF Pipeline (Primary)

The main pipeline. Converts PDFs via Python Marker, chunks by Markdown headings, generates metadata via xAI, and ingests into Firestore. Fully automated, idempotent, and crash-safe.

#### Run all subdirectories at once

```bash
# Process everything — zero arguments
bash server/scripts/runAllKnowledgePipeline.sh

# Pass flags through to the underlying pipeline
bash server/scripts/runAllKnowledgePipeline.sh --overwrite
bash server/scripts/runAllKnowledgePipeline.sh --force-reingest

# Exclude specific subdirectories
bash server/scripts/runAllKnowledgePipeline.sh --exclude iec-iso-standards
bash server/scripts/runAllKnowledgePipeline.sh --exclude africa --exclude asean
```

#### Run a single subdirectory

```bash
# Auto-detects category from subdirectory name
bash server/scripts/runKnowledgePipeline.sh --pdf-subdir eu-battery-regulation

# Override category
bash server/scripts/runKnowledgePipeline.sh --pdf-subdir eu-battery-regulation --category regulations

# Re-convert previously converted files
bash server/scripts/runKnowledgePipeline.sh --pdf-subdir battery-passport --overwrite

# Re-ingest into Firestore (dedup still prevents duplicates)
bash server/scripts/runKnowledgePipeline.sh --pdf-subdir functional-safety --force-reingest

# Reset all state and start from scratch
bash server/scripts/runKnowledgePipeline.sh --pdf-subdir unece-homologation --reset-state
```

#### Thin wrapper scripts (convenience)

Each wraps `runKnowledgePipeline.sh` with a hardcoded `--pdf-subdir`:

| Script | Subdirectory | Category |
|--------|-------------|----------|
| `runBatteryPassportPipeline.sh` | `battery-passport` | `battery_passport` |
| `runEuRegulationPipeline.sh` | `eu-battery-regulation` | `regulations` |
| `runFunctionalSafetyPipeline.sh` | `functional-safety` | `functional_safety` |
| `runIecIsoStandardsPipeline.sh` | `iec-iso-standards` | `standards` |
| `runUnecePipeline.sh` | `unece-homologation` | `homologation` |

Usage: `bash server/scripts/runEuRegulationPipeline.sh [--overwrite|--force-reingest|...]`

#### Pipeline options (runKnowledgePipeline.sh)

| Flag | Description |
|------|-------------|
| `--pdf-subdir <name>` | **Required.** Subdirectory under `knowledge-base/pdfs/` |
| `--category <str>` | Firestore category (auto-detected from subdir if omitted) |
| `--dpi-fallback <int>` | Initial DPI for retry pass (default: 150; degrades to 100, 72) |
| `--overwrite` | Re-convert even if markdown already exists |
| `--force-reingest` | Bypass shell-level ingestion markers |
| `--reset-state` | Delete all state markers and start fresh |
| `--no-log` | Disable log file (output to terminal only) |

#### Robustness features

- **Idempotent**: State markers (`.state/<stem>.converted`, `.state/<stem>.ingested`) track per-file completion
- **Crash-safe**: Partial outputs cleaned up; re-run resumes from last completed file
- **Continue-on-failure**: Individual file failures don't block the pipeline
- **Graceful shutdown**: SIGINT/SIGTERM finish current file, save state, then exit
- **Lock file**: PID-based `.pipeline.lock` prevents concurrent runs
- **Progressive DPI degradation**: On memory/timeout failures, retries at 150 → 100 → 72 DPI
- **Defense-in-depth dedup**: Shell markers (primary) + Firestore query dedup (fallback)
- **Persistent logging**: All output tee'd to `.logs/pipeline_YYYYMMDD_HHMMSS.log`

#### Pipeline stages

```
1. Prerequisites check    Python, Node, venv, dependencies, .env
2. Lock acquisition       PID-based lock file with stale detection
3. PDF discovery          find -maxdepth 1 -name '*.pdf' in subdir
4. Conversion pass        PDF → Markdown (Marker), per-file with DPI retry
5. Retry pass             Failed conversions retried at degraded DPI
6. Pre-count              Firestore document count before ingestion
7. Ingestion pass         Markdown → Firestore, per-file with timeout
8. Retry pass             Failed ingestions retried
9. Post-count             Firestore document count after ingestion
10. Summary               Files processed, skipped, failed; count delta
```

#### Manual steps (if not using the shell pipeline)

**Step 1 — Convert PDF to Markdown:**

```bash
python server/scripts/python/convertPdfToMarkdown.py --input <file.pdf> --output-dir ./markdown_output
```

**Step 2 — Ingest Markdown into Firestore:**

```bash
# Single file
node server/scripts/extractMarkdownKnowledge.js <file.md>

# With category override
node server/scripts/extractMarkdownKnowledge.js <file.md> --category batteries

# Batch all .md files in a directory
node server/scripts/extractMarkdownKnowledge.js <dir/> --batch

# Skip files already in Firestore
node server/scripts/extractMarkdownKnowledge.js <dir/> --batch --skip-existing
```

---

### Pipeline 4: Web Content Extraction

Technical documentation from websites (Catena-X, GBA, standards bodies).

```bash
node server/scripts/extractWebKnowledge.js <url> [--category <name>] [--selector <css>]
```

| Flag | Description |
|------|-------------|
| `--category <name>` | Override the auto-detected category |
| `--selector <css>` | CSS selector to extract specific content (e.g. `main`, `article`) |

Examples:

```bash
# Catena-X Battery Passport Standard
node server/scripts/extractWebKnowledge.js \
  https://catenax-ev.github.io/docs/next/standards/CX-0143 \
  --category regulations

# Extract only the main content area
node server/scripts/extractWebKnowledge.js \
  https://example.com/docs/battery-spec \
  --selector "main article"
```

Each document includes a `source_url` field, enabling the RAG chatbot to cite sources.

---

## PDF Download Scripts

### downloadKnowledgeBase.mjs

Downloads battery regulation PDFs from EUR-Lex, UNECE, and other sources using Playwright Chromium. Handles WAF challenges (EUR-Lex), CloudFlare CAPTCHAs (UNECE), and direct downloads.

```bash
# Download everything
node server/scripts/downloadKnowledgeBase.mjs --all

# Download by source
node server/scripts/downloadKnowledgeBase.mjs --eurlex
node server/scripts/downloadKnowledgeBase.mjs --unece
node server/scripts/downloadKnowledgeBase.mjs --other
```

| Aspect | Detail |
|--------|--------|
| Prerequisite | `npx playwright install chromium` (run once from `e2e/`) |
| Mode | Headed browser (visible) — required for CAPTCHA solving |
| Idempotency | Skips valid PDFs already on disk |
| UNECE note | First UNECE download pauses 30s for human CAPTCHA solve |

### downloadNhtsaERG.mjs

Downloads NHTSA EV Emergency Response Guides (100+ vehicle-specific PDFs).

```bash
node server/scripts/downloadNhtsaERG.mjs
```

| Aspect | Detail |
|--------|--------|
| Destination | `knowledge-base/pdfs/functional-safety/nhtsa-emergency-response-guides/` |
| Pipeline note | These guides are **excluded** from the main pipeline (`-maxdepth 1` filter) |
| Mode | Headed Chromium (NHTSA blocks automated HTTP requests) |

---

## Category Mapping

Categories are auto-detected from the PDF subdirectory name. All 15 subdirectories are mapped:

| Subdirectory | Category | Content |
|-------------|----------|---------|
| `battery-passport` | `battery_passport` | Battery Passport product and platform |
| `eu-battery-regulation` | `regulations` | EU Battery Regulation and related directives |
| `unece-homologation` | `homologation` | UNECE vehicle type approval and safety |
| `iec-iso-standards` | `standards` | IEC/ISO international standards |
| `functional-safety` | `functional_safety` | Battery safety, testing, thermal runaway |
| `africa` | `africa` | African mining codes, energy policy, trade agreements |
| `asean` | `asean` | ASEAN frameworks, EV regulations |
| `battery-production` | `battery_production` | Li-ion battery manufacturing processes |
| `battery-technology` | `battery_technology` | Battery technology research (JRC) |
| `china` | `china` | China NEV development, battery standards |
| `eaeu` | `eaeu` | Eurasian Economic Union regulations |
| `middle-east` | `middle_east` | Middle East electrical installation codes |
| `recycling` | `recycling` | Basel Convention, recycling regulations |
| `supply-chain` | `supply_chain` | OECD due diligence, IRMA, IEA outlook |
| `transport-safety` | `transport_safety` | ADR dangerous goods, UN transport testing |

Additional categories set by the xAI metadata generator:

| Category | Description |
|----------|-------------|
| `batteries` | Battery technology, regulation, lifecycle |
| `services` | Ichnos Protocol consulting and services |
| `general` | Fallback for uncategorized content |

Override auto-detection with `--category <name>` on any extraction script.

---

## Utilities

### countFirestoreCategory.js

Prints the number of `knowledge_base` documents matching a category.

```bash
node server/scripts/utils/countFirestoreCategory.js --category regulations
# Output: 142
```

### chunkByHeadings.js

Shared utility: heading-based Markdown chunking (300 words max, 20 words min). Used by `extractMarkdownKnowledge.js` and `extractWebKnowledge.js`.

### generateMetadata.js

Shared utility: calls xAI Grok API to generate title, category, and tags for a text chunk. Used by all ingestion scripts.

---

## Setup

### Node.js dependencies

```bash
cd server && npm install
```

### Python dependencies (PDF conversion)

```bash
cd server/scripts/python
python -m venv venv
source venv/bin/activate    # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Playwright (PDF downloading)

```bash
cd e2e && npx playwright install chromium
```

### Environment variables

Required in `server/.env`:

```
FIREBASE_SERVICE_ACCOUNT_KEY=...   # Firebase admin SDK credentials
XAI_API_KEY=...                    # xAI Grok API key for metadata generation
```

---

## File Structure

```
server/scripts/
├── README.md                          # This file
│
├── # ── Pipelines ──
├── seedKnowledgeBase.js               # Pipeline 1: Manual company knowledge seeding
├── extractPdfKnowledgeLegacy.js       # Pipeline 2: Simple PDF text extraction (legacy)
├── extractMarkdownKnowledge.js        # Pipeline 3: Markdown → Firestore (heading-based chunks)
├── extractWebKnowledge.js             # Pipeline 4: Web → Markdown → Firestore
│
├── # ── Shell Pipeline Wrappers ──
├── runAllKnowledgePipeline.sh         # Run all subdirectories (zero-argument)
├── runKnowledgePipeline.sh            # Generic robust pipeline (PDF → MD → Firestore)
├── runBatteryPassportPipeline.sh      # Thin wrapper → battery-passport
├── runEuRegulationPipeline.sh         # Thin wrapper → eu-battery-regulation
├── runFunctionalSafetyPipeline.sh     # Thin wrapper → functional-safety
├── runIecIsoStandardsPipeline.sh      # Thin wrapper → iec-iso-standards
├── runUnecePipeline.sh                # Thin wrapper → unece-homologation
│
├── # ── Download Scripts ──
├── downloadKnowledgeBase.mjs          # Download PDFs (EUR-Lex, UNECE, other)
├── downloadNhtsaERG.mjs               # Download NHTSA Emergency Response Guides
│
├── # ── Shared Utilities ──
├── utils/
│   ├── countFirestoreCategory.js      # Count documents by Firestore category
│   ├── generateMetadata.js            # xAI metadata generation (title, category, tags)
│   └── chunkByHeadings.js             # Heading-based Markdown chunking
├── helpers/
│   ├── metadataGenerator.js           # xAI Grok API client (15s timeout)
│   ├── markdownChunker.js             # Markdown chunk logic (300w max, 20w min)
│   ├── domSelector.js                 # CSS DOM selection for web extraction
│   ├── domSelector.test.js            # Tests for domSelector
│   ├── robotsCheck.js                 # robots.txt compliance check
│   └── robotsCheck.test.js            # Tests for robotsCheck
│
└── python/
    ├── convertPdfToMarkdown.py        # Marker: PDF → Markdown conversion
    ├── requirements.txt               # Python dependencies (marker-pdf, etc.)
    └── README.md                      # Python-specific documentation
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ERROR: Unknown subdir` | Add mapping to `resolve_category()` in `runKnowledgePipeline.sh`, or use `--category` |
| xAI API timeout | Increase `XAI_TIMEOUT_MS` in `helpers/metadataGenerator.js` (default 15s) |
| Marker memory errors | Pipeline auto-retries at degraded DPI (150 → 100 → 72). If still failing, reduce PDF size |
| Lock file blocks run | Check if another pipeline is running. If stale, delete `.pipeline.lock` manually |
| Web extraction fails | Check `--selector` CSS selector; verify the site allows scraping |
| Firestore batch limit | Handled automatically (500 docs per batch in `extractMarkdownKnowledge`) |
| Missing Node.js deps | Run `npm install` in `server/` |
| Missing Python deps | Run `pip install -r requirements.txt` in `server/scripts/python/` |
| Empty chunks generated | Minimum 20-word threshold filters noise; check source content quality |
| CAPTCHA during download | `downloadKnowledgeBase.mjs` opens a headed browser — solve the CAPTCHA manually |
| Pipeline re-processes files | State markers in `.state/` may be missing. Run `--reset-state` to rebuild |

---

## Periodic Updates Workflow

1. **Download new/updated PDFs**: Add PDFs to the appropriate subdirectory under `knowledge-base/pdfs/`, or update URLs in `downloadKnowledgeBase.mjs` and re-run
2. **Process everything**: `bash server/scripts/runAllKnowledgePipeline.sh` — only new/changed files will be processed
3. **Web content**: Re-run `extractWebKnowledge.js` for updated pages
4. **Company info**: Edit `SEED_DOCUMENTS` in `seedKnowledgeBase.js` and re-run
5. **Verify**: `node server/scripts/utils/countFirestoreCategory.js --category <name>` to check document counts
