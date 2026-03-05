#!/usr/bin/env bash
# =============================================================================
# Functional Safety & Testing Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# Processes PDFs in functional-safety/ (top-level only).
# Subdirectories (e.g. emergency-guides/) are handled by their own wrappers.
# All output goes to server/knowledge-base/markdown_output/functional-safety/.
#
# Usage (from repo root):
#   bash server/scripts/runFunctionalSafetyPipeline.sh
#   bash server/scripts/runFunctionalSafetyPipeline.sh --overwrite
#   bash server/scripts/runFunctionalSafetyPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir functional-safety "$@"
