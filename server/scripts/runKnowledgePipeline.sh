#!/usr/bin/env bash
# =============================================================================
# Generalized Knowledge Base Pipeline — Robust & Idempotent
#
# Three-stage pipeline: PDF -> Markdown -> Firestore
# Each file is tracked independently via state markers in .state/ directory.
# Safe to re-run at any time — picks up where it left off.
#
# Features:
#   - Idempotent: skips already-completed steps via .state/ markers
#   - Crash-safe: partial outputs cleaned up; re-run resumes correctly
#   - Continue-on-failure: individual file failures don't block the pipeline
#   - Graceful shutdown: SIGINT/SIGTERM finish current file, save state, exit
#   - Lock file: prevents concurrent runs from corrupting state
#   - Per-file Firestore ingestion: each file ingested independently
#   - Defense-in-depth dedup: --skip-existing check in ingestion script
#   - Progressive DPI degradation: retries at 150 -> 100 -> 72 DPI on failure
#   - Persistent log file: all output tee'd to timestamped log
#
# Usage (from repo root):
#   bash server/scripts/runKnowledgePipeline.sh --pdf-subdir eu-battery-regulation
#   bash server/scripts/runKnowledgePipeline.sh --pdf-subdir battery-passport --overwrite
#   bash server/scripts/runKnowledgePipeline.sh --pdf-subdir functional-safety --force-reingest
#
# Options:
#   --pdf-subdir <name>    Subdirectory under knowledge-base/pdfs/ (required)
#   --category <str>       Firestore category (auto-detected from subdir)
#   --dpi <int>            Initial DPI for conversion (default: 200)
#   --dpi-fallback <int>   First fallback DPI on retry (default: 150)
#   --overwrite            Re-convert even if already converted
#   --force-reingest       Bypass shell-level ingestion markers (Firestore-level
#                          dedup still prevents duplicates; use to recover markers)
#   --reset-state          Delete all state markers and start fresh
#   --recursive            Discover PDFs recursively in subdirectories
#   --no-log               Disable log file (output to terminal only)
# =============================================================================

# We intentionally do NOT use set -e. All errors are handled explicitly
# so the pipeline continues processing remaining files after any failure.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PYTHON_DIR="$REPO_ROOT/server/scripts/python"
SERVER_DIR="$REPO_ROOT/server"
CONVERT_SCRIPT="$PYTHON_DIR/convertPdfToMarkdown.py"
PDF_MANIFEST="$REPO_ROOT/server/knowledge-base/pdf-manifest.json"

# --- Defaults ---
PDF_SUBDIR=""
CATEGORY=""
INITIAL_DPI=0
DPI_FALLBACK=150
OVERWRITE_FLAG=false
FORCE_REINGEST=false
RESET_STATE=false
RECURSIVE=false
NO_LOG=false
MIN_MD_SIZE=1024
CONVERT_TIMEOUT=7200
INGEST_TIMEOUT=28800

# Populated during execution
PYTHON_CMD=""
HAS_TIMEOUT=false
SHUTDOWN_REQUESTED=false

# =============================================================================
# Helper Functions
# =============================================================================

resolve_category() {
  case "$1" in
    battery-passport)       echo "battery_passport" ;;
    eu-battery-regulation)  echo "regulations" ;;
    unece-homologation)     echo "homologation" ;;
    iec-iso-standards)      echo "standards" ;;
    functional-safety)      echo "functional_safety" ;;
    functional-safety/emergency-guides|functional-safety/nhtsa-emergency-response-guides) echo "functional_safety" ;;
    africa|africa-regulations)                 echo "africa_regulations" ;;
    asean|asean-regulations)                   echo "asean_regulations" ;;
    battery-production)     echo "battery_production" ;;
    battery-technology)     echo "battery_technology" ;;
    china|china-regulations)                   echo "china_regulations" ;;
    eaeu|eaeu-regulations)                     echo "eaeu_regulations" ;;
    global-market)          echo "global_market" ;;
    middle-east|middle-east-regulations)       echo "middle_east_regulations" ;;
    recycling|recycling-environment)              echo "recycling_environmental" ;;
    supply-chain|supply-chain-due-diligence)     echo "supply_chain" ;;
    transport-safety|transport-dangerous-goods)  echo "transport_dangerous_goods" ;;
    *)                      echo "" ;;
  esac
}

