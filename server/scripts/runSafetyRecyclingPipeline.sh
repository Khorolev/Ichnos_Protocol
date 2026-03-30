#!/usr/bin/env bash
# =============================================================================
# Safety, Recycling & Environmental Knowledge Base Pipeline
# Thin wrapper — delegates to the robust generic pipeline.
#
# PDFs present (3-4): Basel Convention 2025, Waste Shipment Regulation,
# WEEE Directive, EU Industrial Emissions Directive.
# Free web-only/paid sources (NFPA 855, Stockholm, Minamata, BREF,
# UL 9540, FM Global, EPRI, JRC Li-ion safety, Euro NCAP) are
# excluded from this pipeline.
#
# Usage (from repo root):
#   bash server/scripts/runSafetyRecyclingPipeline.sh
#   bash server/scripts/runSafetyRecyclingPipeline.sh --overwrite
#   bash server/scripts/runSafetyRecyclingPipeline.sh --force-reingest
# =============================================================================

exec "$(dirname "$0")/runKnowledgePipeline.sh" --pdf-subdir recycling "$@"
