#!/usr/bin/env bash
# =============================================================================
# Supply Chain Due Diligence Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# PDFs present (5): OECD minerals, IRMA v2, EU CRM Act, EU Conflict
# Minerals Regulation, CSDDD / UN Guiding Principles.
# Web-only sources (RMI, Cobalt Institute, Copper Mark, OECD Handbook)
# are excluded from this pipeline.
#
# Usage (from repo root):
#   bash server/scripts/runSupplyChainPipeline.sh
#   bash server/scripts/runSupplyChainPipeline.sh --overwrite
#   bash server/scripts/runSupplyChainPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir supply-chain "$@"
