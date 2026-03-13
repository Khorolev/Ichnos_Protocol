#!/usr/bin/env bash
# =============================================================================
# China Regulations Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# PDFs present (4): UNECE_China_EV_Battery_Safety_Standards_EVS-04-12e,
# UNECE_GB38031_Revision_Status_SIGTP-01-11,
# China_NEV_Development_Plan_2021-2035_ICCT,
# GBA_Battery_Passport_2024_Overview.
# Paid GB/T standards and web-only sources (MIIT traceability, RoHS, CCC)
# are excluded from this pipeline.
#
# Usage (from repo root):
#   bash server/scripts/runChinaRegulationsPipeline.sh
#   bash server/scripts/runChinaRegulationsPipeline.sh --overwrite
#   bash server/scripts/runChinaRegulationsPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir china --category regulations "$@"