show_usage() {
  cat <<'USAGE'
Usage: bash server/scripts/runKnowledgePipeline.sh --pdf-subdir <name> [options]

Required:
  --pdf-subdir <name>    Subdirectory under knowledge-base/pdfs/

Optional:
  --category <str>       Firestore category (auto-detected from subdir if omitted)
  --dpi <int>            Initial conversion DPI (default: 200)
  --dpi-fallback <int>   First fallback DPI on retry (default: 150; degrades to 100, 72)
  --overwrite            Re-convert even if .md already exists
  --force-reingest       Re-ingest into Firestore even if already done
  --reset-state          Delete all state markers and start fresh
  --recursive            Discover PDFs recursively in subdirectories
  --no-log               Disable log file (output to terminal only)

Known subdirs -> categories:
  battery-passport      -> battery_passport
  eu-battery-regulation -> regulations
  unece-homologation    -> homologation
  iec-iso-standards     -> standards
  functional-safety     -> functional_safety
  functional-safety/emergency-guides -> functional_safety (canonical emergency guides path)
  functional-safety/nhtsa-emergency-response-guides -> functional_safety (legacy alias)
  africa-regulations    -> africa_regulations
  asean-regulations     -> asean_regulations
  battery-production    -> battery_production
  battery-technology    -> battery_technology
  china-regulations     -> china_regulations
  eaeu-regulations      -> eaeu_regulations
  global-market         -> global_market
  middle-east-regulations -> middle_east_regulations
  recycling             -> recycling_environmental
  recycling-environment -> recycling_environmental
  supply-chain          -> supply_chain
  supply-chain-due-diligence -> supply_chain
  transport-safety      -> transport_dangerous_goods
  transport-dangerous-goods -> transport_dangerous_goods
USAGE
}

# --- Signal handling ---

handle_shutdown() {
  echo ""
  echo "  SHUTDOWN REQUESTED — finishing current file, then exiting cleanly..."
  SHUTDOWN_REQUESTED=true
}

check_shutdown() {
  if [ "$SHUTDOWN_REQUESTED" = true ]; then
    echo ""
    echo "  Graceful shutdown: state saved. Re-run to continue from here."
    return 0
  fi
  return 1
}

# --- Lock file management ---

acquire_lock() {
  local lock_file="$1"

  if [ -f "$lock_file" ]; then
    local lock_pid lock_time now age
    lock_pid=$(head -1 "$lock_file" 2>/dev/null || echo "unknown")
    lock_time=$(sed -n '2p' "$lock_file" 2>/dev/null || echo "0")
    now=$(date +%s)
    age=$((now - lock_time))

    if kill -0 "$lock_pid" 2>/dev/null; then
      echo "ERROR: Another pipeline instance is running (PID: $lock_pid, age: ${age}s)."
      echo "  If this is incorrect, delete: $lock_file"
      return 1
    fi

    echo "  WARNING: Removing stale lock (PID $lock_pid died, was ${age}s old)"
    rm -f "$lock_file"
  fi

  echo "$$" > "$lock_file"
  date +%s >> "$lock_file"
  return 0
}

release_lock() {
  rm -f "${LOCK_FILE:-}" 2>/dev/null || true
}

# --- Prerequisites check ---

check_prerequisites() {
  echo "[Step 1] Verifying prerequisites..."

  PYTHON_CMD=""
  for candidate in python3 python py; do
    if command -v "$candidate" &>/dev/null; then
      if "$candidate" --version &>/dev/null 2>&1; then
        PYTHON_CMD="$candidate"
        break
      fi
    fi
  done
  if [ -z "$PYTHON_CMD" ]; then
    echo "ERROR: Python is not installed or not in PATH."
    echo "  On Windows, disable the Microsoft Store stubs:"
    echo "  Settings > Apps > Advanced app settings > App execution aliases"
    echo "  Then ensure Python is installed and in your PATH."
    return 1
  fi
  echo "  Python: $(command -v "$PYTHON_CMD") ($("$PYTHON_CMD" --version 2>&1))"

  if ! command -v node &>/dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH."
    return 1
  fi
  echo "  Node:   $(node --version)"

  HAS_TIMEOUT=false
  if command -v timeout &>/dev/null; then
    HAS_TIMEOUT=true
    echo "  timeout: available"
  else
    echo "  WARNING: 'timeout' command not found. Per-file timeouts will be skipped."
  fi

  if [ ! -d "$PYTHON_DIR/venv" ]; then
    echo "  Creating Python virtual environment..."
    "$PYTHON_CMD" -m venv "$PYTHON_DIR/venv"
  fi

  if [ -f "$PYTHON_DIR/venv/Scripts/activate" ]; then
    source "$PYTHON_DIR/venv/Scripts/activate"
  elif [ -f "$PYTHON_DIR/venv/bin/activate" ]; then
    source "$PYTHON_DIR/venv/bin/activate"
  else
    echo "ERROR: Cannot find venv activate script."
    return 1
  fi
  echo "  Venv activated: $(which python)"

  echo "  Installing Python dependencies..."
  pip install -q -r "$PYTHON_DIR/requirements.txt"

  echo "  Installing Node dependencies..."
  (cd "$SERVER_DIR" && npm install --silent)

  if [ ! -f "$SERVER_DIR/.env" ]; then
    echo "ERROR: server/.env file not found."
    return 1
  fi
  echo "  server/.env found."

  for var in XAI_API_KEY FIREBASE_PROJECT_ID FIREBASE_CLIENT_EMAIL FIREBASE_PRIVATE_KEY; do
    if ! grep -q "^${var}=" "$SERVER_DIR/.env"; then
      echo "  WARNING: $var not found in server/.env"
    fi
  done

  echo "[Step 1] Prerequisites OK."
  echo ""
  return 0
}

