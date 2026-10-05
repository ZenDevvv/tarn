# Graph Report - test-project2  (2026-10-04)

## Corpus Check
- 315 files · ~511,402 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: (none) 7, .toml 5, .mdc 4)

## Summary
- 2642 nodes · 7825 edges · 87 communities (80 shown, 7 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 200 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `db7ccede`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- .agents/skills/impeccable/scripts/live-browser.js
- .cursor/skills/impeccable/scripts/live-browser.js
- .github/skills/impeccable/scripts/live-browser.js
- connectSSE
- connectSSE
- connectSSE
- initGlobalBar
- initGlobalBar
- initGlobalBar
- .agents/skills/impeccable/scripts/modern-screenshot.umd.js
- .cursor/skills/impeccable/scripts/modern-screenshot.umd.js
- .github/skills/impeccable/scripts/modern-screenshot.umd.js
- setLiveState
- setLiveState
- el
- el
- showToast
- syncPageChatFocus
- el
- router.tsx
- initPageChat
- syncPageChatFocus
- app.ts
- types/src/index.ts
- application.routes.ts
- web/package.json
- auth-context.tsx
- showToast
- mountSvelteComponentVariant
- api/package.json
- handleManualEditActivity
- cn
- captureElementToBlob
- handleManualEditActivity
- showToast
- handleManualEditActivity
- scripts
- normalizeManualContextText
- database/package.json
- applications-page.tsx
- resolveLiveInjectionAnchor
- onAnnotDown
- follow-up.routes.ts
- compilerOptions
- jobParserService
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
- error-handler.ts
- authenticate.ts
- createLiveBrowserDomHelpers
- createLiveBrowserDomHelpers
- dependencies
- dashboard-page.tsx
- entities.ts
- resolveLiveInjectionAnchor
- dependencies
- devDependencies
- follow-up.service.ts
- scheduleAcceptCleanup
- mountSvelteComponentVariant
- enableInlineEdit
- compilerOptions
- stage-ring.tsx
- devDependencies
- compilerOptions
- compilerOptions
- .agents/skills/impeccable/scripts/live-browser-ignores.js
- ../../tsconfig.base.json
- .cursor/skills/impeccable/scripts/live-browser-ignores.js
- .github/skills/impeccable/scripts/live-browser-ignores.js
- setLiveState
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
- `ApplicationFiltersProps` --references--> `ApplicationStatus`  [EXTRACTED]
  apps/web/src/features/applications/components/application-filters.tsx → packages/types/src/entities.ts
- `PriorityGlyphProps` --references--> `Priority`  [EXTRACTED]
  apps/web/src/features/applications/components/priority-glyph.tsx → packages/types/src/entities.ts

## Import Cycles
- None detected.

## Communities (87 total, 7 thin omitted)

### Community 0 - ".agents/skills/impeccable/scripts/live-browser.js"
Cohesion: 0.03
Nodes (136): applyGlobalBarLabelState(), applyLiveBarPreference(), applyParamValue(), applyPlaceholderSizingStyles(), averageRgb01(), bindEditBadgeProxy(), bufferToBase64(), buildCollapsible() (+128 more)

### Community 1 - ".cursor/skills/impeccable/scripts/live-browser.js"
Cohesion: 0.03
Nodes (137): addManualContextText(), applyGlobalBarLabelState(), applyPlaceholderSizingStyles(), bindEditBadgeProxy(), bufferToBase64(), buildCollapsible(), buildColorModels(), buildDesignHeader() (+129 more)

### Community 2 - ".github/skills/impeccable/scripts/live-browser.js"
Cohesion: 0.03
Nodes (136): applyGlobalBarLabelState(), applyLiveBarPreference(), applyParamValue(), applyPlaceholderSizingStyles(), averageRgb01(), bindEditBadgeProxy(), bufferToBase64(), buildCollapsible() (+128 more)

### Community 3 - "connectSSE"
Cohesion: 0.07
Nodes (76): applyParamDefaults(), applyPlaceholderDimensions(), applySavedSessionMeta(), checkpointPayload(), clampVariantIndex(), clearSession(), closedClipPath(), commitAcceptedVariantToDom() (+68 more)

### Community 4 - "connectSSE"
Cohesion: 0.06
Nodes (88): abortSvelteComponentInjection(), applyParamDefaults(), applyParamValue(), applyPlaceholderDimensions(), applySavedSessionMeta(), buildParamsPanel(), checkpointPayload(), clampVariantIndex() (+80 more)

### Community 5 - "connectSSE"
Cohesion: 0.07
Nodes (76): applyParamDefaults(), applyPlaceholderDimensions(), applySavedSessionMeta(), checkpointPayload(), clampVariantIndex(), clearSession(), closedClipPath(), commitAcceptedVariantToDom() (+68 more)

### Community 6 - "initGlobalBar"
Cohesion: 0.07
Nodes (57): agentStatusText(), barPaletteForTheme(), beginNewLiveConfiguration(), brandMarkSvg(), buildParamsPanel(), cancelInsertConfigure(), clearInsertPicking(), closeTunePopover() (+49 more)

### Community 7 - "initGlobalBar"
Cohesion: 0.11
Nodes (29): agentHasWorkInFlight(), agentStatusText(), applyLiveBarPreference(), barPaletteForTheme(), brandMarkSvg(), cursorForInsertAxis(), designPanelCss(), detectPageTheme() (+21 more)

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
Nodes (73): applyEditing(), beginNewLiveConfiguration(), buildInsertPlaceholderSnapshotFromDom(), buildLocatorForLeaf(), buildPickedAnchorSnapshot(), cancelEditing(), cancelEditingToPicking(), cancelInsertConfigure() (+65 more)

### Community 13 - "setLiveState"
Cohesion: 0.08
Nodes (56): abortSvelteComponentInjection(), applyEditing(), buildInsertPlaceholderSnapshotFromDom(), buildLocatorForLeaf(), buildPickedAnchorSnapshot(), buildPlaceholderResizeHandles(), cancelEditing(), cancelEditingToPicking() (+48 more)

### Community 14 - "el"
Cohesion: 0.07
Nodes (55): actionLabel(), applyConfigureBarChrome(), bindConfigureCountPillTooltip(), bindConfigureInlineControlHover(), bindConfigureModifierPillHover(), buildConfigureActionControl(), buildConfigureCountControl(), buildConfigureRow() (+47 more)

### Community 15 - "el"
Cohesion: 0.08
Nodes (54): actionLabel(), applyConfigureBarChrome(), bindConfigureCountPillTooltip(), bindConfigureInlineControlHover(), bindConfigureModifierPillHover(), buildConfigureActionControl(), buildConfigureCountControl(), buildConfigureRow() (+46 more)

### Community 16 - "showToast"
Cohesion: 0.14
Nodes (23): abandonForeignSession(), abandonSupersededGo(), cleanup(), clearScrollY(), discardedWrappers(), discardOrphanedSession(), discardStateStyleId(), handleAccept() (+15 more)

### Community 17 - "syncPageChatFocus"
Cohesion: 0.10
Nodes (43): agentHasWorkInFlight(), armPageChatForTyping(), attachSteerFocusDebug(), attachSteerFocusGuard(), buildSteerProcessingDots(), buildSteerQueueHint(), clearSteerAwaitTimer(), clearSteerFocusRecoverTimer() (+35 more)

### Community 18 - "el"
Cohesion: 0.08
Nodes (54): actionLabel(), applyConfigureBarChrome(), bindConfigureCountPillTooltip(), bindConfigureInlineControlHover(), bindConfigureModifierPillHover(), buildConfigureActionControl(), buildConfigureCountControl(), buildConfigureRow() (+46 more)

### Community 19 - "router.tsx"
Cohesion: 0.13
Nodes (21): AppProviders(), queryClient, Theme, ThemeContext, ThemeContextType, ThemeProvider(), useTheme(), AppRouter() (+13 more)

### Community 20 - "initPageChat"
Cohesion: 0.08
Nodes (54): armPageChatForTyping(), attachSteerFocusDebug(), attachSteerFocusGuard(), buildSteerProcessingDots(), buildSteerQueueHint(), clearSteerAwaitTimer(), clearSteerFocusRecoverTimer(), collapsePageChat() (+46 more)

### Community 21 - "syncPageChatFocus"
Cohesion: 0.10
Nodes (43): agentHasWorkInFlight(), armPageChatForTyping(), attachSteerFocusDebug(), attachSteerFocusGuard(), buildSteerProcessingDots(), buildSteerQueueHint(), clearSteerAwaitTimer(), clearSteerFocusRecoverTimer() (+35 more)

### Community 22 - "app.ts"
Cohesion: 0.17
Nodes (9): apiRouter, app, env, envSchema, parsed, notFoundHandler(), authRouter, server (+1 more)

### Community 23 - "types/src/index.ts"
Cohesion: 0.14
Nodes (18): applicationApi, ApplicationFiltersProps, ApplicationForm(), ApplicationFormProps, kindColor, RingKind, STATUS_CONFIG, StatusConfig (+10 more)

### Community 24 - "application.routes.ts"
Cohesion: 0.11
Nodes (15): applicationController, applicationRepository, applicationRouter, applicationService, ApplicationFiltersInput, applicationFiltersSchema, applicationStatusEnum, CreateApplicationInput (+7 more)

### Community 25 - "web/package.json"
Cohesion: 0.09
Nodes (21): @tracker/types, @tracker/validation, vitest, zod, name, private, scripts, build (+13 more)

### Community 26 - "auth-context.tsx"
Cohesion: 0.17
Nodes (13): authController, COOKIE_OPTIONS, authService, authApi, AuthContext, AuthContextType, UserDTO, LoginInput (+5 more)

### Community 27 - "showToast"
Cohesion: 0.09
Nodes (32): abandonForeignSession(), abandonSupersededGo(), applyOriginalAttrsToSvelteAnchor(), clearHandled(), commitAcceptedSvelteComponentToDom(), componentModuleCandidates(), describeMountFailure(), detectDevServerBase() (+24 more)

### Community 28 - "mountSvelteComponentVariant"
Cohesion: 0.12
Nodes (26): acceptedDomAlreadyClean(), applyOriginalAttrsToSvelteAnchor(), clearHandledWrapperReloadStamp(), commitAcceptedSvelteComponentToDom(), componentModuleCandidates(), deferredRecoverySuperseded(), describeMountFailure(), detectDevServerBase() (+18 more)

### Community 29 - "api/package.json"
Cohesion: 0.08
Nodes (25): tsx, vitest, zod, name, private, scripts, build, dev (+17 more)

### Community 30 - "handleManualEditActivity"
Cohesion: 0.19
Nodes (24): clearStoredManualApplyState(), fetchPendingCount(), handleManualEditActivity(), hidePendingApplyDock(), manualApplyLoadingText(), manualApplyStateKey(), manualEditEventForCurrentPage(), numberOrNull() (+16 more)

### Community 31 - "cn"
Cohesion: 0.12
Nodes (16): ConfirmDeleteModal(), ConfirmDeleteModalProps, ApplicationTimeline(), ApplicationTimelineProps, ApplicationDetailPage(), FollowUpItem(), FollowUpItemProps, InterviewCard() (+8 more)

### Community 32 - "captureElementToBlob"
Cohesion: 0.12
Nodes (20): averageRgb01(), captureChromeNodes(), captureElementFromRenderedAncestor(), captureElementToBlob(), compileShader(), cssColorToRgb01(), dominantRgb01(), findBackdropAncestor() (+12 more)

### Community 33 - "handleManualEditActivity"
Cohesion: 0.17
Nodes (26): clearStoredManualApplyState(), fetchPendingCount(), handleManualEditActivity(), hidePendingApplyDock(), manualApplyLoadingText(), manualApplyStateKey(), manualEditEventForCurrentPage(), numberOrNull() (+18 more)

### Community 34 - "showToast"
Cohesion: 0.14
Nodes (23): abandonForeignSession(), abandonSupersededGo(), cleanup(), clearScrollY(), discardedWrappers(), discardOrphanedSession(), discardStateStyleId(), handleAccept() (+15 more)

### Community 35 - "handleManualEditActivity"
Cohesion: 0.19
Nodes (24): clearStoredManualApplyState(), fetchPendingCount(), handleManualEditActivity(), hidePendingApplyDock(), manualApplyLoadingText(), manualApplyStateKey(), manualEditEventForCurrentPage(), numberOrNull() (+16 more)

### Community 36 - "scripts"
Cohesion: 0.04
Nodes (45): description, devDependencies, prettier, typescript, typescript, name, packageManager, private (+37 more)

### Community 37 - "normalizeManualContextText"
Cohesion: 0.12
Nodes (20): addManualContextText(), canRestoreManualEditElement(), collectManualContextPieces(), walk(), contextElementForManualEdit(), cssIdent(), directMixedTextRestoreNodes(), findManualEditRestoreElement() (+12 more)

### Community 38 - "database/package.json"
Cohesion: 0.07
Nodes (24): bcryptjs, @types/bcryptjs, dependencies, @prisma/client, devDependencies, bcryptjs, prisma, tsx (+16 more)

### Community 39 - "applications-page.tsx"
Cohesion: 0.14
Nodes (23): ApplicationCard(), ApplicationCardProps, formatDate(), formatDueText(), formatSalary(), isTodayOrPast(), ApplicationFilters(), ApplicationKanban() (+15 more)

### Community 40 - "resolveLiveInjectionAnchor"
Cohesion: 0.22
Nodes (15): buildSvelteExpressionTextMap(), buildSveltePropValuesFromLiveElement(), buildSveltePropValuesV2(), cloneWithoutElements(), collectTextNodes(), collectVisibleTexts(), cssEscapeIdent(), elementMatchesOriginalMarkup() (+7 more)

### Community 41 - "onAnnotDown"
Cohesion: 0.18
Nodes (18): beginEditPin(), buildAnnotationsForCapture(), buildPinElement(), cancelEditingPin(), finalizeEditingPin(), initAnnotOverlay(), localCoords(), materializePlaceholderWidth() (+10 more)

### Community 42 - "follow-up.routes.ts"
Cohesion: 0.12
Nodes (12): validateBody(), validateQuery(), followUpRouter, priorityEnum, CreateCompanyInput, createCompanySchema, UpdateCompanyInput, updateCompanySchema (+4 more)

### Community 43 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, checkJs, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, lib (+12 more)

### Community 45 - "normalizeManualContextText"
Cohesion: 0.12
Nodes (20): addManualContextText(), canRestoreManualEditElement(), collectManualContextPieces(), walk(), contextElementForManualEdit(), cssIdent(), directMixedTextRestoreNodes(), findManualEditRestoreElement() (+12 more)

### Community 46 - "actOnAgentTarget"
Cohesion: 0.22
Nodes (20): actOnAgentTarget(), agentTargetBusyReason(), agentTargetOverlayGone(), agentTargetTaken(), claimAgentTarget(), claimAndActOnAgentTarget(), declineAgentTargetBusy(), declineAgentTargetUnresolvable() (+12 more)

### Community 47 - "actOnAgentTarget"
Cohesion: 0.24
Nodes (19): actOnAgentTarget(), agentTargetBusyReason(), agentTargetOverlayGone(), agentTargetTaken(), claimAgentTarget(), claimAndActOnAgentTarget(), declineAgentTargetBusy(), declineAgentTargetUnresolvable() (+11 more)

### Community 48 - "actOnAgentTarget"
Cohesion: 0.24
Nodes (19): actOnAgentTarget(), agentTargetBusyReason(), agentTargetOverlayGone(), agentTargetTaken(), claimAgentTarget(), claimAndActOnAgentTarget(), declineAgentTargetBusy(), declineAgentTargetUnresolvable() (+11 more)

### Community 49 - "createLiveBrowserSessionState"
Cohesion: 0.22
Nodes (15): createLiveBrowserSessionState(), clearHandled(), clearScrollY(), clearSession(), isHandled(), loadSession(), markHandled(), nextCheckpointRevision() (+7 more)

### Community 50 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+10 more)

### Community 51 - "onAnnotDown"
Cohesion: 0.20
Nodes (17): beginEditPin(), buildAnnotationsForCapture(), buildPinElement(), cancelEditingPin(), clampPlaceholderSize(), finalizeEditingPin(), initAnnotOverlay(), localCoords() (+9 more)

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
Cohesion: 0.17
Nodes (10): createLiveBrowserDomHelpers(), cssId(), liveUiRoot(), makeFrozenAnchor(), own(), pickable(), rectIsUsableAnchor(), uiAppend() (+2 more)

### Community 56 - "error-handler.ts"
Cohesion: 0.16
Nodes (6): AppError, AuthorizationError, ConflictError, errorHandler(), NotFoundError, ValidationError

### Community 57 - "authenticate.ts"
Cohesion: 0.13
Nodes (15): authenticate(), AuthUser, Express, JwtPayload, Request, AuthenticationError, analyticsController, analyticsRouter (+7 more)

### Community 58 - "createLiveBrowserDomHelpers"
Cohesion: 0.17
Nodes (10): createLiveBrowserDomHelpers(), cssId(), liveUiRoot(), makeFrozenAnchor(), own(), pickable(), rectIsUsableAnchor(), uiAppend() (+2 more)

### Community 59 - "createLiveBrowserDomHelpers"
Cohesion: 0.17
Nodes (10): createLiveBrowserDomHelpers(), cssId(), liveUiRoot(), makeFrozenAnchor(), own(), pickable(), rectIsUsableAnchor(), uiAppend() (+2 more)

### Community 60 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, clsx, @fontsource-variable/bricolage-grotesque, @fontsource-variable/instrument-sans, @hookform/resolvers, lucide-react, react, react-dom (+7 more)

### Community 61 - "dashboard-page.tsx"
Cohesion: 0.09
Nodes (20): NeedsYouToday(), NeedsYouTodayProps, PipelineStrip(), StatsStrip(), StatsStripProps, InterviewItem, UpcomingInterviews(), UpcomingInterviewsProps (+12 more)

### Community 62 - "entities.ts"
Cohesion: 0.15
Nodes (12): CompanyDTO, DashboardUpcomingInterviewDTO, EmploymentType, FollowUpStatus, InterviewDTO, InterviewResult, InterviewStatus, InterviewType (+4 more)

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

### Community 67 - "scheduleAcceptCleanup"
Cohesion: 0.31
Nodes (11): acceptedDomAlreadyClean(), clearHandledWrapperReloadStamp(), deferredRecoverySuperseded(), ensureAcceptedDomClean(), findAcceptedRuntimeWrappers(), handledWrapperReloadKey(), reloadAfterMissingAcceptedDom(), restoreAcceptedDomFromSnapshot() (+3 more)

### Community 68 - "mountSvelteComponentVariant"
Cohesion: 0.12
Nodes (26): acceptedDomAlreadyClean(), applyOriginalAttrsToSvelteAnchor(), clearHandledWrapperReloadStamp(), commitAcceptedSvelteComponentToDom(), componentModuleCandidates(), deferredRecoverySuperseded(), describeMountFailure(), detectDevServerBase() (+18 more)

### Community 69 - "enableInlineEdit"
Cohesion: 0.40
Nodes (5): collectEditableTextRows(), visit(), enableInlineEdit(), onInlineInput(), wrapMixedContentTextNodes()

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

### Community 83 - "setLiveState"
Cohesion: 0.08
Nodes (56): abortSvelteComponentInjection(), applyEditing(), buildInsertPlaceholderSnapshotFromDom(), buildLocatorForLeaf(), buildPickedAnchorSnapshot(), buildPlaceholderResizeHandles(), cancelEditing(), cancelEditingToPicking() (+48 more)

### Community 84 - "compilerOptions"
Cohesion: 0.40
Nodes (5): compilerOptions, module, moduleResolution, outDir, rootDir

## Knowledge Gaps
- **262 isolated node(s):** `ConfirmDeleteModalProps`, `ApplicationFormProps`, `RecentApplicationsTableProps`, `InterviewCardProps`, `QuickSaveModalProps` (+257 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 348 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `NOTE: the compiled component imported from the dev server already carries` connect `.cursor/skills/impeccable/scripts/live-browser.js` to `.agents/skills/impeccable/scripts/live-browser.js`, `.github/skills/impeccable/scripts/live-browser.js`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `NOTE: do NOT clear the persistent scroll key here. startScrollLock` connect `.cursor/skills/impeccable/scripts/live-browser.js` to `.agents/skills/impeccable/scripts/live-browser.js`, `.github/skills/impeccable/scripts/live-browser.js`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `TODO: Enable this proxy for React/Vue/etc. adapters once their live` connect `.cursor/skills/impeccable/scripts/live-browser.js` to `.agents/skills/impeccable/scripts/live-browser.js`, `.github/skills/impeccable/scripts/live-browser.js`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `ConfirmDeleteModalProps`, `ApplicationFormProps`, `RecentApplicationsTableProps` to the rest of the system?**
  _262 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `.agents/skills/impeccable/scripts/live-browser.js` be split into smaller, more focused modules?**
  _Cohesion score 0.03078387813392574 - nodes in this community are weakly interconnected._
- **Should `.cursor/skills/impeccable/scripts/live-browser.js` be split into smaller, more focused modules?**
  _Cohesion score 0.029667365897512735 - nodes in this community are weakly interconnected._
- **Should `.github/skills/impeccable/scripts/live-browser.js` be split into smaller, more focused modules?**
  _Cohesion score 0.03078387813392574 - nodes in this community are weakly interconnected._