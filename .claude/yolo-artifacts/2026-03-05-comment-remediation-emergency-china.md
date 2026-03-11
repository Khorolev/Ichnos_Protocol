# YOLO Artifact — Comment Remediation (Emergency Mapping + China Baseline)

## Objective

Implement review comments for:

1. emergency-guides category consistency and legacy audit visibility;
2. China manifest/source-table reconciliation with explicit deterministic strict exclusion.

## Changes

- Updated category resolver aliases/help in `server/scripts/runKnowledgePipeline.sh`:
  - Canonical: `functional-safety/emergency-guides -> functional_safety`
  - Legacy alias: `functional-safety/nhtsa-emergency-response-guides -> functional_safety`
- Updated `server/scripts/runEmergencyGuidesPipeline.sh` to rely on shared auto-resolution (removed explicit `--category` override).
- Updated `server/scripts/verifyFirestoreIngestion.js`:
  - Added `functional_safety` legacy audit path: `legacyCategories: ["batteries"]`.
  - Enabled source-scoped auditing for `functional_safety` with explicit legacy source prefix support.
  - Added manifest-driven strict exclusions (`strictExclusions`) loader and usage.
  - Made strict expected/md/pdf completeness checks exclusion-aware and deterministic.
  - Added explicit warning/report output for applied strict exclusions.
- Updated `server/knowledge-base/pdf-manifest.json`:
  - Restored `expectedPdfCounts.china` to `4` baseline.
  - Added `strictExclusions.china` entry for `UNECE_GB38031_Revision_Status_SIGTP-01-11.pdf` with reason.
- Updated `server/knowledge-base/BATTERY_REGULATIONS_KNOWLEDGE_BASE.md`:
  - China row now documents `3 (+1 excluded non-extractable)` conversion status.
  - China document entry and notes now explicitly mention strict-baseline exclusion behavior.
  - Pipeline status non-extractable section now states strict exclusion explicitly.

## Validation

- Shell syntax checks passed for updated pipeline scripts.
- Diagnostics show no script errors on updated files.
- Strict verifier run passed:
  - `node server/scripts/verifyFirestoreIngestion.js --all --disk-check --strict`
  - Result: `Failed categories: 0`.
