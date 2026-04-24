export type Role = "admin" | "engineering_lead" | "engineer" | "operator" | "viewer";

export type AppView =
  | "overview"
  | "projects"
  | "queue"
  | "printers"
  | "materials"
  | "files"
  | "analytics"
  | "admin"
  | "specs";

export type ProjectStatus =
  | "intake"
  | "scoping"
  | "design_in_progress"
  | "ready_for_print"
  | "queued"
  | "printing"
  | "post_processing"
  | "validation"
  | "complete"
  | "on_hold"
  | "cancelled";

export type PrinterStatus =
  | "available"
  | "busy"
  | "paused"
  | "maintenance"
  | "offline"
  | "error"
  | "reserved";

export type BuildJobStatus =
  | "draft"
  | "queued"
  | "assigned"
  | "preflight"
  | "printing"
  | "paused"
  | "failed"
  | "completed"
  | "cancelled";

export type BlockerStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";

export type MaterialStatus =
  | "approved"
  | "standard"
  | "experimental"
  | "restricted"
  | "deprecated"
  | "retired";

export type FileRevisionStatus =
  | "uploading"
  | "parsing"
  | "ready"
  | "needs_review"
  | "approved_current"
  | "superseded"
  | "rejected"
  | "parse_failed";

export interface User {
  uid: string;
  displayName: string;
  email: string;
  role: Role;
  team: string;
  active: boolean;
}

export interface Project {
  projectId: string;
  title: string;
  code: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  status: ProjectStatus;
  ownerUid: string;
  collaboratorUids: string[];
  requestedMaterialId: string;
  preferredPrinterIds: string[];
  dueDate: string;
  tags: string[];
  blocked: boolean;
  archived: boolean;
  progress: number;
  currentRevisionLabel: string;
  printerTargetId: string;
  latestActivityAt: string;
}

export interface Printer {
  printerId: string;
  brand: string;
  model: string;
  nickname: string;
  printerType: "fdm" | "resin";
  technology: "FFF" | "MSLA";
  location: string;
  operationalStatus: PrinterStatus;
  queueStatus: string;
  currentJobId?: string;
  iconKey: string;
  buildVolume: [number, number, number];
  capabilityFlags: string[];
  utilizationToday: number;
}

export interface Material {
  materialId: string;
  brandId: string;
  brandName: string;
  familyId: string;
  displayName: string;
  productLine: string;
  resinOrFilament: "filament" | "resin";
  status: MaterialStatus;
  validationState: "seeded" | "approved" | "under_review";
  diameter?: number;
  color?: string;
  reinforcement?: string;
  requiresDrying?: boolean;
  compatiblePrinterIds: string[];
  useCount: number;
  notes: string;
}

export interface FileRevision {
  revisionId: string;
  fileArtifactId: string;
  projectId: string;
  filename: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
  revisionNumber: number;
  status: FileRevisionStatus;
  slicer: string;
  printerProfile: string;
  materialProfile: string;
  notes: string;
  parsedMetadata: {
    slicerDetected: string;
    plateCount: number;
    materialProfileRaw: string;
    printerProfileRaw: string;
    estimateTimeRaw: string;
    embeddedThumbnail: boolean;
    parseConfidence: "low" | "medium" | "high";
  };
  isCurrent: boolean;
}

export interface BuildJob {
  buildJobId: string;
  projectId: string;
  projectFileRevisionId: string;
  printerId: string;
  materialId: string;
  assignedToUid: string;
  queuedAt: string;
  startedAt?: string;
  endedAt?: string;
  jobStatus: BuildJobStatus;
  outcome?: "success" | "failed" | "partial";
  quantityPlanned: number;
  quantityCompleted: number;
  estimatedPrintTimeMinutes: number;
  actualPrintTimeMinutes?: number;
  estimatedMaterialUsedGrams: number;
  actualMaterialUsedGrams?: number;
  failureReason?: string;
  notes: string;
}

export interface ActivityEvent {
  eventId: string;
  entityType: "project" | "printer" | "build_job" | "file" | "material" | "system";
  entityId: string;
  projectId?: string;
  actorUid: string;
  actionType: string;
  message: string;
  createdAt: string;
}

export interface Blocker {
  blockerId: string;
  projectId: string;
  title: string;
  severity: "low" | "medium" | "high";
  status: BlockerStatus;
  assignedToUid: string;
  createdByUid: string;
  createdAt: string;
}

export interface SpecDocument {
  id: string;
  filename: string;
  docType: string;
  title: string;
  summary: string;
  raw: string;
}

export interface ToastMessage {
  id: number;
  title: string;
  body: string;
}
