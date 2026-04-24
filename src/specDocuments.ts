import type { SpecDocument } from "./types";

import readme from "../printforge_enterprise_toon_package/README.md?raw";
import masterManifest from "../printforge_enterprise_toon_package/00_master_manifest.toon?raw";
import productVision from "../printforge_enterprise_toon_package/01_product_vision.toon?raw";
import domainModel from "../printforge_enterprise_toon_package/02_domain_model.toon?raw";
import firestoreSchema from "../printforge_enterprise_toon_package/03_firestore_schema.toon?raw";
import storageIngestion from "../printforge_enterprise_toon_package/04_storage_and_3mf_ingestion.toon?raw";
import authRoles from "../printforge_enterprise_toon_package/05_auth_roles_permissions.toon?raw";
import printerCatalog from "../printforge_enterprise_toon_package/06_printer_fleet_catalog.toon?raw";
import materialTaxonomy from "../printforge_enterprise_toon_package/07_material_taxonomy.toon?raw";
import filamentSeedCatalog from "../printforge_enterprise_toon_package/08_filament_brand_seed_catalog.toon?raw";
import sirayaSeedCatalog from "../printforge_enterprise_toon_package/09_siraya_resin_seed_catalog.toon?raw";
import workflowStates from "../printforge_enterprise_toon_package/10_workflow_states.toon?raw";
import uiUxSystem from "../printforge_enterprise_toon_package/11_ui_ux_system.toon?raw";
import analyticsDoc from "../printforge_enterprise_toon_package/12_search_reporting_analytics.toon?raw";
import apiContracts from "../printforge_enterprise_toon_package/13_api_contracts.toon?raw";
import automationRules from "../printforge_enterprise_toon_package/14_automation_rules.toon?raw";
import buildPlan from "../printforge_enterprise_toon_package/15_build_plan.toon?raw";
import sourceNotes from "../printforge_enterprise_toon_package/16_source_notes.md?raw";
import startupPrompt from "../printforge_enterprise_toon_package/startup_prompt_60000.md?raw";

const docEntries = [
  ["README.md", readme],
  ["00_master_manifest.toon", masterManifest],
  ["01_product_vision.toon", productVision],
  ["02_domain_model.toon", domainModel],
  ["03_firestore_schema.toon", firestoreSchema],
  ["04_storage_and_3mf_ingestion.toon", storageIngestion],
  ["05_auth_roles_permissions.toon", authRoles],
  ["06_printer_fleet_catalog.toon", printerCatalog],
  ["07_material_taxonomy.toon", materialTaxonomy],
  ["08_filament_brand_seed_catalog.toon", filamentSeedCatalog],
  ["09_siraya_resin_seed_catalog.toon", sirayaSeedCatalog],
  ["10_workflow_states.toon", workflowStates],
  ["11_ui_ux_system.toon", uiUxSystem],
  ["12_search_reporting_analytics.toon", analyticsDoc],
  ["13_api_contracts.toon", apiContracts],
  ["14_automation_rules.toon", automationRules],
  ["15_build_plan.toon", buildPlan],
  ["16_source_notes.md", sourceNotes],
  ["startup_prompt_60000.md", startupPrompt],
] as const;

function extractField(raw: string, field: string) {
  const match = raw.match(new RegExp(`^${field}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? "";
}

function summarize(raw: string) {
  const explicit =
    extractField(raw, "SUMMARY") ||
    extractField(raw, "PURPOSE") ||
    extractField(raw, "PROBLEM") ||
    extractField(raw, "OBJECTIVE") ||
    extractField(raw, "TITLE");

  if (explicit) {
    return explicit;
  }

  const firstParagraph = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .slice(0, 3)
    .join(" ");

  return firstParagraph || "Imported source document.";
}

export const specDocuments: SpecDocument[] = docEntries.map(([filename, raw], index) => ({
  id: `spec_${index + 1}`,
  filename,
  docType: extractField(raw, "DOC_TYPE") || (filename.endsWith(".md") ? "MARKDOWN" : "REFERENCE"),
  title: extractField(raw, "TITLE") || filename,
  summary: summarize(raw),
  raw,
}));