manifest_expected_count() {
  local subdir="$1"

  if [ ! -f "$PDF_MANIFEST" ]; then
    echo ""
    return 0
  fi

  node -e '
const fs = require("fs");
const [manifestPath, key] = process.argv.slice(1);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const count = manifest?.expectedPdfCounts?.[key];
if (Number.isFinite(count)) process.stdout.write(String(count));
' "$PDF_MANIFEST" "$subdir" 2>/dev/null || true
}

# --- Run Python conversion with timeout ---
# Extracted to eliminate duplication. Runs the conversion command once
# with the given DPI (0 = default/no --dpi flag).
# Returns the Python script's exit code.

run_python_convert() {
  local pdf_path="$1"
  local md_output_dir="$2"
  local dpi="$3"
  local overwrite_arg="$4"

  local dpi_arg=""
  if [ "$dpi" -gt 0 ] 2>/dev/null; then
    dpi_arg="--dpi $dpi"
  fi

  local exit_code=0
  if [ "$HAS_TIMEOUT" = true ]; then
    timeout "$CONVERT_TIMEOUT" python "$CONVERT_SCRIPT" \
      --input "$pdf_path" \
      --output-dir "$md_output_dir" \
      $overwrite_arg $dpi_arg || exit_code=$?
  else
    python "$CONVERT_SCRIPT" \
      --input "$pdf_path" \
      --output-dir "$md_output_dir" \
      $overwrite_arg $dpi_arg || exit_code=$?
  fi
  return $exit_code
}

# --- Convert a single PDF with progressive DPI degradation ---
# Tries normal DPI first, then cascades through fallback DPI levels
# (150 -> 100 -> 72) on memory/timeout failures.
# Returns: 0 = success, 1 = failure, 2 = skipped

