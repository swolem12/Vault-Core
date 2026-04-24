# PRINTFORGE OPS — MASTER STARTUP PROMPT FOR GITHUB AGENTS

You are my elite GitHub coding agent. You are building a full enterprise internal software platform called **PrintForge Ops** for a 3D print manufacturing engineering firm.

This is **not** an ecommerce site and **not** a customer storefront.  
This is the internal command center for additive manufacturing execution.

The application must help a real engineering and manufacturing team manage:
- all active 3D print engineering projects
- upload and manage .3mf files and other engineering artifacts
- track project owners and contributors
- manage printer fleet status
- assign projects and build jobs to printers
- track which material was intended and which material was actually used
- support both filament and resin workflows
- support Google login using Firebase Authentication
- use Firebase / Cloud Firestore / Cloud Storage as the main backend stack
- provide real-time visibility into shop-floor work
- provide auditability and accountability for who changed what

I need this developed as a **production-grade web application**, not a toy demo.

---

# 1. HIGH LEVEL PRODUCT IDENTITY

## Product name
PrintForge Ops

## Product category
Internal additive manufacturing project management and execution platform

## Product mission
Create a single source of truth for internal 3D print engineering operations so the team can track projects, files, printers, materials, job progress, blockers, and accountability in one place.

## Core truth
Our real-world problem is that 3D printing shops usually end up split across:
- slicers
- random cloud drives
- spreadsheets
- chat messages
- whiteboards
- memory / tribal knowledge

That is garbage for scale, garbage for traceability, and garbage for execution.

This app needs to solve that.

---

# 2. WHAT THE PLATFORM IS AND IS NOT

## This platform IS:
- a project management and operational tracking system for internal 3D print work
- a manufacturing execution style coordination system for print jobs
- a file-traceability system for .3mf and related assets
- a printer fleet dashboard
- a materials and resin catalog
- an accountability and audit layer

## This platform IS NOT:
- not a public order website
- not a Shopify clone
- not a customer quoting portal in v1
- not a slicer replacement
- not a CAD editor
- not a PLM replacement
- not a warehouse ERP replacement
- not an MES monster with 5 years of enterprise consulting baggage

Build the right thing. Do not drift into junk features that dilute the core mission.

---

# 3. PRIMARY USERS

Build the experience around real internal roles:

## Admin
Can manage system settings, users, permissions, materials, printer fleet, imports, and overall platform governance.

## Engineering Lead
Can create and manage projects, assign owners, approve file revisions, allocate printers, review blockers, and see team-wide analytics.

## Engineer / Designer
Can create projects, upload files, manage project content, propose materials, create build jobs, and collaborate on technical execution.

## Printer Operator / Technician
Can see approved build work, manage printer states, start/pause/fail/complete print jobs, upload evidence photos, and log actual material use.

## Viewer / Stakeholder
Read-only access to dashboards, status, project overviews, and printer activity.

---

# 4. PRIMARY BUSINESS OBJECTIVES

The platform must enable a lead to answer these questions fast:
- what projects are active right now?
- who owns each project?
- what printer is running right now?
- which file revision is the latest approved build?
- what material is tied to the build?
- what is blocked?
- what is overdue?
- which printers are overutilized?
- which materials are being used the most?
- what failed this week and why?

The platform must reduce:
- lost files
- ambiguous ownership
- duplicated effort
- untracked printer utilization
- random, undocumented material choices
- spreadsheet dependency
- poor shift handoff quality

---

# 5. REQUIRED PRINTERS TO SUPPORT IN THE SEED CATALOG

The system must include printer model seeds and capability profiles for these machines:

## Bambu Lab
- A1
- P1S
- X1E
- X1C

## Anycubic
- Kobra S1

## Creality
- K2 Plus

## Sovol
- SV08

## Elegoo
- Saturn 4 Ultra 16K resin printer

Important:
- build a **model seed catalog** and a separate **real machine instance layer**
- a printer model is the template
- a real printer is the deployed shop-floor machine with nickname, serial number, asset tag, status, location, and maintenance history

Do not hardcode the UI as if one shop only has one printer of each type.

We need to support many instances of the same model.

---

# 6. REQUIRED MATERIAL / FILAMENT / RESIN SUPPORT

The system must support a huge internal catalog of materials.

This includes normalized families and brand-specific products.

At minimum, the material taxonomy and UI must support the following normalized classes and aliases:
- PLA
- PLA HS
- ePLA
- PLA+
- matte PLA
- silk PLA
- PLA-CF
- PLA copper
- PLA steel
- LW-PLA
- PETG
- PETG-HS
- PETG-CF
- ABS
- ABS-FR
- ASA
- PC
- PC-FR
- TPU 85A
- TPU 90A
- TPU 95A
- TPE
- PAHT-CF
- PA6-CF
- PA6 Nylon
- PA12-CF
- PPA-CF
- support materials like PVA / BVOH / HIPS
- specialty engineering families
- resin families

The global market is too large to realistically hand-enter every single brand and SKU forever.
So architect this correctly:

## Required material architecture
- normalized engineering family
- brand
- vendor product line
- human display name
- aliases
- flexible material metadata
- reinforced material metadata
- resin vs filament class
- internal approval state
- optional drying info
- optional notes
- printer compatibility hints

## Required seed brand support
Ship with a strong seed catalog structure for major brands such as:
- Bambu Lab
- Polymaker
- Fiberon by Polymaker
- eSUN
- Prusament
- Overture
- Hatchbox
- MatterHackers
- ColorFabb
- SUNLU
- Creality
- Anycubic
- Elegoo
- Inland
- Proto-Pasta
- BASF Ultrafuse
- FormFutura
- Raise3D
- 3DXTech
- Siraya Tech where applicable

Important:
Do not claim the app fully contains every SKU in the world on day one.
Instead:
- create the schema
- create seed data structure
- create admin create/edit tools
- create CSV import support
- create future vendor adapter hooks

That is the right engineering move.

---

# 7. REQUIRED SIRAYA TECH RESIN SUPPORT

The system must explicitly support Siraya Tech resin catalog handling.

At minimum, architect for:
- brand record for Siraya Tech
- resin-safe material records
- resin family normalization
- resin-only filters
- resin-compatible printer filtering
- wash/cure notes fields
- resin engineering notes

Seed the Siraya Tech system to support product lines such as:
- Fast
- Build
- Blu
- Tenacious
- Magna
- Sculpt
- Cast
- Mecha
- Simple
- Easy

Some of these may evolve over time and the site catalog may change.
That is why I need a flexible admin-editable catalog system, not a brittle hardcoded UI.

---

# 8. CORE FEATURE SET

## A. Authentication and identity
Required:
- Firebase Authentication
- Google sign-in
- auto-create user profile on first login
- organization-aware access model
- role-based access
- future-ready for MFA but not required in v1

## B. Projects
Each project should have:
- title
- code / short ID
- description
- priority
- owner
- collaborators
- due date
- current status
- blockers
- requested material
- preferred printers
- tags
- creation/update timestamps
- activity feed
- files
- build jobs

## C. File management
We need managed engineering file handling.

