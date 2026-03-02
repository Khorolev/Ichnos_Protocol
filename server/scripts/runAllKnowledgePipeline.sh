#!/usr/bin/env bash
# =============================================================================
# Run Knowledge Pipeline for ALL PDF Subdirectories
#
# Zero-argument wrapper that auto-discovers every subdirectory under
# knowledge-base/pdfs/, resolves its category, and delegates to the
# robust generic pipeline (runKnowledgePipeline.sh).
#
# Usage (from repo root):
#   bash server/scripts/runAllKnowledgePipeline.sh
#   bash server/scripts/runAllKnowledgePipeline.sh --overwrite
#   bash server/scripts/runAllKnowledgePipeline.sh --exclude iec-iso-standards
#   bash server/scripts/runAllKnowledgePipeline.sh --exclude africa --exclude asean
#
# All flags except --exclude are passed through to runKnowledgePipeline.sh.
# =============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PDF_ROOT="$REPO_ROOT/server/knowledge-base/pdfs"
PIPELINE="$SCRIPT_DIR/runKnowledgePipeline.sh"

# --- Parse --exclude flags, collect passthrough args ---

EXCLUDES=()
PASSTHROUGH=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --exclude)
      if [[ $# -lt 2 ]]; then
        echo "ERROR: --exclude requires a subdirectory name"
        exit 1
      fi
      EXCLUDES+=("$2")
      shift 2
      ;;
    --help|-h)
      cat <<'USAGE'
Usage: bash server/scripts/runAllKnowledgePipeline.sh [options]

Discovers all PDF subdirectories and runs the knowledge pipeline for each.

Options:
  --exclude <name>     Skip a subdirectory (repeatable)
  --dpi <int>          Initial conversion DPI (default: 200, passed through)
  --overwrite          Re-convert even if already converted (passed through)
  --force-reingest     Re-ingest into Firestore (passed through)
  --reset-state        Delete all state markers (passed through)
  --no-log             Disable per-subdir log files (passed through)
  --help               Show this help
USAGE
      exit 0
      ;;
    *)
      PASSTHROUGH+=("$1")
      shift
      ;;
  esac
done

# --- Validate ---

if [ ! -d "$PDF_ROOT" ]; then
  echo "ERROR: PDF directory not found: $PDF_ROOT"
  exit 1
fi

if [ ! -f "$PIPELINE" ]; then
  echo "ERROR: Pipeline script not found: $PIPELINE"
  exit 1
fi

# --- Discover subdirectories ---

is_excluded() {
  local name="$1"
  for ex in "${EXCLUDES[@]+"${EXCLUDES[@]}"}"; do
    if [ "$ex" = "$name" ]; then
      return 0
    fi
  done
  return 1
}

SUBDIRS=()
for dir in "$PDF_ROOT"/*/; do
  [ -d "$dir" ] || continue
  name="$(basename "$dir")"

  if is_excluded "$name"; then
    echo "  EXCLUDE: $name (--exclude flag)"
    continue
  fi

  # Skip empty directories (no PDFs)
  pdf_count=$(find "$dir" -maxdepth 1 -name '*.pdf' -type f 2>/dev/null | wc -l)
  if [ "$pdf_count" -eq 0 ]; then
    echo "  SKIP: $name (no PDFs found)"
    continue
  fi

  SUBDIRS+=("$name")
done

if [ ${#SUBDIRS[@]} -eq 0 ]; then
  echo "No PDF subdirectories to process."
  exit 0
fi

echo ""
echo "============================================="
echo "  Knowledge Pipeline — All Subdirectories"
echo "============================================="
echo ""
echo "  Subdirectories to process: ${#SUBDIRS[@]}"
echo "  ${SUBDIRS[*]}"
echo ""

# --- Process each subdirectory ---

RESULTS=()
FAILED=0
TOTAL=${#SUBDIRS[@]}
OVERALL_START=$SECONDS

for i in "${!SUBDIRS[@]}"; do
  name="${SUBDIRS[$i]}"
  idx=$((i + 1))

  echo ""
  echo "============================================="
  echo "  [$idx/$TOTAL] Processing: $name"
  echo "============================================="

  subdir_start=$SECONDS

  bash "$PIPELINE" --pdf-subdir "$name" "${PASSTHROUGH[@]+"${PASSTHROUGH[@]}"}"
  exit_code=$?

  elapsed=$(( SECONDS - subdir_start ))
  mins=$(( elapsed / 60 ))
  secs=$(( elapsed % 60 ))

  if [ $exit_code -eq 0 ]; then
    RESULTS+=("$name|OK|${mins}m${secs}s")
  else
    RESULTS+=("$name|FAILED (exit $exit_code)|${mins}m${secs}s")
    FAILED=$((FAILED + 1))
  fi
done

# --- Summary ---

overall_elapsed=$(( SECONDS - OVERALL_START ))
overall_mins=$(( overall_elapsed / 60 ))
overall_secs=$(( overall_elapsed % 60 ))

echo ""
echo "============================================="
echo "  Summary"
echo "============================================="
echo ""
printf "  %-25s %-20s %s\n" "Subdirectory" "Status" "Duration"
printf "  %-25s %-20s %s\n" "-------------------------" "--------------------" "--------"
for entry in "${RESULTS[@]}"; do
  IFS='|' read -r subdir status duration <<< "$entry"
  printf "  %-25s %-20s %s\n" "$subdir" "$status" "$duration"
done
echo ""
echo "  Total: $TOTAL subdirectories, $((TOTAL - FAILED)) succeeded, $FAILED failed"
echo "  Total duration: ${overall_mins}m${overall_secs}s"
echo ""

if [ $FAILED -gt 0 ]; then
  echo "  Some subdirectories failed. Re-run to retry (idempotent)."
  exit 1
fi

echo "  All subdirectories processed successfully."
exit 0
