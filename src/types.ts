export type Role = "admin" | "engineering_lead" | "engineer" | "operator" | "viewer";

export type AppView = "projects" | "repository" | "warehouse" | "fleet" | "specs";

export interface User {
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  team: string;
  active: boolean;
}

export interface PrinterModel {
  modelId: string;
  brand: string;
  model: string;
  printerType: "fdm" | "resin";
  technology: "FFF" | "MSLA";
  iconKey: string;
  buildVolume: [number, number, number];
  capabilityFlags: string[];
}

export interface WorkcenterZone {
  zoneId: string;
  workcenterName: string;
  zoneName: string;
  description: string;
  createdAt: string;
}

export interface WorkcenterStation {
  stationId: string;
  stationName: string;
  zoneId: string;
  printerModelId: string;
  machineNickname: string;
  bayLabel: string;
  notes: string;
  stationHealth: "ready" | "maintenance" | "offline";
  createdAt: string;
  createdByUid: string;
}

export type WorkProjectStatus = "intake" | "ready" | "queued" | "printing" | "qa" | "complete";

export type WorkProjectPriority = "low" | "normal" | "high" | "rush";

export interface WorkProject {
  projectId: string;
  title: string;
  code: string;
  productName: string;
  clientName: string;
  materialIntent: string;
  fileRevision: string;
  quantity: number;
  dueDate: string;
  priority: WorkProjectPriority;
  notes: string;
  status: WorkProjectStatus;
  ownerUid: string;
  createdAt: string;
  assignedStationId: string | null;
}

export interface StationQueueState {
  activeProjectId: string | null;
  queuedProjectIds: string[];
}

export interface PartRepositoryItem {
  itemId: string;
  title: string;
  linkedProjectId: string | null;
  productName: string;
  fileName: string;
  fileRevision: string;
  material: string;
  estimatedPrintHours: number;
  estimatedCostUsd: number;
  quantityPerRun: number;
  status: "candidate" | "qualified" | "approved";
  notes: string;
  createdAt: string;
  createdByUid: string;
}

export interface SpecDocument {
  id: string;
  filename: string;
  docType: string;
  title: string;
  summary: string;
  raw: string;
}
