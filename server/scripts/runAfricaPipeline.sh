#!/usr/bin/env bash
# =============================================================================
# Africa Regulations Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# Category (enforced): supply_chain
# PDFs present (17): AU_Africa_Mining_Vision, AfCFTA_Agreement,
# IEA_Africa_Energy_Outlook_2022, IRENA_Renewable_Energy_Market_Africa_2022,
# World_Bank_DRC_Cobalt_Market_Analysis, DRC_Mining_Code_2018_French,
# DRC_Mining_Code_English_Analysis_Mayer_Brown,
# South_Africa_National_Energy_Act_2008,
# Morocco_Energy_Efficiency_Strategy_2030, AMDC_Business_Plan,
# SADC_Mining_Protocol_1997, Kenya_Energy_Act_2019,
# Nigeria_Minerals_Mining_Act_2007, Tanzania_Mining_Act_2010,
# Ghana_Minerals_Commission_Act_1993, Zimbabwe_Mines_Minerals_Act,
# Zambia_Mines_Minerals_Act_2015.
#
# Usage (from repo root):
#   bash server/scripts/runAfricaPipeline.sh
#   bash server/scripts/runAfricaPipeline.sh --overwrite
#   bash server/scripts/runAfricaPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir africa --category supply_chain "$@"