Support:
- .3mf uploads
- related support files
- images
- PDFs
- notes
- related exports

Every uploaded .3mf must be treated as a managed artifact with:
- file artifact record
- immutable revision history
- upload timestamp
- uploader identity
- checksum
- file size
- status
- current revision pointer
- parsing metadata if available
- preview thumbnail support if possible

## D. Printer fleet management
We need:
- real machine list
- printer model templates
- printer instance cards
- location / bay tracking
- operational status
- current job
- queued jobs
- maintenance state
- maintenance notes
- supported material families
- printer-specific notes

## E. Build jobs
Build jobs are execution records that tie together:
- project
- exact file revision
- printer
- material
- operator
- status
- quantity
- estimated print time
- actual print time
- estimated material usage
- actual material usage
- success or failure
- failure reason
- notes
- evidence photos

## F. Materials and resins
Need:
- searchable material registry
- normalized family support
- brand filters
- status filters
- resin vs filament class filters
- printer compatibility hints
- admin create/edit/import actions

## G. Analytics
Need:
- active projects count
- blocked projects count
- printer utilization
- queued jobs
- completed jobs
- failed jobs
- failure reasons
- material usage by family
- usage by printer
- usage by operator
- overdue projects

## H. Auditability
Need activity log support for major actions:
- user created project
- file uploaded
- file revision approved
- material created
- build job created
- printer status changed
- blocker opened
- blocker resolved
- job failed
- job completed

---

# 9. SYSTEM ARCHITECTURE REQUIREMENTS

Use a modern frontend and Firebase-centered backend.

## Frontend
Use:
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

Optional:
- TanStack Query
- Zustand or Jotai
- React Hook Form
- Zod

## Backend services
Use:
- Firebase Authentication
- Cloud Firestore
- Cloud Storage
- Cloud Functions or Cloud Run as needed
- Firebase Hosting or Vercel

## Data design principles
- Firestore for operational records and live state
- Cloud Storage for binary files
- immutable file revisions
- real-time listeners only where useful
- keep high-volume historical analytics open for warehouse migration later

## Future readiness
Design so it can later support:
- machine telemetry
- QR code scanning
- printer maintenance automation
- estimated print duration prediction
- material depletion forecasts
- email/slack/google chat notifications
- internal part approval workflows

---

# 10. FIRESTORE DATA MODEL REQUIREMENTS

Design the Firestore schema cleanly.

Use collections like:
- organizations
- users
- projects
- printers
- materials
- materialBrands
- materialFamilies
- buildJobs
- activityEvents
- notifications
- savedViews
- adminConfig

## Projects
A project document must support:
- orgId
- title
- code
- description
- priority
- status
- lifecycleStage
- ownerUid
- collaboratorUids
- requestedMaterialId
- preferredPrinterIds
- dueDate
- blocked
- archived
- tagIds
- latestActivityAt
- createdAt
- updatedAt

Use subcollections for:
- files
- revisions
- comments
- blockers
- milestones
- activity

## Printers
A printer document must support:
- orgId
- brand
- model
- nickname
- serialNumber
- assetTag
- printerType
- locationId
- operationalStatus
- queueStatus
- ownerTeamId
- capabilityProfile
- iconKey
- supportedMaterialFamilyIds
- currentJobId
- notes
- active
- createdAt
- updatedAt
- lastHeartbeatAt

## Materials
A material document must support:
- orgId
- brandId
- familyId
- productLine
- displayName
- rawVendorName
- sku
- diameter
- color
- finish
- weightGrams
- formFactor
- status
- dryingRequired
- dryingNotes
- sourceReference
- metadata
- tags
- createdAt
- updatedAt

## Build jobs
A build job document must support:
- orgId
- projectId
- projectFileRevisionId
- printerId
- materialId
- assignedToUid
- status
- outcome
- quantityPlanned
- quantityCompleted
- estimatedPrintTimeMinutes
- actualPrintTimeMinutes
- estimatedMaterialUsedGrams
- actualMaterialUsedGrams
- startedAt
- endedAt
- queuedAt
- failureReason
- notes
- snapshotImagePaths
- createdAt
- updatedAt

Important:
Design indexes for common operational queries.
Do not make the schema cute. Make it efficient and sane.

---

# 11. FILE AND REVISION MANAGEMENT REQUIREMENTS

This is one of the most important pieces.

## Rules
- Do not overwrite revisions in place
- Every revision is immutable
- A file artifact may have many revisions
- One revision may be marked as current / approved
- Parsing failures cannot destroy the original file
- Duplicate detection using checksum should exist
- Logical deletion first, physical purge later

## File artifact concept
A “file artifact” is the conceptual file stream for a project, like:
- main .3mf
- support file
- reference model
- render
- work instruction
- validation report
- evidence photos

## Revision concept
A revision is the immutable uploaded version of a file artifact.

Need fields for:
- revision number
- uploader
- upload timestamp
- checksum
- storage path
- filename
- mime type
- size
- slicer metadata if available
- printer profile if parsed
- material profile if parsed
- notes
- preview image
- parse status
- current flag

---

# 12. .3MF INGESTION REQUIREMENTS

Do not ignore the fact that .3mf is a real engineering artifact format.

The app should:
- preserve the original raw .3mf upload
- parse it in a non-destructive background job where possible
- extract safe metadata where possible
- surface extracted metadata as advisory, not infallible truth

Target parse fields:
- slicer signature clues
- plate count
- embedded thumbnails if present
- printer profile string if present
- material profile string if present
- estimated print time if present
- archive manifest clues
- internal file list

If parsing fails:
- keep the file
- mark parse status appropriately
- show the user the file is still stored
- never lose data because a derivative process failed

---

# 13. ROLE AND PERMISSION REQUIREMENTS

Need role-based access control.

## Roles
- admin
- engineering_lead
- engineer
- operator
- viewer

## Examples
Admin:
- manage users
- manage permissions
- manage org settings
- manage printers
- manage materials
- run imports
- archive or restore records

Engineering lead:
- create/edit all projects
- assign owners
- approve file revisions
- create build jobs
- assign printers
- resolve blockers
- view analytics

Engineer:
- create projects
- edit owned projects
- upload files
- propose materials
- create build jobs
- add notes/comments

Operator:
- view approved files
- update printer status
- start/pause/fail/complete jobs
- upload evidence photos
- log actual material usage

Viewer:
- read dashboards and project states

Enforce org boundaries in Firestore security rules.
Use trusted server functions for sensitive transitions when needed.

---

# 14. PROJECT STATUS AND WORKFLOW LOGIC

The project workflow must feel like real engineering operations, not random generic task software.

## Project lifecycle statuses
- intake
- scoping
- design_in_progress
- ready_for_print
- queued
- printing
- post_processing
- validation
- complete
- on_hold
- cancelled

## Build job lifecycle
- draft
- queued
- assigned
- preflight
- printing
- paused
- failed
- completed
- cancelled

## Blocker lifecycle
- open
- in_progress
- waiting
- resolved
- closed

## Transition rules
Examples:
- a project should not be ready_for_print unless there is at least one relevant file and a defined owner
- a build job cannot start printing unless a printer and material are assigned
- if any build job is actively printing, the project state should reflect printing
- if all blockers resolve, project.blocked should clear
- a project should not be complete if unresolved blockers exist unless admin override is logged

