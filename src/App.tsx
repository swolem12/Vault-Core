import {
  FormEvent,
  ReactNode,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { printerCatalog, seedUsers } from "./mockData";
import { PrinterIcon } from "./printerIcons";
import { specDocuments } from "./specDocuments";
import type {
  AppView,
  PartRepositoryItem,
  Role,
  StationQueueState,
  WorkProject,
  WorkProjectPriority,
  WorkProjectStatus,
  WorkcenterStation,
  WorkcenterZone,
} from "./types";

const navItems: { id: AppView; label: string; caption: string }[] = [
  { id: "projects", label: "Projects", caption: "Board and execution list" },
  { id: "repository", label: "Repository", caption: "3D files and part records" },
  { id: "warehouse", label: "Warehouse", caption: "Printer floor and queue" },
  { id: "fleet", label: "Fleet", caption: "Approved printer models" },
  { id: "specs", label: "Specs", caption: "Source package and contracts" },
];

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  engineering_lead: "Engineering Lead",
  engineer: "Engineer",
  operator: "Operator",
  viewer: "Viewer",
};

const statusLabels: Record<WorkProjectStatus, string> = {
  intake: "Intake",
  ready: "Ready",
  queued: "Queued",
  printing: "Printing",
  qa: "QA",
  complete: "Complete",
};

const priorityLabels: Record<WorkProjectPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  rush: "Rush",
};

const storageKeys = {
  zones: "vault-core.zones.v3",
  stations: "vault-core.stations.v3",
  projects: "vault-core.projects.v3",
  queues: "vault-core.queues.v3",
  repository: "vault-core.repository.v1",
};

const initialZoneForm = {
  workcenterName: "",
  zoneName: "",
  description: "",
};

const initialStationForm = {
  stationName: "",
  zoneId: "",
  printerModelId: printerCatalog[0]?.modelId ?? "",
  machineNickname: "",
  bayLabel: "",
  notes: "",
  stationHealth: "ready" as WorkcenterStation["stationHealth"],
};

const initialProjectForm = {
  title: "",
  code: "",
  productName: "",
  clientName: "",
  materialIntent: "",
  fileRevision: "",
  quantity: "1",
  dueDate: "",
  priority: "normal" as WorkProjectPriority,
  notes: "",
};

const initialRepositoryForm = {
  title: "",
  linkedProjectId: "",
  productName: "",
  fileName: "",
  fileRevision: "",
  material: "",
  estimatedPrintHours: "0",
  estimatedCostUsd: "0",
  quantityPerRun: "1",
  status: "candidate" as PartRepositoryItem["status"],
  notes: "",
};

const projectStatuses: WorkProjectStatus[] = ["intake", "ready", "queued", "printing", "qa", "complete"];

