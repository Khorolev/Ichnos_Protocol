#!/usr/bin/env python3
"""
PDF to Markdown Converter using Marker

Converts complex PDF files to clean Markdown with preserved tables,
equations, diagrams, and multi-column layouts for RAG knowledge base.

Usage:
    python convertPdfToMarkdown.py --input file.pdf --output-dir ./output
"""

import argparse
import json
import logging
import os
import shutil
import signal
import sys
import threading
import time
from pathlib import Path

try:
    from marker.converters.pdf import PdfConverter
    from marker.models import create_model_dict

    HAS_MARKER = True
except ImportError:
    HAS_MARKER = False

try:
    import fitz  # PyMuPDF

    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

MAX_FILE_SIZE_MB = 500
WARN_FILE_SIZE_MB = 100
DEFAULT_DPI = 200
DEFAULT_TIMEOUT = 7200

shutdown_requested = False


def handle_signal(signum, frame):
    global shutdown_requested
    shutdown_requested = True
    logging.warning("Shutdown requested. Cleaning up...")


signal.signal(signal.SIGINT, handle_signal)
signal.signal(signal.SIGTERM, handle_signal)


def validate_input_file(path):
    """Validate the input PDF file exists and is readable."""
    if not path.exists():
        logging.error("Input file does not exist: %s", path)
        return False
    if not path.is_file():
        logging.error("Input path is not a file: %s", path)
        return False
    if path.suffix.lower() != ".pdf":
        logging.error("Input file is not a PDF: %s", path)
        return False

    size_mb = path.stat().st_size / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        logging.error("File too large (%.1f MB, max %d MB)", size_mb, MAX_FILE_SIZE_MB)
        return False
    if size_mb > WARN_FILE_SIZE_MB:
        logging.warning("Large file (%.1f MB), processing may be slow", size_mb)

    return True


def setup_logging(output_dir, verbose):
    """Configure logging to console and file."""
    level = logging.DEBUG if verbose else logging.INFO
    log_format = "[%(asctime)s] %(levelname)s: %(message)s"

    handlers = [logging.StreamHandler(sys.stdout)]
    log_path = output_dir / "conversion.log"
    handlers.append(logging.FileHandler(str(log_path), mode="w"))

    logging.basicConfig(level=level, format=log_format, handlers=handlers)
    return logging.getLogger(__name__)


def check_disk_space(output_dir, required_mb=100):
    """Check if output directory has enough free disk space."""
    usage = shutil.disk_usage(str(output_dir))
    free_mb = usage.free / (1024 * 1024)
    if free_mb < required_mb:
        logging.error(
            "Insufficient disk space: %.1f MB free, %d MB required",
            free_mb,
            required_mb,
        )
        return False
    return True