---

# 15. PRINTER MANAGEMENT REQUIREMENTS

The printer page must feel like a real print room management board.

Each printer card should display:
- icon
- nickname
- brand + model
- operational status
- queue status
- current job
- current project
- material in use
- location / bay
- last update time
- utilization trend

Statuses:
- available
- busy
- paused
- maintenance
- offline
- error
- reserved

Need:
- create printer
- edit printer
- archive printer
- mark printer maintenance
- assign build job
- view job history
- see utilization analytics

---

# 16. MATERIAL MANAGEMENT REQUIREMENTS

The materials page must be a serious engineering catalog, not a cute shopping page.

Need:
- faceted filtering
- searchable table
- brand filter
- family filter
- resin vs filament filter
- approval state filter
- printer compatibility hints
- create new material form
- create new brand form
- CSV import
- future vendor adapter support

Need material states:
- approved
- standard
- experimental
- restricted
- deprecated
- retired

Need engineering tags or chips:
- flexible
- abrasive
- carbon fiber
- glass fiber
- high speed
- flame retardant
- outdoor
- needs drying
- resin
- engineering

Need warnings:
- abrasive material warning for nozzle wear
- flexible feed complexity note
- drying-required note for nylons/composites when configured
- resin-only compatibility warnings

---

# 17. SIRAYA TECH RESIN PAGE BEHAVIOR

Build Siraya Tech resin support properly.

When user filters Brand = Siraya Tech, the system must support:
- resin-only view
- resin-safe fields
- compatible resin printers only
- wash/cure notes
- engineering notes
- product line grouping
- blend/mix notes if internal team uses them

Support seed entries for:
- Fast
- Build
- Blu
- Tenacious
- Magna
- Sculpt
- Cast
- Mecha
- Simple
- Easy

Keep this flexible and editable because vendor catalogs change over time.

---

# 18. UI / UX REQUIREMENTS

This cannot look like ugly government software or generic bootstrap garbage.

I want a polished enterprise command-center style application.

## Design goals
- premium
- intuitive
- modern
- fast
- clean
- technical
- dense but readable
- excellent dark mode
- motion with purpose
- strong visual hierarchy

## Visual direction
Think:
- modern industrial SaaS
- engineering dashboard
- sharp layout
- subtle glass or elevated surfaces
- crisp cards
- dense professional tables
- smart filters
- beautiful hover states
- polished drawers and modals
- smooth but restrained animation

## Required tech
- Tailwind
- shadcn/ui
- Framer Motion

## Motion rules
- use motion for state changes, panel transitions, upload progress, queue movement, and card feedback
- do not turn this into gimmick animation theatre
- it should feel expensive, not childish

## App shell
Need:
- left sidebar navigation
- top command/search bar
- status-aware content shell
- good empty states
- skeleton loaders
- toasts
- responsive behavior
- strong tablet usability

---

# 19. REQUIRED PAGES / MODULES

## Overview dashboard
Must show:
- active projects
- blocked projects
- queued jobs
- printers currently in use
- failed jobs this week
- completed jobs this week
- most used materials
- recent activity
- printer fleet quick board

## Projects page
Need:
- list view
- kanban view
- sorting
- filtering
- saved views
- owner filters
- status filters
- due date filters
- blocked-only toggle

## Project detail page
Need tabs for:
- summary
- files
- builds
- materials
- comments
- blockers
- history

## Printers page
Need:
- card view
- table view
- status filtering
- active jobs
- utilization summary
- quick actions

## Materials page
Need:
- catalog view
- comparison-ready table
- filters
- create/import controls

## Build queue page
Need:
- active jobs
- queued jobs
- printer assignments
- expected availability
- start/pause/fail/complete controls
- drag and drop reorder if feasible

## Analytics page
Need:
- charts
- KPIs
- time range filters
- export CSV

## Admin page
Need:
- user and role management
- org settings
- printer model seeds
- material brand seeds
- imports
- system configuration

---

# 20. SEARCH REQUIREMENTS

Global search must search:
- projects
- printers
- materials
- build jobs
- file revisions
- users

Use a command-palette style search UI for speed.

v1 can be Firestore-driven with normalized search tokens.
v2 can use Algolia or Meilisearch if needed.
Architect it so that swapping search backends later is possible.

---

# 21. ANALYTICS REQUIREMENTS

The overview and analytics pages must show real operational intelligence.

Required metrics:
- active projects
- blocked projects
- queued jobs
- printers active now
- printers offline
- completed jobs this week
- failed jobs this week
- average queue age
- material usage by family
- material usage by brand
- printer utilization by time period
- jobs completed by printer
- jobs completed by operator
- top failure reasons
- overdue projects

Required chart types:
- line charts
- bar charts
- donut charts
- stacked bars
- utilization heatmap if practical

Make charts clean and enterprise-grade.

---

# 22. ICON AND ASSET STRATEGY

We need icons for printers.

Do this properly:
- build an icon registry keyed by iconKey
- do not depend on external hotlinked assets at runtime
- create local SVG component placeholders or stylized silhouettes
- support future drop-in custom printer graphics
- make brand + model visually recognizable in card form

Printer icon keys should exist for:
- printer-bambu-a1
- printer-bambu-p1s
- printer-bambu-x1e
- printer-bambu-x1c
- printer-anycubic-kobra-s1
- printer-creality-k2-plus
- printer-sovol-sv08
- printer-elegoo-saturn-4-ultra-16k

Do the same conceptually for material classes if useful.

---

# 23. DATA ENTRY UX RULES

This application must be fast for real operators.

Forms should:
- validate cleanly
- auto-save drafts where practical
- use sensible defaults
- avoid giant exhausting form walls
- use drawers/modals/wizards where helpful
- allow inline edits for common fields
- support bulk actions where appropriate

Examples:
- quick-create project
- quick-create printer
- quick-create material
- quick-create build job
- upload file in context from project page
- approve current revision with one clean action

---

# 24. UPLOAD UX RULES

The file upload flow must feel powerful and safe.

Need:
- drag and drop
- progress
- upload state
- parse state
- duplicate checksum warning
- revision numbering
- mark as current
- show uploader identity
- show file size
- show uploaded time
- show preview or placeholder
- show parse metadata when available

Do not make file upload a dead-end blob drop.
Make it a real operational workflow.

---

# 25. ACTIVITY FEED REQUIREMENTS

Every major entity should have traceability.

Need an activity event format that can represent:
- actor
- action
- entity type
- entity id
- project id if related
- before state
- after state
- createdAt

Use this for:
- project history
- file history
- printer history
- system notifications
- audit log entries

This will be massively useful later, so do not skip it.

---

# 26. NOTIFICATION REQUIREMENTS

Need an internal notification model.

Examples:
- file uploaded to your project
- build failed
- blocker opened
- due date approaching
- printer error
- project assigned to you
- revision approved
- queued job assigned to your printer bay or team

Need:
- read/unread state
- recipient
- type
- title
- body
- related entity reference
- createdAt

