# Graph Report - test-project2  (2026-10-03)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 2584 nodes · 7667 edges · 88 communities (82 shown, 6 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 200 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `02bfea8a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .agents/skills/impeccable/scripts/live-browser.js
- .cursor/skills/impeccable/scripts/live-browser.js
- .github/skills/impeccable/scripts/live-browser.js
- resumeSession
- connectSSE
- connectSSE
- setLiveState
- initGlobalBar
- initGlobalBar
- .agents/skills/impeccable/scripts/modern-screenshot.umd.js
- .cursor/skills/impeccable/scripts/modern-screenshot.umd.js
- .github/skills/impeccable/scripts/modern-screenshot.umd.js
- setLiveState
- setLiveState
- el
- el
- connectSSE
- initPageChat
- el
- router.tsx
- syncPageChatFocus
- syncPageChatFocus
- app.ts
- applications-page.tsx
- application.routes.ts
- web/package.json
- auth-context.tsx
- mountSvelteComponentVariant
- mountSvelteComponentVariant
- api/package.json
- handleManualEditActivity
- application-detail-page.tsx
- showToast
- handleManualEditActivity
- showToast
- handleManualEditActivity
- scripts
- barPaletteForTheme
- database/package.json
- cn
- mountSvelteComponentVariant
- onAnnotDown
- follow-up.routes.ts
- compilerOptions
- normalizeManualContextText
- normalizeManualContextText
- actOnAgentTarget
- actOnAgentTarget
- actOnAgentTarget
- createLiveBrowserSessionState
- compilerOptions
- onAnnotDown
- createLiveBrowserSessionState
- onAnnotDown
- createLiveBrowserSessionState
- createLiveBrowserDomHelpers
- authenticate.ts
- analytics.service.ts
- createLiveBrowserDomHelpers
- createLiveBrowserDomHelpers
- dependencies
- entities.ts
- resolveLiveInjectionAnchor
- resolveLiveInjectionAnchor
- dependencies
- devDependencies
- follow-up.service.ts
- validation/package.json
- scheduleAcceptCleanup
- types/package.json
- syncEditBadgeHitProxies
- compilerOptions
- stage-ring.tsx
- devDependencies
- compilerOptions
- compilerOptions
- .agents/skills/impeccable/scripts/live-browser-ignores.js
- ../../tsconfig.base.json
- .cursor/skills/impeccable/scripts/live-browser-ignores.js
- .github/skills/impeccable/scripts/live-browser-ignores.js
- enableInlineEdit
- compilerOptions
- setup.sh script