def generate_metadata(pdf_path, output_path, stats):
    """Generate metadata JSON for the converted document."""
    try:
        import marker

        marker_version = getattr(marker, "__version__", "unknown")
    except (ImportError, AttributeError):
        marker_version = "unknown"

    images_dir = output_path.parent / "images"
    image_files = []
    if images_dir.exists():
        image_files = [f.name for f in images_dir.iterdir() if f.is_file()]

    metadata = {
        "source_pdf": pdf_path.name,
        "page_count": stats.get("page_count", 0),
        "conversion_date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "marker_version": marker_version,
        "dpi": stats.get("dpi", DEFAULT_DPI),
        "languages": stats.get("languages"),
        "images_extracted": image_files,
        "processing_time_seconds": round(stats.get("elapsed", 0), 2),
    }

    meta_path = output_path.with_suffix("").with_name(
        output_path.stem + "_meta.json"
    )
    with open(str(meta_path), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logging.info("Metadata written to %s", meta_path.name)
    return metadata


def convert_with_pymupdf(input_path, output_path, output_dir):
    """Fallback converter using PyMuPDF plain-text extraction."""
    if not HAS_PYMUPDF:
        logging.error("PyMuPDF (fitz) is not installed.")
        return 2

    start_time = time.time()
    doc = fitz.open(str(input_path))
    page_count = len(doc)
    logging.info("PyMuPDF fallback: %d pages", page_count)

    lines = [f"# {input_path.stem.replace('_', ' ')}\n"]
    for i, page in enumerate(doc):
        if shutdown_requested:
            doc.close()
            logging.warning("Shutdown during PyMuPDF extraction")
            return 6
        text = page.get_text("text").strip()
        if text:
            lines.append(f"\n## Page {i + 1}\n")
            lines.append(text)

    doc.close()
    markdown_text = "\n".join(lines)

    if not markdown_text.strip():
        logging.error("PyMuPDF produced empty output")
        return 2

    with open(str(output_path), "w", encoding="utf-8") as f:
        f.write(markdown_text)

    elapsed = time.time() - start_time
    logging.info("PyMuPDF fallback complete in %.1fs (%d pages)", elapsed, page_count)

    generate_metadata(input_path, output_path, {
        "page_count": page_count,
        "elapsed": elapsed,
        "dpi": 0,
        "languages": None,
    })
    return 0


def convert_pdf_to_markdown(args):
    """Run the PDF to Markdown conversion pipeline."""
    input_path = Path(args.input).resolve()
    output_dir = Path(args.output_dir).resolve()

    output_dir.mkdir(parents=True, exist_ok=True)
    logger = setup_logging(output_dir, args.verbose)

    logger.info("Starting PDF to Markdown conversion")
    logger.info("Input:  %s", input_path)
    logger.info("Output: %s", output_dir)

    if not validate_input_file(input_path):
        return 4

    if not check_disk_space(output_dir):
        return 5

    output_filename = input_path.stem + ".md"
    output_path = output_dir / output_filename

    if output_path.exists() and not args.overwrite:
        logger.error(
            "Output file already exists: %s (use --overwrite to replace)",
            output_path,
        )
        return 1

    # PyMuPDF fallback mode — bypass Marker entirely
    if args.fallback == "pymupdf":
        logger.info("Using PyMuPDF fallback converter")
        return convert_with_pymupdf(input_path, output_path, output_dir)

    if not HAS_MARKER:
        logger.error("Marker is not installed and no fallback requested.")
        return 2

    languages = args.languages.split(",") if args.languages else None
    dpi = args.dpi

    start_time = time.time()

    try:
        if shutdown_requested:
            logger.warning("Shutdown requested before conversion started")
            return 6

        logger.info("Initializing Marker models...")
        model_dict = create_model_dict()

        converter_config = {
            "artifact_dict": model_dict,
            "config": {
                "highres_image_dpi": dpi,
                "lowres_image_dpi": dpi,
            },
        }
        if languages:
            converter_config["config"]["languages"] = languages
            logger.info("Languages: %s", ", ".join(languages))

        logger.info("DPI: %d", dpi)
        converter = PdfConverter(**converter_config)

        if shutdown_requested:
            logger.warning("Shutdown requested before conversion")
            return 6

        def _timeout_kill():
            logger.error(
                "TIMEOUT: conversion exceeded %d seconds. Terminating.",
                args.timeout,
            )
            os._exit(7)

        timer = threading.Timer(args.timeout, _timeout_kill)
        timer.daemon = True
        timer.start()

        logger.info("Converting PDF (timeout: %ds)...", args.timeout)
        try:
            rendered = converter(str(input_path))
        finally:
            timer.cancel()

        if shutdown_requested:
            logger.warning("Shutdown requested after conversion, skipping output")
            return 6

        markdown_text = rendered.markdown
        page_count = len(rendered.children) if hasattr(rendered, "children") else 0

        if not markdown_text or len(markdown_text.strip()) == 0:
            logger.error("Conversion produced empty output")
            return 2

        images_dir = output_dir / "images"
        if rendered.images:
            images_dir.mkdir(exist_ok=True)
            for img_name, img_data in rendered.images.items():
                if shutdown_requested:
                    logger.warning("Shutdown during image saving, aborting")
                    return 6
                img_path = images_dir / img_name
                img_data.save(str(img_path))
                logger.info("Saved image: %s", img_name)

        with open(str(output_path), "w", encoding="utf-8") as f:
            f.write(markdown_text)

        elapsed = time.time() - start_time
        logger.info("Markdown written to %s", output_path.name)
        logger.info(
            "Conversion complete in %.1f seconds (%d pages)",
            elapsed,
            page_count,
        )

        stats = {
            "page_count": page_count,
            "elapsed": elapsed,
            "dpi": dpi,
            "languages": languages,
        }
        generate_metadata(input_path, output_path, stats)

        has_headings = "#" in markdown_text
        if not has_headings:
            logger.warning("Output contains no Markdown headings")

        return 0

    except MemoryError:
        logger.error("Out of memory. Try reducing --dpi or processing fewer pages.")
        return 3
    except Exception as e:
        logger.error("Conversion failed: %s", str(e))
        return 2


def parse_arguments():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Convert PDF files to Markdown using Marker",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python convertPdfToMarkdown.py --input spec.pdf --output-dir ./output
  python convertPdfToMarkdown.py --input spec.pdf --output-dir ./output --verbose
  python convertPdfToMarkdown.py --input spec.pdf --output-dir ./output --overwrite
        """,
    )
    parser.add_argument(
        "--input", required=True, help="Path to input PDF file"
    )
    parser.add_argument(
        "--output-dir", required=True, help="Directory for Markdown output"
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=DEFAULT_DPI,
        help="DPI for image extraction (default: %(default)s)",
    )
    parser.add_argument(
        "--languages",
        default=None,
        help='Comma-separated language codes (e.g., "en,it")',
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        default=False,
        help="Overwrite existing output files",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT,
        help="Max seconds per conversion before hard kill (default: %(default)s)",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        default=False,
        help="Enable detailed logging",
    )
    parser.add_argument(
        "--fallback",
        choices=["pymupdf"],
        default=None,
        help="Use a fallback converter instead of Marker (pymupdf)",
    )
    return parser.parse_args()


def main():
    """Entry point for the PDF to Markdown converter."""
    args = parse_arguments()
    return convert_pdf_to_markdown(args)


if __name__ == "__main__":
    sys.exit(main())
