export type Role = "admin" | "engineering_lead" | "engineer" | "operator" | "viewer";

export type AppView = "workcenter" | "fleet" | "specs";

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
  createdAt: string;
  createdByUid: string;
}

export type WorkProjectStatus = "draft" | "ready" | "queued" | "printing" | "complete";

export interface WorkProject {
  projectId: string;
  title: string;
  code: string;
  productName: string;
  materialIntent: string;
  fileRevision: string;
  status: WorkProjectStatus;
  ownerUid: string;
  createdAt: string;
  queueStationId: string | null;
}

export interface StationQueueState {
  activeProjectId: string | null;
  queuedProjectIds: string[];
}

export interface SpecDocument {
  id: string;
  filename: string;
  docType: string;
  title: string;
  summary: string;
  raw: string;
}
