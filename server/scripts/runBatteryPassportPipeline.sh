#!/usr/bin/env bash
# =============================================================================
# Battery Passport Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# Usage (from repo root):
#   bash server/scripts/runBatteryPassportPipeline.sh
#   bash server/scripts/runBatteryPassportPipeline.sh --overwrite
#   bash server/scripts/runBatteryPassportPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir battery-passport "$@"
