#!/usr/bin/env bash
# =============================================================================
# Middle East Regulations Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# PDFs present (5): UAE_Energy_Strategy_2050,
# Saudi_Vision_2030_Themes_Sheet, Oman_PAEW_Law,
# Bahrain_EWA_Electrical_Installation_Regulation,
# Kuwait_MEW_R1_Electrical_Installation_Regulation.
# Paid GSO/SASO/ESMA/Qatar battery standards are excluded.
#
# Usage (from repo root):
#   bash server/scripts/runMiddleEastPipeline.sh
#   bash server/scripts/runMiddleEastPipeline.sh --overwrite
#   bash server/scripts/runMiddleEastPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir middle-east --category regulations "$@"