function App() {
  const [activeView, setActiveView] = useState<AppView>("projects");
  const [currentUserId, setCurrentUserId] = useState(seedUsers[0]?.uid ?? "");
  const [zones, setZones] = useState<WorkcenterZone[]>([]);
  const [stations, setStations] = useState<WorkcenterStation[]>([]);
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [queues, setQueues] = useState<Record<string, StationQueueState>>({});
  const [repositoryItems, setRepositoryItems] = useState<PartRepositoryItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedRepositoryId, setSelectedRepositoryId] = useState("");
  const [selectedStationId, setSelectedStationId] = useState("");
  const [selectedSpecId, setSelectedSpecId] = useState(specDocuments[0]?.id ?? "");
  const [projectSearch, setProjectSearch] = useState("");
  const [repositorySearch, setRepositorySearch] = useState("");
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [fleetSearch, setFleetSearch] = useState("");
  const [showCreateZone, setShowCreateZone] = useState(false);
  const [showCreateStation, setShowCreateStation] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateRepository, setShowCreateRepository] = useState(false);
  const [zoneForm, setZoneForm] = useState(initialZoneForm);
  const [stationForm, setStationForm] = useState(initialStationForm);
  const [projectForm, setProjectForm] = useState(initialProjectForm);
  const [repositoryForm, setRepositoryForm] = useState(initialRepositoryForm);

  const deferredProjectSearch = useDeferredValue(projectSearch);
  const deferredRepositorySearch = useDeferredValue(repositorySearch);
  const deferredWarehouseSearch = useDeferredValue(warehouseSearch);
  const deferredFleetSearch = useDeferredValue(fleetSearch);

  const currentUser = seedUsers.find((user) => user.uid === currentUserId) ?? seedUsers[0];
  const selectedSpec = specDocuments.find((doc) => doc.id === selectedSpecId) ?? specDocuments[0];

  const printerModelMap = useMemo(
    () => Object.fromEntries(printerCatalog.map((printer) => [printer.modelId, printer])),
    [],
  );
  const zoneMap = useMemo(() => Object.fromEntries(zones.map((zone) => [zone.zoneId, zone])), [zones]);
  const stationMap = useMemo(
    () => Object.fromEntries(stations.map((station) => [station.stationId, station])),
    [stations],
  );

  const selectedProject = projects.find((project) => project.projectId === selectedProjectId) ?? null;
  const selectedRepositoryItem = repositoryItems.find((item) => item.itemId === selectedRepositoryId) ?? null;
  const selectedStation = stations.find((station) => station.stationId === selectedStationId) ?? null;
  const selectedStationQueue = selectedStation
    ? queues[selectedStation.stationId] ?? { activeProjectId: null, queuedProjectIds: [] }
    : null;

  useEffect(() => {
    setZones(loadState(storageKeys.zones, []));
    setStations(loadState(storageKeys.stations, []));
    setProjects(loadState(storageKeys.projects, []));
    setQueues(loadState(storageKeys.queues, {}));
    setRepositoryItems(loadState(storageKeys.repository, []));
  }, []);

  useEffect(() => persistState(storageKeys.zones, zones), [zones]);
  useEffect(() => persistState(storageKeys.stations, stations), [stations]);
  useEffect(() => persistState(storageKeys.projects, projects), [projects]);
  useEffect(() => persistState(storageKeys.queues, queues), [queues]);
  useEffect(() => persistState(storageKeys.repository, repositoryItems), [repositoryItems]);

  useEffect(() => {
    if (!selectedProjectId && projects[0]) {
      setSelectedProjectId(projects[0].projectId);
      return;
    }

    if (selectedProjectId && !projects.some((project) => project.projectId === selectedProjectId)) {
      setSelectedProjectId(projects[0]?.projectId ?? "");
    }
  }, [projects, selectedProjectId]);

  useEffect(() => {
    if (!selectedStationId && stations[0]) {
      setSelectedStationId(stations[0].stationId);
      return;
    }

    if (selectedStationId && !stations.some((station) => station.stationId === selectedStationId)) {
      setSelectedStationId(stations[0]?.stationId ?? "");
    }
  }, [selectedStationId, stations]);

  useEffect(() => {
    if (!selectedRepositoryId && repositoryItems[0]) {
      setSelectedRepositoryId(repositoryItems[0].itemId);
      return;
    }

    if (selectedRepositoryId && !repositoryItems.some((item) => item.itemId === selectedRepositoryId)) {
      setSelectedRepositoryId(repositoryItems[0]?.itemId ?? "");
    }
  }, [repositoryItems, selectedRepositoryId]);

  const filteredProjects = useMemo(() => {
    const query = deferredProjectSearch.trim().toLowerCase();
    if (!query) {
      return projects;
    }

    return projects.filter((project) =>
      [
        project.title,
        project.code,
        project.productName,
        project.clientName,
        project.materialIntent,
        project.fileRevision,
        stationMap[project.assignedStationId ?? ""]?.stationName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [deferredProjectSearch, projects, stationMap]);

  const projectGroups = useMemo(
    () =>
      Object.fromEntries(
        projectStatuses.map((status) => [status, filteredProjects.filter((project) => project.status === status)]),
      ) as Record<WorkProjectStatus, WorkProject[]>,
    [filteredProjects],
  );

  const filteredRepositoryItems = useMemo(() => {
    const query = deferredRepositorySearch.trim().toLowerCase();
    if (!query) {
      return repositoryItems;
    }

    return repositoryItems.filter((item) =>
      [
        item.title,
        item.productName,
        item.fileName,
        item.fileRevision,
        item.material,
        projects.find((project) => project.projectId === item.linkedProjectId)?.code,
        projects.find((project) => project.projectId === item.linkedProjectId)?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [deferredRepositorySearch, projects, repositoryItems]);

  const filteredZones = useMemo(() => {
    const query = deferredWarehouseSearch.trim().toLowerCase();
    if (!query) {
      return zones;
    }

    return zones.filter((zone) => {
      const stationMatches = stations
        .filter((station) => station.zoneId === zone.zoneId)
        .some((station) =>
          [
            station.stationName,
            station.machineNickname,
            station.bayLabel,
            printerModelMap[station.printerModelId]?.brand,
            printerModelMap[station.printerModelId]?.model,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query),
        );

      return (
        stationMatches ||
        [zone.workcenterName, zone.zoneName, zone.description].join(" ").toLowerCase().includes(query)
      );
    });
  }, [deferredWarehouseSearch, printerModelMap, stations, zones]);

  const filteredFleet = useMemo(() => {
    const query = deferredFleetSearch.trim().toLowerCase();
    if (!query) {
      return printerCatalog;
    }

    return printerCatalog.filter((printer) =>
      [printer.brand, printer.model, printer.printerType, printer.technology, ...printer.capabilityFlags]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [deferredFleetSearch]);

  const stats = useMemo(
    () => ({
      projectCount: projects.length,
      repositoryCount: repositoryItems.length,
      readyToSchedule: projects.filter((project) => project.status === "ready").length,
      livePrinters: stations.filter((station) => (queues[station.stationId]?.activeProjectId ? true : station.stationHealth === "ready")).length,
      activeBuilds: Object.values(queues).filter((queue) => queue.activeProjectId).length,
    }),
    [projects, queues, repositoryItems.length, stations],
  );

  const assignableProjects = projects.filter((project) => project.status === "ready" || project.status === "qa");

  function openCreateStation(printerModelId?: string, zoneId?: string) {
    setStationForm({
      ...initialStationForm,
      printerModelId: printerModelId ?? initialStationForm.printerModelId,
      zoneId: zoneId ?? "",
    });
    setShowCreateStation(true);
  }

  function openCreateRepository(project?: WorkProject | null) {
    if (!project) {
      setRepositoryForm(initialRepositoryForm);
      setShowCreateRepository(true);
      return;
    }

    setRepositoryForm({
      title: project.title,
      linkedProjectId: project.projectId,
      productName: project.productName,
      fileName: "",
      fileRevision: project.fileRevision,
      material: project.materialIntent,
      estimatedPrintHours: "0",
      estimatedCostUsd: "0",
      quantityPerRun: String(project.quantity),
      status: "candidate",
      notes: project.notes,
    });
    setShowCreateRepository(true);
  }

  function createZone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!zoneForm.workcenterName.trim() || !zoneForm.zoneName.trim()) {
      return;
    }

    const newZone: WorkcenterZone = {
      zoneId: `zone_${Date.now()}`,
      workcenterName: zoneForm.workcenterName.trim(),
      zoneName: zoneForm.zoneName.trim(),
      description: zoneForm.description.trim(),
      createdAt: new Date().toISOString(),
    };

    setZones((current) => [newZone, ...current]);
    setZoneForm(initialZoneForm);
    setStationForm((current) => ({ ...current, zoneId: newZone.zoneId }));
    setShowCreateZone(false);
  }

  function createStation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stationForm.stationName.trim() || !stationForm.zoneId || !stationForm.printerModelId) {
      return;
    }

    const selectedModel = printerModelMap[stationForm.printerModelId];
    const newStation: WorkcenterStation = {
      stationId: `station_${Date.now()}`,
      stationName: stationForm.stationName.trim(),
      zoneId: stationForm.zoneId,
      printerModelId: stationForm.printerModelId,
      machineNickname: stationForm.machineNickname.trim() || selectedModel.model,
      bayLabel: stationForm.bayLabel.trim(),
      notes: stationForm.notes.trim(),
      stationHealth: stationForm.stationHealth,
      createdAt: new Date().toISOString(),
      createdByUid: currentUser.uid,
    };

    setStations((current) => [newStation, ...current]);
    setQueues((current) => ({
      ...current,
      [newStation.stationId]: { activeProjectId: null, queuedProjectIds: [] },
    }));
    startTransition(() => setSelectedStationId(newStation.stationId));
    setShowCreateStation(false);
    setStationForm(initialStationForm);
  }

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectForm.title.trim() || !projectForm.code.trim()) {
      return;
    }

    const hasManufacturingData = Boolean(projectForm.materialIntent.trim() && projectForm.fileRevision.trim());
    const newProject: WorkProject = {
      projectId: `project_${Date.now()}`,
      title: projectForm.title.trim(),
      code: projectForm.code.trim(),
      productName: projectForm.productName.trim(),
      clientName: projectForm.clientName.trim(),
      materialIntent: projectForm.materialIntent.trim(),
      fileRevision: projectForm.fileRevision.trim(),
      quantity: Math.max(1, Number(projectForm.quantity) || 1),
      dueDate: projectForm.dueDate,
      priority: projectForm.priority,
      notes: projectForm.notes.trim(),
      status: hasManufacturingData ? "ready" : "intake",
      ownerUid: currentUser.uid,
      createdAt: new Date().toISOString(),
      assignedStationId: null,
    };

    setProjects((current) => [newProject, ...current]);
    startTransition(() => setSelectedProjectId(newProject.projectId));
    setProjectForm(initialProjectForm);
    setShowCreateProject(false);
  }

  function createRepositoryItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!repositoryForm.title.trim() || !repositoryForm.fileName.trim()) {
      return;
    }

    const newItem: PartRepositoryItem = {
      itemId: `part_${Date.now()}`,
      title: repositoryForm.title.trim(),
      linkedProjectId: repositoryForm.linkedProjectId || null,
      productName: repositoryForm.productName.trim(),
      fileName: repositoryForm.fileName.trim(),
      fileRevision: repositoryForm.fileRevision.trim(),
      material: repositoryForm.material.trim(),
      estimatedPrintHours: Math.max(0, Number(repositoryForm.estimatedPrintHours) || 0),
      estimatedCostUsd: Math.max(0, Number(repositoryForm.estimatedCostUsd) || 0),
      quantityPerRun: Math.max(1, Number(repositoryForm.quantityPerRun) || 1),
      status: repositoryForm.status,
      notes: repositoryForm.notes.trim(),
      createdAt: new Date().toISOString(),
      createdByUid: currentUser.uid,
    };

    setRepositoryItems((current) => [newItem, ...current]);
    startTransition(() => setSelectedRepositoryId(newItem.itemId));
    setRepositoryForm(initialRepositoryForm);
    setShowCreateRepository(false);
  }

  function updateProjectField<K extends keyof WorkProject>(projectId: string, field: K, value: WorkProject[K]) {
    setProjects((current) =>
      current.map((project) => {
        if (project.projectId !== projectId) {
          return project;
        }

        const nextProject = { ...project, [field]: value };
        const hasManufacturingData = Boolean(nextProject.materialIntent.trim() && nextProject.fileRevision.trim());

        if (nextProject.status === "intake" && hasManufacturingData) {
          nextProject.status = "ready";
        }

        if (nextProject.status === "ready" && !hasManufacturingData) {
          nextProject.status = "intake";
        }

        return nextProject;
      }),
    );
  }

  function updateRepositoryField<K extends keyof PartRepositoryItem>(
    itemId: string,
    field: K,
    value: PartRepositoryItem[K],
  ) {
    setRepositoryItems((current) =>
      current.map((item) => (item.itemId === itemId ? { ...item, [field]: value } : item)),
    );
  }

  function updateStationField<K extends keyof WorkcenterStation>(stationId: string, field: K, value: WorkcenterStation[K]) {
    setStations((current) =>
      current.map((station) => (station.stationId === stationId ? { ...station, [field]: value } : station)),
    );
  }

  function removeProjectFromQueues(nextQueues: Record<string, StationQueueState>, projectId: string) {
    for (const stationId of Object.keys(nextQueues)) {
      const queue = nextQueues[stationId];
      nextQueues[stationId] = {
        activeProjectId: queue.activeProjectId === projectId ? null : queue.activeProjectId,
        queuedProjectIds: queue.queuedProjectIds.filter((queuedId) => queuedId !== projectId),
      };
    }
  }

  function assignProjectToStation(projectId: string, stationId: string) {
    setQueues((current) => {
      if (current[stationId]?.activeProjectId === projectId || current[stationId]?.queuedProjectIds.includes(projectId)) {
        return current;
      }

      const nextQueues = structuredClone(current);
      removeProjectFromQueues(nextQueues, projectId);
      const queue = nextQueues[stationId] ?? { activeProjectId: null, queuedProjectIds: [] };
      if (!queue.queuedProjectIds.includes(projectId) && queue.activeProjectId !== projectId) {
        queue.queuedProjectIds.push(projectId);
      }
      nextQueues[stationId] = queue;
      return nextQueues;
    });

    setProjects((current) =>
      current.map((project) =>
        project.projectId === projectId ? { ...project, assignedStationId: stationId, status: "queued" } : project,
      ),
    );
  }

  function unassignProject(projectId: string) {
    setQueues((current) => {
      const nextQueues = structuredClone(current);
      removeProjectFromQueues(nextQueues, projectId);
      return nextQueues;
    });

    setProjects((current) =>
      current.map((project) =>
        project.projectId === projectId
          ? {
              ...project,
              assignedStationId: null,
              status: project.fileRevision && project.materialIntent ? "ready" : "intake",
            }
          : project,
      ),
    );
  }

  function startQueuedProject(stationId: string, projectId: string) {
    setQueues((current) => {
      const queue = current[stationId] ?? { activeProjectId: null, queuedProjectIds: [] };
      const nextQueued = queue.queuedProjectIds.filter((queuedId) => queuedId !== projectId);
      const demoted = queue.activeProjectId && queue.activeProjectId !== projectId ? [queue.activeProjectId] : [];
      return {
        ...current,
        [stationId]: {
          activeProjectId: projectId,
          queuedProjectIds: [...demoted, ...nextQueued],
        },
      };
    });

    setProjects((current) =>
      current.map((project) => {
        if (project.projectId === projectId) {
          return { ...project, assignedStationId: stationId, status: "printing" };
        }
        if (project.assignedStationId === stationId && project.status === "printing") {
          return { ...project, status: "queued" };
        }
        return project;
      }),
    );
  }

  function moveQueuedProject(stationId: string, projectId: string, direction: -1 | 1) {
    setQueues((current) => {
      const queue = current[stationId] ?? { activeProjectId: null, queuedProjectIds: [] };
      const index = queue.queuedProjectIds.indexOf(projectId);
      if (index === -1) {
        return current;
      }
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= queue.queuedProjectIds.length) {
        return current;
      }

      const nextQueued = [...queue.queuedProjectIds];
      [nextQueued[index], nextQueued[nextIndex]] = [nextQueued[nextIndex], nextQueued[index]];
      return {
        ...current,
        [stationId]: {
          activeProjectId: queue.activeProjectId,
          queuedProjectIds: nextQueued,
        },
      };
    });
  }

  function sendActiveToQa(stationId: string) {
    const queue = queues[stationId];
    if (!queue?.activeProjectId) {
      return;
    }

    const activeProjectId = queue.activeProjectId;

    setQueues((current) => ({
      ...current,
      [stationId]: {
        activeProjectId: null,
        queuedProjectIds: current[stationId]?.queuedProjectIds ?? [],
      },
    }));

    setProjects((current) =>
      current.map((project) =>
        project.projectId === activeProjectId ? { ...project, status: "qa", assignedStationId: stationId } : project,
      ),
    );
  }

  function markProjectComplete(projectId: string) {
    setQueues((current) => {
      const nextQueues = structuredClone(current);
      removeProjectFromQueues(nextQueues, projectId);
      return nextQueues;
    });

    setProjects((current) =>
      current.map((project) => (project.projectId === projectId ? { ...project, status: "complete" } : project)),
    );
  }

  function reopenProject(projectId: string) {
    setProjects((current) =>
      current.map((project) => {
        if (project.projectId !== projectId) {
          return project;
        }
        return {
          ...project,
          status: project.fileRevision && project.materialIntent ? "ready" : "intake",
        };
      }),
    );
  }

  function deleteZone(zoneId: string) {
    const stationIds = stations.filter((station) => station.zoneId === zoneId).map((station) => station.stationId);

    setZones((current) => current.filter((zone) => zone.zoneId !== zoneId));
    setStations((current) => current.filter((station) => station.zoneId !== zoneId));
    setQueues((current) => {
      const next = { ...current };
      for (const stationId of stationIds) {
        delete next[stationId];
      }
      return next;
    });
    setProjects((current) =>
      current.map((project) =>
        project.assignedStationId && stationIds.includes(project.assignedStationId)
          ? {
              ...project,
              assignedStationId: null,
              status: project.fileRevision && project.materialIntent ? "ready" : "intake",
            }
          : project,
      ),
    );
  }

  function warehouseActivity(station: WorkcenterStation) {
    const queue = queues[station.stationId] ?? { activeProjectId: null, queuedProjectIds: [] };
    if (station.stationHealth === "maintenance") {
      return { label: "Maintenance", tone: "maintenance" as const };
    }
    if (station.stationHealth === "offline") {
      return { label: "Offline", tone: "offline" as const };
    }
    if (queue.activeProjectId) {
      return { label: "Printing", tone: "printing" as const };
    }
    if (queue.queuedProjectIds.length) {
      return { label: "Queued", tone: "queued" as const };
    }
    return { label: "Ready", tone: "ready" as const };
  }

  function renderProjectsView() {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <p className="section-kicker">Program board</p>
            <h2>Projects become printable only when product, material, revision, and station all line up.</h2>
            <p className="section-copy">
              This workspace tracks engineering projects rather than sold inventory. The product record lives inside the
              project so every printed unit inherits the correct file revision, material intent, and printer assignment.
            </p>
          </div>
          <div className="header-actions">
            <button className="secondary-button" onClick={() => setShowCreateZone(true)}>
              Create zone
            </button>
            <button className="secondary-button" onClick={() => setShowCreateStation(true)}>
              Add printer station
            </button>
            <button className="secondary-button" onClick={() => openCreateRepository(selectedProject)}>
              Promote to repository
            </button>
            <button className="primary-button" onClick={() => setShowCreateProject(true)}>
              New project
            </button>
          </div>
        </section>

        <section className="metric-row">
          <MetricCard label="Projects" value={String(stats.projectCount)} tone="blue" />
          <MetricCard label="Ready to schedule" value={String(stats.readyToSchedule)} tone="green" />
          <MetricCard label="Live printers" value={String(stats.livePrinters)} tone="purple" />
          <MetricCard label="Active builds" value={String(stats.activeBuilds)} tone="amber" />
        </section>

        <section className="panel board-panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Status board</p>
              <h3>Monday-style execution lanes</h3>
            </div>
            <div className="search-shell board-search">
              <label htmlFor="project-search">Search projects</label>
              <input
                id="project-search"
                className="field"
                value={projectSearch}
                onChange={(event) => setProjectSearch(event.target.value)}
                placeholder="Code, product, client, material, station"
              />
            </div>
          </div>

          <div className="board-lanes">
            {projectStatuses.map((status) => (
              <div key={status} className={`board-column ${status}`}>
                <div className="board-column-head">
                  <span className={`status-pill ${status}`}>{statusLabels[status]}</span>
                  <strong>{projectGroups[status].length}</strong>
                </div>
                <div className="board-column-body">
                  {projectGroups[status].length ? (
                    projectGroups[status].map((project) => (
                      <button
                        key={project.projectId}
                        className={`board-project ${selectedProjectId === project.projectId ? "selected" : ""}`}
                        onClick={() => startTransition(() => setSelectedProjectId(project.projectId))}
                      >
                        <div className="board-project-top">
                          <strong>{project.title}</strong>
                          <span className={`priority-chip ${project.priority}`}>{priorityLabels[project.priority]}</span>
                        </div>
                        <span>{project.code}</span>
                        <p>{project.productName || "Product not named yet"}</p>
                        <div className="board-project-meta">
                          <span>{project.materialIntent || "Material pending"}</span>
                          <span>{stationMap[project.assignedStationId ?? ""]?.stationName ?? "Unassigned"}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="empty-lane">No projects in {statusLabels[status].toLowerCase()}.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="operations-grid">
          <div className="panel table-panel">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Execution list</p>
                <h3>Projects and products</h3>
              </div>
            </div>

            {filteredProjects.length ? (
              <div className="project-table">
                <div className="table-head">
                  <span>Project</span>
                  <span>Status</span>
                  <span>Product</span>
                  <span>Material</span>
                  <span>Revision</span>
                  <span>Due</span>
                  <span>Printer</span>
                </div>
                {filteredProjects.map((project) => (
                  <button
                    key={project.projectId}
                    className={`table-row ${selectedProjectId === project.projectId ? "selected" : ""}`}
                    onClick={() => startTransition(() => setSelectedProjectId(project.projectId))}
                  >
                    <span>
                      <strong>{project.title}</strong>
                      <em>{project.code}</em>
                    </span>
                    <span>
                      <span className={`status-pill ${project.status}`}>{statusLabels[project.status]}</span>
                    </span>
                    <span>{project.productName || "Pending"}</span>
                    <span>{project.materialIntent || "Pending"}</span>
                    <span>{project.fileRevision || "Pending"}</span>
                    <span>{project.dueDate || "Not set"}</span>
                    <span>{stationMap[project.assignedStationId ?? ""]?.stationName ?? "Unassigned"}</span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No projects yet"
                body="Use project intake to create your first manufacturing record. Once material and revision are present, the project can move into the print queue."
              />
            )}
          </div>

          <aside className="panel detail-panel">
            {selectedProject ? (
              <>
                <div className="panel-head">
                  <div>
                    <p className="section-kicker">Project detail</p>
                    <h3>{selectedProject.title}</h3>
                  </div>
                  <span className={`status-pill ${selectedProject.status}`}>{statusLabels[selectedProject.status]}</span>
                </div>

                <div className="detail-grid">
                  <Field
                    label="Project title"
                    value={selectedProject.title}
                    onChange={(value) => updateProjectField(selectedProject.projectId, "title", value)}
                    placeholder="Project title"
                  />
                  <Field
                    label="Project code"
                    value={selectedProject.code}
                    onChange={(value) => updateProjectField(selectedProject.projectId, "code", value)}
                    placeholder="PF-2401"
                  />
                  <Field
                    label="Product / part"
                    value={selectedProject.productName}
                    onChange={(value) => updateProjectField(selectedProject.projectId, "productName", value)}
                    placeholder="Jig base assembly"
                  />
                  <Field
                    label="Client"
                    value={selectedProject.clientName}
                    onChange={(value) => updateProjectField(selectedProject.projectId, "clientName", value)}
                    placeholder="Customer or internal team"
                  />
                  <Field
                    label="Material"
                    value={selectedProject.materialIntent}
                    onChange={(value) => updateProjectField(selectedProject.projectId, "materialIntent", value)}
                    placeholder="PETG-HS / ASA / Siraya Blu"
                  />
                  <Field
                    label="File revision"
                    value={selectedProject.fileRevision}
                    onChange={(value) => updateProjectField(selectedProject.projectId, "fileRevision", value)}
                    placeholder="r3 approved"
                  />
                  <Field
                    label="Due date"
                    type="date"
                    value={selectedProject.dueDate}
                    onChange={(value) => updateProjectField(selectedProject.projectId, "dueDate", value)}
                    placeholder=""
                  />
                  <Field
                    label="Quantity"
                    type="number"
                    value={String(selectedProject.quantity)}
                    onChange={(value) =>
                      updateProjectField(selectedProject.projectId, "quantity", Math.max(1, Number(value) || 1))
                    }
                    placeholder="1"
                  />
                  <SelectField
                    label="Priority"
                    value={selectedProject.priority}
                    onChange={(value) =>
                      updateProjectField(selectedProject.projectId, "priority", value as WorkProjectPriority)
                    }
                    options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))}
                  />
                  <SelectField
                    label="Assigned printer"
                    value={selectedProject.assignedStationId ?? ""}
                    onChange={(value) => {
                      if (!value) {
                        unassignProject(selectedProject.projectId);
                        return;
                      }
                      assignProjectToStation(selectedProject.projectId, value);
                    }}
                    options={[
                      { value: "", label: "Unassigned" },
                      ...stations.map((station) => ({
                        value: station.stationId,
                        label: `${station.stationName} · ${printerModelMap[station.printerModelId].brand} ${printerModelMap[station.printerModelId].model}`,
                      })),
                    ]}
                  />
                </div>

                <TextAreaField
                  label="Operator and engineering notes"
                  value={selectedProject.notes}
                  onChange={(value) => updateProjectField(selectedProject.projectId, "notes", value)}
                  placeholder="Print intent, support notes, finish requirements, tolerances"
                />

                <div className="detail-callout">
                  <strong>How products are managed</strong>
                  <p>
                    The project is the operational container. The product name inside the project is the printable part
                    definition, and every finished print can be traced back to its exact material, file revision, and
                    assigned printer station.
                  </p>
                </div>

                <div className="action-row">
                  <button className="secondary-button" onClick={() => openCreateRepository(selectedProject)}>
                    Create part record
                  </button>
                  {selectedProject.status === "intake" && selectedProject.materialIntent && selectedProject.fileRevision ? (
                    <button
                      className="secondary-button"
                      onClick={() => updateProjectField(selectedProject.projectId, "status", "ready")}
                    >
                      Mark ready
                    </button>
                  ) : null}
                  {selectedProject.status === "qa" ? (
                    <button className="primary-button" onClick={() => markProjectComplete(selectedProject.projectId)}>
                      Mark complete
                    </button>
                  ) : null}
                  {selectedProject.status === "complete" ? (
                    <button className="secondary-button" onClick={() => reopenProject(selectedProject.projectId)}>
                      Reopen project
                    </button>
                  ) : null}
                  {selectedProject.assignedStationId ? (
                    <button className="ghost-button" onClick={() => unassignProject(selectedProject.projectId)}>
                      Remove from printer
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <EmptyState
                title="Select a project"
                body="Project detail is where you control the product definition, material intent, revision, due date, and printer assignment."
              />
            )}
          </aside>
        </section>
      </div>
    );
  }

  function renderRepositoryView() {
    const repositoryHours = filteredRepositoryItems.reduce((sum, item) => sum + item.estimatedPrintHours, 0);
    const repositoryCost = filteredRepositoryItems.reduce((sum, item) => sum + item.estimatedCostUsd, 0);

    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <p className="section-kicker">Part repository</p>
            <h2>Build a digital inventory of qualified `.3mf` parts with the print data your team actually uses.</h2>
            <p className="section-copy">
              Inspired by part-identification workflows, this repository stores the part record itself alongside print
              time, material, cost, revision, and linked project context so your team can screen, qualify, and reuse
              parts instead of hunting through folders.
            </p>
          </div>
          <div className="header-actions">
            <button className="primary-button" onClick={() => openCreateRepository()}>
              New part record
            </button>
          </div>
        </section>

        <section className="metric-row">
          <MetricCard label="Part records" value={String(stats.repositoryCount)} tone="blue" />
          <MetricCard label="Approved parts" value={String(repositoryItems.filter((item) => item.status === "approved").length)} tone="green" />
          <MetricCard label="Catalog hours" value={repositoryHours.toFixed(1)} tone="purple" />
          <MetricCard label="Catalog cost" value={`$${repositoryCost.toFixed(0)}`} tone="amber" />
        </section>

        <section className="operations-grid">
          <div className="panel table-panel">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Qualified inventory</p>
                <h3>Part list</h3>
              </div>
              <div className="search-shell board-search">
                <label htmlFor="repository-search">Search repository</label>
                <input
                  id="repository-search"
                  className="field"
                  value={repositorySearch}
                  onChange={(event) => setRepositorySearch(event.target.value)}
                  placeholder="Part, file, material, revision, linked project"
                />
              </div>
            </div>

            {filteredRepositoryItems.length ? (
              <div className="project-table repository-table">
                <div className="table-head repository-head">
                  <span>Part</span>
                  <span>Status</span>
                  <span>File</span>
                  <span>Material</span>
                  <span>Time</span>
                  <span>Cost</span>
                  <span>Project</span>
                </div>
                {filteredRepositoryItems.map((item) => {
                  const linkedProject = projects.find((project) => project.projectId === item.linkedProjectId) ?? null;
                  return (
                    <button
                      key={item.itemId}
                      className={`table-row repository-row ${selectedRepositoryId === item.itemId ? "selected" : ""}`}
                      onClick={() => startTransition(() => setSelectedRepositoryId(item.itemId))}
                    >
                      <span>
                        <strong>{item.title}</strong>
                        <em>{item.productName || "Product not named"}</em>
                      </span>
                      <span>
                        <span className={`status-pill repository-${item.status}`}>{item.status}</span>
                      </span>
                      <span>{item.fileName}</span>
                      <span>{item.material || "Pending"}</span>
                      <span>{item.estimatedPrintHours.toFixed(1)} hr</span>
                      <span>${item.estimatedCostUsd.toFixed(2)}</span>
                      <span>{linkedProject ? `${linkedProject.code}` : "Unlinked"}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No part records yet"
                body="Create repository records for approved `.3mf` files so print time, cost, material, and revision stay visible and reusable."
              />
            )}
          </div>

          <aside className="panel detail-panel">
            {selectedRepositoryItem ? (
              <>
                <div className="panel-head">
                  <div>
                    <p className="section-kicker">Part detail</p>
                    <h3>{selectedRepositoryItem.title}</h3>
                  </div>
                  <span className={`status-pill repository-${selectedRepositoryItem.status}`}>
                    {selectedRepositoryItem.status}
                  </span>
                </div>

                <div className="detail-grid">
                  <Field
                    label="Part title"
                    value={selectedRepositoryItem.title}
                    onChange={(value) => updateRepositoryField(selectedRepositoryItem.itemId, "title", value)}
                    placeholder="Motor housing bracket"
                  />
                  <Field
                    label="Product / part"
                    value={selectedRepositoryItem.productName}
                    onChange={(value) => updateRepositoryField(selectedRepositoryItem.itemId, "productName", value)}
                    placeholder="Qualified printable part"
                  />
                  <Field
                    label="3MF file"
                    value={selectedRepositoryItem.fileName}
                    onChange={(value) => updateRepositoryField(selectedRepositoryItem.itemId, "fileName", value)}
                    placeholder="housing_bracket_r4.3mf"
                  />
                  <Field
                    label="Revision"
                    value={selectedRepositoryItem.fileRevision}
                    onChange={(value) => updateRepositoryField(selectedRepositoryItem.itemId, "fileRevision", value)}
                    placeholder="r4 approved"
                  />
                  <Field
                    label="Material"
                    value={selectedRepositoryItem.material}
                    onChange={(value) => updateRepositoryField(selectedRepositoryItem.itemId, "material", value)}
                    placeholder="PLA+, PETG-HS, ASA, Blu"
                  />
                  <Field
                    label="Est. print hours"
                    type="number"
                    value={String(selectedRepositoryItem.estimatedPrintHours)}
                    onChange={(value) =>
                      updateRepositoryField(
                        selectedRepositoryItem.itemId,
                        "estimatedPrintHours",
                        Math.max(0, Number(value) || 0),
                      )
                    }
                    placeholder="0"
                  />
                  <Field
                    label="Est. cost (USD)"
                    type="number"
                    value={String(selectedRepositoryItem.estimatedCostUsd)}
                    onChange={(value) =>
                      updateRepositoryField(
                        selectedRepositoryItem.itemId,
                        "estimatedCostUsd",
                        Math.max(0, Number(value) || 0),
                      )
                    }
                    placeholder="0"
                  />
                  <Field
                    label="Qty per run"
                    type="number"
                    value={String(selectedRepositoryItem.quantityPerRun)}
                    onChange={(value) =>
                      updateRepositoryField(
                        selectedRepositoryItem.itemId,
                        "quantityPerRun",
                        Math.max(1, Number(value) || 1),
                      )
                    }
                    placeholder="1"
                  />
                  <SelectField
                    label="Catalog status"
                    value={selectedRepositoryItem.status}
                    onChange={(value) =>
                      updateRepositoryField(
                        selectedRepositoryItem.itemId,
                        "status",
                        value as PartRepositoryItem["status"],
                      )
                    }
                    options={[
                      { value: "candidate", label: "Candidate" },
                      { value: "qualified", label: "Qualified" },
                      { value: "approved", label: "Approved" },
                    ]}
                  />
                  <SelectField
                    label="Linked project"
                    value={selectedRepositoryItem.linkedProjectId ?? ""}
                    onChange={(value) =>
                      updateRepositoryField(selectedRepositoryItem.itemId, "linkedProjectId", value || null)
                    }
                    options={[
                      { value: "", label: "Unlinked" },
                      ...projects.map((project) => ({
                        value: project.projectId,
                        label: `${project.code} · ${project.title}`,
                      })),
                    ]}
                  />
                </div>

                <TextAreaField
                  label="Part notes"
                  value={selectedRepositoryItem.notes}
                  onChange={(value) => updateRepositoryField(selectedRepositoryItem.itemId, "notes", value)}
                  placeholder="Orientation, post-processing, cost assumptions, preferred printers, quality notes"
                />

                <div className="detail-callout">
                  <strong>Repository intent</strong>
                  <p>
                    This is the digital part inventory layer. Projects track active engineering work, while the
                    repository preserves reusable, screened, and approved print definitions with cost and timing
                    metadata for future production.
                  </p>
                </div>
              </>
            ) : (
              <EmptyState
                title="Select a part record"
                body="Choose a repository item to manage its 3MF filename, revision, print hours, cost, material, and linked project."
              />
            )}
          </aside>
        </section>
      </div>
    );
  }

  function renderWarehouseView() {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <p className="section-kicker">Print warehouse</p>
            <h2>Build a digital floor map of your installed printers and assign live projects to each station.</h2>
            <p className="section-copy">
              Zones represent parts of the room. Stations represent real installed machines. Each station can carry an
              active build plus a waiting queue, so everyone sees what is printing and what is next.
            </p>
          </div>
          <div className="header-actions">
            <button className="secondary-button" onClick={() => setShowCreateZone(true)}>
              Create zone
            </button>
            <button className="primary-button" onClick={() => setShowCreateStation(true)}>
              Add station
            </button>
          </div>
        </section>

        <div className="warehouse-layout">
          <div className="panel warehouse-map-panel">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Floor map</p>
                <h3>Zones and printers</h3>
              </div>
              <div className="search-shell">
                <label htmlFor="warehouse-search">Search warehouse</label>
                <input
                  id="warehouse-search"
                  className="field"
                  value={warehouseSearch}
                  onChange={(event) => setWarehouseSearch(event.target.value)}
                  placeholder="Zone, station, printer model"
                />
              </div>
            </div>

            {filteredZones.length ? (
              <div className="zone-stack">
                {filteredZones.map((zone) => {
                  const zoneStations = stations.filter((station) => station.zoneId === zone.zoneId);
                  return (
                    <section key={zone.zoneId} className="zone-card">
                      <div className="zone-card-head">
                        <div>
                          <p className="section-kicker">{zone.workcenterName}</p>
                          <h3>{zone.zoneName}</h3>
                          <p>{zone.description || "No zone description yet."}</p>
                        </div>
                        <div className="zone-actions">
                          <button className="ghost-button" onClick={() => openCreateStation(undefined, zone.zoneId)}>
                            Add station
                          </button>
                          <button className="text-danger" onClick={() => deleteZone(zone.zoneId)}>
                            Delete zone
                          </button>
                        </div>
                      </div>

                      {zoneStations.length ? (
                        <div className="station-grid">
                          {zoneStations.map((station) => {
                            const printer = printerModelMap[station.printerModelId];
                            const activity = warehouseActivity(station);
                            const queue = queues[station.stationId] ?? { activeProjectId: null, queuedProjectIds: [] };
                            const activeProject = queue.activeProjectId
                              ? projects.find((project) => project.projectId === queue.activeProjectId) ?? null
                              : null;

                            return (
                              <button
                                key={station.stationId}
                                className={`station-tile ${selectedStationId === station.stationId ? "selected" : ""}`}
                                onClick={() => startTransition(() => setSelectedStationId(station.stationId))}
                              >
                                <div className="station-tile-top">
                                  <PrinterIcon printer={printer} />
                                  <span className={`status-pill ${activity.tone}`}>{activity.label}</span>
                                </div>
                                <strong>{station.stationName}</strong>
                                <span className="station-caption">
                                  {station.machineNickname} · {station.bayLabel || "Bay not set"}
                                </span>
                                <span className="station-caption">
                                  {printer.brand} {printer.model}
                                </span>
                                <div className="station-summary">
                                  <div>
                                    <span>Active</span>
                                    <strong>{activeProject?.code ?? "None"}</strong>
                                  </div>
                                  <div>
                                    <span>Queued</span>
                                    <strong>{queue.queuedProjectIds.length}</strong>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <EmptyState
                          title="No stations in this zone"
                          body="Add a printer station to start mapping the real floor."
                          compact
                        />
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No zones yet"
                body="Create your first zone so the print warehouse can mirror the physical layout of the room."
              />
            )}
          </div>

          <aside className="panel station-detail-panel">
            {selectedStation ? (
              <>
                <div className="panel-head">
                  <div>
                    <p className="section-kicker">Station detail</p>
                    <h3>{selectedStation.stationName}</h3>
                  </div>
                  <span className={`status-pill ${warehouseActivity(selectedStation).tone}`}>
                    {warehouseActivity(selectedStation).label}
                  </span>
                </div>

                <div className="station-hero">
                  <PrinterIcon printer={printerModelMap[selectedStation.printerModelId]} className="large" />
                  <div>
                    <h4>
                      {printerModelMap[selectedStation.printerModelId].brand}{" "}
                      {printerModelMap[selectedStation.printerModelId].model}
                    </h4>
                    <p>
                      {selectedStation.machineNickname} · {selectedStation.bayLabel || "Bay not set"}
                    </p>
                  </div>
                </div>

                <div className="detail-grid">
                  <Field
                    label="Station name"
                    value={selectedStation.stationName}
                    onChange={(value) => updateStationField(selectedStation.stationId, "stationName", value)}
                    placeholder="Station 04"
                  />
                  <Field
                    label="Machine nickname"
                    value={selectedStation.machineNickname}
                    onChange={(value) => updateStationField(selectedStation.stationId, "machineNickname", value)}
                    placeholder="X1C East"
                  />
                  <Field
                    label="Bay label"
                    value={selectedStation.bayLabel}
                    onChange={(value) => updateStationField(selectedStation.stationId, "bayLabel", value)}
                    placeholder="Bay 04"
                  />
                  <SelectField
                    label="Station health"
                    value={selectedStation.stationHealth}
                    onChange={(value) =>
                      updateStationField(
                        selectedStation.stationId,
                        "stationHealth",
                        value as WorkcenterStation["stationHealth"],
                      )
                    }
                    options={[
                      { value: "ready", label: "Ready" },
                      { value: "maintenance", label: "Maintenance" },
                      { value: "offline", label: "Offline" },
                    ]}
                  />
                </div>

                <TextAreaField
                  label="Station notes"
                  value={selectedStation.notes}
                  onChange={(value) => updateStationField(selectedStation.stationId, "notes", value)}
                  placeholder="Nozzle size, approved materials, maintenance caveats, location notes"
                />

                <div className="queue-shell">
                  <div className="queue-head">
                    <div>
                      <p className="section-kicker">Print queue</p>
                      <h4>Active build and next-up sequence</h4>
                    </div>
                    <SelectField
                      label="Assign ready project"
                      compact
                      value=""
                      onChange={(value) => {
                        if (value) {
                          assignProjectToStation(value, selectedStation.stationId);
                        }
                      }}
                      options={[
                        { value: "", label: "Select a project" },
                        ...assignableProjects
                          .filter((project) => project.assignedStationId !== selectedStation.stationId)
                          .map((project) => ({
                            value: project.projectId,
                            label: `${project.code} · ${project.title}`,
                          })),
                      ]}
                    />
                  </div>

                  <div className="queue-active-card">
                    <span className="queue-label">Active</span>
                    {selectedStationQueue?.activeProjectId ? (
                      (() => {
                        const activeProject =
                          projects.find((project) => project.projectId === selectedStationQueue.activeProjectId) ?? null;
                        if (!activeProject) {
                          return <p>Missing active project record.</p>;
                        }

                        return (
                          <>
                            <strong>{activeProject.code}</strong>
                            <p>{activeProject.title}</p>
                            <div className="queue-actions">
                              <button
                                className="secondary-button"
                                onClick={() => sendActiveToQa(selectedStation.stationId)}
                              >
                                Send to QA
                              </button>
                              <button className="ghost-button" onClick={() => markProjectComplete(activeProject.projectId)}>
                                Mark complete
                              </button>
                            </div>
                          </>
                        );
                      })()
                    ) : (
                      <p>No project is currently printing on this station.</p>
                    )}
                  </div>

                  <div className="queue-list">
                    {selectedStationQueue?.queuedProjectIds.length ? (
                      selectedStationQueue.queuedProjectIds.map((projectId, index) => {
                        const project = projects.find((candidate) => candidate.projectId === projectId);
                        if (!project) {
                          return null;
                        }

                        return (
                          <div key={project.projectId} className="queue-row">
                            <div>
                              <strong>{project.code}</strong>
                              <p>{project.title}</p>
                            </div>
                            <div className="queue-row-actions">
                              <button
                                className="ghost-icon-button"
                                onClick={() => moveQueuedProject(selectedStation.stationId, project.projectId, -1)}
                                disabled={index === 0}
                                aria-label="Move project up"
                              >
                                ↑
                              </button>
                              <button
                                className="ghost-icon-button"
                                onClick={() => moveQueuedProject(selectedStation.stationId, project.projectId, 1)}
                                disabled={index === selectedStationQueue.queuedProjectIds.length - 1}
                                aria-label="Move project down"
                              >
                                ↓
                              </button>
                              <button
                                className="secondary-button"
                                onClick={() => startQueuedProject(selectedStation.stationId, project.projectId)}
                              >
                                Start
                              </button>
                              <button className="ghost-button" onClick={() => unassignProject(project.projectId)}>
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-lane">No queued projects for this station.</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <EmptyState
                title="Select a station"
                body="Choose a printer tile to manage its health, local notes, and project queue."
              />
            )}
          </aside>
        </div>
      </div>
    );
  }

  function renderFleetView() {
    return (
      <div className="page-stack">
        <section className="page-header">
          <div>
            <p className="section-kicker">Approved hardware</p>
            <h2>Printer models that can be instantiated as real stations on the warehouse floor.</h2>
          </div>
          <div className="search-shell">
            <label htmlFor="fleet-search">Search models</label>
            <input
              id="fleet-search"
              className="field"
              value={fleetSearch}
              onChange={(event) => setFleetSearch(event.target.value)}
              placeholder="Brand, model, technology, capability"
            />
          </div>
        </section>

        <section className="fleet-grid">
          {filteredFleet.map((printer) => (
            <article key={printer.modelId} className="panel fleet-card">
              <div className="fleet-card-top">
                <PrinterIcon printer={printer} className="large" />
                <span className={`status-pill ${printer.printerType}`}>{printer.technology}</span>
              </div>
              <div className="fleet-copy">
                <p className="section-kicker">{printer.brand}</p>
                <h3>{printer.model}</h3>
                <p>{printer.buildVolume.join(" x ")} mm build volume</p>
              </div>
              <div className="tag-list">
                {printer.capabilityFlags.map((flag) => (
                  <span key={flag} className="tag">
                    {flag}
                  </span>
                ))}
              </div>
              <button className="primary-button stretch" onClick={() => openCreateStation(printer.modelId)}>
                Create station from this model
              </button>
            </article>
          ))}
        </section>
      </div>
    );
  }

  function renderSpecsView() {
    return (
      <div className="spec-layout">
        <aside className="panel spec-rail">
          <p className="section-kicker">Source package</p>
          <h2>Spec vault</h2>
          <div className="spec-list">
            {specDocuments.map((spec) => (
              <button
                key={spec.id}
                className={`spec-link ${spec.id === selectedSpec.id ? "active" : ""}`}
                onClick={() => setSelectedSpecId(spec.id)}
              >
                <strong>{spec.title}</strong>
                <span>{spec.filename}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="panel spec-panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">{selectedSpec.docType}</p>
              <h2>{selectedSpec.title}</h2>
            </div>
            <span className="spec-file">{selectedSpec.filename}</span>
          </div>
          <pre className="code-block">{selectedSpec.raw}</pre>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <p className="section-kicker">Vault Core</p>
          <h1>PrintForge</h1>
          <p>
            Project management for additive manufacturing teams, with product definition, print-floor mapping, and live
            printer assignment in one place.
          </p>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? "active" : ""}`}
              onClick={() => setActiveView(item.id)}
            >
              <strong>{item.label}</strong>
              <span>{item.caption}</span>
            </button>
          ))}
        </nav>

        <div className="operator-card">
          <label htmlFor="operator-select">Active teammate</label>
          <select
            id="operator-select"
            className="field"
            value={currentUserId}
            onChange={(event) => setCurrentUserId(event.target.value)}
          >
            {seedUsers.map((user) => (
              <option key={user.uid} value={user.uid}>
                {user.displayName} · {roleLabels[user.role]}
              </option>
            ))}
          </select>
          <p>
            Logged in as <strong>{currentUser.displayName}</strong>
          </p>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-topbar">
          <div>
            <p className="section-kicker">Current workspace</p>
            <h2>{navItems.find((item) => item.id === activeView)?.label}</h2>
          </div>
          <div className="topbar-badges">
            <span className="topbar-badge">No seeded projects</span>
            <span className="topbar-badge">Digital part repository</span>
            <span className="topbar-badge">Real fleet catalog</span>
            <span className="topbar-badge">Station-based scheduling</span>
          </div>
        </header>

        {activeView === "projects" ? renderProjectsView() : null}
        {activeView === "repository" ? renderRepositoryView() : null}
        {activeView === "warehouse" ? renderWarehouseView() : null}
        {activeView === "fleet" ? renderFleetView() : null}
        {activeView === "specs" ? renderSpecsView() : null}
      </main>

      {showCreateZone ? (
        <ModalShell onClose={() => setShowCreateZone(false)}>
          <div className="modal-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">Create zone</p>
                <h3>Add a production area to the warehouse map.</h3>
              </div>
              <button className="ghost-button" onClick={() => setShowCreateZone(false)}>
                Close
              </button>
            </div>

            <form className="form-stack" onSubmit={createZone}>
              <div className="detail-grid">
                <Field
                  label="Workcenter"
                  value={zoneForm.workcenterName}
                  onChange={(value) => setZoneForm((current) => ({ ...current, workcenterName: value }))}
                  placeholder="North Production Floor"
                />
                <Field
                  label="Zone"
                  value={zoneForm.zoneName}
                  onChange={(value) => setZoneForm((current) => ({ ...current, zoneName: value }))}
                  placeholder="Prototype Row"
                />
              </div>
              <TextAreaField
                label="Description"
                value={zoneForm.description}
                onChange={(value) => setZoneForm((current) => ({ ...current, description: value }))}
                placeholder="What this area is used for, staffing notes, environmental notes"
              />
              <div className="action-row">
                <button type="button" className="ghost-button" onClick={() => setShowCreateZone(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Create zone
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      ) : null}

      {showCreateProject ? (
        <ModalShell onClose={() => setShowCreateProject(false)}>
          <div className="modal-card wide">
            <div className="panel-head">
              <div>
                <p className="section-kicker">New project</p>
                <h3>Create a manufacturing project and its product definition.</h3>
              </div>
              <button className="ghost-button" onClick={() => setShowCreateProject(false)}>
                Close
              </button>
            </div>

            <form className="form-stack" onSubmit={createProject}>
              <div className="detail-grid">
                <Field
                  label="Project title"
                  value={projectForm.title}
                  onChange={(value) => setProjectForm((current) => ({ ...current, title: value }))}
                  placeholder="Panel alignment jig"
                />
                <Field
                  label="Project code"
                  value={projectForm.code}
                  onChange={(value) => setProjectForm((current) => ({ ...current, code: value }))}
                  placeholder="PF-2401"
                />
                <Field
                  label="Product / part"
                  value={projectForm.productName}
                  onChange={(value) => setProjectForm((current) => ({ ...current, productName: value }))}
                  placeholder="Jig base assembly"
                />
                <Field
                  label="Client"
                  value={projectForm.clientName}
                  onChange={(value) => setProjectForm((current) => ({ ...current, clientName: value }))}
                  placeholder="Customer or internal team"
                />
                <Field
                  label="Material intent"
                  value={projectForm.materialIntent}
                  onChange={(value) => setProjectForm((current) => ({ ...current, materialIntent: value }))}
                  placeholder="PETG-HS / ASA / TPU 95A"
                />
                <Field
                  label="File revision"
                  value={projectForm.fileRevision}
                  onChange={(value) => setProjectForm((current) => ({ ...current, fileRevision: value }))}
                  placeholder="r2 approved"
                />
                <Field
                  label="Quantity"
                  type="number"
                  value={projectForm.quantity}
                  onChange={(value) => setProjectForm((current) => ({ ...current, quantity: value }))}
                  placeholder="1"
                />
                <Field
                  label="Due date"
                  type="date"
                  value={projectForm.dueDate}
                  onChange={(value) => setProjectForm((current) => ({ ...current, dueDate: value }))}
                  placeholder=""
                />
                <SelectField
                  label="Priority"
                  value={projectForm.priority}
                  onChange={(value) =>
                    setProjectForm((current) => ({ ...current, priority: value as WorkProjectPriority }))
                  }
                  options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))}
                />
              </div>
              <TextAreaField
                label="Notes"
                value={projectForm.notes}
                onChange={(value) => setProjectForm((current) => ({ ...current, notes: value }))}
                placeholder="Support strategy, post-processing, tolerance concerns, client context"
              />
              <div className="detail-callout">
                Projects without both material and file revision start in intake. Once those are present, the project is
                immediately ready for printer assignment.
              </div>
              <div className="action-row">
                <button type="button" className="ghost-button" onClick={() => setShowCreateProject(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Create project
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      ) : null}

      {showCreateRepository ? (
        <ModalShell onClose={() => setShowCreateRepository(false)}>
          <div className="modal-card wide">
            <div className="panel-head">
              <div>
                <p className="section-kicker">New part record</p>
                <h3>Create a reusable repository item for a `.3mf` print file.</h3>
              </div>
              <button className="ghost-button" onClick={() => setShowCreateRepository(false)}>
                Close
              </button>
            </div>

            <form className="form-stack" onSubmit={createRepositoryItem}>
              <div className="detail-grid">
                <Field
                  label="Record title"
                  value={repositoryForm.title}
                  onChange={(value) => setRepositoryForm((current) => ({ ...current, title: value }))}
                  placeholder="Motor housing bracket"
                />
                <Field
                  label="Product / part"
                  value={repositoryForm.productName}
                  onChange={(value) => setRepositoryForm((current) => ({ ...current, productName: value }))}
                  placeholder="Printable part name"
                />
                <Field
                  label="3MF filename"
                  value={repositoryForm.fileName}
                  onChange={(value) => setRepositoryForm((current) => ({ ...current, fileName: value }))}
                  placeholder="housing_bracket_r4.3mf"
                />
                <div className="field-wrap">
                  <label htmlFor="repository-file-upload">Attach `.3mf` file</label>
                  <input
                    id="repository-file-upload"
                    className="field"
                    type="file"
                    accept=".3mf"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      setRepositoryForm((current) => ({
                        ...current,
                        fileName: file.name,
                      }));
                    }}
                  />
                </div>
                <Field
                  label="Revision"
                  value={repositoryForm.fileRevision}
                  onChange={(value) => setRepositoryForm((current) => ({ ...current, fileRevision: value }))}
                  placeholder="r4 approved"
                />
                <Field
                  label="Material"
                  value={repositoryForm.material}
                  onChange={(value) => setRepositoryForm((current) => ({ ...current, material: value }))}
                  placeholder="PLA+, PETG-HS, ASA, Blu"
                />
                <Field
                  label="Est. print hours"
                  type="number"
                  value={repositoryForm.estimatedPrintHours}
                  onChange={(value) => setRepositoryForm((current) => ({ ...current, estimatedPrintHours: value }))}
                  placeholder="0"
                />
                <Field
                  label="Est. cost (USD)"
                  type="number"
                  value={repositoryForm.estimatedCostUsd}
                  onChange={(value) => setRepositoryForm((current) => ({ ...current, estimatedCostUsd: value }))}
                  placeholder="0"
                />
                <Field
                  label="Qty per run"
                  type="number"
                  value={repositoryForm.quantityPerRun}
                  onChange={(value) => setRepositoryForm((current) => ({ ...current, quantityPerRun: value }))}
                  placeholder="1"
                />
                <SelectField
                  label="Catalog status"
                  value={repositoryForm.status}
                  onChange={(value) =>
                    setRepositoryForm((current) => ({
                      ...current,
                      status: value as PartRepositoryItem["status"],
                    }))
                  }
                  options={[
                    { value: "candidate", label: "Candidate" },
                    { value: "qualified", label: "Qualified" },
                    { value: "approved", label: "Approved" },
                  ]}
                />
                <SelectField
                  label="Linked project"
                  value={repositoryForm.linkedProjectId}
                  onChange={(value) => setRepositoryForm((current) => ({ ...current, linkedProjectId: value }))}
                  options={[
                    { value: "", label: "Unlinked" },
                    ...projects.map((project) => ({
                      value: project.projectId,
                      label: `${project.code} · ${project.title}`,
                    })),
                  ]}
                />
              </div>
              <TextAreaField
                label="Notes"
                value={repositoryForm.notes}
                onChange={(value) => setRepositoryForm((current) => ({ ...current, notes: value }))}
                placeholder="Qualification notes, orientation, support strategy, preferred printers, cost assumptions"
              />
              <div className="detail-callout">
                This repository stores the reusable print definition, while projects continue to track the active work,
                ownership, scheduling, and floor execution. The current prototype stores file metadata and selected file
                names locally; Firebase Storage can become the binary source of truth next.
              </div>
              <div className="action-row">
                <button type="button" className="ghost-button" onClick={() => setShowCreateRepository(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Create part record
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      ) : null}

      {showCreateStation ? (
        <ModalShell onClose={() => setShowCreateStation(false)} align="right">
          <div className="drawer-card">
            <div className="panel-head">
              <div>
                <p className="section-kicker">New station</p>
                <h3>Instantiate a real printer on the warehouse floor.</h3>
              </div>
              <button className="ghost-button" onClick={() => setShowCreateStation(false)}>
                Close
              </button>
            </div>

            <div className="drawer-layout">
              <form className="form-stack" onSubmit={createStation}>
                <div className="detail-grid">
                  <Field
                    label="Station name"
                    value={stationForm.stationName}
                    onChange={(value) => setStationForm((current) => ({ ...current, stationName: value }))}
                    placeholder="Station 04"
                  />
                  <SelectField
                    label="Zone"
                    value={stationForm.zoneId}
                    onChange={(value) => setStationForm((current) => ({ ...current, zoneId: value }))}
                    options={[
                      { value: "", label: "Select zone" },
                      ...zones.map((zone) => ({
                        value: zone.zoneId,
                        label: `${zone.workcenterName} · ${zone.zoneName}`,
                      })),
                    ]}
                  />
                  <SelectField
                    label="Printer model"
                    value={stationForm.printerModelId}
                    onChange={(value) => setStationForm((current) => ({ ...current, printerModelId: value }))}
                    options={printerCatalog.map((printer) => ({
                      value: printer.modelId,
                      label: `${printer.brand} ${printer.model}`,
                    }))}
                  />
                  <Field
                    label="Machine nickname"
                    value={stationForm.machineNickname}
                    onChange={(value) => setStationForm((current) => ({ ...current, machineNickname: value }))}
                    placeholder="X1C East"
                  />
                  <Field
                    label="Bay label"
                    value={stationForm.bayLabel}
                    onChange={(value) => setStationForm((current) => ({ ...current, bayLabel: value }))}
                    placeholder="Bay 04"
                  />
                  <SelectField
                    label="Health"
                    value={stationForm.stationHealth}
                    onChange={(value) =>
                      setStationForm((current) => ({
                        ...current,
                        stationHealth: value as WorkcenterStation["stationHealth"],
                      }))
                    }
                    options={[
                      { value: "ready", label: "Ready" },
                      { value: "maintenance", label: "Maintenance" },
                      { value: "offline", label: "Offline" },
                    ]}
                  />
                </div>
                <TextAreaField
                  label="Station notes"
                  value={stationForm.notes}
                  onChange={(value) => setStationForm((current) => ({ ...current, notes: value }))}
                  placeholder="Location notes, materials allowed, nozzle size, maintenance status"
                />
                <div className="action-row">
                  <button type="button" className="ghost-button" onClick={() => setShowCreateStation(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    Create station
                  </button>
                </div>
              </form>

              <aside className="drawer-preview">
                <p className="section-kicker">Station preview</p>
                <div className="preview-card">
                  <PrinterIcon printer={printerModelMap[stationForm.printerModelId]} className="large" />
                  <strong>{stationForm.stationName || "Station name"}</strong>
                  <span>
                    {stationForm.machineNickname || printerModelMap[stationForm.printerModelId].model} ·{" "}
                    {stationForm.bayLabel || "Bay not set"}
                  </span>
                  <span>
                    {printerModelMap[stationForm.printerModelId].brand}{" "}
                    {printerModelMap[stationForm.printerModelId].model}
                  </span>
                </div>
                <div className="tag-list">
                  {printerModelMap[stationForm.printerModelId].capabilityFlags.map((flag) => (
                    <span key={flag} className="tag">
                      {flag}
                    </span>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function persistState(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: "blue" | "green" | "purple" | "amber" }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function EmptyState({ title, body, compact = false }: { title: string; body: string; compact?: boolean }) {
  return (
    <div className={`empty-state ${compact ? "compact" : ""}`}>
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "date" | "number";
}) {
  return (
    <div className="field-wrap">
      <label>{label}</label>
      <input className="field" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  compact?: boolean;
}) {
  return (
    <div className={`field-wrap ${compact ? "compact" : ""}`}>
      <label>{label}</label>
      <select className="field" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="field-wrap">
      <label>{label}</label>
      <textarea className="field textarea" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ModalShell({
  children,
  onClose,
  align = "center",
}: {
  children: ReactNode;
  onClose: () => void;
  align?: "center" | "right";
}) {
  return (
    <div className={`modal-shell ${align}`} onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()}>{children}</div>
    </div>
  );
}

export default App;
