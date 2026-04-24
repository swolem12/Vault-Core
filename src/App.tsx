import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { printerCatalog, seedUsers } from "./mockData";
import { specDocuments } from "./specDocuments";
import type {
  AppView,
  Role,
  SpecDocument,
  StationQueueState,
  WorkProject,
  WorkProjectStatus,
  WorkcenterStation,
  WorkcenterZone,
} from "./types";

const navItems: { id: AppView; label: string; hint: string }[] = [
  { id: "workcenter", label: "Workcenter", hint: "Zones, stations, queue" },
  { id: "fleet", label: "Fleet Library", hint: "Approved printer models" },
  { id: "specs", label: "Spec Vault", hint: "Source architecture" },
];

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  engineering_lead: "Engineering Lead",
  engineer: "Engineer",
  operator: "Operator",
  viewer: "Viewer",
};

const storageKeys = {
  zones: "vault-core.zones.v2",
  stations: "vault-core.stations.v2",
  projects: "vault-core.projects.v2",
  queues: "vault-core.queues.v2",
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
};

const initialProjectForm = {
  title: "",
  code: "",
  productName: "",
  materialIntent: "",
  fileRevision: "",
};

type DragState = {
  projectId: string;
  sourceStationId: string | null;
  sourceLane: "backlog" | "queue";
};

