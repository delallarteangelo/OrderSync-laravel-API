# Graph Report - minigrocery  (2026-09-18)

## Corpus Check
- 491 files · ~138,670 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 3442 nodes · 9637 edges · 114 communities (87 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5acab57e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- db.ts
- Illuminate\Database\Eloquent\Relations\HasMany
- mockDataStore.ts
- api/platform.ts
- PlatformHomePage.tsx
- models.dart
- RecordedPayment
- index.ts
- storefront_store_test.dart
- package.json
- types/orders.ts
- app.dart
- ../theme/app_typography.dart
- app_routes.dart
- PosSaleTest
- app_search_field.dart
- addresses_screen.dart
- storefront_models.dart
- composer.json
- ProductFormPage.tsx
- pdf.tsx
- app_colors.dart
- AuthTokenService
- State
- Illuminate\Database\Migrations\Migration
- Business
- SubscriptionRequest
- dependencies
- messaging_models.dart
- messaging_store.dart
- api/inventory.ts
- primary_button.dart
- Illuminate\Database\Eloquent\Relations\BelongsTo
- Illuminate\Http\JsonResponse
- main.tsx
- RuntimeException
- BusinessSettingsPage.tsx
- messaging_store_test.dart
- Sale
- Closure
- ChatPage.tsx
- edit_profile_screen.dart
- useApi.ts
- app_icon_button.dart
- AiSupportService
- register_screen.dart
- package:flutter/material.dart
- storefront_store.dart
- orders_tab.dart
- BusinessUserController
- devDependencies
- api/reports.ts
- AiSupportContext
- Illuminate\Database\Eloquent\Relations\HasOne
- messaging_api.dart
- Illuminate\Http\Request
- app_shadows.dart
- AiCustomerSupportTest
- routes.tsx
- auth_models.dart
- AiAdministrationController
- DatabaseDialect
- auth_api.dart
- List
- package:flutter_test/flutter_test.dart
- AiSupportProvider
- storefront_api.dart
- LogicException
- auth_session_store.dart
- app_text_field.dart
- app_spacing.dart
- CatalogInventoryTest
- empty_state.dart
- MessagingPayload
- AccessToken
- home_shell.dart
- scripts
- loading_skeleton.dart
- Role
- GeminiAiProviderTest
- axios.ts
- Product
- home_tab.dart
- types/auth.ts
- app_motion.dart
- app_primary_app_bar.dart
- quantity_stepper.dart
- CustomerAddressController
- Illuminate\Database\Eloquent\Relations\BelongsToMany
- msw
- Category
- ReleaseSecurityTest
- app_radii.dart
- ReportController
- logging.php
- ExampleTest
- console.php
- useAuthStore
- @example
- CustomerOrderTest
- types/pos.ts
- ConversationThread

## God Nodes (most connected - your core abstractions)
1. `Business` - 202 edges
2. `User` - 194 edges
3. `cn()` - 126 edges
4. `Role` - 93 edges
5. `react` - 84 edges
6. `Product` - 76 edges
7. `Membership` - 67 edges
8. `Order` - 62 edges
9. `Controller` - 61 edges
10. `SubscriptionPlan` - 61 edges

## Surprising Connections (you probably didn't know these)
- `down()` --calls--> `DatabaseDialect`  [EXTRACTED]
  database/migrations/2026_09_08_000001_create_tenancy_and_auth_tables.php → app/Support/Database/DatabaseDialect.php
- `up()` --calls--> `DatabaseDialect`  [EXTRACTED]
  database/migrations/2026_09_08_000001_create_tenancy_and_auth_tables.php → app/Support/Database/DatabaseDialect.php
- `down()` --calls--> `DatabaseDialect`  [EXTRACTED]
  database/migrations/2026_09_08_000002_create_saas_administration_tables.php → app/Support/Database/DatabaseDialect.php
- `up()` --calls--> `DatabaseDialect`  [EXTRACTED]
  database/migrations/2026_09_08_000002_create_saas_administration_tables.php → app/Support/Database/DatabaseDialect.php
- `up()` --calls--> `DatabaseDialect`  [EXTRACTED]
  database/migrations/2026_09_08_000004_create_catalog_and_inventory_tables.php → app/Support/Database/DatabaseDialect.php

## Import Cycles
- None detected.

## Communities (114 total, 16 thin omitted)

### Community 0 - "cn"
Cohesion: 0.05
Nodes (82): cmdk, @radix-ui/react-dialog, react, initialsOf(), PwForm, pwSchema, emptyKnowledge, KnowledgeDraft (+74 more)

### Community 1 - "db.ts"
Cohesion: 0.10
Nodes (31): makeMessages(), mockMessages, mockThreads, KnowledgeInput, getNotificationPreferences(), listMessages(), listNotifications(), listThreads() (+23 more)

### Community 3 - "mockDataStore.ts"
Cohesion: 0.10
Nodes (23): recordMovement(), useMockDataStore, product, mockCategories, makeMovements(), mockMovements, reasons, mockNotifications (+15 more)

### Community 4 - "api/platform.ts"
Cohesion: 0.06
Nodes (49): BillingDialog(), BusinessActions(), money(), PlanEditor(), PlatformHomePage(), shortDate(), PlanPerkList(), featureLabels (+41 more)

### Community 5 - "PlatformHomePage.tsx"
Cohesion: 0.07
Nodes (66): class-variance-authority, date-fns, lucide-react, react-day-picker, recharts, @tanstack/react-table, MovementLogPage(), reasonColor (+58 more)

### Community 6 - "models.dart"
Cohesion: 0.04
Nodes (55): ImageProvider get, Address, AppNotification, AppOrder, at, avatarUrl, body, CartLine (+47 more)

### Community 7 - "RecordedPayment"
Cohesion: 0.08
Nodes (9): PurgeExpiredPaymentProofs, RecordedPaymentContext, RecordedPaymentController, RecordedPayment, RecordedPaymentPayload, Illuminate\Console\Command, Symfony\Component\HttpFoundation\StreamedResponse, RecordedPaymentTest (+1 more)

### Community 8 - "index.ts"
Cohesion: 0.12
Nodes (31): msw, db, findUserByToken(), randomId(), tokenFromAuthHeader(), authHandlers, authResponse(), healthHandlers (+23 more)

### Community 9 - "storefront_store_test.dart"
Cohesion: 0.08
Nodes (25): AuthSession, main, cancelOrder, chooseBalanceMethod, close, failNextOrderRefresh, failNextPayment, failNextPlacement (+17 more)

### Community 10 - "package.json"
Cohesion: 0.05
Nodes (42): autoprefixer, clsx, eslint, eslint-config-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, @hookform/resolvers, jsdom (+34 more)

### Community 11 - "types/orders.ts"
Cohesion: 0.12
Nodes (20): zustand, StorefrontCartLine, StorefrontCartState, useStorefrontCartStore, allowedTransitions(), canAdjustInventory(), canApplyLineDiscount(), canEditCatalog() (+12 more)

### Community 12 - "app.dart"
Cohesion: 0.11
Nodes (18): core/messaging/messaging_api.dart, core/storefront/storefront_api.dart, _auth, build, createState, didChangeAppLifecycleState, dispose, _handleAuthChange (+10 more)

### Community 13 - "../theme/app_typography.dart"
Cohesion: 0.06
Nodes (48): ../core/messaging/messaging_models.dart, ../../core/messaging/messaging_store.dart, ../../core/storefront/storefront_store.dart, MessagingMessage, build, CartTab, CategoriesTab, category (+40 more)

### Community 14 - "app_routes.dart"
Cohesion: 0.04
Nodes (53): addresses, AppRoutes, _build, cartTab, categoriesTab, categoryBrowse, chatList, chatThread (+45 more)

### Community 16 - "app_search_field.dart"
Cohesion: 0.10
Nodes (18): AppBottomNavBar, badge, build, cartBadge, _CartIcon, currentIndex, filled, onTap (+10 more)

### Community 17 - "addresses_screen.dart"
Cohesion: 0.09
Nodes (22): FormState, address, _AddressDialog, _AddressDialogState, _AddressDraft, AddressesScreen, _AddressesScreenState, build (+14 more)

### Community 18 - "storefront_models.dart"
Cohesion: 0.04
Nodes (51): accountName, accountNumber, actorName, amount, amountReceived, api, apiPrefix, at (+43 more)

### Community 19 - "composer.json"
Cohesion: 0.04
Nodes (47): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+39 more)