convert_one_pdf() {
  local pdf_path="$1"
  local md_output_dir="$2"
  local state_dir="$3"
  local overwrite="$4"
  local initial_dpi_fallback="$5"

  local pdf stem md_path marker
  pdf="$(basename "$pdf_path")"
  stem="${pdf%.pdf}"
  md_path="$md_output_dir/${stem}.md"
  marker="$state_dir/${stem}.converted"

  # 1. Check state marker (highest priority skip)
  if [ "$overwrite" = false ] && [ -f "$marker" ]; then
    echo "    SKIP (already converted)"
    return 2
  fi

  # 2. Crash recovery: valid .md exists but marker is missing
  if [ "$overwrite" = false ] && [ -f "$md_path" ]; then
    local md_size
    md_size=$(wc -c < "$md_path" 2>/dev/null || echo "0")
    if [ "$md_size" -gt "$MIN_MD_SIZE" ]; then
      echo "    SKIP (valid .md exists, ${md_size} bytes — recovering missing marker)"
      touch "$marker"
      return 2
    fi
  fi

  # 3. Determine if we need --overwrite (for partial .md from previous crash)
  local overwrite_arg=""
  if [ "$overwrite" = true ] || [ -f "$md_path" ]; then
    overwrite_arg="--overwrite"
  fi

  # 4. Build the DPI cascade: initial DPI, then progressively lower fallbacks
  #    Deduplicates and only includes values lower than the starting DPI.
  local dpi_levels=("$INITIAL_DPI")

  # Determine the effective numeric ceiling for filtering fallbacks
  local effective_ceiling=200
  if [ "$INITIAL_DPI" -gt 0 ] 2>/dev/null; then
    effective_ceiling="$INITIAL_DPI"
  fi

  for dpi in "$initial_dpi_fallback" 150 100 72; do
    # Only fall back to DPI levels strictly lower than starting DPI
    if [ "$dpi" -ge "$effective_ceiling" ] 2>/dev/null; then
      continue
    fi
    local already_listed=false
    for existing in "${dpi_levels[@]}"; do
      if [ "$existing" -eq "$dpi" ] 2>/dev/null; then
        already_listed=true
        break
      fi
    done
    if [ "$already_listed" = false ]; then
      dpi_levels+=("$dpi")
    fi
  done

  # 5. Try each DPI level in order
  local attempt=0
  for dpi in "${dpi_levels[@]}"; do
    attempt=$((attempt + 1))

    # After the first attempt, only retry on retryable exit codes
    if [ $attempt -gt 1 ]; then
      local label
      if [ "$dpi" -eq 0 ]; then label="default DPI"; else label="${dpi} DPI"; fi
      echo "    Retry #$((attempt - 1)) at $label..."
      # Force overwrite on retries
      overwrite_arg="--overwrite"
    fi

    local exit_code=0
    run_python_convert "$pdf_path" "$md_output_dir" "$dpi" "$overwrite_arg" || exit_code=$?

    # Success
    if [ $exit_code -eq 0 ] && [ -f "$md_path" ] && [ -s "$md_path" ]; then
      local size
      size=$(wc -c < "$md_path")
      if [ "$size" -le "$MIN_MD_SIZE" ]; then
        echo "    UNDERSIZED OUTPUT (${size} bytes <= ${MIN_MD_SIZE})"
        continue
      fi
      if [ $attempt -eq 1 ]; then
        echo "    OK: ${stem}.md (${size} bytes)"
      else
        echo "    OK (recovered at attempt #${attempt}): ${stem}.md (${size} bytes)"
      fi
      touch "$marker"
      return 0
    fi

    # Exit code 1: file exists without --overwrite — recover if valid
    if [ $exit_code -eq 1 ] && [ -f "$md_path" ]; then
      local md_size
      md_size=$(wc -c < "$md_path" 2>/dev/null || echo "0")
      if [ "$md_size" -gt "$MIN_MD_SIZE" ]; then
        echo "    OK: ${stem}.md already exists (${md_size} bytes)"
        touch "$marker"
        return 0
      fi
    fi

    # Retryable failures — continue to next DPI level
    if [ $exit_code -eq 3 ] || [ $exit_code -eq 7 ] || [ $exit_code -eq 124 ] || [ $exit_code -eq 139 ]; then
      local reason
      case $exit_code in
        3)     reason="MEMORY ERROR" ;;
        7|124) reason="TIMEOUT" ;;
        139)   reason="SEGFAULT" ;;
      esac
      echo "    $reason (exit $exit_code)"
      continue
    fi

    # Non-retryable failures — stop trying
    if [ $exit_code -eq 2 ]; then
      echo "    EMPTY OUTPUT: PDF may be scanned/image-only"
    elif [ $exit_code -eq 4 ]; then
      echo "    INPUT VALIDATION FAILED (corrupt or unsupported PDF)"
    elif [ $exit_code -eq 5 ]; then
      echo "    INSUFFICIENT DISK SPACE"
    elif [ $exit_code -eq 6 ]; then
      echo "    SHUTDOWN SIGNAL received by converter"
    elif [ $exit_code -eq 0 ]; then
      echo "    WARN: Conversion returned 0 but .md file is empty or missing"
    else
      echo "    FAILED (exit code: $exit_code)"
    fi
    break
  done

  # 6. All DPI attempts exhausted — try PyMuPDF fallback
  echo "    All Marker attempts failed. Trying PyMuPDF fallback..."

  local fallback_exit=0
  if [ "$HAS_TIMEOUT" = true ]; then
    timeout "$CONVERT_TIMEOUT" python "$CONVERT_SCRIPT" \
      --input "$pdf_path" \
      --output-dir "$md_output_dir" \
      --overwrite \
      --fallback pymupdf || fallback_exit=$?
  else
    python "$CONVERT_SCRIPT" \
      --input "$pdf_path" \
      --output-dir "$md_output_dir" \
      --overwrite \
      --fallback pymupdf || fallback_exit=$?
  fi

  if [ $fallback_exit -eq 0 ] && [ -f "$md_path" ] && [ -s "$md_path" ]; then
    local size
    size=$(wc -c < "$md_path")
    if [ "$size" -le "$MIN_MD_SIZE" ]; then
      echo "    UNDERSIZED OUTPUT with PyMuPDF (${size} bytes <= ${MIN_MD_SIZE})"
      fallback_exit=2
    else
      echo "    OK (PyMuPDF fallback): ${stem}.md (${size} bytes)"
      touch "$marker"
      return 0
    fi
  fi

  echo "    PyMuPDF fallback also failed (exit $fallback_exit)"

  # 7. All attempts exhausted — clean up partial output
  if [ -f "$md_path" ]; then
    local md_size
    md_size=$(wc -c < "$md_path" 2>/dev/null || echo "0")
    if [ "$md_size" -le "$MIN_MD_SIZE" ]; then
      rm -f "$md_path"
      echo "    Cleaned up partial output (${md_size} bytes)"
    fi
  fi

  return 1
}

# --- Ingest a single .md file into Firestore ---
# Returns: 0 = success, 1 = failure, 2 = skipped

