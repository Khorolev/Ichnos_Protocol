#!/usr/bin/env bash
# =============================================================================
# IEC/ISO Standards Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# NOTE: Most IEC/ISO standards are paid/proprietary. Only the free
# documents are included. Add more PDFs to the pdfs/iec-iso-standards/
# directory — they will be discovered automatically.
#
# Usage (from repo root):
#   bash server/scripts/runIecIsoStandardsPipeline.sh
#   bash server/scripts/runIecIsoStandardsPipeline.sh --overwrite
#   bash server/scripts/runIecIsoStandardsPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir iec-iso-standards "$@"