### Community 20 - "ProductFormPage.tsx"
Cohesion: 0.11
Nodes (27): @radix-ui/react-label, @radix-ui/react-slot, react-hook-form, zod, BusinessRegistrationPage, ProductFormPage, UserFormPage, BusinessRegistrationPage() (+19 more)

### Community 21 - "pdf.tsx"
Cohesion: 0.21
Nodes (10): @react-pdf/renderer, AdminDashboard(), formatPHP(), PHP, sum(), toNumber(), PdfColumn, PdfReportProps (+2 more)

### Community 22 - "app_colors.dart"
Cohesion: 0.07
Nodes (26): AppColors, brandAccentAmber, brandAccentYellow, brandAccentYellowBold, brandPrimary, brandPrimarySurface, neutralBorder, neutralInk (+18 more)

### Community 23 - "AuthTokenService"
Cohesion: 0.13
Nodes (4): AuthController, AuthTokenService, Cookie, Illuminate\Support\Facades\Cookie

### Community 24 - "State"
Cohesion: 0.07
Nodes (34): LoginScreen, _LoginScreenState, _askAi, build, ChatThreadScreen, _ChatThreadScreenState, _controller, createState (+26 more)

### Community 25 - "Illuminate\Database\Migrations\Migration"
Cohesion: 0.07
Nodes (16): down(), up(), down(), up(), up(), up(), down(), up() (+8 more)