UI can be an in-app notification panel in v1.

---

# 27. CSV IMPORT REQUIREMENTS

Because the material market is huge and dynamic, CSV import is mandatory.

Need:
- import wizard
- column mapping
- dry run / preview
- validation errors
- created / updated / rejected counts
- downloadable error summary if practical
- idempotent import strategy where possible

Primary CSV import use cases:
- materials
- printer fleet
- maybe projects later

---

# 28. IMPORTANT ENGINEERING TRUTHS

Do not fake enterprise quality.
Do not build a giant pile of brittle hardcoded components.
Do not create fake data architecture that collapses once multiple users start touching it.

Design this as if a real additive manufacturing team will use it daily.

That means:
- strong schema
- strong typing
- strong validation
- role controls
- auditability
- status logic
- thoughtful UX
- modular codebase
- testability

---

# 29. FIRESTORE SECURITY RULE INTENT

We need proper security logic.

Core rules:
- org boundary enforced
- user must belong to org to read/write org documents
- viewer mostly read-only
- admin elevated
- lead and engineer constrained by role
- operator only updates permitted execution records
- sensitive status transitions can go through trusted server functions

I want proper rule structure and not lazy “allow read, write: if request.auth != null”.

---

# 30. TESTING REQUIREMENTS

Need meaningful tests.

At minimum:
- auth flow test
- protected route test
- Firestore rules tests
- project CRUD tests
- material CRUD tests
- printer CRUD tests
- build job state transition tests
- upload flow tests
- duplicate checksum handling tests
- role-based UI visibility tests
- analytics rendering smoke tests

Use the correct level of testing.
Do not overengineer tests just to make a giant suite.
But do not skip important workflow protection.

---

# 31. REPO STRUCTURE REQUIREMENTS

Generate a clean repository structure.

Suggested:
- /app
- /components
- /components/ui
- /features/auth
- /features/projects
- /features/printers
- /features/materials
- /features/files
- /features/jobs
- /features/analytics
- /features/admin
- /lib/firebase
- /lib/domain
- /lib/utils
- /lib/validators
- /lib/search
- /hooks
- /types
- /data/seeds
- /public/icons/printers
- /public/icons/materials
- /functions
- /tests
- /docs

Modularize by domain, not random technical sprawl.

---

# 32. REQUIRED BUILD STRATEGY

Build in phases, but the repo should feel cohesive from the start.

## Phase 0
- app shell
- auth
- routing
- theme
- design system baseline
- Firebase wiring

## Phase 1
- project CRUD
- printer CRUD
- material CRUD
- build job CRUD

## Phase 2
- file uploads
- revision tracking
- .3mf parsing hooks
- activity events

## Phase 3
- dashboards
- analytics
- saved views
- CSV export

## Phase 4
- imports
- admin tools
- polish
- testing hardening

But in the codebase, build the architectural skeleton early so later phases are not hacky add-ons.

---

# 33. BUILD JOB LOGIC DETAILS

The build queue is one of the most important operational surfaces.

Need:
- list of queued jobs
- list of active jobs
- printer assignment
- drag reorder if practical
- expected finish times
- ability to mark printer busy / available / maintenance
- ability to retry failed jobs
- ability to clone a failed job into a retry job
- ability to record actual duration and material use

Failure reasons should support values like:
- adhesion_failure
- warping
- spaghetti
- nozzle_clog
- filament_break
- support_failure
- layer_shift
- resin_fail
- operator_abort
- machine_fault
- unknown

---

# 34. PROJECT DETAIL EXPERIENCE

Project detail cannot be a boring wall of fields.

I want:
- strong hero header
- owner and status visible immediately
- blocker visibility immediately
- due date and priority obvious
- quick actions
- tabbed content
- good file history area
- build history
- material history
- comments / discussion
- audit trail
- related printers
- recent activity

Make it feel like the command center for a single engineering effort.

---

# 35. OPERATOR EXPERIENCE

The operator experience matters.

When an operator opens the app, they should quickly see:
- what printer they care about
- what jobs are assigned
- what file revision is approved
- what material is intended
- what to do next
- what is blocked
- what failed recently

This means the operator flows must be fast and clean.
Do not bury operational actions under three layers of enterprise nonsense.

---

# 36. MATERIAL NORMALIZATION RULES

This is important.

We must keep both:
- the normalized engineering family
- the vendor-specific display name

Example:
Vendor display name might be:
- “PETG HF”
- “Hyper PLA”
- “PLA+”
- “Fiberon PA6-CF20”
- “Blu Clear”
- “Tenacious Black”

Internal normalized family may be:
- PETG_HS
- PLA_HS
- PLA_PLUS
- PA6_CF
- TOUGH
- FLEXIBLE

The UI should show both when useful:
- Display name for specificity
- normalized family for comparison and filtering

Do not flatten away the important detail.

---

# 37. PRINTER COMPATIBILITY MODEL

Materials should optionally support compatibility hints.

Need a compatibility table or structured metadata so the system can later express:
- recommended
- allowed
- caution
- restricted
- not_applicable

Examples:
- resin materials only valid for resin printers
- abrasive CF/GF materials may recommend hardened nozzle
- flexible materials may show caution for certain feed systems
- high temp engineering materials may prefer enclosed or chamber-heated machines

This can be advisory in v1, but the data model should support it properly.

---

# 38. SAVED VIEWS AND FILTERS

Users should be able to save useful work views.

Examples:
- my active projects
- blocked projects
- large-format builds
- resin-only jobs
- jobs due this week
- printers in maintenance
- experimental materials

Each saved view should preserve:
- filters
- sorts
- visible columns
- page density
- default landing preference if user chooses

---

# 39. COMMAND PALETTE

Add a serious command palette.

It should allow:
- search entity
- navigate directly to project/printer/material
- create project
- create printer
- create build job
- open uploads
- view analytics
- jump to admin sections if authorized

Fast keyboard-driven workflow is important.

---

# 40. EMPTY STATES AND LOADING STATES

Do not leave blank dead pages.

Need:
- empty state illustrations or structured placeholders
- CTA buttons for first action
- skeleton loaders
- loading indicators with purpose
- no janky layout shifts

The product should feel premium even before the database is full.

---

# 41. RESPONSIVENESS

The primary target is desktop and tablet.
Mobile can be limited but still functional for dashboards and light edits.

Need:
- good tablet printer-room usability
- dense table handling
- card fallback on small screens
- drawers instead of impossible full-page forms on narrow widths

---

# 42. ACCESSIBILITY

Need:
- visible focus rings
- keyboard nav
- semantic labels
- contrast-safe status indicators
- not relying on color alone for meaning

Make this professional software, not aesthetic-only software.

---

# 43. IMPLEMENTATION GUIDELINES FOR CODE QUALITY

I want real code quality:
- strong typing
- reusable domain types
- normalized constants/enums
- clear folder ownership
- no giant god components
- no giant god files
- no spaghetti state management
- no copy-paste query logic everywhere
- no random inline hardcoded JSON blobs all over the app

Use proper architecture.

---

# 44. PREFERRED DEVELOPMENT STYLE

