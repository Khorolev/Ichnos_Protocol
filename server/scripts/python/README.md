# Python PDF Knowledge Extraction Scripts

Advanced PDF-to-Markdown conversion using the [Marker](https://github.com/VikParuchuri/marker) library for the Ichnos Protocol RAG knowledge base.

Marker preserves complex PDF structures that simple text extraction (pdfjs-dist) cannot handle:
- Tables with row/column structure
- LaTeX equations (`$...$` and `$$...$$`)
- Multi-column layouts (academic papers, datasheets)
- Embedded diagrams and images
- Code blocks with syntax

## Installation

```bash
cd server/scripts/python
python -m venv venv

# Linux/macOS
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

For GPU acceleration (optional, significantly faster):
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

## Usage

### Basic conversion

```bash
python convertPdfToMarkdown.py --input ../../data/spec.pdf --output-dir ../../data/markdown
```

### With verbose logging

```bash
python convertPdfToMarkdown.py --input spec.pdf --output-dir ./output --verbose
```

### Overwrite existing output

```bash
python convertPdfToMarkdown.py --input spec.pdf --output-dir ./output --overwrite
```

### Batch processing (shell loop)

```bash
for pdf in ../../data/pdfs/*.pdf; do
  python convertPdfToMarkdown.py --input "$pdf" --output-dir ../../data/markdown
done
```

## CLI Arguments

| Argument       | Required | Default | Description                              |
|----------------|----------|---------|------------------------------------------|
| `--input`      | Yes      | —       | Path to input PDF file                   |
| `--output-dir` | Yes      | —       | Directory for Markdown output            |
| `--dpi`        | No       | 200     | DPI for image extraction                 |
| `--languages`  | No       | None    | Comma-separated language codes (e.g., "en,it") |
| `--overwrite`  | No       | false   | Overwrite existing output files          |
| `--verbose`    | No       | false   | Enable detailed logging                  |

## Output Structure

```
output_dir/
├── spec.md              # Converted Markdown
├── spec_meta.json       # Conversion metadata
├── images/              # Extracted images
│   ├── img_0.png
│   └── img_1.png
└── conversion.log       # Processing log
```

### Metadata file (`spec_meta.json`)

```json
{
  "source_pdf": "spec.pdf",
  "page_count": 45,
  "conversion_date": "2026-02-17T10:30:00Z",
  "marker_version": "0.3.2",
  "images_extracted": ["img_0.png", "img_1.png"],
  "processing_time_seconds": 123.45
}
```

## Integration with Node.js Pipeline

This script is the first stage of a two-step knowledge extraction pipeline:

1. **Python (this script)**: Convert PDF to clean Markdown with preserved structure
2. **Node.js** (`extractMarkdownKnowledge.js`): Chunk Markdown by headings, generate xAI metadata, write to Firestore `knowledge_base` collection

```
PDF → [convertPdfToMarkdown.py] → Markdown → [extractMarkdownKnowledge.js] → Firestore
```

For simple text-only PDFs, the legacy `extractPdfKnowledgeLegacy.js` script using pdfjs-dist is still available.

## Step 2: Process Markdown to Knowledge Base

After converting a PDF to Markdown, use `extractMarkdownKnowledge.js` to chunk and ingest it into Firestore.

### Heading-based chunking vs paragraph-based chunking

The legacy `extractPdfKnowledgeLegacy.js` splits text at double newlines (paragraph boundaries) with a 200-word limit. This loses structural context like section titles, table grouping, and equation placement.

`extractMarkdownKnowledge.js` uses **heading hierarchy** as natural chunk boundaries. Each section (defined by `#`, `##`, `###`, etc.) becomes a chunk, preserving tables, code blocks, and LaTeX equations intact. Oversized sections are split at paragraph boundaries within the section. This produces higher-quality chunks for RAG retrieval.

### Single file

```bash
node server/scripts/extractMarkdownKnowledge.js output/spec.md
```

### With category override

```bash
node server/scripts/extractMarkdownKnowledge.js output/spec.md --category batteries
```

### Batch directory

```bash
node server/scripts/extractMarkdownKnowledge.js output/ --batch
```

### Enhanced metadata fields

Each Firestore document includes additional fields beyond the legacy schema:

| Field | Type | Description |
|-------|------|-------------|
| `source_type` | string | `"markdown"` (vs `"pdf"` for legacy) |
| `heading_level` | number | 1-6 for the chunk's heading depth |
| `parent_section` | string | Parent heading text for hierarchical context |

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Empty chunks | Markdown may lack headings; add at least one `#` heading |
| Oversized sections | Sections exceeding 300 words are split at paragraph boundaries |
| Missing headings | Content before the first heading is grouped as "Untitled Section" |
| API timeout | xAI metadata generation has a 15s timeout; check `XAI_API_KEY` |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `MemoryError` | Reduce `--dpi` (try 150 or 100) |
| Missing tables | Tables with complex spans may need manual review |
| Slow processing | Reduce DPI; use GPU acceleration if available |
| Empty output | Check if PDF is encrypted or image-only (scanned) |
| Import errors | Ensure venv is activated and dependencies installed |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0    | Success |
| 1    | Output file exists (use `--overwrite`) |
| 2    | Conversion error (corrupted PDF, empty output) |
| 3    | Out of memory |
| 4    | Invalid input file (missing, wrong extension, too large) |
| 5    | Insufficient disk space |
