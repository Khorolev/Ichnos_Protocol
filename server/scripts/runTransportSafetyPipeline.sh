#!/usr/bin/env bash
# =============================================================================
# Transport of Dangerous Goods Knowledge Base Pipeline (backward-compatible alias)
# Prefer runTransportDangerousGoodsPipeline.sh for new usage.
# Delegates to the robust generic pipeline via transport-dangerous-goods subdir.
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir transport-safety "$@"