### Community 26 - "Business"
Cohesion: 0.05
Nodes (31): BillingStatus, BusinessStatus, SubscriptionStatus, PlatformDashboardController, BillingRecord, Business, Membership, Subscription (+23 more)

### Community 27 - "SubscriptionRequest"
Cohesion: 0.08
Nodes (11): PaymentMethod, RecordedPaymentStatus, RecordedPaymentException, SubscriptionRequestController, PlatformWallet, SubscriptionRequest, RecordedPaymentService, SubscriptionRequestPayload (+3 more)

### Community 28 - "dependencies"
Cohesion: 0.05
Nodes (39): dependencies, axios, class-variance-authority, clsx, cmdk, date-fns, @hookform/resolvers, lucide-react (+31 more)

### Community 29 - "messaging_models.dart"
Cohesion: 0.05
Nodes (37): AppUserNotification, body, content, copyWith, createdAt, cursor, customerName, EventPollResult (+29 more)

### Community 30 - "messaging_store.dart"
Cohesion: 0.05
Nodes (36): int get, messaging_api.dart, aiKnowledge, askAssistant, busy, consumeForegroundNotice, createGeneralThread, _cursor (+28 more)

### Community 31 - "api/inventory.ts"
Cohesion: 0.16
Nodes (18): listInventory(), listMovements(), LowStockItem, MovementFilters, InventoryMovement, inventoryMovementSchema, ReasonCode, reasonCodeSchema (+10 more)

### Community 32 - "primary_button.dart"
Cohesion: 0.10
Nodes (19): Color, dart:async, build, createState, initState, PaymentProcessingScreen, _PaymentProcessingScreenState, build (+11 more)

### Community 33 - "Illuminate\Database\Eloquent\Relations\BelongsTo"
Cohesion: 0.04
Nodes (13): AiKnowledgeType, BusinessSetting, CustomerProfile, OrderCounterPayment, OrderLine, OrderRefund, OrderStatusEvent, ProductImage (+5 more)

### Community 34 - "Illuminate\Http\JsonResponse"
Cohesion: 0.05
Nodes (27): ConversationMessageKind, BusinessRegistrationController, BusinessSettingsController, ContextController, CustomerProfileController, HealthController, PlatformBusinessController, PlatformPlanController (+19 more)

### Community 35 - "main.tsx"
Cohesion: 0.08
Nodes (21): @stomp/stompjs, @tanstack/react-query-devtools, queryClient, QueryProvider(), ToastProvider(), router, enableMswIfNeeded(), env (+13 more)

### Community 36 - "RuntimeException"
Cohesion: 0.15
Nodes (4): Illuminate\Foundation\Testing\TestCase, Illuminate\Support\Facades\Http, RuntimeException, HealthTest