I want the first version to already feel like a refined product.
Do not build an ugly CRUD admin shell and say “we can beautify later.”
Build solid fundamentals and polished UX together.

You can use mock data where needed during scaffolding, but the data contracts must be real and aligned with Firebase.

---

# 45. PRINTER AND MATERIAL SEEDS

Create seed data files for:
- printer model seeds
- material family seeds
- brand seeds
- Siraya resin seeds

The seed system should:
- load cleanly
- be typed
- be easily editable
- support future migration or re-seeding
- avoid duplicating records on reruns if possible

---

# 46. DETAILED PRINTER SEED EXPECTATIONS

Create capability seed entries for:

## Bambu Lab A1
Need fields for:
- brand
- model
- printerType = fdm
- technology = FFF
- build volume
- icon key
- notes
- core capability flags

## Bambu Lab P1S
Same pattern.

## Bambu Lab X1C
Same pattern, engineering-friendly flags.

## Bambu Lab X1E
Same pattern, enterprise and chamber-heating capability flags.

## Anycubic Kobra S1
Same pattern.

## Creality K2 Plus
Large-format production flags.

## Sovol SV08
Large-format and open-source-friendly flags.

## Elegoo Saturn 4 Ultra 16K
Resin/MSLA flags, resin-safe machine classification.

Make the model seeds visually and structurally clean.

---

# 47. DETAILED SIRAYA TECH EXPECTATIONS

Create a Siraya Tech seed set that can be extended.

Need:
- brand record
- normalized resin families
- seed product line entries
- resin-specific metadata fields
- notes for engineering usage
- UI filters for resin
- printer compatibility hints for resin printers only

This needs to feel like a first-class part of the application, not a hacked afterthought.

---

# 48. ADMIN TOOLS

The admin experience needs:
- manage users
- assign roles
- manage org settings
- manage printer model seeds
- manage real printer instances
- manage materials and brands
- run CSV imports
- review import conflicts
- archive/restore records
- view recent admin actions

This should be clean and secure.

---

# 49. ANALYTICS VISUAL QUALITY

Charts and reports must look good.
Use modern charting if needed.
Keep charts readable and not over-designed.

Show:
- usage trends
- failure trends
- distribution breakdowns
- printer load
- material consumption
- throughput

---

# 50. ACTIVITY FEED VISUAL QUALITY

The activity feed should not be an ugly JSON dump.
Make it:
- human-readable
- time-grouped
- actor-aware
- icon-supported
- easy to scan

Examples:
- “Andrew uploaded revision v4 of Main .3mf”
- “Printer X1E-02 changed from Available to Busy”
- “Build job BJ-104 failed: nozzle_clog”
- “Material Fiberon PA6-CF20 added as Experimental”

---

# 51. FILE HISTORY EXPERIENCE

The file history area should allow:
- list revisions
- show who uploaded
- show timestamp
- show size
- show parse status
- show current revision
- mark as approved current
- show preview
- download/open reference
- compare metadata side by side if feasible

This is a core product differentiator.

---

# 52. DATA HYGIENE AND GOVERNANCE

Need:
- consistent IDs
- consistent enums
- timestamps everywhere
- updatedAt touch behavior
- actor tracking
- logical archive behavior
- no accidental hard deletes by default

Design it like a real internal operational platform.

---

# 53. OPTIONAL ADVANCED NICE-TO-HAVES IF TIME ALLOWS

If you have time after the core is solid, good advanced optional features:
- drag and drop queue ordering
- timeline visualization of printer availability
- quick “clone project” action
- QR label generation for printers or projects
- upload evidence images from tablet camera
- estimated completion time callouts
- printer downtime logs
- maintenance reminder chips

Do not let these derail the core build.

---

# 54. WHAT I WANT GENERATED IN THE INITIAL REPO

I want you to generate:
- the initial full app scaffold
- the domain types
- Firebase wiring
- the app shell
- the auth flow
- the primary routes
- the design system baseline
- the seed data files
- the core Firestore schema mapping
- the protected route logic
- the first-pass UI for the major pages
- representative dummy data fallback where useful
- action contracts and validation schemas
- starter security-rule intent docs or implementation files

---

# 55. EXPECTED OUTPUT STYLE FROM YOU

When you generate code and project structure:
- be decisive
- avoid filler explanation
- create files directly
- keep naming coherent
- keep types strict
- keep components modular
- keep the aesthetic premium
- keep the architecture scalable

If you need placeholders, make them high quality placeholders.

---

# 56. FINAL EXECUTION PRIORITIES

Your priority order is:
1. architecture
2. auth
3. data model
4. project workflows
5. file workflows
6. printer workflows
7. material workflows
8. analytics
9. admin tools
10. polish

Do not reverse that order.

---

# 57. HARD CONSTRAINTS

Do not:
- build a storefront
- over-focus on customers
- build random unrelated manufacturing features
- treat uploads as dumb blob storage only
- make materials hardcoded and non-extensible
- make printers hardcoded and non-extensible
- make role permissions an afterthought
- create an ugly UI
- ignore dark mode
- ignore tablet usability
- ignore auditability

---

# 58. DELIVERY ATTITUDE

Build this like a serious internal enterprise platform for a technically demanding 3D print engineering firm.

The result should feel:
- sharp
- expensive
- modern
- operationally useful
- scalable
- real

Start by scaffolding the repository and core application architecture, then implement the first real workflows with Firebase-backed models and strong seed data.

Do not underbuild this.

# 59. DETAILED ROUTE MAP

Use a route structure that is obvious and scalable.

Recommended:
- /login
- /onboarding
- /overview
- /projects
- /projects/[projectId]
- /projects/[projectId]/files
- /projects/[projectId]/builds
- /projects/[projectId]/history
- /printers
- /printers/[printerId]
- /materials
- /materials/[materialId]
- /queue
- /analytics
- /admin
- /admin/users
- /admin/printers
- /admin/materials
- /admin/imports
- /admin/settings

Use protected route logic.
Unauthorized users should not see privileged routes.

---

# 60. SUGGESTED COMPONENT INVENTORY

Build a reusable component inventory so the app feels consistent.

Need reusable components like:
- AppShell
- SidebarNav
- TopCommandBar
- ThemeToggle
- UserMenu
- StatusBadge
- PriorityBadge
- PrinterStatusPill
- MaterialFamilyChip
- BrandPill
- SearchCommandPalette
- KPICard
- EmptyStateCard
- SkeletonBlock
- ActivityTimeline
- AuditDiffCard
- FileDropzone
- RevisionList
- RevisionCard
- BuildJobCard
- BuildQueueRow
- PrinterCard
- PrinterGrid
- PrinterMiniBadge
- MaterialTable
- MaterialForm
- MaterialImportWizard
- ProjectCard
- ProjectTable
- ProjectKanbanColumn
- BlockerCard
- DueDateChip
- OwnerAvatarGroup
- FilterBar
- SavedViewDropdown
- DataTableToolbar
- CreateProjectModal
- CreatePrinterDrawer
- CreateMaterialDrawer
- CreateBuildJobModal
- ConfirmDialog
- ErrorStatePanel
- NotFoundState
- NotificationCenter
- AnalyticsCard
- ChartPanel
- UtilizationHeatmap
- CSVExportButton

