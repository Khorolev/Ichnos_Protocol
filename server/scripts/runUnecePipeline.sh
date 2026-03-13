#!/usr/bin/env bash
# =============================================================================
# UNECE Homologation Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# Usage (from repo root):
#   bash server/scripts/runUnecePipeline.sh
#   bash server/scripts/runUnecePipeline.sh --overwrite
#   bash server/scripts/runUnecePipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir unece-homologation "$@"