ingest_one_file() {
  local md_path="$1"
  local category="$2"
  local state_dir="$3"
  local force="$4"
  local server_dir="$5"

  local stem marker
  stem="$(basename "${md_path%.md}")"
  marker="$state_dir/${stem}.ingested"

  # Check state marker
  if [ "$force" = false ] && [ -f "$marker" ]; then
    echo "    SKIP (already ingested)"
    return 2
  fi

  # Validate the .md file before attempting ingestion
  if [ ! -f "$md_path" ] || [ ! -s "$md_path" ]; then
    echo "    SKIP (file missing or empty)"
    return 2
  fi

  local md_size
  md_size=$(wc -c < "$md_path" 2>/dev/null || echo "0")
  if [ "$md_size" -le "$MIN_MD_SIZE" ]; then
    echo "    FAILED (file too small: ${md_size} bytes <= ${MIN_MD_SIZE})"
    return 1
  fi

  # Ingest with timeout + defense-in-depth deduplication via --skip-existing
  local exit_code=0
  if [ "$HAS_TIMEOUT" = true ]; then
    (cd "$server_dir" && timeout "$INGEST_TIMEOUT" node scripts/extractMarkdownKnowledge.js \
      "$md_path" \
      --category "$category" \
      --skip-existing) || exit_code=$?
  else
    (cd "$server_dir" && node scripts/extractMarkdownKnowledge.js \
      "$md_path" \
      --category "$category" \
      --skip-existing) || exit_code=$?
  fi

  if [ $exit_code -eq 0 ]; then
    touch "$marker"
    echo "    OK (ingested)"
    return 0
  fi

  if [ $exit_code -eq 124 ]; then
    echo "    TIMEOUT (ingestion exceeded ${INGEST_TIMEOUT}s — xAI API may be slow)"
  else
    echo "    FAILED (ingest exit code: $exit_code)"
  fi
  return 1
}

# =============================================================================
# Argument Parsing
# =============================================================================

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pdf-subdir)     PDF_SUBDIR="$2"; shift 2 ;;
    --category)       CATEGORY="$2"; shift 2 ;;
    --dpi)            INITIAL_DPI="$2"; shift 2 ;;
    --dpi-fallback)   DPI_FALLBACK="$2"; shift 2 ;;
    --overwrite)      OVERWRITE_FLAG=true; shift ;;
    --force-reingest) FORCE_REINGEST=true; shift ;;
    --reset-state)    RESET_STATE=true; shift ;;
    --recursive)      RECURSIVE=true; shift ;;
    --no-log)         NO_LOG=true; shift ;;
    --help|-h)        show_usage; exit 0 ;;
    *)
      echo "ERROR: Unknown argument: $1"
      show_usage
      exit 1
      ;;
  esac
done

if [ -z "$PDF_SUBDIR" ]; then
  echo "ERROR: --pdf-subdir is required."
  echo ""
  show_usage
  exit 1
fi

# Auto-detect category from subdir if not provided
if [ -z "$CATEGORY" ]; then
  CATEGORY=$(resolve_category "$PDF_SUBDIR")
  if [ -z "$CATEGORY" ]; then
    echo "ERROR: Unknown subdir '$PDF_SUBDIR' — cannot auto-detect category."
    echo "  Provide --category explicitly or add the mapping to resolve_category()."
    echo ""
    show_usage
    exit 1
  fi
  echo "  Auto-detected category: $CATEGORY (from --pdf-subdir $PDF_SUBDIR)"
fi

# =============================================================================
# Derived Paths
# =============================================================================

PDF_DIR="$REPO_ROOT/server/knowledge-base/pdfs/$PDF_SUBDIR"
MD_OUTPUT_DIR="$REPO_ROOT/server/knowledge-base/markdown_output/$PDF_SUBDIR"
STATE_DIR="$MD_OUTPUT_DIR/.state"
LOCK_FILE="$MD_OUTPUT_DIR/.pipeline.lock"
LOG_DIR="$MD_OUTPUT_DIR/.logs"
UNRESOLVED_FAILURES_FILE="$STATE_DIR/unresolved_failures.txt"

echo "============================================="
echo "Knowledge Base Pipeline (Robust)"
echo "  Subdir:         $PDF_SUBDIR"
echo "  Category:       $CATEGORY"
echo "  Overwrite:      $OVERWRITE_FLAG"
echo "  Force reingest: $FORCE_REINGEST"
if [ "$INITIAL_DPI" -gt 0 ] 2>/dev/null; then
  DPI_LABEL="$INITIAL_DPI"
else
  DPI_LABEL="default (200)"
fi
echo "  DPI cascade:    $DPI_LABEL -> $DPI_FALLBACK -> 100 -> 72"
echo "============================================="
echo ""

# =============================================================================
# Step 1: Prerequisites
# =============================================================================

if ! check_prerequisites; then
  exit 1
fi

# =============================================================================
# Step 2: Workspace Setup + Lock + Log + Signals
# =============================================================================

echo "[Step 2] Setting up workspace..."

mkdir -p "$MD_OUTPUT_DIR"
mkdir -p "$STATE_DIR"
mkdir -p "$LOG_DIR"

: > "$UNRESOLVED_FAILURES_FILE"