### Community 37 - "BusinessSettingsPage.tsx"
Cohesion: 0.06
Nodes (57): BusinessApplicationPage, BusinessSettingsPage, PlatformApplicationsPage, SubscriptionPage, BusinessApplicationPage(), PaymentProofPreview(), PrivatePaymentProofPreview(), Props (+49 more)

### Community 38 - "messaging_store_test.dart"
Cohesion: 0.06
Nodes (32): MessagingThread get, askAssistant, close, createGeneralThread, _expiry, gateway, getPreferences, handoffThreads (+24 more)

### Community 40 - "Closure"
Cohesion: 0.18
Nodes (10): AuthenticateAccessToken, EnsureEntitlement, EnsureRole, ResolveTenant, SecurityHeaders, Closure, Illuminate\Foundation\Application, Illuminate\Foundation\Configuration\Exceptions (+2 more)

### Community 41 - "ChatPage.tsx"
Cohesion: 0.14
Nodes (23): sonner, CashierDashboard(), ChatPage(), OrderListPage(), Props, ReceiptView(), CustomerSupportPanel(), askAiAssistant() (+15 more)

### Community 42 - "edit_profile_screen.dart"
Cohesion: 0.09
Nodes (21): build, ForgotPasswordScreen, avatarUrl, build, bytes, _chooseAvatar, createState, didChangeDependencies (+13 more)

### Community 43 - "useApi.ts"
Cohesion: 0.04
Nodes (124): Topbar(), UserListPage, AiSupportPage(), CategoryListPage(), ProductFormPage(), ProductListPage(), DashboardPage(), AdjustStockDialog() (+116 more)

### Community 44 - "app_icon_button.dart"
Cohesion: 0.05
Nodes (34): app_icon_button.dart, IconData?, AccentButton, build, expand, label, onPressed, AppIconButton (+26 more)

### Community 45 - "AiSupportService"
Cohesion: 0.08
Nodes (6): AiSupportRunStatus, AiSupportException, AiSupportRun, AiSupportSetting, AiSupportService, PromptInjectionGuard

### Community 46 - "register_screen.dart"
Cohesion: 0.06
Nodes (33): ../../core/auth/auth_api.dart, ../../core/auth/auth_models.dart, build, _businesses, _businessId, createState, dispose, _emailController (+25 more)

### Community 47 - "package:flutter/material.dart"
Cohesion: 0.06
Nodes (38): app.dart, CartLine, main, build, isScrollControlled, cancelLabel, AppSnackBar, _show (+30 more)

### Community 48 - "storefront_store.dart"
Cohesion: 0.06
Nodes (34): ../auth/auth_models.dart, ChangeNotifier, InheritedNotifier, Map, AuthScope, AuthSessionStore, MessagingScope, MessagingStore (+26 more)

### Community 49 - "orders_tab.dart"
Cohesion: 0.08
Nodes (24): ../../core/storefront/storefront_models.dart, CustomerOrder, build, claimedAmount, claimedController, method, order, OrderDetailScreen (+16 more)

### Community 51 - "devDependencies"
Cohesion: 0.08
Nodes (26): devDependencies, autoprefixer, eslint, eslint-config-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, lighthouse (+18 more)

### Community 52 - "api/reports.ts"
Cohesion: 0.12
Nodes (20): mockSalesDaily, mockSalesMonthly, mockSalesWeekly, seededDay(), sevenDaySales, DashboardSnapshot, getAnalyticsOverview(), getDashboard() (+12 more)

### Community 53 - "AiSupportContext"
Cohesion: 0.19
Nodes (3): AiProviderResult, AiSupportContext, GeminiAiProvider

### Community 55 - "messaging_api.dart"
Cohesion: 0.08
Nodes (24): messaging_models.dart, askAssistant, _baseUrl, _client, close, createGeneralThread, getPreferences, listMessages (+16 more)

### Community 56 - "Illuminate\Http\Request"
Cohesion: 0.12
Nodes (12): OrderStatus, OrderWorkflowException, CustomerOrderController, OrderController, PaymentInstructionController, Order, PaymentInstruction, CustomerOrderService (+4 more)

