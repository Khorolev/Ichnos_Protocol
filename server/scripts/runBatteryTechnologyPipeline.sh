#!/usr/bin/env bash
# =============================================================================
# Battery Technology Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# Category (enforced): batteries
# PDFs present (1): JRC battery technology research.
#
# Usage (from repo root):
#   bash server/scripts/runBatteryTechnologyPipeline.sh
#   bash server/scripts/runBatteryTechnologyPipeline.sh --overwrite
#   bash server/scripts/runBatteryTechnologyPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir battery-technology --category batteries "$@"
