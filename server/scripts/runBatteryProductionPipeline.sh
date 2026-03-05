#!/usr/bin/env bash
# =============================================================================
# Battery Production Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# Category (enforced): batteries
# PDFs present (1): Lithium-ion battery production process.
#
# Usage (from repo root):
#   bash server/scripts/runBatteryProductionPipeline.sh
#   bash server/scripts/runBatteryProductionPipeline.sh --overwrite
#   bash server/scripts/runBatteryProductionPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir battery-production --category batteries "$@"