All of these should feel like part of one polished system.

---

# 61. DESIGN TOKEN DIRECTION

Define design tokens early.

## Typography
- large, sharp page titles
- medium section headers
- compact body copy
- strong numeric styling for KPIs
- monospace usage only when useful for IDs, serials, or filenames

## Spacing
- generous shell spacing
- tighter dense-table spacing
- comfortable drawer/modal spacing
- consistent gap scale

## Radius
- modern rounded corners, not bubbly toy corners

## Shadows
- subtle, layered, premium

## Borders
- crisp and restrained

## Surfaces
- page background
- card background
- elevated panels
- active/selected surfaces
- destructive/high-risk surfaces

Do not leave the visual system vague.

---

# 62. TABLE DESIGN REQUIREMENTS

This app will live and die by its table quality.

Tables need:
- sticky headers where appropriate
- column resizing if practical
- sorting
- filtering
- density toggle
- column visibility toggle
- row actions
- row selection for bulk actions
- keyboard-friendly navigation
- compact but readable styling
- graceful empty states

Primary dense tables:
- projects
- materials
- printers
- build jobs
- activity log
- file revisions

---

# 63. KANBAN REQUIREMENTS FOR PROJECTS

Provide a kanban view for project statuses.

Columns:
- intake
- scoping
- design_in_progress
- ready_for_print
- queued
- printing
- post_processing
- validation
- complete
- on_hold

Behavior:
- drag between statuses if authorized
- status counts on columns
- cards show owner, due date, blockers, and quick status info
- support filter persistence

Make it functional, not just pretty.

---

# 64. PROJECT CREATION FLOW

When a user creates a project, use a fast guided flow.

Suggested steps:
1. basic info
2. owner and collaborators
3. target material
4. preferred printers
5. due date and priority
6. optional initial file upload

After creation:
- land the user in project detail
- create initial activity event
- optionally prompt upload of main .3mf

---

# 65. FILE APPROVAL FLOW

Need a clean file approval flow.

Suggested behavior:
- user uploads a revision
- system parses and stores metadata
- lead or authorized user can mark revision as current / approved
- system supersedes previous current revision
- system logs audit event
- project detail updates immediately

If multiple revisions exist:
- clearly show current
- clearly show previous
- clearly show parse issues
- clearly show upload history

---

# 66. BUILD JOB CREATION FLOW

Create build job flow should feel operationally crisp.

Suggested form:
- select project
- select approved file revision
- select printer
- select material
- assign operator
- quantity planned
- estimated print time
- optional notes
- create job

Post-create:
- place in queue
- show on queue page
- show on project detail
- show on printer if assigned

---

# 67. BUILD JOB EXECUTION FLOW

Operator execution flow should be minimal friction.

On a queued or assigned job:
- open job
- verify file revision
- verify material
- verify printer
- begin preflight
- start printing
- pause if needed
- fail with reason if needed
- complete and record actuals

If failed:
- require failure reason
- optional evidence photo
- optional retry clone
- notify owner and lead

If completed:
- record actual duration
- record actual material used if known
- prompt post-processing / validation progression

---

# 68. PRINTER MAINTENANCE MODEL

Do not leave maintenance as just a text note.

Need maintenance records:
- maintenanceRecordId
- printerId
- type
- title
- description
- createdAt
- resolvedAt
- createdBy
- status
- notes

Maintenance types:
- routine
- nozzle_replacement
- calibration
- cleaning
- repair
- diagnostics
- upgrade
- other

Status:
- scheduled
- in_progress
- resolved
- deferred

A printer in maintenance should be visually obvious and protected from accidental new job assignment.

---

# 69. TEAM / LOCATION MODEL

The organization may have multiple teams and locations.

Add support for:
- teams
- locations
- bays / rooms / labs

Use cases:
- printer belongs to a room or cell
- user belongs to team
- dashboard can filter by location or team

Even if basic in v1, model it now.

---

# 70. TAGGING MODEL

Need flexible tagging.

Support tags on:
- projects
- materials
- printers if useful later

Example project tags:
- prototype
- tooling
- urgent
- customer_internal
- validation_required
- research
- production_trial
- resin
- fdm
- composite

Example material tags:
- high_temp
- flexible
- abrasive
- cf
- gf
- transparent
- outdoor
- support
- engineering
- aesthetic

Do not hardcode them forever.
Support admin management or at least scalable definitions.

---

# 71. SEARCH TOKEN STRATEGY

For v1 search, generate normalized search tokens on write.

Examples:
- lowercase
- remove punctuation where useful
- split brand/model/title/code words
- store token arrays for prefix-ish search behavior

Search coverage suggestions:
Projects:
- title
- code
- description keywords
- owner name
Printers:
- nickname
- brand
- model
- asset tag
Materials:
- display name
- family
- brand
- aliases
Files:
- filename
- canonical name
- slicer
Jobs:
- build job ID
- project title
- printer nickname

Make the search architecture swappable later.

---

# 72. SAMPLE DOMAIN TYPES

Create strong TypeScript domain models.
For example:

Project
Printer
Material
BuildJob
FileArtifact
FileRevision
ActivityEvent
Blocker
Notification
SavedView
UserProfile
OrganizationMember

Keep these in dedicated domain/type files.
Do not scatter them randomly.

---

# 73. VALIDATION STRATEGY

Use Zod or equivalent.

Need validation schemas for:
- createProject
- updateProject
- createPrinter
- updatePrinter
- createMaterial
- updateMaterial
- createBuildJob
- transitionBuildJob
- createFileArtifact
- createUploadSession
- finalizeRevision
- setCurrentRevision
- createBlocker
- resolveBlocker
- CSV import row parse

Centralize validation.
Do not duplicate form validation and server validation separately in fragile ways.

---

# 74. FIRESTORE WRITE STRATEGY

Prefer controlled writes for sensitive actions.

Safe client writes can be okay for simpler low-risk records if rules are strict.
But use trusted functions or server actions for:
- permission-sensitive transitions
- import pipelines
- file finalization
- approval actions
- audit append logic if needed
- cross-document consistency actions

---

# 75. ACTIVITY EVENT STRATEGY

Activity events should be generated consistently.

Potential actions:
- project.created
- project.updated
- project.owner_changed
- project.status_changed
- file.artifact_created
- file.revision_uploaded
- file.revision_approved
- printer.created
- printer.status_changed
- material.created
- material.updated
- buildjob.created
- buildjob.status_changed
- blocker.opened
- blocker.resolved
- notification.generated
- import.materials_completed

This should later feed analytics and audits.

---

# 76. SAVED VIEW DATA CONTRACT

A saved view should support:
- entityType
- ownerUid
- name
- filters
- sort
- visibleColumns
- density
- isDefault
- createdAt
- updatedAt

Entity types:
- projects
- printers
- materials
- buildJobs

---

# 77. SEED DATA STRUCTURE GUIDANCE

Create clean seed data files in /data/seeds.

Examples:
- printerModels.seed.ts
- materialFamilies.seed.ts
- materialBrands.seed.ts
- sirayaResins.seed.ts
- demoProjects.seed.ts if needed
- demoPrinters.seed.ts if needed