### Community 57 - "app_shadows.dart"
Cohesion: 0.09
Nodes (20): app_colors.dart, app_radii.dart, app_typography.dart, AppShadows, shadow1, shadow2, shadow3, shadow4 (+12 more)

### Community 59 - "routes.tsx"
Cohesion: 0.06
Nodes (33): AppShell(), AiSupportPage, AppShell, businessWorkspaceRoles, CategoryListPage, ChatPage, DashboardPage, ForbiddenPage (+25 more)

### Community 60 - "auth_models.dart"
Cohesion: 0.06
Nodes (33): DateTime, accessExpiresAt, accessToken, AuthRole, AuthSession, AuthUser, avatarUrl, businessId (+25 more)

### Community 61 - "AiAdministrationController"
Cohesion: 0.14
Nodes (5): AiAdministrationController, AiSupportController, AiKnowledgeEntry, SupportHandoff, AiSupportPayload

### Community 62 - "DatabaseDialect"
Cohesion: 0.12
Nodes (9): PosSaleException, PosSaleController, PosPayload, PosSaleService, DatabaseDialect, down(), up(), down() (+1 more)

### Community 63 - "auth_api.dart"
Cohesion: 0.05
Nodes (38): auth_models.dart, dart:convert, dart:io, HttpServer, AuthApi, _baseUrl, businesses, _client (+30 more)

### Community 64 - "List"
Cohesion: 0.10
Nodes (18): double get, List, mockCart, mockCartSubtotal, mockCartTotal, mockDeliveryFee, mockCategories, mockChatList (+10 more)

### Community 65 - "package:flutter_test/flutter_test.dart"
Cohesion: 0.12
Nodes (11): main, main, main, main, main, package:flutter_test/flutter_test.dart, package:minigrocery/app.dart, package:minigrocery/core/auth/auth_models.dart (+3 more)

### Community 66 - "AiSupportProvider"
Cohesion: 0.21
Nodes (6): AiSupportProvider, AppServiceProvider, AiSupportProviderSelector, LocalGroundedAiProvider, Illuminate\Support\Facades\Gate, Illuminate\Support\ServiceProvider

### Community 67 - "storefront_api.dart"
Cohesion: 0.08
Nodes (26): dart:typed_data, Exception, HttpClient, AuthApiException, MessagingApiException, _baseUrl, cancelOrder, chooseBalanceMethod (+18 more)

### Community 68 - "LogicException"
Cohesion: 0.08
Nodes (7): AuditLog, PaymentReviewEvent, SubscriptionEvent, UserFactory, Illuminate\Database\Eloquent\Factories\Factory, LogicException, static

### Community 69 - "auth_session_store.dart"
Cohesion: 0.07
Nodes (26): auth_api.dart, AuthSession? get, bool get, _addressError, _addresses, _addressesBusy, _api, _busy (+18 more)

### Community 70 - "app_text_field.dart"
Cohesion: 0.10
Nodes (19): int?, AppTextField, build, controller, hint, keyboardType, label, maxLines (+11 more)

### Community 71 - "app_spacing.dart"
Cohesion: 0.11
Nodes (16): AppIconSize, lg, md, sm, xs, AppSpacing, lg, lgPlus (+8 more)

### Community 73 - "empty_state.dart"
Cohesion: 0.11
Nodes (16): actionLabel, build, description, EmptyState, icon, iconTint, onAction, title (+8 more)

### Community 74 - "MessagingPayload"
Cohesion: 0.11
Nodes (7): SupportHandoffStatus, NotificationController, ConversationMessage, NotificationPreference, RealtimeEvent, UserNotification, MessagingPayload

### Community 76 - "home_shell.dart"
Cohesion: 0.08
Nodes (25): ../auth/login_screen.dart, ../cart/cart_tab.dart, ../categories/categories_tab.dart, ../../core/auth/auth_session_store.dart, edit_profile_screen.dart, home_tab.dart, build, createState (+17 more)

### Community 77 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, e2e, e2e:install, format, format:check, lint (+5 more)

### Community 78 - "loading_skeleton.dart"
Cohesion: 0.15
Nodes (13): AnimationController, BorderRadius, double?, borderRadius, build, _c, createState, dispose (+5 more)

### Community 79 - "Role"
Cohesion: 0.17
Nodes (4): Role, AuthenticationTest, BusinessSettingsTest, CustomerProfileTest

