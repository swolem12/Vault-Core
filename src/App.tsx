import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { seedActivity, seedBlockers, seedBuildJobs, seedMaterials, seedPrinters, seedProjects, seedRevisions, seedUsers } from "./mockData";
import { specDocuments } from "./specDocuments";
import type {
  ActivityEvent,
  AppView,
  BuildJob,
  BuildJobStatus,
  FileRevision,
  Material,
  Printer,
  PrinterStatus,
  Project,
  Role,
  SpecDocument,
  ToastMessage,
  User,
} from "./types";

const navItems: { id: AppView; label: string; hint: string }[] = [
  { id: "overview", label: "Overview", hint: "Shift handoff" },
  { id: "projects", label: "Projects", hint: "Workspace board" },
  { id: "queue", label: "Build Queue", hint: "Run status" },
  { id: "printers", label: "Printers", hint: "Fleet view" },
  { id: "materials", label: "Materials", hint: "Catalog registry" },
  { id: "files", label: "Files", hint: "Managed revisions" },
  { id: "analytics", label: "Analytics", hint: "Ops insight" },
  { id: "admin", label: "Admin", hint: "Roles and seeds" },
  { id: "specs", label: "Spec Vault", hint: "Imported package" },
];

const permissionMatrix: Record<string, Role[]> = {
  project_create: ["admin", "engineering_lead", "engineer"],
  project_edit_any: ["admin", "engineering_lead"],
  project_edit_owned: ["engineer"],
  project_archive: ["admin", "engineering_lead"],
  printer_manage: ["admin", "engineering_lead"],
  material_manage: ["admin"],
  material_propose: ["engineering_lead", "engineer"],
  buildjob_run: ["admin", "engineering_lead", "engineer", "operator"],
  file_upload: ["admin", "engineering_lead", "engineer"],
  file_approve_current: ["admin", "engineering_lead"],
  analytics_view: ["admin", "engineering_lead", "viewer", "operator"],
};

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  engineering_lead: "Engineering Lead",
  engineer: "Engineer",
  operator: "Operator",
  viewer: "Viewer",
};

const statusOrder: BuildJobStatus[] = ["queued", "assigned", "preflight", "printing", "paused", "failed", "completed"];

