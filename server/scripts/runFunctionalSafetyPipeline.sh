#!/usr/bin/env bash
# =============================================================================
# Functional Safety & Testing Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# NOTE: Only processes root-level PDFs in functional-safety/.
# The nhtsa-emergency-response-guides/ subfolder is excluded
# by the generic pipeline's -maxdepth 1 discovery.
#
# Usage (from repo root):
#   bash server/scripts/runFunctionalSafetyPipeline.sh
#   bash server/scripts/runFunctionalSafetyPipeline.sh --overwrite
#   bash server/scripts/runFunctionalSafetyPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir functional-safety "$@"