### Community 81 - "axios.ts"
Cohesion: 0.11
Nodes (16): axios, mockSettings, axios, AxiosRequestConfig, http, InternalAxiosRequestConfig, ApiError, attachAuthInterceptor() (+8 more)

### Community 82 - "Product"
Cohesion: 0.08
Nodes (15): InventoryReason, ReorderAlertStatus, InsufficientStockException, InventoryController, ProductController, InventoryMovement, InventoryStock, Product (+7 more)

### Community 83 - "home_tab.dart"
Cohesion: 0.10
Nodes (20): build, build, build, createState, didChangeDependencies, HomeTab, _HomeTabState, _requested (+12 more)

### Community 84 - "types/auth.ts"
Cohesion: 0.25
Nodes (7): adminUser, cashierUser, mockUsers, superAdminUser, AuthSession, BusinessSummary, User

### Community 85 - "app_motion.dart"
Cohesion: 0.17
Nodes (11): AppMotion, easeInOut, easeOut, emphasized, emphasizedCurve, fast, slow, standard (+3 more)

### Community 86 - "app_primary_app_bar.dart"
Cohesion: 0.17
Nodes (11): actions, AppPrimaryAppBar, backgroundColor, build, centerTitle, foregroundColor, preferredSize, showBack (+3 more)

### Community 87 - "quantity_stepper.dart"
Cohesion: 0.13
Nodes (15): build, _CellBtn, createState, enabled, height, icon, initial, max (+7 more)

### Community 91 - "Category"
Cohesion: 0.23
Nodes (3): CategoryController, Category, CategoryPolicy

### Community 92 - "ReleaseSecurityTest"
Cohesion: 0.27
Nodes (3): Illuminate\Routing\Route, Illuminate\Support\Facades\Route, ReleaseSecurityTest

### Community 94 - "app_radii.dart"
Cohesion: 0.11
Nodes (18): AppRadii, brFull, brLg, brMd, brPill, brSheetTop, brSm, brXl (+10 more)

### Community 95 - "ReportController"
Cohesion: 0.14
Nodes (7): CarbonImmutable, ReportController, AnalyticsService, CarbonImmutable, Carbon\CarbonImmutable, AnalyticsReportTest, CarbonImmutable

### Community 101 - "logging.php"
Cohesion: 0.40
Nodes (4): Monolog\Handler\NullHandler, Monolog\Handler\StreamHandler, Monolog\Handler\SyslogUdpHandler, Monolog\Processor\PsrLogMessageProcessor

### Community 104 - "useAuthStore"
Cohesion: 0.05
Nodes (55): react-router-dom, @tanstack/react-query, @testing-library/react, @testing-library/user-event, vitest, PlatformNavItem, PlatformShell(), PlatformSidebar() (+47 more)

### Community 122 - "types/pos.ts"
Cohesion: 0.22
Nodes (9): PosCartState, usePosCartStore, FinalizeSalePayload, CartLine, cartLineSchema, PaymentMethod, paymentMethodSchema, PosSale (+1 more)

### Community 124 - "ConversationThread"
Cohesion: 0.10
Nodes (5): UserNotificationType, ConversationController, ConversationReadState, ConversationThread, MessagingService

## Knowledge Gaps
- **1032 isolated node(s):** `$schema`, `name`, `type`, `description`, `keywords` (+1027 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1316 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `State` connect `State` to `primary_button.dart`, `mockDataStore.ts`, `edit_profile_screen.dart`, `app.dart`, `home_shell.dart`, `register_screen.dart`, `loading_skeleton.dart`, `addresses_screen.dart`, `home_tab.dart`, `quantity_stepper.dart`?**
  _High betweenness centrality (0.413) - this node is a cross-community bridge._
- **Why does `_AddressesScreenState` connect `addresses_screen.dart` to `State`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **Why does `_AddressDialogState` connect `addresses_screen.dart` to `State`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **What connects `$schema`, `name`, `type` to the rest of the system?**
  _1032 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.04551820728291316 - nodes in this community are weakly interconnected._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10128205128205128 - nodes in this community are weakly interconnected._
- **Should `Illuminate\Database\Eloquent\Relations\HasMany` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._