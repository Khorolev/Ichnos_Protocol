#!/usr/bin/env bash
# =============================================================================
# NHTSA Emergency Response Guides Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# Targets the emergency-guides subfolder under functional-safety/.
# The main runFunctionalSafetyPipeline.sh intentionally excludes this folder
# (generic pipeline uses -maxdepth 1), so this wrapper handles it separately.
#
# Pre-condition: PDFs must be downloaded first. If the folder is empty, run:
#   node server/scripts/downloadNhtsaERG.mjs
#   (requires: npx playwright install chromium from e2e/)
#
# Usage (from repo root):
#   bash server/scripts/runEmergencyGuidesPipeline.sh
#   bash server/scripts/runEmergencyGuidesPipeline.sh --overwrite
#   bash server/scripts/runEmergencyGuidesPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir functional-safety/emergency-guides "$@"
