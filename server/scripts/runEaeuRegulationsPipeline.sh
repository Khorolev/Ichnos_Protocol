#!/usr/bin/env bash
# =============================================================================
# EAEU Regulations Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# PDFs present (1): EAEU_TR_CU_004-2011_LV_Equipment_EN.
# Only 1 downloaded PDF; remaining sources are web-only (Russian text)
# or paid. The script will process what is available without error.
#
# Usage (from repo root):
#   bash server/scripts/runEaeuRegulationsPipeline.sh
#   bash server/scripts/runEaeuRegulationsPipeline.sh --overwrite
#   bash server/scripts/runEaeuRegulationsPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir eaeu --category regulations "$@"