function App() {
  const [activeView, setActiveView] = useState<AppView>("workcenter");
  const [currentUserId, setCurrentUserId] = useState(seedUsers[0]?.uid ?? "");
  const [zones, setZones] = useState<WorkcenterZone[]>([]);
  const [stations, setStations] = useState<WorkcenterStation[]>([]);
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [queues, setQueues] = useState<Record<string, StationQueueState>>({});
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [selectedStationId, setSelectedStationId] = useState("");
  const [selectedSpecId, setSelectedSpecId] = useState(specDocuments[0]?.id ?? "");
  const [showCreateZone, setShowCreateZone] = useState(false);
  const [showCreateStation, setShowCreateStation] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [zoneForm, setZoneForm] = useState(initialZoneForm);
  const [stationForm, setStationForm] = useState(initialStationForm);
  const [projectForm, setProjectForm] = useState(initialProjectForm);
  const [stationSearch, setStationSearch] = useState("");
  const [fleetSearch, setFleetSearch] = useState("");
  const [fleetSpotlightIndex, setFleetSpotlightIndex] = useState(0);
  const [dragState, setDragState] = useState<DragState | null>(null);

  const currentUser = seedUsers.find((user) => user.uid === currentUserId) ?? seedUsers[0];
  const selectedSpec = specDocuments.find((doc) => doc.id === selectedSpecId) ?? specDocuments[0];

  const printerModelMap = useMemo(
    () => Object.fromEntries(printerCatalog.map((printer) => [printer.modelId, printer])),
    [],
  );
  const zoneMap = useMemo(() => Object.fromEntries(zones.map((zone) => [zone.zoneId, zone])), [zones]);
  const stationMap = useMemo(() => Object.fromEntries(stations.map((station) => [station.stationId, station])), [stations]);
  const projectMap = useMemo(() => Object.fromEntries(projects.map((project) => [project.projectId, project])), [projects]);

  const selectedStation = stations.find((station) => station.stationId === selectedStationId) ?? null;
  const selectedStationQueue = selectedStation ? queues[selectedStation.stationId] ?? { activeProjectId: null, queuedProjectIds: [] } : null;
  const selectedStationPrinter = selectedStation ? printerModelMap[selectedStation.printerModelId] : null;
  const stationPreviewPrinter = printerModelMap[stationForm.printerModelId] ?? printerCatalog[0];
  const spotlightPrinter = printerCatalog[fleetSpotlightIndex] ?? printerCatalog[0];

  const filteredStations = useMemo(() => {
    const query = stationSearch.trim().toLowerCase();
    return stations.filter((station) => {
      const printer = printerModelMap[station.printerModelId];
      const inZone = !selectedZoneId || station.zoneId === selectedZoneId;
      const matchesSearch =
        !query ||
        [station.stationName, station.machineNickname, station.bayLabel, zoneMap[station.zoneId]?.zoneName, printer?.brand, printer?.model]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      return inZone && matchesSearch;
    });
  }, [printerModelMap, selectedZoneId, stationSearch, stations, zoneMap]);

  const filteredFleet = useMemo(() => {
    const query = fleetSearch.trim().toLowerCase();
    if (!query) {
      return printerCatalog;
    }

    return printerCatalog.filter((printer) =>
      [printer.brand, printer.model, printer.printerType, printer.technology, ...printer.capabilityFlags]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [fleetSearch]);

  const backlogProjects = useMemo(
    () => projects.filter((project) => project.queueStationId === null && project.status !== "complete"),
    [projects],
  );

  const draftProjects = backlogProjects.filter((project) => project.status === "draft");
  const readyProjects = backlogProjects.filter((project) => project.status === "ready");

  const workcenterMetrics = useMemo(
    () => ({
      zones: zones.length,
      stations: stations.length,
      readyProjects: readyProjects.length,
      activeBuilds: Object.values(queues).filter((queue) => queue.activeProjectId).length,
    }),
    [queues, readyProjects.length, stations.length, zones.length],
  );

  useEffect(() => {
    setZones(loadState(storageKeys.zones, []));
    setStations(loadState(storageKeys.stations, []));
    setProjects(loadState(storageKeys.projects, []));
    setQueues(loadState(storageKeys.queues, {}));
  }, []);

  useEffect(() => persistState(storageKeys.zones, zones), [zones]);
  useEffect(() => persistState(storageKeys.stations, stations), [stations]);
  useEffect(() => persistState(storageKeys.projects, projects), [projects]);
  useEffect(() => persistState(storageKeys.queues, queues), [queues]);

  useEffect(() => {
    if (!selectedZoneId && zones[0]) {
      setSelectedZoneId(zones[0].zoneId);
      return;
    }

    if (selectedZoneId && !zones.some((zone) => zone.zoneId === selectedZoneId)) {
      setSelectedZoneId(zones[0]?.zoneId ?? "");
    }
  }, [selectedZoneId, zones]);

  useEffect(() => {
    if (selectedStationId && !stations.some((station) => station.stationId === selectedStationId)) {
      setSelectedStationId("");
      return;
    }

    if (!selectedStationId && filteredStations[0]) {
      setSelectedStationId(filteredStations[0].stationId);
    }
  }, [filteredStations, selectedStationId, stations]);

  function cycleSpotlight(direction: "next" | "prev") {
    setFleetSpotlightIndex((current) => {
      const next = direction === "next" ? current + 1 : current - 1;
      return (next + printerCatalog.length) % printerCatalog.length;
    });
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

    setZones((current) => [...current, newZone]);
    setSelectedZoneId(newZone.zoneId);
    setZoneForm(initialZoneForm);
    setShowCreateZone(false);
    setStationForm((current) => ({ ...current, zoneId: newZone.zoneId }));
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
      createdAt: new Date().toISOString(),
      createdByUid: currentUser.uid,
    };

    setStations((current) => [newStation, ...current]);
    setQueues((current) => ({
      ...current,
      [newStation.stationId]: { activeProjectId: null, queuedProjectIds: [] },
    }));
    setSelectedStationId(newStation.stationId);
    setShowCreateStation(false);
    setStationForm({ ...initialStationForm, zoneId: stationForm.zoneId });
  }

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectForm.title.trim() || !projectForm.code.trim()) {
      return;
    }

    const status: WorkProjectStatus =
      projectForm.materialIntent.trim() && projectForm.fileRevision.trim() ? "ready" : "draft";

    const newProject: WorkProject = {
      projectId: `project_${Date.now()}`,
      title: projectForm.title.trim(),
      code: projectForm.code.trim(),
      productName: projectForm.productName.trim(),
      materialIntent: projectForm.materialIntent.trim(),
      fileRevision: projectForm.fileRevision.trim(),
      status,
      ownerUid: currentUser.uid,
      createdAt: new Date().toISOString(),
      queueStationId: null,
    };

    setProjects((current) => [newProject, ...current]);
    setProjectForm(initialProjectForm);
    setShowCreateProject(false);
  }

  function updateStationField<K extends keyof WorkcenterStation>(stationId: string, field: K, value: WorkcenterStation[K]) {
    setStations((current) =>
      current.map((station) => (station.stationId === stationId ? { ...station, [field]: value } : station)),
    );
  }

  function deleteZone(zoneId: string) {
    const stationIdsInZone = stations.filter((station) => station.zoneId === zoneId).map((station) => station.stationId);

    setZones((current) => current.filter((zone) => zone.zoneId !== zoneId));
    setStations((current) => current.filter((station) => station.zoneId !== zoneId));
    setQueues((current) => {
      const next = { ...current };
      for (const stationId of stationIdsInZone) {
        delete next[stationId];
      }
      return next;
    });
    setProjects((current) =>
      current.map((project) =>
        project.queueStationId && stationIdsInZone.includes(project.queueStationId)
          ? { ...project, queueStationId: null, status: project.status === "complete" ? "complete" : "ready" }
          : project,
      ),
    );
  }

  function deleteStation(stationId: string) {
    const queue = queues[stationId];
    const affectedProjectIds = unique([
      queue?.activeProjectId ?? undefined,
      ...(queue?.queuedProjectIds ?? []),
    ]).filter(Boolean) as string[];

    setStations((current) => current.filter((station) => station.stationId !== stationId));
    setQueues((current) => {
      const next = { ...current };
      delete next[stationId];
      return next;
    });
    setProjects((current) =>
      current.map((project) =>
        affectedProjectIds.includes(project.projectId)
          ? { ...project, queueStationId: null, status: project.status === "complete" ? "complete" : "ready" }
          : project,
      ),
    );
  }

  function assignProjectToStation(stationId: string, projectId: string, targetIndex?: number) {
    setQueues((current) => {
      const next = structuredClone(current);

      for (const [candidateStationId, queue] of Object.entries(next)) {
        if (queue.activeProjectId === projectId) {
          queue.activeProjectId = null;
        }
        queue.queuedProjectIds = queue.queuedProjectIds.filter((queuedId) => queuedId !== projectId);
        next[candidateStationId] = queue;
      }

      const stationQueue = next[stationId] ?? { activeProjectId: null, queuedProjectIds: [] };
      const insertionIndex =
        typeof targetIndex === "number"
          ? Math.max(0, Math.min(targetIndex, stationQueue.queuedProjectIds.length))
          : stationQueue.queuedProjectIds.length;

      stationQueue.queuedProjectIds.splice(insertionIndex, 0, projectId);
      next[stationId] = stationQueue;
      return next;
    });

    setProjects((current) =>
      current.map((project) =>
        project.projectId === projectId
          ? {
              ...project,
              queueStationId: stationId,
              status: project.status === "complete" ? "complete" : "queued",
            }
          : project,
      ),
    );
  }

  function promoteProjectToActive(stationId: string, projectId: string) {
    setQueues((current) => {
      const queue = current[stationId] ?? { activeProjectId: null, queuedProjectIds: [] };
      const nextQueued = queue.queuedProjectIds.filter((queuedId) => queuedId !== projectId);
      const demotedActive = queue.activeProjectId && queue.activeProjectId !== projectId ? [queue.activeProjectId] : [];
      return {
        ...current,
        [stationId]: {
          activeProjectId: projectId,
          queuedProjectIds: [...demotedActive, ...nextQueued],
        },
      };
    });

    setProjects((current) =>
      current.map((project) => {
        if (project.projectId === projectId) {
          return { ...project, queueStationId: stationId, status: "printing" };
        }
        if (project.queueStationId === stationId && project.status === "printing") {
          return { ...project, status: "queued" };
        }
        return project;
      }),
    );
  }

  function sendActiveBackToQueue(stationId: string) {
    const queue = queues[stationId];
    if (!queue?.activeProjectId) {
      return;
    }

    const activeProjectId = queue.activeProjectId;

    setQueues((current) => ({
      ...current,
      [stationId]: {
        activeProjectId: null,
        queuedProjectIds: [activeProjectId, ...(current[stationId]?.queuedProjectIds ?? [])],
      },
    }));

    setProjects((current) =>
      current.map((project) =>
        project.projectId === activeProjectId ? { ...project, status: "queued", queueStationId: stationId } : project,
      ),
    );
  }

  function completeActiveProject(stationId: string) {
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
        project.projectId === activeProjectId ? { ...project, status: "complete", queueStationId: stationId } : project,
      ),
    );
  }

  function removeQueuedProject(stationId: string, projectId: string) {
    setQueues((current) => ({
      ...current,
      [stationId]: {
        activeProjectId: current[stationId]?.activeProjectId ?? null,
        queuedProjectIds: (current[stationId]?.queuedProjectIds ?? []).filter((queuedId) => queuedId !== projectId),
      },
    }));

    setProjects((current) =>
      current.map((project) =>
        project.projectId === projectId ? { ...project, queueStationId: null, status: "ready" } : project,
      ),
    );
  }

  function handleDragStart(event: DragEvent<HTMLElement>, payload: DragState) {
    setDragState(payload);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleQueueDrop(stationId: string, targetIndex?: number) {
    if (!dragState) {
      return;
    }

    assignProjectToStation(stationId, dragState.projectId, targetIndex);
    setDragState(null);
  }

  function statusTone(status: WorkProjectStatus) {
    if (status === "printing") return "printing";
    if (status === "queued") return "queued";
    if (status === "complete") return "complete";
    return status === "ready" ? "ready" : "draft";
  }

  function renderWorkcenter() {
    return (
      <div className="view-stack">
        <section className="hero-shell">
          <div className="hero-copy">
            <p className="eyebrow">Vault Core</p>
            <h1>Run the floor by station, not by spreadsheet.</h1>
            <p>
              Workcenters own the physical room, zones organize the machine clusters, stations represent real installed
              printers, and every queued build flows through that chain with explicit operator visibility.
            </p>
            <div className="hero-actions">
              <button className="primary-action" onClick={() => setShowCreateZone(true)}>
                Create zone
              </button>
              <button className="ghost-action" onClick={() => setShowCreateProject(true)}>
                Intake project
              </button>
            </div>
          </div>

          <div className="hero-sidecard">
            <MetricBlock label="Zones" value={String(workcenterMetrics.zones)} />
            <MetricBlock label="Stations" value={String(workcenterMetrics.stations)} />
            <MetricBlock label="Ready projects" value={String(workcenterMetrics.readyProjects)} />
            <MetricBlock label="Active builds" value={String(workcenterMetrics.activeBuilds)} />
          </div>
        </section>

        <section className="spotlight-shell">
          <div className="spotlight-copy">
            <p className="eyebrow">Fleet spotlight</p>
            <h2>{spotlightPrinter.brand} {spotlightPrinter.model}</h2>
            <p>
              This catalog remains the source of truth for printable hardware. Operators create stations from this
              library, then build queue state lives at the station layer.
            </p>
            <div className="tag-row">
              {spotlightPrinter.capabilityFlags.map((flag) => (
                <span key={flag} className="capability-tag">
                  {flag}
                </span>
              ))}
            </div>
          </div>

          <div className="spotlight-stage">
            <button className="slider-button" onClick={() => cycleSpotlight("prev")} aria-label="Previous printer">
              ‹
            </button>
            <div className={`silhouette-frame spotlight-card ${spotlightPrinter.printerType}`}>
              <div className="silhouette-label">{spotlightPrinter.technology}</div>
              <strong>{spotlightPrinter.model}</strong>
              <span className="spotlight-dimensions">{spotlightPrinter.buildVolume.join(" x ")} mm</span>
            </div>
            <button className="slider-button" onClick={() => cycleSpotlight("next")} aria-label="Next printer">
              ›
            </button>
          </div>
        </section>

        <section className="workcenter-grid">
          <aside className="zone-rail">
            <div className="rail-head">
              <div>
                <p className="eyebrow">Workcenter map</p>
                <h2>Zones</h2>
              </div>
              <button className="ghost-mini" onClick={() => setShowCreateZone(true)}>
                + Zone
              </button>
            </div>

            <div className="zone-list">
              {zones.length ? (
                zones.map((zone) => (
                  <button
                    key={zone.zoneId}
                    className={`zone-card ${selectedZoneId === zone.zoneId ? "active" : ""}`}
                    onClick={() => setSelectedZoneId(zone.zoneId)}
                  >
                    <strong>{zone.zoneName}</strong>
                    <span>{zone.workcenterName}</span>
                    {zone.description ? <p>{zone.description}</p> : null}
                    <div className="zone-card-foot">
                      <small>{stations.filter((station) => station.zoneId === zone.zoneId).length} stations</small>
                      <span
                        className="zone-delete"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteZone(zone.zoneId);
                        }}
                      >
                        Remove
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="empty-rail-card">
                  <strong>No zones yet</strong>
                  <p>Define the physical work areas first.</p>
                </div>
              )}
            </div>
          </aside>

          <section className="operations-stage">
            <div className="command-bar">
              <div className="field-wrap grow">
                <label htmlFor="station-search">Search stations</label>
                <input
                  id="station-search"
                  className="field"
                  value={stationSearch}
                  onChange={(event) => setStationSearch(event.target.value)}
                  placeholder="Station, printer, bay, zone"
                />
              </div>
              <button
                className="primary-action"
                onClick={() => {
                  if (!zones.length) {
                    setShowCreateZone(true);
                    return;
                  }
                  setStationForm((current) => ({ ...current, zoneId: selectedZoneId || zones[0].zoneId }));
                  setShowCreateStation(true);
                }}
              >
                Create station
              </button>
            </div>

            <div className="stations-board">
              {filteredStations.length ? (
                filteredStations.map((station) => {
                  const printer = printerModelMap[station.printerModelId];
                  const queue = queues[station.stationId] ?? { activeProjectId: null, queuedProjectIds: [] };
                  const activeProject = queue.activeProjectId ? projectMap[queue.activeProjectId] : null;
                  return (
                    <article
                      key={station.stationId}
                      className={`station-card ${selectedStationId === station.stationId ? "selected" : ""}`}
                      onClick={() => setSelectedStationId(station.stationId)}
                    >
                      <div className="station-topline">
                        <div>
                          <p className="card-kicker">{zoneMap[station.zoneId]?.zoneName ?? "Unassigned zone"}</p>
                          <h3>{station.stationName}</h3>
                        </div>
                        <span className={`printer-chip ${printer.printerType}`}>{printer.printerType.toUpperCase()}</span>
                      </div>

                      <div className={`silhouette-frame compact ${printer.printerType}`}>
                        <div className="silhouette-label">{printer.brand}</div>
                        <strong>{station.machineNickname}</strong>
                      </div>

                      <div className="station-meta">
                        <MetaPair label="Model" value={printer.model} />
                        <MetaPair label="Bay" value={station.bayLabel || "Not set"} />
                      </div>

                      <div className="lane-summary">
                        <div className="lane-stat">
                          <span>Active</span>
                          <strong>{activeProject?.code ?? "None"}</strong>
                        </div>
                        <div className="lane-stat">
                          <span>Queued</span>
                          <strong>{queue.queuedProjectIds.length}</strong>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty-state compact">
                  <p className="eyebrow">No stations in scope</p>
                  <h2>Create the first station in this zone.</h2>
                  <button className="primary-action" onClick={() => setShowCreateStation(true)} disabled={!zones.length}>
                    New station
                  </button>
                </div>
              )}
            </div>

            <div className="blueprint-grid">
              <BlueprintCard
                eyebrow="Queue model"
                title="How the print queue works"
                items={[
                  "Projects begin in intake and only become queue-ready after they include a revision and material intent.",
                  "A build is queued against a station, not a generic printer type, so the system mirrors the actual floor.",
                  "Each station exposes one active slot and an ordered backlog lane that can be reprioritized by drag and drop.",
                  "Completing a build clears the active slot and preserves the project as a manufacturing event tied to that station.",
                ]}
              />
              <BlueprintCard
                eyebrow="Product model"
                title="How we manage products"
                items={[
                  "This platform does not manage storefront products. The source of truth is the engineering project and its controlled manufacturing definition.",
                  "A project captures the product name, code, intended material, and current `.3mf` revision instead of pretending it is an ecommerce SKU.",
                  "When a build runs, the software links the output to the exact project, file revision, station, and material used.",
                  "If customer-facing products come later, they should map into this project layer rather than replace it.",
                ]}
              />
            </div>
          </section>

          <aside className="detail-rail">
            {selectedStation && selectedStationQueue && selectedStationPrinter ? (
              <>
                <div className="rail-head">
                  <div>
                    <p className="eyebrow">Station detail</p>
                    <h2>{selectedStation.stationName}</h2>
                  </div>
                  <button className="danger-link" onClick={() => deleteStation(selectedStation.stationId)}>
                    Remove station
                  </button>
                </div>

                <section className="detail-card">
                  <div className="form-grid single">
                    <Field
                      label="Station name"
                      value={selectedStation.stationName}
                      onChange={(value) => updateStationField(selectedStation.stationId, "stationName", value)}
                      placeholder="Station name"
                    />
                    <Field
                      label="Machine nickname"
                      value={selectedStation.machineNickname}
                      onChange={(value) => updateStationField(selectedStation.stationId, "machineNickname", value)}
                      placeholder="Machine nickname"
                    />
                    <Field
                      label="Bay label"
                      value={selectedStation.bayLabel}
                      onChange={(value) => updateStationField(selectedStation.stationId, "bayLabel", value)}
                      placeholder="Bay label"
                    />
                  </div>

                  <div className={`silhouette-frame morph-preview ${selectedStationPrinter.printerType}`}>
                    <div className="silhouette-label">{selectedStationPrinter.brand}</div>
                    <strong>{selectedStationPrinter.model}</strong>
                    <span className="spotlight-dimensions">{selectedStationPrinter.buildVolume.join(" x ")} mm build volume</span>
                  </div>

                  <div className="field-wrap">
                    <label htmlFor="station-notes-edit">Station notes</label>
                    <textarea
                      id="station-notes-edit"
                      className="field textarea"
                      value={selectedStation.notes}
                      onChange={(event) => updateStationField(selectedStation.stationId, "notes", event.target.value)}
                      placeholder="Maintenance posture, nozzle state, access, shop-floor instructions"
                    />
                  </div>
                </section>

                <section className="queue-card">
                  <div className="queue-card-head">
                    <div>
                      <p className="eyebrow">Active lane</p>
                      <h3>Now printing</h3>
                    </div>
                    {selectedStationQueue.activeProjectId ? (
                      <div className="inline-actions">
                        <button className="ghost-mini" onClick={() => sendActiveBackToQueue(selectedStation.stationId)}>
                          Pause back to queue
                        </button>
                        <button className="primary-mini" onClick={() => completeActiveProject(selectedStation.stationId)}>
                          Complete
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="active-lane">
                    {selectedStationQueue.activeProjectId ? (
                      <ProjectCard
                        project={projectMap[selectedStationQueue.activeProjectId]}
                        tone={statusTone(projectMap[selectedStationQueue.activeProjectId].status)}
                      />
                    ) : (
                      <div className="lane-empty">
                        <strong>No active build</strong>
                        <p>Promote a queued project to start the live station slot.</p>
                      </div>
                    )}
                  </div>

                  <div className="queue-card-head secondary">
                    <div>
                      <p className="eyebrow">Queue lane</p>
                      <h3>Drag to reprioritize</h3>
                    </div>
                  </div>

                  <div
                    className="queue-lane"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleQueueDrop(selectedStation.stationId)}
                  >
                    {selectedStationQueue.queuedProjectIds.length ? (
                      selectedStationQueue.queuedProjectIds.map((projectId, index) => (
                        <div
                          key={projectId}
                          className="queue-wrapper"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => handleQueueDrop(selectedStation.stationId, index)}
                        >
                          <ProjectCard
                            project={projectMap[projectId]}
                            draggable
                            tone={statusTone(projectMap[projectId].status)}
                            onDragStart={(event) =>
                              handleDragStart(event, {
                                projectId,
                                sourceStationId: selectedStation.stationId,
                                sourceLane: "queue",
                              })
                            }
                            footer={
                              <div className="inline-actions">
                                <button className="primary-mini" onClick={() => promoteProjectToActive(selectedStation.stationId, projectId)}>
                                  Launch active
                                </button>
                                <button className="ghost-mini" onClick={() => removeQueuedProject(selectedStation.stationId, projectId)}>
                                  Remove
                                </button>
                              </div>
                            }
                          />
                        </div>
                      ))
                    ) : (
                      <div className="lane-empty">
                        <strong>Queue is empty</strong>
                        <p>Drop a ready project here from intake to stage work for this station.</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="queue-card">
                  <div className="queue-card-head secondary">
                    <div>
                      <p className="eyebrow">Project intake</p>
                      <h3>Ready to queue</h3>
                    </div>
                    <button className="ghost-mini" onClick={() => setShowCreateProject(true)}>
                      New project
                    </button>
                  </div>

                  <div className="intake-columns">
                    <div className="intake-column">
                      <h4>Ready</h4>
                      {readyProjects.length ? (
                        readyProjects.map((project) => (
                          <ProjectCard
                            key={project.projectId}
                            project={project}
                            draggable
                            tone="ready"
                            onDragStart={(event) =>
                              handleDragStart(event, {
                                projectId: project.projectId,
                                sourceStationId: null,
                                sourceLane: "backlog",
                              })
                            }
                            footer={
                              <button className="primary-mini" onClick={() => assignProjectToStation(selectedStation.stationId, project.projectId)}>
                                Add to queue
                              </button>
                            }
                          />
                        ))
                      ) : (
                        <div className="lane-empty small">
                          <strong>No queue-ready projects</strong>
                          <p>Add material intent and a revision during intake.</p>
                        </div>
                      )}
                    </div>

                    <div className="intake-column">
                      <h4>Drafts</h4>
                      {draftProjects.length ? (
                        draftProjects.map((project) => (
                          <ProjectCard key={project.projectId} project={project} tone="draft" compact />
                        ))
                      ) : (
                        <div className="lane-empty small">
                          <strong>No drafts</strong>
                          <p>Everything currently in intake is queue-ready.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </>
            ) : (
              <div className="empty-rail-card tall">
                <strong>Select a station</strong>
                <p>Station detail, editable metadata, queue lanes, and intake handoff live here.</p>
              </div>
            )}
          </aside>
        </section>
      </div>
    );
  }

  function renderFleetLibrary() {
    return (
      <div className="view-stack">
        <section className="section-header">
          <div>
            <p className="eyebrow">Printer catalog</p>
            <h2>Approved fleet library</h2>
          </div>
          <div className="field-wrap library-search">
            <label htmlFor="fleet-search">Search printer models</label>
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
            <article key={printer.modelId} className="fleet-card">
              <div className="fleet-card-head">
                <div>
                  <p className="card-kicker">{printer.brand}</p>
                  <h3>{printer.model}</h3>
                </div>
                <span className={`printer-chip ${printer.printerType}`}>{printer.technology}</span>
              </div>

              <div className={`silhouette-frame ${printer.printerType}`}>
                <div className="silhouette-label">{printer.printerType === "resin" ? "Resin platform" : "FDM platform"}</div>
                <strong>{printer.model}</strong>
                <span className="spotlight-dimensions">{printer.buildVolume.join(" x ")} mm build volume</span>
              </div>

              <div className="tag-row">
                {printer.capabilityFlags.map((flag) => (
                  <span key={flag} className="capability-tag">
                    {flag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    );
  }

  function renderSpecs() {
    return (
      <div className="spec-layout">
        <aside className="spec-rail">
          <p className="eyebrow">Source package</p>
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

        <section className="spec-panel">
          <div className="spec-panel-head">
            <div>
              <p className="eyebrow">{selectedSpec.docType}</p>
              <h2>{selectedSpec.title}</h2>
            </div>
            <span className="spec-filename">{selectedSpec.filename}</span>
          </div>
          <pre className="code-block">{selectedSpec.raw}</pre>
        </section>
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="navigation">
        <div className="brand-lockup">
          <p className="eyebrow">Vault Core</p>
          <h1>PrintForge Operations</h1>
          <p>Station-based manufacturing software for additive engineering teams.</p>
        </div>

        <nav className="nav-stack">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-tile ${activeView === item.id ? "active" : ""}`}
              onClick={() => setActiveView(item.id)}
            >
              <strong>{item.label}</strong>
              <span>{item.hint}</span>
            </button>
          ))}
        </nav>

        <div className="operator-card">
          <label htmlFor="operator-switch">Active operator</label>
          <select id="operator-switch" className="field" value={currentUserId} onChange={(event) => setCurrentUserId(event.target.value)}>
            {seedUsers.map((user) => (
              <option key={user.uid} value={user.uid}>
                {user.displayName} · {roleLabels[user.role]}
              </option>
            ))}
          </select>
          <p>
            Signed in as <strong>{currentUser.displayName}</strong>
          </p>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Current surface</p>
            <h2>{navItems.find((item) => item.id === activeView)?.label}</h2>
          </div>
          <div className="workspace-badges">
            <span className="workspace-badge">Drag queue ordering</span>
            <span className="workspace-badge">Persistent local state</span>
            <span className="workspace-badge">No fake live metrics</span>
          </div>
        </header>

        {activeView === "workcenter" && renderWorkcenter()}
        {activeView === "fleet" && renderFleetLibrary()}
        {activeView === "specs" && renderSpecs()}
      </main>

      {showCreateZone ? (
        <ModalScrim onClose={() => setShowCreateZone(false)}>
          <div className="modal-card">
            <div className="modal-head">
              <div>
                <p className="eyebrow">Create zone</p>
                <h2>Define a real production area.</h2>
              </div>
              <button className="ghost-mini" onClick={() => setShowCreateZone(false)}>
                Close
              </button>
            </div>

            <form className="form-stack" onSubmit={createZone}>
              <div className="form-grid">
                <Field
                  label="Workcenter name"
                  value={zoneForm.workcenterName}
                  onChange={(value) => setZoneForm((current) => ({ ...current, workcenterName: value }))}
                  placeholder="North Production Floor"
                />
                <Field
                  label="Zone name"
                  value={zoneForm.zoneName}
                  onChange={(value) => setZoneForm((current) => ({ ...current, zoneName: value }))}
                  placeholder="Large Format Row"
                />
              </div>
              <div className="field-wrap">
                <label htmlFor="zone-description">Description</label>
                <textarea
                  id="zone-description"
                  className="field textarea"
                  value={zoneForm.description}
                  onChange={(event) => setZoneForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="What happens in this part of the shop, access notes, workflow focus"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="ghost-action" onClick={() => setShowCreateZone(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-action">
                  Create zone
                </button>
              </div>
            </form>
          </div>
        </ModalScrim>
      ) : null}

      {showCreateProject ? (
        <ModalScrim onClose={() => setShowCreateProject(false)}>
          <div className="modal-card">
            <div className="modal-head">
              <div>
                <p className="eyebrow">Project intake</p>
                <h2>Create a product-ready engineering project.</h2>
              </div>
              <button className="ghost-mini" onClick={() => setShowCreateProject(false)}>
                Close
              </button>
            </div>

            <form className="form-stack" onSubmit={createProject}>
              <div className="form-grid">
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
                  label="Product / part name"
                  value={projectForm.productName}
                  onChange={(value) => setProjectForm((current) => ({ ...current, productName: value }))}
                  placeholder="Jig base assembly"
                />
                <Field
                  label="Material intent"
                  value={projectForm.materialIntent}
                  onChange={(value) => setProjectForm((current) => ({ ...current, materialIntent: value }))}
                  placeholder="PETG HF / Siraya Blu / PA6-CF"
                />
                <Field
                  label="Current revision"
                  value={projectForm.fileRevision}
                  onChange={(value) => setProjectForm((current) => ({ ...current, fileRevision: value }))}
                  placeholder="r3 approved_current"
                />
              </div>
              <div className="intake-note">
                Projects with both material intent and revision start as <strong>ready</strong>. Otherwise they stay in
                <strong> draft</strong> until the required manufacturing data is filled in.
              </div>
              <div className="modal-actions">
                <button type="button" className="ghost-action" onClick={() => setShowCreateProject(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-action">
                  Create project
                </button>
              </div>
            </form>
          </div>
        </ModalScrim>
      ) : null}

      {showCreateStation ? (
        <ModalScrim onClose={() => setShowCreateStation(false)} align="right">
          <div className="station-drawer">
            <div className="modal-head">
              <div>
                <p className="eyebrow">Create station</p>
                <h2>Attach a printer model to a real floor location.</h2>
              </div>
              <button className="ghost-mini" onClick={() => setShowCreateStation(false)}>
                Close
              </button>
            </div>

            <div className="drawer-layout">
              <form className="form-stack" onSubmit={createStation}>
                <div className="form-grid">
                  <Field
                    label="Station name"
                    value={stationForm.stationName}
                    onChange={(value) => setStationForm((current) => ({ ...current, stationName: value }))}
                    placeholder="Station 04"
                  />
                  <div className="field-wrap">
                    <label htmlFor="station-zone">Zone</label>
                    <select
                      id="station-zone"
                      className="field"
                      value={stationForm.zoneId}
                      onChange={(event) => setStationForm((current) => ({ ...current, zoneId: event.target.value }))}
                    >
                      <option value="">Select zone</option>
                      {zones.map((zone) => (
                        <option key={zone.zoneId} value={zone.zoneId}>
                          {zone.workcenterName} / {zone.zoneName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-wrap">
                    <label htmlFor="station-printer-model">Printer model</label>
                    <select
                      id="station-printer-model"
                      className="field"
                      value={stationForm.printerModelId}
                      onChange={(event) => setStationForm((current) => ({ ...current, printerModelId: event.target.value }))}
                    >
                      {printerCatalog.map((printer) => (
                        <option key={printer.modelId} value={printer.modelId}>
                          {printer.brand} {printer.model}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Field
                    label="Machine nickname"
                    value={stationForm.machineNickname}
                    onChange={(value) => setStationForm((current) => ({ ...current, machineNickname: value }))}
                    placeholder="X1E North"
                  />
                  <Field
                    label="Bay label"
                    value={stationForm.bayLabel}
                    onChange={(value) => setStationForm((current) => ({ ...current, bayLabel: value }))}
                    placeholder="Bay 04"
                  />
                </div>
                <div className="field-wrap">
                  <label htmlFor="station-notes">Notes</label>
                  <textarea
                    id="station-notes"
                    className="field textarea"
                    value={stationForm.notes}
                    onChange={(event) => setStationForm((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Nozzle, material restrictions, maintenance caveats, local operator guidance"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="ghost-action" onClick={() => setShowCreateStation(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-action">
                    Create station
                  </button>
                </div>
              </form>

              <aside className="drawer-preview">
                <p className="eyebrow">Live preview</p>
                <div className={`silhouette-frame morph-preview ${stationPreviewPrinter.printerType}`}>
                  <div className="silhouette-label">{stationPreviewPrinter.brand}</div>
                  <strong>{stationForm.stationName || stationPreviewPrinter.model}</strong>
                  <span className="spotlight-dimensions">
                    {(stationForm.machineNickname || stationPreviewPrinter.model) + " · " + stationPreviewPrinter.technology}
                  </span>
                </div>
                <div className="preview-grid">
                  <MetaPair label="Zone" value={zoneMap[stationForm.zoneId]?.zoneName ?? "Select a zone"} />
                  <MetaPair label="Bay" value={stationForm.bayLabel || "Not set"} />
                  <MetaPair label="Type" value={stationPreviewPrinter.printerType.toUpperCase()} />
                  <MetaPair label="Build volume" value={stationPreviewPrinter.buildVolume.join(" x ") + " mm"} />
                </div>
                <div className="tag-row">
                  {stationPreviewPrinter.capabilityFlags.map((flag) => (
                    <span key={flag} className="capability-tag">
                      {flag}
                    </span>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </ModalScrim>
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

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-block">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BlueprintCard({ eyebrow, title, items }: { eyebrow: string; title: string; items: string[] }) {
  return (
    <article className="blueprint-card">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <ol className="blueprint-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </article>
  );
}

function ProjectCard({
  project,
  tone,
  draggable = false,
  compact = false,
  onDragStart,
  footer,
}: {
  project: WorkProject;
  tone: "draft" | "ready" | "queued" | "printing" | "complete";
  draggable?: boolean;
  compact?: boolean;
  onDragStart?: (event: DragEvent<HTMLElement>) => void;
  footer?: React.ReactNode;
}) {
  return (
    <article className={`project-card ${tone} ${compact ? "compact" : ""}`} draggable={draggable} onDragStart={onDragStart}>
      <div className="project-card-head">
        <div>
          <span className={`status-dot ${tone}`} />
          <strong>{project.title}</strong>
        </div>
        <span className="project-code">{project.code}</span>
      </div>
      <p className="project-detail">{project.productName || "Product name not set"}</p>
      <div className="project-facts">
        <span>{project.materialIntent || "Material pending"}</span>
        <span>{project.fileRevision || "Revision pending"}</span>
      </div>
      {footer ? <div className="project-footer">{footer}</div> : null}
    </article>
  );
}

function MetaPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="meta-pair">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({
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
      <input className="field" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ModalScrim({
  children,
  onClose,
  align = "center",
}: {
  children: React.ReactNode;
  onClose: () => void;
  align?: "center" | "right";
}) {
  return (
    <div className={`modal-scrim ${align}`} onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()}>{children}</div>
    </div>
  );
}

export default App;
