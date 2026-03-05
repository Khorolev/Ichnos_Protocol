#!/usr/bin/env bash
# Night-run wrapper: processes only the remaining (non-beta) subdirectories.
# Excludes the 5 already-completed beta categories so they are never re-processed.
#
# Usage (from repo root):
#   bash server/scripts/runNightPipeline.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PDF_ROOT="$REPO_ROOT/server/knowledge-base/pdfs"

# Required subdirectories for sec5-14 scope
REQUIRED_SUBDIRS=(
  "supply-chain"
  "transport-safety"
  "recycling"
  "africa"
  "asean"
  "battery-production"
  "battery-technology"
  "china"
  "eaeu"
  "middle-east"
)

# --- Preflight: verify each required folder exists and has PDFs ---

echo "=== Night Pipeline Preflight ==="
echo ""

PREFLIGHT_FAILED=0
MISSING_DIRS=()
EMPTY_DIRS=()

for subdir in "${REQUIRED_SUBDIRS[@]}"; do
  dir="$PDF_ROOT/$subdir"
  if [ ! -d "$dir" ]; then
    MISSING_DIRS+=("$subdir")
    PREFLIGHT_FAILED=1
    continue
  fi

  pdf_count=$(find "$dir" -maxdepth 1 -name '*.pdf' -type f 2>/dev/null | wc -l)
  if [ "$pdf_count" -eq 0 ]; then
    EMPTY_DIRS+=("$subdir")
    PREFLIGHT_FAILED=1
  else
    echo "  ✓ $subdir ($pdf_count PDFs)"
  fi
done

if [ ${#MISSING_DIRS[@]} -gt 0 ]; then
  echo ""
  echo "  Missing directories:"
  for d in "${MISSING_DIRS[@]}"; do
    echo "    ✗ $PDF_ROOT/$d"
  done
fi

if [ ${#EMPTY_DIRS[@]} -gt 0 ]; then
  echo ""
  echo "  Empty directories (no PDFs):"
  for d in "${EMPTY_DIRS[@]}"; do
    echo "    ✗ $PDF_ROOT/$d"
  done
fi

if [ $PREFLIGHT_FAILED -ne 0 ]; then
  echo ""
  echo "  ❌ Preflight failed: ${#MISSING_DIRS[@]} missing, ${#EMPTY_DIRS[@]} empty."
  echo "  All required sec5-14 subdirectories must exist and contain at least one PDF."
  exit 1
fi

echo ""
echo "  ✅ Preflight passed: all ${#REQUIRED_SUBDIRS[@]} required subdirectories present."
echo ""

# --- Delegate to master pipeline, excluding already-completed beta categories ---

exec bash "$SCRIPT_DIR/runAllKnowledgePipeline.sh" \
  --exclude eu-battery-regulation \
  --exclude unece-homologation \
  --exclude battery-passport \
  --exclude functional-safety \
  --exclude iec-iso-standards \
  "$@"