Each seed file should be typed and importable.
Optionally include seed runner logic if appropriate.

---

# 78. DEMO DATA APPROACH

For early UX polish, it is acceptable to create sample seeded demo data.
But:
- demo data must align with real schema
- do not make fake fields that do not exist in production
- make the mock data believable and operationally useful

Example demo records:
- Project Falcon Bracket
- Project Sensor Housing
- Project UAV Duct Revision
- Printer X1E-02
- Printer K2PLUS-LF-01
- Material Fiberon PA6-CF20
- Material Siraya Blu Clear
- Job in progress on P1S-01

Make the demo feel like a real engineering team is using it.

---

# 79. ERROR HANDLING UX

Need proper user-facing error handling.

Examples:
- upload failed
- permissions issue
- invalid transition
- duplicate material import
- file parse failure
- missing project owner
- printer unavailable
- restricted material selected

Use:
- clear error toast
- inline form field error
- recoverable messaging
- retry actions where appropriate

Avoid cryptic raw exception dumps.

---

# 80. LOGICAL ARCHIVE BEHAVIOR

Support logical archive for:
- projects
- printers
- materials

Archived records should:
- disappear from default operational lists
- remain searchable if filters allow
- preserve history
- remain restorable by admins or authorized roles

Do not hard-delete important records casually.

---

# 81. NOTIFICATION PANEL UX

The notification system should feel modern.

Need:
- bell or inbox in header
- unread count
- grouped notifications
- click to navigate to related entity
- mark read
- mark all read

Types:
- info
- warning
- critical
- assignment
- approval
- failure

---

# 82. CHARTING / REPORT COMPONENT EXPECTATIONS

Analytics panels should support:
- clear titles
- time range toggle
- optional compare mode
- tooltip details
- export or screenshot-friendly layout
- empty-state handling

Potential chart library:
- Recharts or similar modern React chart stack

Keep styling consistent with the rest of the system.

---

# 83. QUEUE VISUALIZATION IDEAS

The queue page can include:
- grouped by printer
- grouped by status
- list mode
- board mode
- time-based queue hints

Strong idea:
Show each printer as a lane with:
- current active job
- queued upcoming jobs
- expected availability time

This would be extremely useful if implemented cleanly.

---

# 84. PERFORMANCE REQUIREMENTS

This app should feel fast.

Consider:
- route-level code splitting
- lazy loading heavy charts
- Firestore listener scoping
- pagination for historical logs
- memoized expensive tables
- server-side prefetch where helpful
- good loading states

Do not let heavy dashboards become sluggish nonsense.

---

# 85. DARK MODE QUALITY BAR

Dark mode cannot be a lazy inversion.

Need:
- deep but readable backgrounds
- layered surfaces
- clean chart colors
- proper status contrast
- polished hover states
- good table readability
- non-glowing garbage shadows

Treat dark mode as first-class.

---

# 86. TABLET PRINT-ROOM USE CASES

Assume a tablet in a print room or lab.

That means:
- large enough touch targets
- queue page usable on tablet
- job state changes easy on tablet
- printer cards readable from standing distance
- upload evidence photos possible later
- not every action requires perfect mouse precision

---

# 87. CODE COMMENTING STYLE

Comment only where it adds real clarity:
- tricky Firestore consistency logic
- state transition guards
- upload lifecycle logic
- parsing hooks
- permission reasoning

Do not fill files with noisy tutorial comments.

---

# 88. DOCUMENTATION EXPECTATIONS

Create lightweight useful docs in /docs:
- architecture overview
- Firebase setup
- env vars
- seed usage
- local dev instructions
- deployment notes
- Firestore schema summary
- security rule overview

Keep docs concise and operational.

---

# 89. ENVIRONMENT VARIABLES / CONFIG

Document env vars for:
- Firebase client config
- Firebase service account or admin config as applicable
- storage bucket
- optional feature flags
- environment label

Use a clean env strategy.

---

# 90. DEPLOYMENT READINESS

The code should be deployable.
Do not make a repo that only works in theory.

Need:
- environment setup docs
- buildable Next.js app
- Firebase integration stubs or actual wiring
- realistic config handling
- no obviously broken imports
- coherent route structure

---

# 91. FEATURE FLAGS

If useful, create lightweight feature flags for:
- analytics advanced mode
- queue drag reorder
- import wizard beta
- machine telemetry placeholders
- resin advanced fields

This can help keep the system extensible.

---

# 92. DATA MIGRATION THINKING

Even if this starts small, think about future migrations.

Examples:
- evolving material schema
- adding lot tracking later
- adding BigQuery later
- adding machine telemetry later
- adding external integrations later

Do not hardcode assumptions that break future expansion.

---

# 93. FUTURE LOT TRACKING HOOKS

Even if not fully implemented now, reserve room for:
- spool lot number
- resin batch number
- opened date
- remaining weight
- storage condition
- drying history

Just build the schema with optional future hooks, not full UX if not needed now.

---

# 94. FUTURE MACHINE TELEMETRY HOOKS

Reserve room for:
- last heartbeat
- current nozzle temp
- bed temp
- chamber temp
- active job progress
- machine error code
- camera status
- uptime
- total runtime hours

These can be placeholders in v1, but the domain should not block them later.

---

# 95. PROJECT PRIORITY MODEL

Create a clean priority model:
- low
- normal
- high
- urgent
- critical

Use strong visual cues.
Do not make every project look equally important.

---

# 96. BLOCKER EXPERIENCE

Blockers must stand out.

Need blocker cards with:
- severity
- title
- owner
- status
- created time
- due/resolution expectation if added
- relation to project

Severity:
- low
- medium
- high
- critical

The project card and detail header should surface blocker count clearly.

---

# 97. AUDIT DIFF EXPERIENCE

If feasible, activity items for edits should support simple before/after diffs for key fields:
- status
- owner
- due date
- material
- printer
- revision current pointer

Even lightweight diff summaries would be extremely useful.

---

# 98. ID STRATEGY

Use stable, understandable IDs when useful.

Examples:
- projectId can be firestore-generated but expose human code like PF-00124
- buildJobId can expose human-readable code like BJ-00091
- printer nickname can be human-managed like X1E-02
- material IDs can remain internal but display names drive UX

Think through the human side of IDs.

---

# 99. FAVORITES / QUICK ACCESS

Optional but strong UX improvement:
Allow users to favorite:
- projects
- printers
- saved views

That makes repeat operational work faster.

---

# 100. QUICK ACTIONS EVERYWHERE

Strong enterprise UX means meaningful quick actions.

Examples:
Projects:
- open
- assign owner
- upload file
- create build job
- open blocker
Printers:
- mark busy
- mark maintenance
- assign next job
- view history
Materials:
- duplicate
- archive
- compare
- restrict
Queue jobs:
- start
- pause
- fail
- complete
- clone retry

---

# 101. FILTER DESIGN

Filter UX must be good.
I want good multi-filter behavior, not clumsy filter spaghetti.