if [ "$RESET_STATE" = true ]; then
  echo "  Resetting all state markers..."
  rm -f "$STATE_DIR"/*.converted "$STATE_DIR"/*.ingested 2>/dev/null || true
fi

if ! acquire_lock "$LOCK_FILE"; then
  exit 1
fi
trap release_lock EXIT
echo "  Lock acquired (PID $$)"

# Set up log file (tee all output to both terminal and log)
if [ "$NO_LOG" = false ]; then
  LOG_FILE="$LOG_DIR/pipeline_$(date +%Y%m%d_%H%M%S).log"
  echo "  Log file: $LOG_FILE"

  # Redirect stdout and stderr through tee
  exec > >(tee -a "$LOG_FILE") 2>&1
fi

# Set up graceful shutdown (after lock, so cleanup works)
trap 'handle_shutdown' SIGINT SIGTERM
# Combine with lock release on EXIT (trap overwrite protection)
trap 'release_lock' EXIT

echo ""

# =============================================================================
# Step 3: Discover PDFs
# =============================================================================

echo "[Step 3] Discovering PDFs..."

if [ ! -d "$PDF_DIR" ]; then
  echo "ERROR: PDF directory not found: $PDF_DIR"
  exit 1
fi

if [ "$RECURSIVE" = true ]; then
  mapfile -t PDF_FILES < <(find "$PDF_DIR" -name "*.pdf" | sort)
else
  mapfile -t PDF_FILES < <(find "$PDF_DIR" -maxdepth 1 -name "*.pdf" | sort)
fi

EXPECTED_PDF_COUNT="$(manifest_expected_count "$PDF_SUBDIR")"
if [ -n "$EXPECTED_PDF_COUNT" ]; then
  echo "  Manifest expected PDF count: $EXPECTED_PDF_COUNT"
fi

if [ ${#PDF_FILES[@]} -eq 0 ]; then
  echo "  No PDF files found in $PDF_DIR"
  echo "  Nothing to process."
  exit 0
fi

echo "  Found ${#PDF_FILES[@]} PDF file(s)"
if [ -n "$EXPECTED_PDF_COUNT" ] && [ ${#PDF_FILES[@]} -lt "$EXPECTED_PDF_COUNT" ]; then
  echo "  WARNING: PDFs on disk are below manifest expectation (${#PDF_FILES[@]}/$EXPECTED_PDF_COUNT)"
fi
echo ""

# =============================================================================
# Step 4: Conversion Pass
# =============================================================================

echo "[Step 4] Converting PDFs to Markdown..."
echo ""

CONVERT_TOTAL=${#PDF_FILES[@]}
CONVERT_SUCCESS=0
CONVERT_FAILED=0
CONVERT_SKIPPED=0
CONVERT_FAILED_LIST=()

for i in "${!PDF_FILES[@]}"; do
  # Check for graceful shutdown before each file
  if check_shutdown 2>/dev/null; then break; fi

  idx=$((i + 1))
  pdf_path="${PDF_FILES[$i]}"
  pdf="$(basename "$pdf_path")"

  echo "  [$idx/$CONVERT_TOTAL] $pdf"

  convert_one_pdf "$pdf_path" "$MD_OUTPUT_DIR" "$STATE_DIR" "$OVERWRITE_FLAG" "$DPI_FALLBACK"
  result=$?

  case $result in
    0) CONVERT_SUCCESS=$((CONVERT_SUCCESS + 1)) ;;
    1) CONVERT_FAILED=$((CONVERT_FAILED + 1)); CONVERT_FAILED_LIST+=("$pdf") ;;
    2) CONVERT_SKIPPED=$((CONVERT_SKIPPED + 1)) ;;
  esac

  echo ""
done

echo "  ----------------------------------------"
echo "  Conversion: $CONVERT_SUCCESS OK, $CONVERT_FAILED failed, $CONVERT_SKIPPED skipped (of $CONVERT_TOTAL)"
echo ""

# =============================================================================
# Step 5: Retry Pass for Failed Conversions
# =============================================================================

STILL_FAILED_LIST=()

if [ ${#CONVERT_FAILED_LIST[@]} -gt 0 ] && [ "$SHUTDOWN_REQUESTED" = false ]; then
  echo "[Step 5] Retry pass: ${#CONVERT_FAILED_LIST[@]} failed PDF(s)..."
  echo ""

  RETRY_RECOVERED=0

  for pdf in "${CONVERT_FAILED_LIST[@]}"; do
    if check_shutdown 2>/dev/null; then
      STILL_FAILED_LIST+=("$pdf")
      continue
    fi

    pdf_path="$PDF_DIR/$pdf"
    echo "  [Retry] $pdf"

    # Force overwrite for retries (partial .md may exist)
    convert_one_pdf "$pdf_path" "$MD_OUTPUT_DIR" "$STATE_DIR" "true" "$DPI_FALLBACK"
    result=$?

    if [ $result -eq 0 ] || [ $result -eq 2 ]; then
      RETRY_RECOVERED=$((RETRY_RECOVERED + 1))
    else
      STILL_FAILED_LIST+=("$pdf")
    fi
    echo ""
  done

  CONVERT_SUCCESS=$((CONVERT_SUCCESS + RETRY_RECOVERED))
  CONVERT_FAILED=$((CONVERT_FAILED - RETRY_RECOVERED))

  echo "  Retry: $RETRY_RECOVERED recovered, ${#STILL_FAILED_LIST[@]} still failing"
  if [ ${#STILL_FAILED_LIST[@]} -gt 0 ]; then
    echo "  Unresolved conversion failures:"
    for f in "${STILL_FAILED_LIST[@]}"; do
      echo "    - $f"
    done
  fi
  echo ""
else
  if [ ${#CONVERT_FAILED_LIST[@]} -eq 0 ]; then
    echo "[Step 5] No failed PDFs to retry."
  else
    echo "[Step 5] Skipped (shutdown requested)."
    STILL_FAILED_LIST=("${CONVERT_FAILED_LIST[@]}")
  fi
  echo ""
fi

# NOTE: We do NOT abort here. Even if some conversions failed, we proceed
# to ingest the ones that succeeded. No knowledge element is lost.

# =============================================================================
# Step 6: Firestore Pre-Count
# =============================================================================

echo "[Step 6] Checking Firestore pre-ingest count..."

PRE_COUNT=$( (cd "$SERVER_DIR" && node scripts/utils/countFirestoreCategory.js --category "$CATEGORY") 2>/dev/null) || true
PRE_COUNT=${PRE_COUNT:-0}
echo "  Pre-ingest count for '$CATEGORY': $PRE_COUNT"
echo ""

# =============================================================================
# Step 7: Per-File Firestore Ingestion
# =============================================================================

echo "[Step 7] Ingesting Markdown into Firestore (per-file)..."
echo ""

# Collect all valid .md files (not state files, not failed logs)
mapfile -t MD_FILES < <(find "$MD_OUTPUT_DIR" -maxdepth 1 -name "*.md" -type f | sort)

INGEST_TOTAL=${#MD_FILES[@]}
INGEST_SUCCESS=0
INGEST_FAILED=0
INGEST_SKIPPED=0
INGEST_FAILED_LIST=()

if [ "$INGEST_TOTAL" -eq 0 ]; then
  echo "  No .md files to ingest."
else
  for i in "${!MD_FILES[@]}"; do
    if check_shutdown 2>/dev/null; then break; fi

    idx=$((i + 1))
    md_path="${MD_FILES[$i]}"
    md_name="$(basename "$md_path")"

    echo "  [$idx/$INGEST_TOTAL] $md_name"

    ingest_one_file "$md_path" "$CATEGORY" "$STATE_DIR" "$FORCE_REINGEST" "$SERVER_DIR"
    result=$?

    case $result in
      0) INGEST_SUCCESS=$((INGEST_SUCCESS + 1)) ;;
      1) INGEST_FAILED=$((INGEST_FAILED + 1)); INGEST_FAILED_LIST+=("$md_name") ;;
      2) INGEST_SKIPPED=$((INGEST_SKIPPED + 1)) ;;
    esac

    echo ""
  done
fi

echo "  ----------------------------------------"
echo "  Ingestion: $INGEST_SUCCESS OK, $INGEST_FAILED failed, $INGEST_SKIPPED skipped (of $INGEST_TOTAL)"
echo ""

# =============================================================================
# Step 8: Retry Pass for Failed Ingestions
# =============================================================================

INGEST_STILL_FAILED=()

if [ ${#INGEST_FAILED_LIST[@]} -gt 0 ] && [ "$SHUTDOWN_REQUESTED" = false ]; then
  echo "[Step 8] Retrying ${#INGEST_FAILED_LIST[@]} failed ingestion(s)..."
  echo ""

  INGEST_RECOVERED=0

  for md_name in "${INGEST_FAILED_LIST[@]}"; do
    if check_shutdown 2>/dev/null; then
      INGEST_STILL_FAILED+=("$md_name")
      continue
    fi

    md_path="$MD_OUTPUT_DIR/$md_name"
    echo "  [Retry] $md_name"

    ingest_one_file "$md_path" "$CATEGORY" "$STATE_DIR" "true" "$SERVER_DIR"
    result=$?

    if [ $result -eq 0 ]; then
      INGEST_RECOVERED=$((INGEST_RECOVERED + 1))
    else
      INGEST_STILL_FAILED+=("$md_name")
    fi
    echo ""
  done

  INGEST_SUCCESS=$((INGEST_SUCCESS + INGEST_RECOVERED))
  INGEST_FAILED=$((INGEST_FAILED - INGEST_RECOVERED))

  echo "  Retry: $INGEST_RECOVERED recovered, ${#INGEST_STILL_FAILED[@]} still failing"
  if [ ${#INGEST_STILL_FAILED[@]} -gt 0 ]; then
    echo "  Unresolved ingestion failures:"
    for f in "${INGEST_STILL_FAILED[@]}"; do
      echo "    - $f"
    done
  fi
  echo ""
else
  if [ ${#INGEST_FAILED_LIST[@]} -eq 0 ]; then
    echo "[Step 8] No failed ingestions to retry."
  else
    echo "[Step 8] Skipped (shutdown requested)."
    INGEST_STILL_FAILED=("${INGEST_FAILED_LIST[@]}")
  fi
  echo ""
fi

# =============================================================================
# Step 9: Firestore Post-Count
# =============================================================================

echo "[Step 9] Checking Firestore post-ingest count..."

POST_COUNT=$( (cd "$SERVER_DIR" && node scripts/utils/countFirestoreCategory.js --category "$CATEGORY") 2>/dev/null) || true
POST_COUNT=${POST_COUNT:-0}
DELTA=$((POST_COUNT - PRE_COUNT))
echo "  Post-ingest count: $POST_COUNT (+$DELTA new documents)"
echo ""

CONVERTED_NOT_INGESTED=()
if [ -d "$STATE_DIR" ]; then
  while IFS= read -r marker_path; do
    stem="$(basename "${marker_path%.converted}")"
    if [ ! -f "$STATE_DIR/${stem}.ingested" ]; then
      md_path="$MD_OUTPUT_DIR/${stem}.md"
      if [ ! -f "$md_path" ]; then
        CONVERTED_NOT_INGESTED+=("${stem}.md (missing)")
      else
        md_size=$(wc -c < "$md_path" 2>/dev/null || echo "0")
        if [ "$md_size" -le "$MIN_MD_SIZE" ]; then
          CONVERTED_NOT_INGESTED+=("${stem}.md (${md_size} bytes)")
        else
          CONVERTED_NOT_INGESTED+=("${stem}.md")
        fi
      fi
    fi
  done < <(find "$STATE_DIR" -maxdepth 1 -type f -name "*.converted" | sort)
fi

{
  for f in "${STILL_FAILED_LIST[@]}"; do
    echo "conversion:$f"
  done
  for f in "${INGEST_STILL_FAILED[@]}"; do
    echo "ingestion:$f"
  done
  for f in "${CONVERTED_NOT_INGESTED[@]}"; do
    echo "state:converted_without_ingested:$f"
  done
} > "$UNRESOLVED_FAILURES_FILE"

# =============================================================================
# Final Summary
# =============================================================================

PIPELINE_OK=true
if [ $CONVERT_FAILED -gt 0 ] || [ $INGEST_FAILED -gt 0 ] || [ ${#CONVERTED_NOT_INGESTED[@]} -gt 0 ]; then
  PIPELINE_OK=false
fi

echo "============================================="
if [ "$SHUTDOWN_REQUESTED" = true ]; then
  echo "Pipeline INTERRUPTED (graceful shutdown)"
elif [ "$PIPELINE_OK" = true ]; then
  echo "Pipeline COMPLETE"
else
  echo "Pipeline FINISHED WITH ERRORS"
fi
echo "  PDF subdir:      $PDF_SUBDIR"
echo "  Category:        $CATEGORY"
echo "  ---"
echo "  Conversion:      $CONVERT_SUCCESS OK, $CONVERT_FAILED failed, $CONVERT_SKIPPED skipped"
echo "  Ingestion:       $INGEST_SUCCESS OK, $INGEST_FAILED failed, $INGEST_SKIPPED skipped"
echo "  Converted w/o ingested: ${#CONVERTED_NOT_INGESTED[@]}"
echo "  Firestore:       $PRE_COUNT -> $POST_COUNT (+$DELTA)"

if [ $CONVERT_FAILED -gt 0 ]; then
  echo "  ---"
  echo "  Conversion failures (re-run to retry):"
  for f in "${STILL_FAILED_LIST[@]}"; do
    echo "    - $f"
  done
fi

if [ $INGEST_FAILED -gt 0 ]; then
  echo "  ---"
  echo "  Ingestion failures (re-run to retry):"
  for f in "${INGEST_STILL_FAILED[@]}"; do
    echo "    - $f"
  done
fi

if [ ${#CONVERTED_NOT_INGESTED[@]} -gt 0 ]; then
  echo "  ---"
  echo "  Converted but not ingestible/ingested:"
  for f in "${CONVERTED_NOT_INGESTED[@]}"; do
    echo "    - $f"
  done
fi

echo ""
echo "  State directory:  $STATE_DIR"
echo "  Active failures:  $UNRESOLVED_FAILURES_FILE"
if [ "$NO_LOG" = false ] && [ -n "${LOG_FILE:-}" ]; then
  echo "  Log file:         $LOG_FILE"
fi
echo "  Re-run to process any remaining failures."
if [ $CONVERT_FAILED -gt 0 ] || [ $INGEST_FAILED -gt 0 ] || [ "$SHUTDOWN_REQUESTED" = true ]; then
  echo "  Use --reset-state to clear all markers and start fresh."
fi
echo "============================================="

if [ "$PIPELINE_OK" = false ] || [ "$SHUTDOWN_REQUESTED" = true ]; then
  exit 1
fi
exit 0
