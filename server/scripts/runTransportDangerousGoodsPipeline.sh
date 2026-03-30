#!/usr/bin/env bash
# =============================================================================
# Transport of Dangerous Goods Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# PDFs present (6): UN Manual Rev.8 + Amend.1, UN Model Regs Rev.23
# Vol 1/2, ADR 2025 Vol 1/2.
# Paid/web-only sources (IMDG, IATA, ICAO, RID, PHMSA, ADN) are
# excluded from this pipeline.
#
# Usage (from repo root):
#   bash server/scripts/runTransportDangerousGoodsPipeline.sh
#   bash server/scripts/runTransportDangerousGoodsPipeline.sh --overwrite
#   bash server/scripts/runTransportDangerousGoodsPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir transport-safety "$@"