Examples:
Projects:
- status
- priority
- owner
- blocked
- due date
- material family
- printer
Printers:
- status
- brand
- model
- printer type
- location
Materials:
- brand
- family
- resin/filament
- approval state
- compatibility hints
Jobs:
- status
- operator
- printer
- project
- failure reason
- date range

---

# 102. BRANDING / HEADER COPY STYLE

Use clean, confident product copy.
No cheesy “welcome to the future of additive synergy” nonsense.

Headers should be direct:
- Projects
- Printer Fleet
- Material Registry
- Build Queue
- Revision History
- Analytics
- Admin

Subcopy should be useful, not bloated.

---

# 103. IMPORT CONFLICT HANDLING

When importing materials or printers:
- detect duplicate names or IDs
- detect probable same item with different formatting
- offer create/update/skip actions
- show conflict summary
- let admin dry-run before commit

This is important because material catalogs get messy fast.

---

# 104. INTERNAL SEARCH RESULT DESIGN

Search results should show enough detail to identify the target quickly.

Project result:
- title
- code
- owner
- status

Printer result:
- nickname
- brand + model
- current status

Material result:
- display name
- brand
- family

Build job result:
- job code
- project
- printer
- status

File result:
- filename
- project
- revision
- uploaded by

---

# 105. OVERVIEW DASHBOARD LAYOUT SUGGESTION

Recommended visual structure:
Top row:
- Active Projects KPI
- Blocked Projects KPI
- Printers Running KPI
- Queued Jobs KPI
- Failed Jobs 7d KPI
- Completed Jobs 7d KPI

Second row:
- Active Project Board
- Printer Fleet Snapshot

Third row:
- Build Queue Preview
- Most Used Materials
- Recent Failures

Fourth row:
- Recent Activity Feed

Keep it executive-friendly but still operational.

---

# 106. PROJECT DETAIL HEADER SPEC

Recommended header contents:
- project title
- project code
- status badge
- priority badge
- owner
- due date
- blocker count
- requested material
- preferred printer(s)
- quick actions

This should be the first thing visible on load.

---

# 107. PRINTER DETAIL PAGE SPEC

A printer detail page should include:
- printer hero card
- status
- brand/model
- nickname
- location
- serial
- asset tag
- current job
- queued jobs
- maintenance history
- recent failures
- runtime or utilization snapshots if available
- supported material families
- notes

Make it feel like a machine profile, not generic metadata.

---

# 108. MATERIAL DETAIL PAGE SPEC

A material detail page should include:
- display name
- brand
- normalized family
- resin vs filament
- status
- tags
- notes
- compatibility hints
- drying notes
- usage metrics
- jobs using this material
- projects using this material
- source / reference note if captured

---

# 109. ADMIN USER MANAGEMENT SPEC

Admin user view should include:
- avatar
- name
- email
- role
- team
- active status
- last seen
- actions to change role / deactivate / reactivate

Keep this safe and clear.

---

# 110. CODE GENERATION BEHAVIOR I EXPECT FROM YOU

As you generate the codebase:
- scaffold intelligently
- create realistic reusable types
- create feature folders
- wire the design system
- do not leave giant TODO-only placeholders
- produce a buildable skeleton with real momentum

When uncertain, choose scalable clarity over shortcuts.

---

# 111. USE MEANINGFUL NAMES

Use names like:
- ProjectStatus
- BuildJobStatus
- PrinterOperationalStatus
- MaterialApprovalState
- MaterialClass
- MaterialFamily
- RevisionStatus
- ActivityActionType

Avoid lazy names like data1, stuff, tempList, or generic “item” everywhere.

---

# 112. INTERNAL FILE STORAGE PATH STRATEGY

Use structured storage paths.
Suggested:
- /orgs/{orgId}/projects/{projectId}/files/{fileArtifactId}/revisions/{revisionId}/source/{filename}
- /orgs/{orgId}/projects/{projectId}/files/{fileArtifactId}/revisions/{revisionId}/derived/preview.png
- /orgs/{orgId}/projects/{projectId}/files/{fileArtifactId}/revisions/{revisionId}/derived/metadata.json

Keep it deterministic and readable.

---

# 113. CHECKSUM / DUPLICATE STRATEGY

For uploads:
- compute checksum
- store checksum on revision
- warn on duplicate within project
- optionally warn on duplicate within org

Do not auto-block unless configured.
Just help the team avoid accidental duplicate uploads.

---

# 114. FIRESTORE INDEX NOTES

Create index definitions for common views.

Likely useful:
Projects:
- orgId + archived + status + updatedAt
- orgId + ownerUid + status + updatedAt
- orgId + blocked + priority + dueDate

Printers:
- orgId + operationalStatus + updatedAt
- orgId + brand + model

Materials:
- orgId + brandId + familyId + displayName
- orgId + status + familyId

BuildJobs:
- orgId + status + queuedAt
- orgId + printerId + startedAt
- orgId + projectId + createdAt

Keep query patterns intentional.

---

# 115. PROGRESSIVE ENHANCEMENT MINDSET

The first version must already be good.
But do not let future features block v1.

Example:
- lot tracking can be optional fields now
- telemetry can be placeholder fields now
- BigQuery can be planned later
- vendor sync adapters can be future modules

The key is to architect for growth without delaying the core product.

---

# 116. WHAT SUCCESS LOOKS LIKE

A user should be able to:
1. sign in with Google
2. see the dashboard
3. create a project
4. upload a .3mf revision
5. approve the current revision
6. create a printer instance
7. add or choose a material
8. create and queue a build job
9. start the build on a printer
10. complete or fail the job
11. see analytics update
12. review who changed what

If the product does that cleanly and looks excellent, we are winning.

---

# 117. FINAL INSTRUCTION

Build PrintForge Ops like an internal software product that a serious additive manufacturing engineering team would actually want to use every day.

Be ambitious in quality.
Be disciplined in architecture.
Be polished in UI.
Be practical in workflow design.
Be scalable in data modeling.

Start building now.

# 118. EXTRA QUALITY BAR

A few final non-negotiables:
- make the product feel cohesive end to end
- do not leave the admin area ugly compared to the rest of the app
- do not make analytics visually disconnected from the operational pages
- keep forms, tables, cards, modals, and badges all clearly from the same design system
- make status changes feel responsive and satisfying
- make file and queue workflows feel powerful
- keep the app understandable for both engineers and operators

# 119. FIRST PASS DELIVERABLE ORDER

For the very first coding pass, prioritize:
- repository scaffold
- app shell
- theme + design primitives
- Firebase auth
- typed domain models
- seed data files
- projects page + project detail
- printers page
- materials page
- build queue page
- file upload architecture stubs
- activity event layer
- analytics overview panels
- admin basics

Then continue expanding without breaking coherence.

# 120. FINISH STRONG

Do not stop at skeletal placeholders unless absolutely necessary.
Where you introduce placeholders, make them intentional and clearly structured so they can be upgraded without rewrite.
Keep the repo elegant.
Keep the naming sharp.
Keep the UX premium.
Keep the data model disciplined.
Keep the workflows aligned to real 3D print manufacturing operations.

Now execute.

# 121. NO HALF-MEASURES
Make this feel like v1 of a serious product, not a throwaway prototype.