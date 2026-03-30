#!/usr/bin/env bash
# =============================================================================
# EU Battery Regulation Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# Usage (from repo root):
#   bash server/scripts/runEuRegulationPipeline.sh
#   bash server/scripts/runEuRegulationPipeline.sh --overwrite
#   bash server/scripts/runEuRegulationPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir eu-battery-regulation "$@"
