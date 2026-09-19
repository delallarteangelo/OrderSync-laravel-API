# Graph Report - web  (2026-09-18)

## Corpus Check
- 208 files · ~64,214 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: .css 1)

## Summary
- 1087 nodes · 3743 edges · 41 communities (38 shown, 1 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5acab57e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PlatformHomePage.tsx
- Topbar.tsx
- SubscriptionPage.tsx
- cn
- useApi.ts
- axios.ts
- package.json
- ProductFormPage.tsx
- dependencies
- index.ts
- PosPage.tsx
- CustomerSupportPanel.tsx
- routes.tsx
- api/aiSupport.ts
- OrderDetailPage.tsx
- react
- devDependencies
- mockDataStore.ts
- api/reports.ts
- pdf.tsx
- api/orders.ts
- isApiError
- StorefrontPage.tsx
- db.ts
- @testing-library/react
- types/orders.ts
- authStore.ts
- api/inventory.ts
- AuthProvider.tsx
- scripts
- api/auth.ts
- PlatformShell.tsx
- button.tsx
- roleGuards.ts
- storefrontCartStore.ts
- useAuthStore
- useRole
- usePersistentDraft.ts
- msw

## God Nodes (most connected - your core abstractions)
1. `cn()` - 126 edges
2. `react` - 84 edges
3. `useAuthStore` - 60 edges
4. `useBusinessId()` - 51 edges
5. `isApiError()` - 49 edges
6. `lucide-react` - 48 edges
7. `Button` - 48 edges
8. `vitest` - 39 edges
9. `react-router-dom` - 32 edges
10. `fmtDateTime()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `PlatformSidebar()` --indirect_call--> `listPlatformApplications()`  [INFERRED]
  src/app/layout/PlatformShell.tsx → src/shared/api/subscriptionApplications.ts
- `queryClient` --calls--> `isApiError()`  [EXTRACTED]
  src/app/providers/QueryProvider.tsx → src/shared/api/errors.ts
- `BusinessRegistrationPage()` --indirect_call--> `publicSubscriptionPlans()`  [INFERRED]
  src/features/auth/pages/BusinessRegistrationPage.tsx → src/shared/api/subscriptionApplications.ts
- `PlatformHomePage()` --indirect_call--> `listPlatformApplications()`  [INFERRED]
  src/features/platform/pages/PlatformHomePage.tsx → src/shared/api/subscriptionApplications.ts
- `BusinessSettingsContent()` --indirect_call--> `getTenantSubscription()`  [INFERRED]
  src/features/settings/pages/BusinessSettingsPage.tsx → src/shared/api/platform.ts

## Import Cycles
- None detected.

## Communities (41 total, 1 thin omitted)

### Community 0 - "PlatformHomePage.tsx"
Cohesion: 0.06
Nodes (57): BusinessRegistrationPage, BusinessRegistrationPage(), schema, Values, api, BillingDialog(), BusinessActions(), money() (+49 more)

### Community 1 - "Topbar.tsx"
Cohesion: 0.07
Nodes (47): @radix-ui/react-dropdown-menu, sonner, @tanstack/react-query, initialsOf(), PwForm, pwSchema, emptyKnowledge, KnowledgeDraft (+39 more)

### Community 2 - "SubscriptionPage.tsx"
Cohesion: 0.06
Nodes (57): BusinessApplicationPage, PlatformApplicationsPage, SubscriptionPage, BusinessApplicationPage(), PaymentProofPreview(), PrivatePaymentProofPreview(), Props, InstructionForm() (+49 more)

### Community 3 - "cn"
Cohesion: 0.06
Nodes (46): class-variance-authority, cmdk, @radix-ui/react-dialog, AppShell(), groups, NavGroup, NavItem, Sidebar() (+38 more)

### Community 4 - "useApi.ts"
Cohesion: 0.08
Nodes (57): CategoryListPage(), ProductFormPage(), ProductListPage(), DashboardPage(), InventoryListPage(), MovementLogPage(), RestockPage(), BusinessSettingsContent() (+49 more)

### Community 5 - "axios.ts"
Cohesion: 0.07
Nodes (31): axios, @tanstack/react-query-devtools, queryClient, QueryProvider(), ToastProvider(), router, enableMswIfNeeded(), axios (+23 more)

### Community 6 - "package.json"
Cohesion: 0.05
Nodes (42): name, private, type, version, autoprefixer, clsx, eslint, eslint-config-prettier (+34 more)

### Community 7 - "ProductFormPage.tsx"
Cohesion: 0.08
Nodes (36): react-hook-form, zod, UserFormPage, FormValues, schema, hooks, FormValues, schema (+28 more)

### Community 8 - "dependencies"
Cohesion: 0.05
Nodes (39): dependencies, axios, class-variance-authority, clsx, cmdk, date-fns, @hookform/resolvers, lucide-react (+31 more)

### Community 9 - "index.ts"
Cohesion: 0.13
Nodes (30): msw, db, findUserByToken(), randomId(), tokenFromAuthHeader(), authHandlers, authResponse(), healthHandlers (+22 more)

### Community 10 - "PosPage.tsx"
Cohesion: 0.09
Nodes (27): PosPage, PosCartState, usePosCartStore, CashierDashboard(), OrderListPage(), Props, ReceiptView(), ScanInput (+19 more)

### Community 11 - "CustomerSupportPanel.tsx"
Cohesion: 0.11
Nodes (32): Topbar(), ChatPage(), CustomerSupportPanel(), askAiAssistant(), listPublishedAiKnowledge(), requestHumanHandoff(), createThread(), getNotificationPreferences() (+24 more)

### Community 12 - "routes.tsx"
Cohesion: 0.07
Nodes (26): react-router-dom, RequireRole(), AiSupportPage, BusinessSettingsPage, businessWorkspaceRoles, CategoryListPage, DashboardPage, ForbiddenPage (+18 more)

### Community 13 - "api/aiSupport.ts"
Cohesion: 0.10
Nodes (27): AiSupportPage(), createAiKnowledge(), deactivateAiKnowledge(), getAiSupportSettings(), getAiUsage(), KnowledgeInput, listAiKnowledge(), listSupportHandoffs() (+19 more)

### Community 14 - "OrderDetailPage.tsx"
Cohesion: 0.18
Nodes (17): date-fns, recharts, SalesReportPage, statusActionLabel, STATUS_FIELDS, BucketSelector(), DataTableProps, DateRangePicker() (+9 more)

### Community 15 - "react"
Cohesion: 0.23
Nodes (16): lucide-react, react, @tanstack/react-table, reasonColor, Row, ALL_STATUSES, DataTable(), PageHeader() (+8 more)

### Community 16 - "devDependencies"
Cohesion: 0.08
Nodes (26): devDependencies, autoprefixer, eslint, eslint-config-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, lighthouse (+18 more)

### Community 17 - "mockDataStore.ts"
Cohesion: 0.13
Nodes (14): recordMovement(), State, useMockDataStore, PosProductTile(), PosProductTileProps, product, mockCategories, mockProducts (+6 more)

### Community 18 - "api/reports.ts"
Cohesion: 0.12
Nodes (19): mockSalesDaily, mockSalesMonthly, mockSalesWeekly, seededDay(), sevenDaySales, LowStockItem, DashboardSnapshot, ReportRange (+11 more)

### Community 19 - "pdf.tsx"
Cohesion: 0.11
Nodes (19): papaparse, @react-pdf/renderer, AdminDashboard(), InventoryReportPage(), OrdersReportPage(), SalesReportPage(), getInventoryReport(), useInventoryReport() (+11 more)

### Community 20 - "api/orders.ts"
Cohesion: 0.11
Nodes (22): OrderDetailPage(), StorefrontPage(), cancelCustomerOrder(), collectOrderCounterPayment(), getOrder(), getStorefront(), listCustomerOrders(), listOrders() (+14 more)

### Community 21 - "isApiError"
Cohesion: 0.28
Nodes (12): vitest, AdjustStockDialog(), isApiError(), adjustStock(), listInventory(), listMovements(), useAdjustStock(), loginAs() (+4 more)

### Community 22 - "StorefrontPage.tsx"
Cohesion: 0.25
Nodes (11): EmptyState(), EmptyStateProps, KpiCard(), KpiCardProps, Money(), MoneyProps, StatusChip(), Card (+3 more)

### Community 23 - "db.ts"
Cohesion: 0.18
Nodes (15): makeMessages(), mockMessages, mockThreads, makeMovements(), mockNotifications, NotificationItem, makeOrder(), mockPosSales (+7 more)

### Community 24 - "@testing-library/react"
Cohesion: 0.12
Nodes (11): @testing-library/react, @testing-library/user-event, hooks, order, payments, PaymentDialog(), scannerMocks, hooks (+3 more)

### Community 25 - "types/orders.ts"
Cohesion: 0.15
Nodes (13): customers, mockOrders, statusOrder, Order, OrderItem, OrderStatus, OrderStatusEvent, orderStatusSchema (+5 more)

### Community 26 - "authStore.ts"
Cohesion: 0.21
Nodes (11): AuthState, apiMocks, currentUser, adminUser, cashierUser, mockUsers, superAdminUser, AuthSession (+3 more)

### Community 27 - "api/inventory.ts"
Cohesion: 0.19
Nodes (11): mockMovements, reasons, MovementFilters, InventoryMovement, inventoryMovementSchema, ReasonCode, reasonCodeSchema, RestockEntry (+3 more)

### Community 28 - "AuthProvider.tsx"
Cohesion: 0.16
Nodes (6): @stomp/stompjs, AuthProvider(), refresh(), Handler, stomp, StompService

### Community 29 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, e2e, e2e:install, format, format:check, lint (+5 more)

### Community 30 - "api/auth.ts"
Cohesion: 0.19
Nodes (6): LoginPage(), AuthResponse, changePassword(), login(), LoginPayload, server

### Community 31 - "PlatformShell.tsx"
Cohesion: 0.27
Nodes (9): PlatformNavItem, PlatformShell(), PlatformSidebar(), PlatformTopbar(), apiMocks, PlatformShell, UiState, useUiStore (+1 more)

### Community 32 - "button.tsx"
Cohesion: 0.36
Nodes (7): react-day-picker, DateRangePickerProps, Button, ButtonProps, buttonVariants, Calendar(), CalendarProps

### Community 33 - "roleGuards.ts"
Cohesion: 0.38
Nodes (8): allowedTransitions(), canAdjustInventory(), canApplyLineDiscount(), canEditCatalog(), canManageSettings(), canManageUsers(), canViewReports(), isAdmin()

### Community 34 - "storefrontCartStore.ts"
Cohesion: 0.33
Nodes (5): zustand, StorefrontCartLine, StorefrontCartState, useStorefrontCartStore, StorefrontProduct

### Community 35 - "useAuthStore"
Cohesion: 0.38
Nodes (5): RequireAuth(), syncCartTenant(), useAuthStore, BusinessSettingsPage(), hooks

### Community 36 - "useRole"
Cohesion: 0.53
Nodes (4): RoleGate(), RoleGateProps, useRole(), Role

### Community 37 - "usePersistentDraft.ts"
Cohesion: 0.80
Nodes (3): clearMessageDraftsForUser(), draftStorageKey(), usePersistentDraft()

## Knowledge Gaps
- **256 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+251 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 298 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `PlatformHomePage.tsx`, `Topbar.tsx`, `SubscriptionPage.tsx`, `cn`, `axios.ts`, `package.json`, `ProductFormPage.tsx`, `PosPage.tsx`, `CustomerSupportPanel.tsx`, `routes.tsx`, `OrderDetailPage.tsx`, `mockDataStore.ts`, `api/reports.ts`, `StorefrontPage.tsx`, `@testing-library/react`, `AuthProvider.tsx`, `PlatformShell.tsx`, `button.tsx`, `useAuthStore`, `useRole`, `usePersistentDraft.ts`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _256 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PlatformHomePage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.057511737089201875 - nodes in this community are weakly interconnected._
- **Should `Topbar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07039337474120083 - nodes in this community are weakly interconnected._
- **Should `SubscriptionPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05920745920745921 - nodes in this community are weakly interconnected._