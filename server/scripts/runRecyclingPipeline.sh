#!/usr/bin/env bash
# =============================================================================
# Safety, Recycling & Environmental Knowledge Base Pipeline (backward-compatible alias)
# Prefer runSafetyRecyclingPipeline.sh for new usage.
# Delegates to the robust generic pipeline via recycling-environment subdir.
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir recycling "$@"
