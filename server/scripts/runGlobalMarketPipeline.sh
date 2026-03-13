#!/usr/bin/env bash
# =============================================================================
# Global Market Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# Processes global market reports (trade analyses, market outlooks,
# cross-regional battery industry studies) stored under
# knowledge-base/pdfs/global-market/.
#
# Usage (from repo root):
#   bash server/scripts/runGlobalMarketPipeline.sh
#   bash server/scripts/runGlobalMarketPipeline.sh --overwrite
#   bash server/scripts/runGlobalMarketPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir global-market "$@"