## God Nodes (most connected - your core abstractions)
1. `connectSSE()` - 34 edges
2. `connectSSE()` - 34 edges
3. `connectSSE()` - 34 edges
4. `setLiveState()` - 33 edges
5. `setLiveState()` - 33 edges
6. `resumeSession()` - 33 edges
7. `resumeSession()` - 33 edges
8. `resumeSession()` - 33 edges
9. `setLiveState()` - 33 edges
10. `showToast()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `PipelineStripProps` --references--> `ApplicationStatus`  [EXTRACTED]
  apps/web/src/features/dashboard/components/pipeline-strip.tsx → packages/types/src/entities.ts
- `ApplicationCardProps` --references--> `ApplicationDTO`  [EXTRACTED]
  apps/web/src/features/applications/components/application-card.tsx → packages/types/src/entities.ts
- `ApplicationKanbanProps` --references--> `ApplicationDTO`  [EXTRACTED]
  apps/web/src/features/applications/components/application-kanban.tsx → packages/types/src/entities.ts
- `RecentApplicationsTableProps` --references--> `ApplicationDTO`  [EXTRACTED]
  apps/web/src/features/dashboard/components/recent-applications-table.tsx → packages/types/src/entities.ts
- `ApplicationFiltersProps` --references--> `ApplicationStatus`  [EXTRACTED]
  apps/web/src/features/applications/components/application-filters.tsx → packages/types/src/entities.ts

## Import Cycles
- None detected.

## Communities (88 total, 6 thin omitted)

### Community 0 - ".agents/skills/impeccable/scripts/live-browser.js"
Cohesion: 0.03
Nodes (138): addManualContextText(), applyGlobalBarLabelState(), applyLiveBarPreference(), averageRgb01(), bufferToBase64(), buildCollapsible(), buildColorModels(), buildDesignHeader() (+130 more)

### Community 1 - ".cursor/skills/impeccable/scripts/live-browser.js"
Cohesion: 0.03
Nodes (136): applyGlobalBarLabelState(), applyLiveBarPreference(), applyParamValue(), applyPlaceholderSizingStyles(), averageRgb01(), bindEditBadgeProxy(), bufferToBase64(), buildCollapsible() (+128 more)

### Community 2 - ".github/skills/impeccable/scripts/live-browser.js"
Cohesion: 0.03
Nodes (136): applyGlobalBarLabelState(), applyLiveBarPreference(), applyParamValue(), applyPlaceholderSizingStyles(), averageRgb01(), bindEditBadgeProxy(), bufferToBase64(), buildCollapsible() (+128 more)

### Community 3 - "resumeSession"
Cohesion: 0.05
Nodes (84): applyParamDefaults(), applyParamValue(), applyPlaceholderSizingStyles(), applySavedSessionMeta(), buildCyclingRow(), captureAndEmit(), checkpointPayload(), clampVariantIndex() (+76 more)

### Community 4 - "connectSSE"
Cohesion: 0.07
Nodes (76): applyParamDefaults(), applyPlaceholderDimensions(), applySavedSessionMeta(), checkpointPayload(), clampVariantIndex(), clearSession(), closedClipPath(), commitAcceptedVariantToDom() (+68 more)

### Community 5 - "connectSSE"
Cohesion: 0.07
Nodes (76): applyParamDefaults(), applyPlaceholderDimensions(), applySavedSessionMeta(), checkpointPayload(), clampVariantIndex(), clearSession(), closedClipPath(), commitAcceptedVariantToDom() (+68 more)

### Community 6 - "setLiveState"
Cohesion: 0.10
Nodes (60): applyEditing(), beginNewLiveConfiguration(), cancelEditing(), cancelEditingToPicking(), cancelInsertConfigure(), cleanupAcceptedSession(), clearAnnotations(), clearInsertPicking() (+52 more)

### Community 7 - "initGlobalBar"
Cohesion: 0.07
Nodes (57): agentStatusText(), barPaletteForTheme(), beginNewLiveConfiguration(), brandMarkSvg(), buildParamsPanel(), cancelInsertConfigure(), clearInsertPicking(), closeTunePopover() (+49 more)

### Community 8 - "initGlobalBar"
Cohesion: 0.07
Nodes (57): agentStatusText(), barPaletteForTheme(), beginNewLiveConfiguration(), brandMarkSvg(), buildParamsPanel(), cancelInsertConfigure(), clearInsertPicking(), closeTunePopover() (+49 more)

### Community 9 - ".agents/skills/impeccable/scripts/modern-screenshot.umd.js"
Cohesion: 0.09
Nodes (55): ae(), be(), bt(), Ce(), s(), Ct(), de(), dt() (+47 more)

### Community 10 - ".cursor/skills/impeccable/scripts/modern-screenshot.umd.js"
Cohesion: 0.09
Nodes (55): ae(), be(), bt(), Ce(), s(), Ct(), de(), dt() (+47 more)

### Community 11 - ".github/skills/impeccable/scripts/modern-screenshot.umd.js"
Cohesion: 0.09
Nodes (55): ae(), be(), bt(), Ce(), s(), Ct(), de(), dt() (+47 more)

### Community 12 - "setLiveState"
Cohesion: 0.08
Nodes (56): abortSvelteComponentInjection(), applyEditing(), buildInsertPlaceholderSnapshotFromDom(), buildLocatorForLeaf(), buildPickedAnchorSnapshot(), buildPlaceholderResizeHandles(), cancelEditing(), cancelEditingToPicking() (+48 more)

### Community 13 - "setLiveState"
Cohesion: 0.08
Nodes (56): abortSvelteComponentInjection(), applyEditing(), buildInsertPlaceholderSnapshotFromDom(), buildLocatorForLeaf(), buildPickedAnchorSnapshot(), buildPlaceholderResizeHandles(), cancelEditing(), cancelEditingToPicking() (+48 more)

### Community 14 - "el"
Cohesion: 0.08
Nodes (54): actionLabel(), applyConfigureBarChrome(), bindConfigureCountPillTooltip(), bindConfigureInlineControlHover(), bindConfigureModifierPillHover(), buildConfigureActionControl(), buildConfigureCountControl(), buildConfigureRow() (+46 more)

### Community 15 - "el"
Cohesion: 0.08
Nodes (54): actionLabel(), applyConfigureBarChrome(), bindConfigureCountPillTooltip(), bindConfigureInlineControlHover(), bindConfigureModifierPillHover(), buildConfigureActionControl(), buildConfigureCountControl(), buildConfigureRow() (+46 more)

### Community 16 - "connectSSE"
Cohesion: 0.08
Nodes (52): abandonForeignSession(), abandonSupersededGo(), abortSvelteComponentInjection(), cleanup(), clearMountErrorCard(), clearScrollY(), clearSession(), connectSSE() (+44 more)

### Community 17 - "initPageChat"
Cohesion: 0.08
Nodes (52): armPageChatForTyping(), attachSteerFocusDebug(), attachSteerFocusGuard(), buildSteerProcessingDots(), buildSteerQueueHint(), clearSteerAwaitTimer(), clearSteerFocusRecoverTimer(), collapsePageChat() (+44 more)

### Community 18 - "el"
Cohesion: 0.08
Nodes (48): actionLabel(), applyConfigureBarChrome(), bindConfigureCountPillTooltip(), bindConfigureInlineControlHover(), bindConfigureModifierPillHover(), buildConfigureActionControl(), buildConfigureCountControl(), buildConfigureRow() (+40 more)

### Community 19 - "router.tsx"
Cohesion: 0.10
Nodes (33): AppProviders(), queryClient, Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme(), AppRouter() (+25 more)

### Community 20 - "syncPageChatFocus"
Cohesion: 0.10
Nodes (43): agentHasWorkInFlight(), armPageChatForTyping(), attachSteerFocusDebug(), attachSteerFocusGuard(), buildSteerProcessingDots(), buildSteerQueueHint(), clearSteerAwaitTimer(), clearSteerFocusRecoverTimer() (+35 more)

### Community 21 - "syncPageChatFocus"
Cohesion: 0.10
Nodes (43): agentHasWorkInFlight(), armPageChatForTyping(), attachSteerFocusDebug(), attachSteerFocusGuard(), buildSteerProcessingDots(), buildSteerQueueHint(), clearSteerAwaitTimer(), clearSteerFocusRecoverTimer() (+35 more)

### Community 22 - "app.ts"
Cohesion: 0.11
Nodes (14): apiRouter, app, AppError, AuthorizationError, ConflictError, errorHandler(), NotFoundError, ValidationError (+6 more)

### Community 23 - "applications-page.tsx"
Cohesion: 0.18
Nodes (14): applicationApi, ApplicationFilters(), ApplicationFiltersProps, STAGES, kindColor, RingKind, STATUS_CONFIG, StatusConfig (+6 more)

### Community 24 - "application.routes.ts"
Cohesion: 0.11
Nodes (15): applicationController, applicationRepository, applicationRouter, applicationService, ApplicationFiltersInput, applicationFiltersSchema, applicationStatusEnum, CreateApplicationInput (+7 more)

### Community 25 - "web/package.json"
Cohesion: 0.08
Nodes (23): @tracker/types, @tracker/validation, vitest, zod, name, private, scripts, build (+15 more)

### Community 26 - "auth-context.tsx"
Cohesion: 0.17
Nodes (13): authController, COOKIE_OPTIONS, authService, authApi, AuthContext, AuthContextType, UserDTO, LoginInput (+5 more)

### Community 27 - "mountSvelteComponentVariant"
Cohesion: 0.12
Nodes (26): acceptedDomAlreadyClean(), applyOriginalAttrsToSvelteAnchor(), clearHandledWrapperReloadStamp(), commitAcceptedSvelteComponentToDom(), componentModuleCandidates(), deferredRecoverySuperseded(), describeMountFailure(), detectDevServerBase() (+18 more)

### Community 28 - "mountSvelteComponentVariant"
Cohesion: 0.12
Nodes (26): acceptedDomAlreadyClean(), applyOriginalAttrsToSvelteAnchor(), clearHandledWrapperReloadStamp(), commitAcceptedSvelteComponentToDom(), componentModuleCandidates(), deferredRecoverySuperseded(), describeMountFailure(), detectDevServerBase() (+18 more)

### Community 29 - "api/package.json"
Cohesion: 0.08
Nodes (24): tsx, vitest, zod, name, private, scripts, build, dev (+16 more)

### Community 30 - "handleManualEditActivity"
Cohesion: 0.19
Nodes (24): clearStoredManualApplyState(), fetchPendingCount(), handleManualEditActivity(), hidePendingApplyDock(), manualApplyLoadingText(), manualApplyStateKey(), manualEditEventForCurrentPage(), numberOrNull() (+16 more)

### Community 31 - "application-detail-page.tsx"
Cohesion: 0.12
Nodes (14): ApplicationTimeline(), ApplicationTimelineProps, ApplicationDetailPage(), FollowUpItem(), FollowUpItemProps, apiClient, ApiError, request() (+6 more)

### Community 32 - "showToast"
Cohesion: 0.14
Nodes (23): abandonForeignSession(), abandonSupersededGo(), cleanup(), clearScrollY(), discardedWrappers(), discardOrphanedSession(), discardStateStyleId(), handleAccept() (+15 more)

### Community 33 - "handleManualEditActivity"
Cohesion: 0.19
Nodes (24): clearStoredManualApplyState(), fetchPendingCount(), handleManualEditActivity(), hidePendingApplyDock(), manualApplyLoadingText(), manualApplyStateKey(), manualEditEventForCurrentPage(), numberOrNull() (+16 more)

### Community 34 - "showToast"
Cohesion: 0.14
Nodes (23): abandonForeignSession(), abandonSupersededGo(), cleanup(), clearScrollY(), discardedWrappers(), discardOrphanedSession(), discardStateStyleId(), handleAccept() (+15 more)

### Community 35 - "handleManualEditActivity"
Cohesion: 0.19
Nodes (24): clearStoredManualApplyState(), fetchPendingCount(), handleManualEditActivity(), hidePendingApplyDock(), manualApplyLoadingText(), manualApplyStateKey(), manualEditEventForCurrentPage(), numberOrNull() (+16 more)

### Community 36 - "scripts"
Cohesion: 0.08
Nodes (23): description, devDependencies, prettier, typescript, name, packageManager, private, scripts (+15 more)

### Community 37 - "barPaletteForTheme"
Cohesion: 0.13
Nodes (22): agentHasWorkInFlight(), agentStatusText(), barPaletteForTheme(), brandMarkSvg(), buildParamsPanel(), designPanelCss(), detectPageTheme(), ensureAgentPollTooltip() (+14 more)

### Community 38 - "database/package.json"
Cohesion: 0.09
Nodes (22): bcryptjs, @types/bcryptjs, dependencies, @prisma/client, devDependencies, bcryptjs, prisma, tsx (+14 more)

### Community 39 - "cn"
Cohesion: 0.19
Nodes (19): ApplicationCard(), ApplicationCardProps, formatDate(), formatDueText(), formatSalary(), isTodayOrPast(), ApplicationKanban(), ApplicationKanbanProps (+11 more)

### Community 40 - "mountSvelteComponentVariant"
Cohesion: 0.16
Nodes (21): applyOriginalAttrsToSvelteAnchor(), commitAcceptedSvelteComponentToDom(), componentModuleCandidates(), describeMountFailure(), detectDevServerBase(), elementMatchesOriginalMarkup(), findInsertAnchorInDom(), findLiveElementForOriginalMarkup() (+13 more)

### Community 41 - "onAnnotDown"
Cohesion: 0.15
Nodes (21): applyPlaceholderDimensions(), beginEditPin(), buildAnnotationsForCapture(), buildPinElement(), cancelEditingPin(), clampPlaceholderSize(), finalizeEditingPin(), initAnnotOverlay() (+13 more)

### Community 42 - "follow-up.routes.ts"
Cohesion: 0.12
Nodes (12): validateBody(), validateQuery(), followUpRouter, priorityEnum, CreateCompanyInput, createCompanySchema, UpdateCompanyInput, updateCompanySchema (+4 more)

### Community 43 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, checkJs, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib (+12 more)

### Community 44 - "normalizeManualContextText"
Cohesion: 0.12
Nodes (20): addManualContextText(), canRestoreManualEditElement(), collectManualContextPieces(), walk(), contextElementForManualEdit(), cssIdent(), directMixedTextRestoreNodes(), findManualEditRestoreElement() (+12 more)

### Community 45 - "normalizeManualContextText"
Cohesion: 0.12
Nodes (20): addManualContextText(), canRestoreManualEditElement(), collectManualContextPieces(), walk(), contextElementForManualEdit(), cssIdent(), directMixedTextRestoreNodes(), findManualEditRestoreElement() (+12 more)

### Community 46 - "actOnAgentTarget"
Cohesion: 0.24
Nodes (19): actOnAgentTarget(), agentTargetBusyReason(), agentTargetOverlayGone(), agentTargetTaken(), claimAgentTarget(), claimAndActOnAgentTarget(), declineAgentTargetBusy(), declineAgentTargetUnresolvable() (+11 more)

### Community 47 - "actOnAgentTarget"
Cohesion: 0.24
Nodes (19): actOnAgentTarget(), agentTargetBusyReason(), agentTargetOverlayGone(), agentTargetTaken(), claimAgentTarget(), claimAndActOnAgentTarget(), declineAgentTargetBusy(), declineAgentTargetUnresolvable() (+11 more)

### Community 48 - "actOnAgentTarget"
Cohesion: 0.26
Nodes (18): actOnAgentTarget(), agentTargetBusyReason(), agentTargetOverlayGone(), agentTargetTaken(), claimAgentTarget(), claimAndActOnAgentTarget(), declineAgentTargetBusy(), declineAgentTargetUnresolvable() (+10 more)

### Community 49 - "createLiveBrowserSessionState"
Cohesion: 0.22
Nodes (15): createLiveBrowserSessionState(), clearHandled(), clearScrollY(), clearSession(), isHandled(), loadSession(), markHandled(), nextCheckpointRevision() (+7 more)

### Community 50 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+10 more)

### Community 51 - "onAnnotDown"
Cohesion: 0.18
Nodes (18): beginEditPin(), buildAnnotationsForCapture(), buildPinElement(), cancelEditingPin(), finalizeEditingPin(), initAnnotOverlay(), localCoords(), materializePlaceholderWidth() (+10 more)

### Community 52 - "createLiveBrowserSessionState"
Cohesion: 0.22
Nodes (15): createLiveBrowserSessionState(), clearHandled(), clearScrollY(), clearSession(), isHandled(), loadSession(), markHandled(), nextCheckpointRevision() (+7 more)

### Community 53 - "onAnnotDown"
Cohesion: 0.18
Nodes (18): beginEditPin(), buildAnnotationsForCapture(), buildPinElement(), cancelEditingPin(), finalizeEditingPin(), initAnnotOverlay(), localCoords(), materializePlaceholderWidth() (+10 more)

### Community 54 - "createLiveBrowserSessionState"
Cohesion: 0.22
Nodes (15): createLiveBrowserSessionState(), clearHandled(), clearScrollY(), clearSession(), isHandled(), loadSession(), markHandled(), nextCheckpointRevision() (+7 more)

### Community 55 - "createLiveBrowserDomHelpers"
Cohesion: 0.16
Nodes (11): createLiveBrowserDomHelpers(), cssId(), liveUiRoot(), makeFrozenAnchor(), own(), pickable(), rectIsUsableAnchor(), uiAppend() (+3 more)

### Community 56 - "authenticate.ts"
Cohesion: 0.14
Nodes (12): env, envSchema, parsed, authenticate(), AuthUser, Express, JwtPayload, Request (+4 more)

### Community 57 - "analytics.service.ts"
Cohesion: 0.15
Nodes (7): analyticsService, timelineRouter, timelineService, prisma, prisma, DashboardAnalyticsDTO, @prisma/client

### Community 58 - "createLiveBrowserDomHelpers"
Cohesion: 0.17
Nodes (10): createLiveBrowserDomHelpers(), cssId(), liveUiRoot(), makeFrozenAnchor(), own(), pickable(), rectIsUsableAnchor(), uiAppend() (+2 more)

### Community 59 - "createLiveBrowserDomHelpers"
Cohesion: 0.17
Nodes (10): createLiveBrowserDomHelpers(), cssId(), liveUiRoot(), makeFrozenAnchor(), own(), pickable(), rectIsUsableAnchor(), uiAppend() (+2 more)

### Community 60 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, clsx, @fontsource-variable/bricolage-grotesque, @fontsource-variable/instrument-sans, @hookform/resolvers, lucide-react, react, react-dom (+7 more)

### Community 61 - "entities.ts"
Cohesion: 0.15
Nodes (10): StatsStripProps, WeeklyVelocityChartProps, CompanyDTO, DashboardSummaryDTO, EmploymentType, FollowUpStatus, JobDTO, TimelineEventType (+2 more)

### Community 62 - "resolveLiveInjectionAnchor"
Cohesion: 0.22
Nodes (15): buildSvelteExpressionTextMap(), buildSveltePropValuesFromLiveElement(), buildSveltePropValuesV2(), cloneWithoutElements(), collectTextNodes(), collectVisibleTexts(), cssEscapeIdent(), elementMatchesOriginalMarkup() (+7 more)

### Community 63 - "resolveLiveInjectionAnchor"
Cohesion: 0.22
Nodes (15): buildSvelteExpressionTextMap(), buildSveltePropValuesFromLiveElement(), buildSveltePropValuesV2(), cloneWithoutElements(), collectTextNodes(), collectVisibleTexts(), cssEscapeIdent(), elementMatchesOriginalMarkup() (+7 more)

### Community 64 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, bcryptjs, cookie-parser, cors, dotenv, express, jsonwebtoken, pino (+5 more)

### Community 65 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, pino-pretty, supertest, tsx, @types/bcryptjs, @types/cookie-parser, @types/cors, @types/express (+5 more)

### Community 66 - "follow-up.service.ts"
Cohesion: 0.26
Nodes (6): followUpController, followUpRepository, followUpService, CreateFollowUpInput, FollowUpFilterInput, UpdateFollowUpInput

### Community 67 - "validation/package.json"
Cohesion: 0.15
Nodes (12): dependencies, zod, devDependencies, typescript, zod, main, name, private (+4 more)

### Community 68 - "scheduleAcceptCleanup"
Cohesion: 0.31
Nodes (11): acceptedDomAlreadyClean(), clearHandledWrapperReloadStamp(), deferredRecoverySuperseded(), ensureAcceptedDomClean(), findAcceptedRuntimeWrappers(), handledWrapperReloadKey(), reloadAfterMissingAcceptedDom(), restoreAcceptedDomFromSnapshot() (+3 more)

### Community 69 - "types/package.json"
Cohesion: 0.18
Nodes (10): typescript, devDependencies, typescript, main, name, private, scripts, build (+2 more)

### Community 70 - "syncEditBadgeHitProxies"
Cohesion: 0.27
Nodes (10): bindEditBadgeProxy(), editBadgeProxyTargets(), initEditBadge(), initEditBadgeHitProxies(), positionEditBadge(), proxyMouseEvent(), setImportantStyle(), styleEditBadgeProxy() (+2 more)

### Community 71 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, declaration, declarationMap, module, moduleResolution, outDir, rootDir, extends (+1 more)

### Community 72 - "stage-ring.tsx"
Cohesion: 0.25
Nodes (7): ApplicationStatus, ApplicationStatusBadge(), kindColor, RingKind, StageRing(), STATUS_CONFIG, StatusConfig

### Community 73 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, tailwindcss, @tailwindcss/vite, @types/react, @types/react-dom, typescript, vite, @vitejs/plugin-react (+1 more)

### Community 74 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, module, moduleResolution, outDir, rootDir, extends, include

### Community 75 - "compilerOptions"
Cohesion: 0.25
Nodes (7): compilerOptions, module, moduleResolution, outDir, rootDir, extends, include

### Community 76 - ".agents/skills/impeccable/scripts/live-browser-ignores.js"
Cohesion: 0.52
Nodes (6): globToRegex(), matchesScope(), normalizeIgnoreRule(), normalizeIgnoreValue(), pageCandidates(), resolveDetectIgnores()

### Community 77 - "../../tsconfig.base.json"
Cohesion: 0.29
Nodes (5): ../../tsconfig.base.json, extends, include, extends, include

### Community 78 - ".cursor/skills/impeccable/scripts/live-browser-ignores.js"
Cohesion: 0.52
Nodes (6): globToRegex(), matchesScope(), normalizeIgnoreRule(), normalizeIgnoreValue(), pageCandidates(), resolveDetectIgnores()

### Community 79 - ".github/skills/impeccable/scripts/live-browser-ignores.js"
Cohesion: 0.52
Nodes (6): globToRegex(), matchesScope(), normalizeIgnoreRule(), normalizeIgnoreValue(), pageCandidates(), resolveDetectIgnores()

### Community 83 - "enableInlineEdit"
Cohesion: 0.40
Nodes (5): collectEditableTextRows(), visit(), enableInlineEdit(), onInlineInput(), wrapMixedContentTextNodes()

### Community 84 - "compilerOptions"
Cohesion: 0.40
Nodes (5): compilerOptions, module, moduleResolution, outDir, rootDir

## Knowledge Gaps
- **249 isolated node(s):** `Theme`, `ThemeContextType`, `NeedsYouTodayProps`, `InterviewItem`, `UpcomingInterviewsProps` (+244 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 327 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `NOTE: the compiled component imported from the dev server already carries` connect `.agents/skills/impeccable/scripts/live-browser.js` to `.cursor/skills/impeccable/scripts/live-browser.js`, `.github/skills/impeccable/scripts/live-browser.js`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `NOTE: do NOT clear the persistent scroll key here. startScrollLock` connect `.agents/skills/impeccable/scripts/live-browser.js` to `.cursor/skills/impeccable/scripts/live-browser.js`, `.github/skills/impeccable/scripts/live-browser.js`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `TODO: Enable this proxy for React/Vue/etc. adapters once their live` connect `.agents/skills/impeccable/scripts/live-browser.js` to `.cursor/skills/impeccable/scripts/live-browser.js`, `.github/skills/impeccable/scripts/live-browser.js`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **What connects `Theme`, `ThemeContextType`, `NeedsYouTodayProps` to the rest of the system?**
  _249 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.agents/skills/impeccable/scripts/live-browser.js` be split into smaller, more focused modules?**
  _Cohesion score 0.028661479365704717 - nodes in this community are weakly interconnected._
- **Should `.cursor/skills/impeccable/scripts/live-browser.js` be split into smaller, more focused modules?**
  _Cohesion score 0.03078387813392574 - nodes in this community are weakly interconnected._
- **Should `.github/skills/impeccable/scripts/live-browser.js` be split into smaller, more focused modules?**
  _Cohesion score 0.03078387813392574 - nodes in this community are weakly interconnected._