function App() {
  const [activeView, setActiveView] = useState<AppView>("overview");
  const [users] = useState<User[]>(seedUsers);
  const [currentUserId, setCurrentUserId] = useState("u_lead_marcus");
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [printers, setPrinters] = useState<Printer[]>(seedPrinters);
  const [materials] = useState<Material[]>(seedMaterials);
  const [revisions, setRevisions] = useState<FileRevision[]>(seedRevisions);
  const [jobs, setJobs] = useState<BuildJob[]>(seedBuildJobs);
  const [activity, setActivity] = useState<ActivityEvent[]>(seedActivity);
  const [specs] = useState<SpecDocument[]>(specDocuments);
  const [blockers] = useState(seedBlockers);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [projectLayout, setProjectLayout] = useState<"board" | "table">("board");
  const [selectedProjectId, setSelectedProjectId] = useState(seedProjects[0].projectId);
  const [selectedSpecId, setSelectedSpecId] = useState(specDocuments[0]?.id ?? "");
  const [materialFilter, setMaterialFilter] = useState<"all" | "filament" | "resin">("all");
  const [materialSearch, setMaterialSearch] = useState("");
  const [comparedMaterialIds, setComparedMaterialIds] = useState<string[]>([]);
  const [queueFilter, setQueueFilter] = useState<"all" | BuildJobStatus>("all");
  const [selectedFileProjectId, setSelectedFileProjectId] = useState(seedProjects[0].projectId);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadName, setUploadName] = useState("");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateBuild, setShowCreateBuild] = useState(false);
  const [projectWizardStep, setProjectWizardStep] = useState(1);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [newProjectForm, setNewProjectForm] = useState({
    title: "",
    code: "",
    description: "",
    requestedMaterialId: seedMaterials[0].materialId,
    printerTargetId: seedPrinters[0].printerId,
    dueDate: "",
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([
    {
      id: 1,
      title: "Spec bundle imported",
      body: `${specDocuments.length} package documents are wired into the Spec Vault and seed data.`,
    },
  ]);

  const currentUser = useMemo(
    () => users.find((user) => user.uid === currentUserId) ?? users[0],
    [currentUserId, users],
  );

  const userMap = useMemo(() => Object.fromEntries(users.map((user) => [user.uid, user])), [users]);
  const projectMap = useMemo(() => Object.fromEntries(projects.map((project) => [project.projectId, project])), [projects]);
  const printerMap = useMemo(() => Object.fromEntries(printers.map((printer) => [printer.printerId, printer])), [printers]);
  const materialMap = useMemo(() => Object.fromEntries(materials.map((material) => [material.materialId, material])), [materials]);
  const revisionMap = useMemo(() => Object.fromEntries(revisions.map((revision) => [revision.revisionId, revision])), [revisions]);

  const selectedProject = projects.find((project) => project.projectId === selectedProjectId) ?? projects[0];
  const selectedSpec = specs.find((doc) => doc.id === selectedSpecId) ?? specs[0];
  const projectRevisions = revisions.filter((revision) => revision.projectId === selectedFileProjectId);

  const kpis = useMemo(() => {
    const activeProjects = projects.filter((project) => !["complete", "cancelled"].includes(project.status)).length;
    const blockedProjects = projects.filter((project) => project.blocked).length;
    const queuedJobs = jobs.filter((job) => ["queued", "assigned", "preflight"].includes(job.jobStatus)).length;
    const printersInUse = printers.filter((printer) => printer.operationalStatus === "busy").length;
    const offlinePrinters = printers.filter((printer) => ["offline", "error"].includes(printer.operationalStatus)).length;
    const completedJobs = jobs.filter((job) => job.jobStatus === "completed").length;
    const failedJobs = jobs.filter((job) => job.jobStatus === "failed").length;
    const materialUsage = jobs.reduce((sum, job) => sum + (job.actualMaterialUsedGrams ?? job.estimatedMaterialUsedGrams), 0);
    return {
      activeProjects,
      blockedProjects,
      queuedJobs,
      printersInUse,
      offlinePrinters,
      completedJobs,
      failedJobs,
      materialUsage,
    };
  }, [jobs, printers, projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
        project.code.toLowerCase().includes(projectSearch.toLowerCase()) ||
        project.tags.some((tag) => tag.toLowerCase().includes(projectSearch.toLowerCase()));
      const matchesStatus = projectStatusFilter === "all" || project.status === projectStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projectSearch, projectStatusFilter, projects]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => queueFilter === "all" || job.jobStatus === queueFilter);
  }, [jobs, queueFilter]);

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesClass = materialFilter === "all" || material.resinOrFilament === materialFilter;
      const q = materialSearch.toLowerCase();
      const matchesSearch =
        material.displayName.toLowerCase().includes(q) ||
        material.familyId.toLowerCase().includes(q) ||
        material.brandName.toLowerCase().includes(q);
      return matchesClass && matchesSearch;
    });
  }, [materialFilter, materialSearch, materials]);

  const searchResults = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }

    const results = [
      ...projects
        .filter((project) => `${project.title} ${project.code} ${project.description}`.toLowerCase().includes(query))
        .map((project) => ({
          id: project.projectId,
          label: project.title,
          meta: `${project.code} · project`,
          action: () => {
            setActiveView("projects");
            setSelectedProjectId(project.projectId);
            setCommandOpen(false);
          },
        })),
      ...printers
        .filter((printer) => `${printer.nickname} ${printer.brand} ${printer.model}`.toLowerCase().includes(query))
        .map((printer) => ({
          id: printer.printerId,
          label: printer.nickname,
          meta: `${printer.brand} ${printer.model} · printer`,
          action: () => {
            setActiveView("printers");
            setCommandOpen(false);
          },
        })),
      ...materials
        .filter((material) => `${material.displayName} ${material.familyId} ${material.brandName}`.toLowerCase().includes(query))
        .map((material) => ({
          id: material.materialId,
          label: material.displayName,
          meta: `${material.brandName} · material`,
          action: () => {
            setActiveView("materials");
            setCommandOpen(false);
          },
        })),
      ...jobs
        .filter((job) => `${job.buildJobId} ${projectMap[job.projectId]?.title ?? ""}`.toLowerCase().includes(query))
        .map((job) => ({
          id: job.buildJobId,
          label: job.buildJobId,
          meta: `${projectMap[job.projectId]?.title ?? "Unknown project"} · build job`,
          action: () => {
            setActiveView("queue");
            setCommandOpen(false);
          },
        })),
      ...specs
        .filter((spec) => `${spec.title} ${spec.filename} ${spec.docType}`.toLowerCase().includes(query))
        .map((spec) => ({
          id: spec.id,
          label: spec.title,
          meta: `${spec.filename} · document`,
          action: () => {
            setActiveView("specs");
            setSelectedSpecId(spec.id);
            setCommandOpen(false);
          },
        })),
    ];

    return results.slice(0, 12);
  }, [commandQuery, jobs, materials, printers, projectMap, projects, specs]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setShowCreateProject(false);
        setShowCreateBuild(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!toasts.length) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 4200);

    return () => window.clearTimeout(timer);
  }, [toasts]);

  function can(action: keyof typeof permissionMatrix) {
    return permissionMatrix[action].includes(currentUser.role);
  }

  function pushToast(title: string, body: string) {
    setToasts((current) => [...current, { id: Date.now(), title, body }]);
  }

  function pushActivity(entry: ActivityEvent) {
    setActivity((current) => [entry, ...current]);
  }

  function formatDate(value?: string) {
    if (!value) {
      return "Not set";
    }
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function relativeHours(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours ? `${hours}h ${mins}m` : `${mins}m`;
  }

  function transitionJob(jobId: string, targetStatus: BuildJobStatus) {
    const job = jobs.find((item) => item.buildJobId === jobId);
    if (!job) {
      return;
    }

    const printer = printerMap[job.printerId];
    const project = projectMap[job.projectId];

    setJobs((current) =>
      current.map((item) =>
        item.buildJobId === jobId
          ? {
              ...item,
              jobStatus: targetStatus,
              startedAt: targetStatus === "printing" ? new Date().toISOString() : item.startedAt,
              endedAt: ["completed", "failed", "cancelled"].includes(targetStatus) ? new Date().toISOString() : item.endedAt,
              quantityCompleted: targetStatus === "completed" ? item.quantityPlanned : item.quantityCompleted,
              outcome: targetStatus === "completed" ? "success" : targetStatus === "failed" ? "failed" : item.outcome,
              actualPrintTimeMinutes: targetStatus === "completed" ? item.estimatedPrintTimeMinutes - 18 : item.actualPrintTimeMinutes,
              actualMaterialUsedGrams: targetStatus === "completed" ? item.estimatedMaterialUsedGrams - 7 : item.actualMaterialUsedGrams,
              failureReason: targetStatus === "failed" ? "machine_fault" : item.failureReason,
            }
          : item,
      ),
    );

    setPrinters((current) =>
      current.map((item) => {
        if (item.printerId !== job.printerId) {
          return item;
        }
        return {
          ...item,
          operationalStatus:
            targetStatus === "printing"
              ? "busy"
              : targetStatus === "paused"
                ? "paused"
                : targetStatus === "failed"
                  ? "error"
                  : ["completed", "cancelled"].includes(targetStatus)
                    ? "available"
                    : item.operationalStatus,
          queueStatus:
            targetStatus === "printing"
              ? "active build"
              : targetStatus === "paused"
                ? "operator hold"
                : targetStatus === "completed"
                  ? "clearing part"
                  : targetStatus === "failed"
                    ? "needs inspection"
                    : item.queueStatus,
          currentJobId: ["completed", "failed", "cancelled"].includes(targetStatus) ? undefined : item.currentJobId ?? jobId,
        };
      }),
    );

    setProjects((current) =>
      current.map((item) => {
        if (item.projectId !== job.projectId) {
          return item;
        }
        return {
          ...item,
          status:
            targetStatus === "printing"
              ? "printing"
              : targetStatus === "completed"
                ? "validation"
                : targetStatus === "failed"
                  ? "on_hold"
                  : targetStatus === "assigned" || targetStatus === "queued"
                    ? "queued"
                    : item.status,
          blocked: targetStatus === "failed" ? true : item.blocked,
          latestActivityAt: new Date().toISOString(),
          progress: targetStatus === "completed" ? Math.max(item.progress, 88) : targetStatus === "printing" ? Math.max(item.progress, 74) : item.progress,
        };
      }),
    );

    pushActivity({
      eventId: `evt_${Date.now()}`,
      entityType: "build_job",
      entityId: jobId,
      projectId: job.projectId,
      actorUid: currentUser.uid,
      actionType: `job.${targetStatus}`,
      message: `${currentUser.displayName} moved ${jobId} to ${targetStatus} on ${printer?.nickname ?? "printer"}.`,
      createdAt: new Date().toISOString(),
    });

    pushToast(
      `Job ${targetStatus}`,
      `${project?.title ?? jobId} is now ${targetStatus}. Printer state was updated in the fleet board.`,
    );
  }

  function updatePrinterStatus(printerId: string, operationalStatus: PrinterStatus) {
    setPrinters((current) =>
      current.map((printer) =>
        printer.printerId === printerId
          ? {
              ...printer,
              operationalStatus,
              queueStatus:
                operationalStatus === "available"
                  ? "open"
                  : operationalStatus === "maintenance"
                    ? "service window"
                    : operationalStatus === "paused"
                      ? "operator hold"
                      : printer.queueStatus,
            }
          : printer,
      ),
    );

    pushActivity({
      eventId: `evt_${Date.now()}`,
      entityType: "printer",
      entityId: printerId,
      actorUid: currentUser.uid,
      actionType: "printer.status.updated",
      message: `${currentUser.displayName} marked ${printerMap[printerId]?.nickname ?? "printer"} as ${operationalStatus}.`,
      createdAt: new Date().toISOString(),
    });

    pushToast("Printer updated", `${printerMap[printerId]?.nickname ?? "Printer"} is now ${operationalStatus}.`);
  }

  function handleProjectCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!can("project_create")) {
      pushToast("Permission denied", "This role cannot create projects in the test app.");
      return;
    }

    const title = newProjectForm.title.trim();
    const code = newProjectForm.code.trim();
    const description = newProjectForm.description.trim();
    const requestedMaterialId = newProjectForm.requestedMaterialId;
    const printerTargetId = newProjectForm.printerTargetId;
    const dueDate = newProjectForm.dueDate ? new Date(newProjectForm.dueDate).toISOString() : new Date().toISOString();

    if (!title || !code) {
      pushToast("Missing fields", "Title and code are required.");
      return;
    }

    const newProject: Project = {
      projectId: `proj_${Date.now()}`,
      title,
      code,
      description,
      priority: "medium",
      status: "intake",
      ownerUid: currentUser.uid,
      collaboratorUids: [],
      requestedMaterialId,
      preferredPrinterIds: [printerTargetId],
      dueDate,
      tags: ["new"],
      blocked: false,
      archived: false,
      progress: 8,
      currentRevisionLabel: "r0 pending upload",
      printerTargetId,
      latestActivityAt: new Date().toISOString(),
    };

    setProjects((current) => [newProject, ...current]);
    setSelectedProjectId(newProject.projectId);
    setShowCreateProject(false);
    setProjectWizardStep(1);
    setNewProjectForm({
      title: "",
      code: "",
      description: "",
      requestedMaterialId: materials[0].materialId,
      printerTargetId: printers[0].printerId,
      dueDate: "",
    });

    pushActivity({
      eventId: `evt_${Date.now()}`,
      entityType: "project",
      entityId: newProject.projectId,
      projectId: newProject.projectId,
      actorUid: currentUser.uid,
      actionType: "project.created",
      message: `${currentUser.displayName} created ${title}.`,
      createdAt: new Date().toISOString(),
    });

    pushToast("Project created", `${title} is live in the board and ready for file upload.`);
  }

  function handleBuildCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!can("buildjob_run")) {
      pushToast("Permission denied", "This role cannot create build jobs in the test app.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const projectId = String(form.get("projectId") || projects[0].projectId);
    const printerId = String(form.get("printerId") || printers[0].printerId);
    const materialId = String(form.get("materialId") || materials[0].materialId);
    const assignedToUid = String(form.get("assignedToUid") || currentUser.uid);
    const revision = revisions.find((item) => item.projectId === projectId && item.isCurrent) ?? revisions[0];

    const newJob: BuildJob = {
      buildJobId: `job_${Date.now()}`,
      projectId,
      projectFileRevisionId: revision.revisionId,
      printerId,
      materialId,
      assignedToUid,
      queuedAt: new Date().toISOString(),
      jobStatus: "queued",
      quantityPlanned: 1,
      quantityCompleted: 0,
      estimatedPrintTimeMinutes: 205,
      estimatedMaterialUsedGrams: 96,
      notes: "Created from the test webapp build drawer.",
    };

    setJobs((current) => [newJob, ...current]);
    setProjects((current) =>
      current.map((project) =>
        project.projectId === projectId
          ? { ...project, status: "queued", latestActivityAt: new Date().toISOString(), progress: Math.max(project.progress, 66) }
          : project,
      ),
    );
    setPrinters((current) =>
      current.map((printer) =>
        printer.printerId === printerId
          ? { ...printer, operationalStatus: "reserved", queueStatus: "new queue item", currentJobId: printer.currentJobId }
          : printer,
      ),
    );
    setShowCreateBuild(false);

    pushActivity({
      eventId: `evt_${Date.now()}`,
      entityType: "build_job",
      entityId: newJob.buildJobId,
      projectId,
      actorUid: currentUser.uid,
      actionType: "job.created",
      message: `${currentUser.displayName} queued a new build on ${printerMap[printerId]?.nickname ?? "printer"}.`,
      createdAt: new Date().toISOString(),
    });

    pushToast("Build queued", `${projectMap[projectId]?.title ?? "Project"} now has a queued job.`);
  }

  function handleUpload(fileName: string) {
    if (!can("file_upload")) {
      pushToast("Permission denied", "This role cannot upload file revisions in the test app.");
      return;
    }

    setUploadName(fileName);
    setUploadProgress(15);

    let progress = 15;
    const timer = window.setInterval(() => {
      progress += 21;
      if (progress >= 100) {
        window.clearInterval(timer);
        setUploadProgress(100);

        const latestRevisionNumber =
          Math.max(0, ...revisions.filter((revision) => revision.projectId === selectedFileProjectId).map((revision) => revision.revisionNumber)) + 1;

        const fileProject = projectMap[selectedFileProjectId] ?? selectedProject;

        const newRevision: FileRevision = {
          revisionId: `rev_${Date.now()}`,
          fileArtifactId: `artifact_${selectedFileProjectId}_main`,
          projectId: selectedFileProjectId,
          filename: fileName,
          sizeBytes: 16482912,
          uploadedBy: currentUser.uid,
          uploadedAt: new Date().toISOString(),
          revisionNumber: latestRevisionNumber,
          status: "ready",
          slicer: "Bambu Studio",
          printerProfile: printerMap[fileProject?.printerTargetId]?.nickname ?? "Unassigned",
          materialProfile: materialMap[fileProject?.requestedMaterialId]?.displayName ?? "Unassigned",
          notes: "Uploaded from the test webapp dropzone.",
          parsedMetadata: {
            slicerDetected: "bambu_studio",
            plateCount: 1,
            materialProfileRaw: materialMap[fileProject?.requestedMaterialId]?.displayName ?? "Unknown",
            printerProfileRaw: printerMap[fileProject?.printerTargetId]?.nickname ?? "Unknown",
            estimateTimeRaw: "2h 48m",
            embeddedThumbnail: true,
            parseConfidence: "medium",
          },
          isCurrent: false,
        };

        setRevisions((current) => [newRevision, ...current]);
        setProjects((current) =>
          current.map((project) =>
            project.projectId === selectedFileProjectId
              ? {
                  ...project,
                  currentRevisionLabel: `r${newRevision.revisionNumber} ready`,
                  latestActivityAt: new Date().toISOString(),
                  progress: Math.max(project.progress, 34),
                }
              : project,
          ),
        );

        pushActivity({
          eventId: `evt_${Date.now()}`,
          entityType: "file",
          entityId: newRevision.revisionId,
          projectId: selectedFileProjectId,
          actorUid: currentUser.uid,
          actionType: "revision.uploaded",
          message: `${currentUser.displayName} uploaded ${fileName}.`,
          createdAt: new Date().toISOString(),
        });

        pushToast("Revision uploaded", `${fileName} is stored as revision r${latestRevisionNumber}.`);
        window.setTimeout(() => {
          setUploadProgress(0);
          setUploadName("");
        }, 800);
      } else {
        setUploadProgress(progress);
      }
    }, 180);
  }

  function markRevisionCurrent(revisionId: string) {
    if (!can("file_approve_current")) {
      pushToast("Permission denied", "This role cannot approve current revisions in the test app.");
      return;
    }

    const revision = revisions.find((entry) => entry.revisionId === revisionId);
    if (!revision) {
      return;
    }

    setRevisions((current) =>
      current.map((entry) => {
        if (entry.projectId !== revision.projectId) {
          return entry;
        }
        if (entry.revisionId === revisionId) {
          return { ...entry, status: "approved_current", isCurrent: true };
        }
        return { ...entry, status: entry.isCurrent ? "superseded" : entry.status, isCurrent: false };
      }),
    );

    setProjects((current) =>
      current.map((project) =>
        project.projectId === revision.projectId
          ? {
              ...project,
              currentRevisionLabel: `r${revision.revisionNumber} approved_current`,
              status: project.status === "intake" ? "scoping" : project.status,
              latestActivityAt: new Date().toISOString(),
            }
          : project,
      ),
    );

    pushActivity({
      eventId: `evt_${Date.now()}`,
      entityType: "file",
      entityId: revisionId,
      projectId: revision.projectId,
      actorUid: currentUser.uid,
      actionType: "revision.approved",
      message: `${currentUser.displayName} marked ${revision.filename} as current.`,
      createdAt: new Date().toISOString(),
    });

    pushToast("Revision approved", `${revision.filename} is now the current managed artifact.`);
  }

  function toggleMaterialCompare(materialId: string) {
    setComparedMaterialIds((current) =>
      current.includes(materialId)
        ? current.filter((id) => id !== materialId)
        : current.length >= 3
          ? [...current.slice(1), materialId]
          : [...current, materialId],
    );
  }

  function renderOverview() {
    return (
      <div className="view-grid">
        <section className="hero-panel">
          <div>
            <p className="eyebrow">Manufacturing command center</p>
            <h1>PrintForge Ops test webapp</h1>
            <p className="hero-copy">
              Seeded directly from the provided planning package: printer fleet, material taxonomy, workflow rules,
              role matrix, and managed revision flows are all represented here as a runnable prototype.
            </p>
          </div>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => setShowCreateProject(true)} disabled={!can("project_create")}>
              Create project
            </button>
            <button className="button" onClick={() => setShowCreateBuild(true)} disabled={!can("buildjob_run")}>
              Queue build
            </button>
            <button className="button" onClick={() => setActiveView("specs")}>
              Open spec vault
            </button>
          </div>
        </section>

        <section className="kpi-grid">
          <StatCard label="Active projects" value={String(kpis.activeProjects)} accent="blue" />
          <StatCard label="Blocked projects" value={String(kpis.blockedProjects)} accent="amber" />
          <StatCard label="Queued jobs" value={String(kpis.queuedJobs)} accent="blue" />
          <StatCard label="Printers in use" value={String(kpis.printersInUse)} accent="green" />
          <StatCard label="Completed jobs" value={String(kpis.completedJobs)} accent="green" />
          <StatCard label="Material used" value={`${kpis.materialUsage}g`} accent="amber" />
        </section>

        <div className="content-grid">
          <Panel title="Active Project Board" subtitle="Status-aware work in flight">
            <div className="project-card-grid">
              {projects.slice(0, 4).map((project) => (
                <article key={project.projectId} className="project-card" onClick={() => {
                  setSelectedProjectId(project.projectId);
                  setActiveView("projects");
                }}>
                  <div className="card-header">
                    <div>
                      <h3>{project.title}</h3>
                      <p>{project.code}</p>
                    </div>
                    <StatusPill tone={project.blocked ? "error" : "info"} label={project.blocked ? "Blocked" : project.status.replaceAll("_", " ")} />
                  </div>
                  <p className="card-copy">{project.description}</p>
                  <div className="meta-row">
                    <span>Owner {userMap[project.ownerUid]?.displayName}</span>
                    <span>Due {formatDate(project.dueDate)}</span>
                  </div>
                  <ProgressBar value={project.progress} />
                  <div className="meta-row">
                    <span>{project.currentRevisionLabel}</span>
                    <span>{materialMap[project.requestedMaterialId]?.displayName}</span>
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Printer Fleet" subtitle="Live machine posture">
            <div className="printer-grid">
              {printers.map((printer) => (
                <article key={printer.printerId} className="printer-card">
                  <div className="printer-visual">
                    <div className={`printer-badge ${printer.printerType}`}>{printer.model}</div>
                    <StatusPill tone={toneForPrinter(printer.operationalStatus)} label={printer.operationalStatus} />
                  </div>
                  <div className="card-header compact">
                    <div>
                      <h3>{printer.nickname}</h3>
                      <p>{printer.brand} {printer.model}</p>
                    </div>
                    <span className="muted">{printer.location}</span>
                  </div>
                  <div className="meta-row">
                    <span>{printer.queueStatus}</span>
                    <span>{printer.utilizationToday}% util.</span>
                  </div>
                  <ProgressBar value={printer.utilizationToday} tone="blue" />
                </article>
              ))}
            </div>
          </Panel>

          <Panel title="Build Queue" subtitle="Priority order and release readiness">
            <div className="queue-list">
              {jobs.slice(0, 5).map((job) => (
                <div key={job.buildJobId} className="queue-row">
                  <div>
                    <strong>{projectMap[job.projectId]?.title}</strong>
                    <p>{printerMap[job.printerId]?.nickname} · {materialMap[job.materialId]?.displayName}</p>
                  </div>
                  <div className="queue-meta">
                    <StatusPill tone={toneForJob(job.jobStatus)} label={job.jobStatus} />
                    <span>{relativeHours(job.estimatedPrintTimeMinutes)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent Activity" subtitle="Who changed what">
            <div className="activity-list">
              {activity.slice(0, 6).map((event) => (
                <div key={event.eventId} className="activity-item">
                  <div className="activity-dot" />
                  <div>
                    <strong>{event.message}</strong>
                    <p>{userMap[event.actorUid]?.displayName} · {formatDate(event.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Shift Handoff" subtitle="Required by workflow rules">
            <div className="handoff-list">
              <HandoffRow label="Running now" value={String(jobs.filter((job) => job.jobStatus === "printing").length)} detail="Printers currently producing parts" />
              <HandoffRow label="Due today / overdue" value={String(projects.filter((project) => new Date(project.dueDate) <= new Date("2026-04-24T23:59:59+09:00")).length)} detail="Escalate if still blocked at shift end" />
              <HandoffRow label="Open blockers" value={String(blockers.filter((blocker) => !["resolved", "closed"].includes(blocker.status)).length)} detail="Engineering review items still active" />
              <HandoffRow label="Recent failures" value={String(jobs.filter((job) => job.jobStatus === "failed" || job.jobStatus === "paused").length)} detail="Investigate before restarting jobs" />
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  function renderProjects() {
    const detailRevisions = revisions.filter((revision) => revision.projectId === selectedProject.projectId);
    const detailJobs = jobs.filter((job) => job.projectId === selectedProject.projectId);
    const detailBlockers = blockers.filter((blocker) => blocker.projectId === selectedProject.projectId);
    const detailActivity = activity.filter((entry) => entry.projectId === selectedProject.projectId).slice(0, 8);

    return (
      <div className="view-grid">
        <section className="toolbar-panel">
          <div className="toolbar-group">
            <input
              className="input"
              value={projectSearch}
              onChange={(event) => setProjectSearch(event.target.value)}
              placeholder="Search projects, codes, tags"
            />
            <select className="select" value={projectStatusFilter} onChange={(event) => setProjectStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              {Array.from(new Set(projects.map((project) => project.status))).map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="toolbar-group">
            <button className={`button ${projectLayout === "board" ? "button-primary" : ""}`} onClick={() => setProjectLayout("board")}>
              Board
            </button>
            <button className={`button ${projectLayout === "table" ? "button-primary" : ""}`} onClick={() => setProjectLayout("table")}>
              Table
            </button>
            <button className="button button-primary" onClick={() => setShowCreateProject(true)} disabled={!can("project_create")}>
              New project
            </button>
          </div>
        </section>

        <div className="split-layout">
          <Panel title="Projects" subtitle={`${filteredProjects.length} visible`}>
            {projectLayout === "board" ? (
              <div className="project-card-grid">
                {filteredProjects.map((project) => (
                  <article
                    key={project.projectId}
                    className={`project-card ${selectedProject.projectId === project.projectId ? "selected" : ""}`}
                    onClick={() => setSelectedProjectId(project.projectId)}
                  >
                    <div className="card-header">
                      <div>
                        <h3>{project.title}</h3>
                        <p>{project.code}</p>
                      </div>
                      <StatusPill tone={project.blocked ? "error" : "info"} label={project.status.replaceAll("_", " ")} />
                    </div>
                    <p className="card-copy">{project.description}</p>
                    <div className="meta-row">
                      <span>{userMap[project.ownerUid]?.displayName}</span>
                      <span>{project.priority}</span>
                    </div>
                    <ProgressBar value={project.progress} />
                    <div className="tag-row">
                      {project.tags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Due</th>
                    <th>Revision</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.projectId} onClick={() => setSelectedProjectId(project.projectId)}>
                      <td>
                        <strong>{project.title}</strong>
                        <div className="muted">{project.code}</div>
                      </td>
                      <td><StatusPill tone={project.blocked ? "error" : "info"} label={project.status.replaceAll("_", " ")} /></td>
                      <td>{userMap[project.ownerUid]?.displayName}</td>
                      <td>{formatDate(project.dueDate)}</td>
                      <td>{project.currentRevisionLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title={selectedProject.title} subtitle={`${selectedProject.code} · detailed workspace`}>
            <div className="detail-stack">
              <div className="detail-hero">
                <div>
                  <p className="eyebrow">Project status</p>
                  <h2>{selectedProject.status.replaceAll("_", " ")}</h2>
                </div>
                <div className="detail-badges">
                  <StatusPill tone={selectedProject.blocked ? "error" : "success"} label={selectedProject.blocked ? "Blocked" : "Unblocked"} />
                  <StatusPill tone="info" label={selectedProject.priority} />
                </div>
              </div>
              <p className="card-copy">{selectedProject.description}</p>
              <div className="detail-grid">
                <InfoCard label="Owner" value={userMap[selectedProject.ownerUid]?.displayName ?? "Unknown"} />
                <InfoCard label="Material" value={materialMap[selectedProject.requestedMaterialId]?.displayName ?? "Unknown"} />
                <InfoCard label="Preferred printer" value={printerMap[selectedProject.printerTargetId]?.nickname ?? "Unknown"} />
                <InfoCard label="Due" value={formatDate(selectedProject.dueDate)} />
              </div>

              <div className="tabbed-panel">
                <div className="subsection">
                  <h3>Files</h3>
                  {detailRevisions.map((revision) => (
                    <div key={revision.revisionId} className="list-row">
                      <div>
                        <strong>{revision.filename}</strong>
                        <p>{revision.slicer} · {revision.materialProfile}</p>
                      </div>
                      <StatusPill tone={revision.isCurrent ? "success" : "neutral"} label={revision.status} />
                    </div>
                  ))}
                </div>
                <div className="subsection">
                  <h3>Builds</h3>
                  {detailJobs.map((job) => (
                    <div key={job.buildJobId} className="list-row">
                      <div>
                        <strong>{job.buildJobId}</strong>
                        <p>{printerMap[job.printerId]?.nickname} · {relativeHours(job.estimatedPrintTimeMinutes)}</p>
                      </div>
                      <StatusPill tone={toneForJob(job.jobStatus)} label={job.jobStatus} />
                    </div>
                  ))}
                </div>
                <div className="subsection">
                  <h3>Blockers</h3>
                  {detailBlockers.length ? (
                    detailBlockers.map((blocker) => (
                      <div key={blocker.blockerId} className="list-row">
                        <div>
                          <strong>{blocker.title}</strong>
                          <p>{userMap[blocker.assignedToUid]?.displayName} · {blocker.severity}</p>
                        </div>
                        <StatusPill tone="amber" label={blocker.status} />
                      </div>
                    ))
                  ) : (
                    <p className="muted">No active blockers.</p>
                  )}
                </div>
                <div className="subsection">
                  <h3>History</h3>
                  {detailActivity.map((entry) => (
                    <div key={entry.eventId} className="list-row">
                      <div>
                        <strong>{entry.message}</strong>
                        <p>{formatDate(entry.createdAt)}</p>
                      </div>
                      <span className="muted">{entry.actionType}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  function renderQueue() {
    return (
      <div className="view-grid">
        <section className="toolbar-panel">
          <div className="toolbar-group">
            <select className="select" value={queueFilter} onChange={(event) => setQueueFilter(event.target.value as typeof queueFilter)}>
              <option value="all">All queue states</option>
              {statusOrder.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <button className="button button-primary" onClick={() => setShowCreateBuild(true)} disabled={!can("buildjob_run")}>
            Create build job
          </button>
        </section>

        <Panel title="Build queue" subtitle="State transitions follow the workflow spec">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Project</th>
                <th>Printer</th>
                <th>Material</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.buildJobId}>
                  <td>
                    <strong>{job.buildJobId}</strong>
                    <div className="muted">{relativeHours(job.estimatedPrintTimeMinutes)}</div>
                  </td>
                  <td>{projectMap[job.projectId]?.title}</td>
                  <td>{printerMap[job.printerId]?.nickname}</td>
                  <td>{materialMap[job.materialId]?.displayName}</td>
                  <td><StatusPill tone={toneForJob(job.jobStatus)} label={job.jobStatus} /></td>
                  <td>
                    <div className="action-row">
                      {job.jobStatus !== "printing" && job.jobStatus !== "completed" && (
                        <button className="mini-button" onClick={() => transitionJob(job.buildJobId, "printing")} disabled={!can("buildjob_run")}>
                          Start
                        </button>
                      )}
                      {job.jobStatus === "printing" && (
                        <button className="mini-button" onClick={() => transitionJob(job.buildJobId, "paused")} disabled={!can("buildjob_run")}>
                          Pause
                        </button>
                      )}
                      {job.jobStatus !== "completed" && (
                        <button className="mini-button" onClick={() => transitionJob(job.buildJobId, "completed")} disabled={!can("buildjob_run")}>
                          Complete
                        </button>
                      )}
                      {job.jobStatus !== "failed" && job.jobStatus !== "completed" && (
                        <button className="mini-button danger" onClick={() => transitionJob(job.buildJobId, "failed")} disabled={!can("buildjob_run")}>
                          Fail
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    );
  }

  function renderPrinters() {
    return (
      <div className="view-grid">
        <Panel title="Printer fleet" subtitle="Seed models from the provided package">
          <div className="printer-grid">
            {printers.map((printer) => (
              <article key={printer.printerId} className="printer-card expanded">
                <div className="printer-visual">
                  <div className={`printer-badge ${printer.printerType}`}>{printer.brand.split(" ").map((part) => part[0]).join("")}</div>
                  <StatusPill tone={toneForPrinter(printer.operationalStatus)} label={printer.operationalStatus} />
                </div>
                <div className="card-header compact">
                  <div>
                    <h3>{printer.nickname}</h3>
                    <p>{printer.brand} {printer.model}</p>
                  </div>
                  <span className="muted">{printer.location}</span>
                </div>
                <div className="meta-row">
                  <span>{printer.buildVolume.join(" x ")} mm</span>
                  <span>{printer.utilizationToday}% utilization</span>
                </div>
                <div className="tag-row">
                  {printer.capabilityFlags.map((flag) => (
                    <span key={flag} className="tag">
                      {flag}
                    </span>
                  ))}
                </div>
                <div className="action-row">
                  <button className="mini-button" onClick={() => updatePrinterStatus(printer.printerId, "available")} disabled={!can("printer_manage")}>
                    Mark available
                  </button>
                  <button className="mini-button" onClick={() => updatePrinterStatus(printer.printerId, "maintenance")} disabled={!can("printer_manage")}>
                    Maintenance
                  </button>
                  <button className="mini-button" onClick={() => updatePrinterStatus(printer.printerId, "paused")} disabled={!can("printer_manage")}>
                    Pause
                  </button>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  function renderMaterials() {
    const comparedMaterials = comparedMaterialIds.map((id) => materialMap[id]).filter(Boolean);

    return (
      <div className="view-grid">
        <section className="toolbar-panel">
          <div className="toolbar-group">
            <input
              className="input"
              value={materialSearch}
              onChange={(event) => setMaterialSearch(event.target.value)}
              placeholder="Search materials, brands, families"
            />
            <select className="select" value={materialFilter} onChange={(event) => setMaterialFilter(event.target.value as typeof materialFilter)}>
              <option value="all">All classes</option>
              <option value="filament">Filament</option>
              <option value="resin">Resin</option>
            </select>
          </div>
        </section>

        <div className="split-layout">
          <Panel title="Material registry" subtitle={`${filteredMaterials.length} seeded records`}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Family</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Use count</th>
                  <th>Compare</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((material) => (
                  <tr key={material.materialId}>
                    <td>
                      <strong>{material.displayName}</strong>
                      <div className="muted">{material.brandName}</div>
                    </td>
                    <td>{material.familyId}</td>
                    <td>{material.resinOrFilament}</td>
                    <td><StatusPill tone={material.resinOrFilament === "resin" ? "purple" : "blue"} label={material.status} /></td>
                    <td>{material.useCount}</td>
                    <td>
                      <button className="mini-button" onClick={() => toggleMaterialCompare(material.materialId)}>
                        {comparedMaterialIds.includes(material.materialId) ? "Remove" : "Add"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Comparison drawer" subtitle="Up to 3 materials">
            {comparedMaterials.length ? (
              <div className="comparison-list">
                {comparedMaterials.map((material) => (
                  <div key={material.materialId} className="comparison-card">
                    <h3>{material.displayName}</h3>
                    <p>{material.brandName} · {material.familyId}</p>
                    <div className="detail-grid">
                      <InfoCard label="Class" value={material.resinOrFilament} />
                      <InfoCard label="Status" value={material.status} />
                      <InfoCard label="Validation" value={material.validationState} />
                      <InfoCard label="Use count" value={String(material.useCount)} />
                    </div>
                    <p className="card-copy">{material.notes}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Select materials from the table to compare resin-safe fields, family mapping, and validation state.</p>
            )}
          </Panel>
        </div>
      </div>
    );
  }

  function renderFiles() {
    return (
      <div className="view-grid">
        <section className="toolbar-panel">
          <div className="toolbar-group">
            <select className="select" value={selectedFileProjectId} onChange={(event) => setSelectedFileProjectId(event.target.value)}>
              {projects.map((project) => (
                <option key={project.projectId} value={project.projectId}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div className="split-layout">
          <Panel title="Upload dropzone" subtitle="Managed manufacturing artifact flow">
            <div className="dropzone">
              <p>Drag and drop is simulated in this prototype. Choose a file to create a new revision record with parsing metadata and approval controls.</p>
              <label className="button button-primary">
                Choose file
                <input
                  type="file"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handleUpload(file.name);
                    }
                  }}
                />
              </label>
              <button className="button" onClick={() => handleUpload("mock-upload.3mf")}>
                Generate mock upload
              </button>
              {uploadProgress > 0 && (
                <div className="upload-panel">
                  <div className="meta-row">
                    <strong>{uploadName}</strong>
                    <span>{uploadProgress}%</span>
                  </div>
                  <ProgressBar value={uploadProgress} tone="blue" />
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Revision history" subtitle={`${projectRevisions.length} revisions for selected project`}>
            <div className="revision-list">
              {projectRevisions.map((revision) => (
                <article key={revision.revisionId} className="revision-card">
                  <div className="card-header">
                    <div>
                      <h3>{revision.filename}</h3>
                      <p>r{revision.revisionNumber} · {formatDate(revision.uploadedAt)}</p>
                    </div>
                    <StatusPill tone={revision.isCurrent ? "success" : "neutral"} label={revision.status} />
                  </div>
                  <div className="detail-grid">
                    <InfoCard label="Slicer" value={revision.slicer} />
                    <InfoCard label="Printer profile" value={revision.printerProfile} />
                    <InfoCard label="Material profile" value={revision.materialProfile} />
                    <InfoCard label="Estimate" value={revision.parsedMetadata.estimateTimeRaw} />
                  </div>
                  <p className="card-copy">{revision.notes}</p>
                  <div className="meta-row">
                    <span>Parse confidence {revision.parsedMetadata.parseConfidence}</span>
                    <span>{Math.round(revision.sizeBytes / 1024 / 1024)} MB</span>
                  </div>
                  <div className="action-row">
                    <button className="mini-button" onClick={() => markRevisionCurrent(revision.revisionId)} disabled={revision.isCurrent || !can("file_approve_current")}>
                      Mark current
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  function renderAnalytics() {
    const materialMix = materials.reduce(
      (accumulator, material) => {
        accumulator[material.resinOrFilament] += material.useCount;
        return accumulator;
      },
      { filament: 0, resin: 0 },
    );

    return (
      <div className="view-grid">
        <section className="kpi-grid">
          <StatCard label="Average queue age" value="4.2h" accent="amber" />
          <StatCard label="Failure rate" value="6.8%" accent="red" />
          <StatCard label="Large-format load" value="91%" accent="blue" />
          <StatCard label="Resin mix" value={`${Math.round((materialMix.resin / (materialMix.filament + materialMix.resin)) * 100)}%`} accent="purple" />
        </section>
        <div className="content-grid analytics">
          <Panel title="Utilization by printer" subtitle="Today">
            <div className="chart-list">
              {printers.map((printer) => (
                <div key={printer.printerId} className="chart-row">
                  <span>{printer.nickname}</span>
                  <div className="chart-bar">
                    <div className="chart-fill blue" style={{ width: `${printer.utilizationToday}%` }} />
                  </div>
                  <strong>{printer.utilizationToday}%</strong>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Top materials by job count" subtitle="Seed usage distribution">
            <div className="chart-list">
              {[...materials]
                .sort((left, right) => right.useCount - left.useCount)
                .slice(0, 6)
                .map((material) => (
                  <div key={material.materialId} className="chart-row">
                    <span>{material.displayName}</span>
                    <div className="chart-bar">
                      <div className={`chart-fill ${material.resinOrFilament === "resin" ? "purple" : "amber"}`} style={{ width: `${Math.min(material.useCount * 2, 100)}%` }} />
                    </div>
                    <strong>{material.useCount}</strong>
                  </div>
                ))}
            </div>
          </Panel>
          <Panel title="Ops report pack" subtitle="V1 report set from the spec">
            <div className="report-grid">
              {[
                "Printer utilization by day/week/month",
                "Project throughput by owner",
                "Job failure reasons",
                "Materials used by family and brand",
                "Overdue projects",
                "Resin vs filament mix",
              ].map((report) => (
                <div key={report} className="report-card">
                  <strong>{report}</strong>
                  <p>Prepared for export-ready analytics and saved views.</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  function renderAdmin() {
    return (
      <div className="view-grid">
        <div className="split-layout">
          <Panel title="Role matrix" subtitle="Derived from the auth and permissions spec">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Permission</th>
                  <th>Roles</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(permissionMatrix).map(([permission, roles]) => (
                  <tr key={permission}>
                    <td>{permission}</td>
                    <td>{roles.map((role) => roleLabels[role]).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="Seed registry" subtitle="Directly reflected from the provided package">
            <div className="report-grid">
              <div className="report-card">
                <strong>Printer model seeds</strong>
                <p>7 requested models including Bambu, Creality, Sovol, Anycubic, and Elegoo resin equipment.</p>
              </div>
              <div className="report-card">
                <strong>Material normalization</strong>
                <p>Filament and resin taxonomy with normalized engineering families and vendor-facing product lines.</p>
              </div>
              <div className="report-card">
                <strong>Managed uploads</strong>
                <p>Revision-aware .3mf flow with parsing, preview fallback, and current-artifact approval controls.</p>
              </div>
              <div className="report-card">
                <strong>Analytics contract</strong>
                <p>KPIs, saved views, CSV exports, utilization charts, and failure analysis scaffolding.</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  function renderSpecs() {
    return (
      <div className="view-grid">
        <div className="split-layout">
          <Panel title="Imported source package" subtitle={`${specs.length} files mounted into the test app`}>
            <div className="spec-list">
              {specs.map((spec) => (
                <button
                  key={spec.id}
                  className={`spec-item ${selectedSpec.id === spec.id ? "selected" : ""}`}
                  onClick={() => setSelectedSpecId(spec.id)}
                >
                  <div>
                    <strong>{spec.title}</strong>
                    <p>{spec.filename}</p>
                  </div>
                  <span className="muted">{spec.docType}</span>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title={selectedSpec.title} subtitle={selectedSpec.filename}>
            <div className="spec-meta">
              <StatusPill tone="info" label={selectedSpec.docType} />
              <p>{selectedSpec.summary}</p>
            </div>
            <pre className="code-block">{selectedSpec.raw}</pre>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <p className="eyebrow">Internal additive execution</p>
          <h2>PrintForge Ops</h2>
          <p className="muted">Test webapp generated from the provided spec bundle.</p>
        </div>
        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? "active" : ""}`}
              onClick={() => setActiveView(item.id)}
            >
              <span>{item.label}</span>
              <small>{item.hint}</small>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <label className="sidebar-label" htmlFor="user-switcher">
            Active role
          </label>
          <select id="user-switcher" className="select full" value={currentUserId} onChange={(event) => setCurrentUserId(event.target.value)}>
            {users.map((user) => (
              <option key={user.uid} value={user.uid}>
                {user.displayName} · {roleLabels[user.role]}
              </option>
            ))}
          </select>
          <button className="button full" onClick={() => setCommandOpen(true)}>
            Search everything
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">Signed in as</p>
            <h1>{currentUser.displayName}</h1>
            <p className="muted">{roleLabels[currentUser.role]} · {currentUser.team}</p>
          </div>
          <div className="topbar-actions">
            <div className="status-chip">Org-aware mock environment</div>
            <div className="status-chip">Spec docs: {specs.length}</div>
          </div>
        </header>

        {activeView === "overview" && renderOverview()}
        {activeView === "projects" && renderProjects()}
        {activeView === "queue" && renderQueue()}
        {activeView === "printers" && renderPrinters()}
        {activeView === "materials" && renderMaterials()}
        {activeView === "files" && renderFiles()}
        {activeView === "analytics" && renderAnalytics()}
        {activeView === "admin" && renderAdmin()}
        {activeView === "specs" && renderSpecs()}
      </main>

      {showCreateProject && (
        <div className="modal-backdrop" onClick={() => setShowCreateProject(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="card-header">
              <div>
                <p className="eyebrow">Multi-step create project wizard</p>
                <h3>New project</h3>
              </div>
              <StatusPill tone="info" label={`Step ${projectWizardStep} of 3`} />
            </div>
            <form className="form-stack" onSubmit={handleProjectCreate}>
              {projectWizardStep === 1 && (
                <>
                  <input
                    className="input"
                    name="title"
                    placeholder="Project title"
                    required
                    value={newProjectForm.title}
                    onChange={(event) => setNewProjectForm((current) => ({ ...current, title: event.target.value }))}
                  />
                  <input
                    className="input"
                    name="code"
                    placeholder="Project code"
                    required
                    value={newProjectForm.code}
                    onChange={(event) => setNewProjectForm((current) => ({ ...current, code: event.target.value }))}
                  />
                  <textarea
                    className="textarea"
                    name="description"
                    placeholder="Operational description"
                    rows={4}
                    value={newProjectForm.description}
                    onChange={(event) => setNewProjectForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </>
              )}
              {projectWizardStep === 2 && (
                <>
                  <select
                    className="select"
                    name="requestedMaterialId"
                    value={newProjectForm.requestedMaterialId}
                    onChange={(event) => setNewProjectForm((current) => ({ ...current, requestedMaterialId: event.target.value }))}
                  >
                    {materials.map((material) => (
                      <option key={material.materialId} value={material.materialId}>
                        {material.displayName}
                      </option>
                    ))}
                  </select>
                  <select
                    className="select"
                    name="printerTargetId"
                    value={newProjectForm.printerTargetId}
                    onChange={(event) => setNewProjectForm((current) => ({ ...current, printerTargetId: event.target.value }))}
                  >
                    {printers.map((printer) => (
                      <option key={printer.printerId} value={printer.printerId}>
                        {printer.nickname}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {projectWizardStep === 3 && (
                <input
                  className="input"
                  type="datetime-local"
                  name="dueDate"
                  required
                  value={newProjectForm.dueDate}
                  onChange={(event) => setNewProjectForm((current) => ({ ...current, dueDate: event.target.value }))}
                />
              )}
              <div className="action-row">
                <button type="button" className="button" onClick={() => setProjectWizardStep((step) => Math.max(1, step - 1))}>
                  Back
                </button>
                {projectWizardStep < 3 ? (
                  <button type="button" className="button button-primary" onClick={() => setProjectWizardStep((step) => Math.min(3, step + 1))}>
                    Next
                  </button>
                ) : (
                  <button type="submit" className="button button-primary">
                    Create project
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showCreateBuild && (
        <div className="modal-backdrop" onClick={() => setShowCreateBuild(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="card-header">
              <div>
                <p className="eyebrow">Modal to create build job</p>
                <h3>Queue build job</h3>
              </div>
              <StatusPill tone="info" label="Action contract" />
            </div>
            <form className="form-stack" onSubmit={handleBuildCreate}>
              <select className="select" name="projectId" defaultValue={projects[0].projectId}>
                {projects.map((project) => (
                  <option key={project.projectId} value={project.projectId}>
                    {project.title}
                  </option>
                ))}
              </select>
              <select className="select" name="printerId" defaultValue={printers[0].printerId}>
                {printers.map((printer) => (
                  <option key={printer.printerId} value={printer.printerId}>
                    {printer.nickname}
                  </option>
                ))}
              </select>
              <select className="select" name="materialId" defaultValue={materials[0].materialId}>
                {materials.map((material) => (
                  <option key={material.materialId} value={material.materialId}>
                    {material.displayName}
                  </option>
                ))}
              </select>
              <select className="select" name="assignedToUid" defaultValue={currentUser.uid}>
                {users.map((user) => (
                  <option key={user.uid} value={user.uid}>
                    {user.displayName}
                  </option>
                ))}
              </select>
              <div className="action-row">
                <button type="button" className="button" onClick={() => setShowCreateBuild(false)}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  Queue build
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {commandOpen && (
        <div className="modal-backdrop" onClick={() => setCommandOpen(false)}>
          <div className="modal command-palette" onClick={(event) => event.stopPropagation()}>
            <input
              autoFocus
              className="input"
              value={commandQuery}
              onChange={(event) => setCommandQuery(event.target.value)}
              placeholder="Search projects, printers, materials, jobs, docs"
            />
            <div className="command-results">
              {searchResults.length ? (
                searchResults.map((result) => (
                  <button key={result.id} className="command-result" onClick={result.action}>
                    <strong>{result.label}</strong>
                    <p>{result.meta}</p>
                  </button>
                ))
              ) : (
                <p className="muted">Type to search across the seeded app state and imported package documents.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            <strong>{toast.title}</strong>
            <p>{toast.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: "blue" | "green" | "amber" | "red" | "purple" }) {
  return (
    <article className={`stat-card ${accent}`}>
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  );
}

function ProgressBar({ value, tone = "green" }: { value: number; tone?: "green" | "blue" | "amber" }) {
  return (
    <div className="progress-shell">
      <div className={`progress-fill ${tone}`} style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "success" | "info" | "error" | "amber" | "neutral" | "blue" | "green" | "red" | "purple" }) {
  return <span className={`status-pill ${tone}`}>{label}</span>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-card">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function HandoffRow({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="handoff-row">
      <div>
        <strong>{label}</strong>
        <p>{detail}</p>
      </div>
      <span>{value}</span>
    </div>
  );
}

function toneForPrinter(status: PrinterStatus) {
  if (status === "available") return "success";
  if (status === "busy" || status === "reserved") return "info";
  if (status === "paused" || status === "maintenance") return "amber";
  return "error";
}

function toneForJob(status: BuildJobStatus) {
  if (status === "completed") return "success";
  if (status === "printing" || status === "assigned" || status === "preflight") return "info";
  if (status === "paused" || status === "queued") return "amber";
  if (status === "failed" || status === "cancelled") return "error";
  return "neutral";
}

export default App;
