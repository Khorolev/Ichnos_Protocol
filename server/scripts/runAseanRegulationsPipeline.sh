#!/usr/bin/env bash
# =============================================================================
# ASEAN Regulations Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# PDFs present (5): ASEAN_MRA_EE_Equipment_2002,
# OECD_ASEAN_Fuel_Economy_Roadmap_Implementation,
# Thailand_BOI_EV_Investment_Policy_2024,
# ICCT_Vietnam_EV_Development_2022,
# ASEAN_Framework_Integration_Priority_Sectors.
# Paid SNI/PNS/MS standards and web-only Singapore LTA page are excluded.
#
# Usage (from repo root):
#   bash server/scripts/runAseanRegulationsPipeline.sh
#   bash server/scripts/runAseanRegulationsPipeline.sh --overwrite
#   bash server/scripts/runAseanRegulationsPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir asean --category regulations "$@"
