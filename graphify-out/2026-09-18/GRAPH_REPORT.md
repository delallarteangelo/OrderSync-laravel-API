# Graph Report - minigrocery  (2026-09-18)

## Corpus Check
- 490 files · ~137,988 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 3432 nodes · 9575 edges · 112 communities (86 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 78 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5acab57e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- api/aiSupport.ts
- Illuminate\Database\Eloquent\Relations\HasMany
- db.ts
- PlatformHomePage.tsx
- OrderDetailPage.tsx
- models.dart
- RecordedPayment
- index.ts
- storefront_store_test.dart
- package.json
- api/orders.ts
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
- error_state.dart
- State
- Illuminate\Database\Migrations\Migration
- Business
- Illuminate\Http\JsonResponse
- dependencies
- messaging_models.dart
- messaging_store.dart
- login.ts
- AuditLog
- Illuminate\Database\Eloquent\Model
- Illuminate\Http\Request
- main.tsx
- RuntimeException
- StorefrontPage.tsx
- messaging_store_test.dart
- Illuminate\Database\Eloquent\Relations\BelongsTo
- AuthTokenService
- react
- edit_profile_screen.dart
- useApi.ts
- empty_state.dart
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
- OrderLine
- app_shadows.dart
- AiCustomerSupportTest
- PosPage.tsx
- auth_models.dart
- AiAdministrationController
- DomainException
- auth_api.dart
- List
- ConversationReadState
- StorefrontController
- storefront_api.dart
- LogicException
- auth_session_store.dart
- app_text_field.dart
- app_spacing.dart
- PlatformAdministrationTest
- String?
- MessagingPayload
- home_shell.dart
- Topbar.tsx
- loading_skeleton.dart
- Role
- axios.ts
- Product
- home_tab.dart
- app_motion.dart
- app_primary_app_bar.dart
- quantity_stepper.dart
- CustomerAddressController
- chat_thread_screen.dart
- Category
- ReleaseSecurityTest
- app_radii.dart
- ReportController
- ReorderAlert
- logging.php
- ExampleTest
- console.php
- routes.tsx
- @example
- CustomerOrderTest
- roleGuards.ts
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
- `_OrderSyncAppState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/app.dart → web/src/app/stores/mockDataStore.ts
- `_ChatThreadScreenState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/screens/chat/chat_thread_screen.dart → web/src/app/stores/mockDataStore.ts
- `_HomeShellState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/screens/home/home_shell.dart → web/src/app/stores/mockDataStore.ts
- `_HomeTabState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/screens/home/home_tab.dart → web/src/app/stores/mockDataStore.ts
- `_AddressesScreenState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/screens/profile/addresses_screen.dart → web/src/app/stores/mockDataStore.ts

## Import Cycles
- None detected.

## Communities (112 total, 15 thin omitted)

### Community 0 - "cn"
Cohesion: 0.05
Nodes (58): class-variance-authority, clsx, @radix-ui/react-checkbox, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-popover, @radix-ui/react-separator, @radix-ui/react-tooltip (+50 more)

### Community 1 - "api/aiSupport.ts"
Cohesion: 0.13
Nodes (20): CustomerSupportPanel(), askAiAssistant(), KnowledgeInput, listPublishedAiKnowledge(), requestHumanHandoff(), createThread(), AiAssistantResponse, AiKnowledgeEntry (+12 more)

### Community 2 - "Illuminate\Database\Eloquent\Relations\HasMany"
Cohesion: 0.05
Nodes (3): ConversationKind, Sale, Illuminate\Database\Eloquent\Relations\HasMany

### Community 3 - "db.ts"
Cohesion: 0.06
Nodes (50): zod, recordMovement(), useMockDataStore, mockCategories, makeMessages(), mockMessages, mockThreads, makeMovements() (+42 more)

### Community 4 - "PlatformHomePage.tsx"
Cohesion: 0.07
Nodes (51): BillingDialog(), BusinessActions(), money(), PlanEditor(), PlatformHomePage(), platformKeys, PlatformSection, sectionHeadings (+43 more)

### Community 5 - "OrderDetailPage.tsx"
Cohesion: 0.09
Nodes (42): date-fns, lucide-react, papaparse, react-day-picker, recharts, Row, OrderDetailPage(), statusActionLabel (+34 more)

### Community 6 - "models.dart"
Cohesion: 0.04
Nodes (55): ImageProvider get, Address, AppNotification, AppOrder, at, avatarUrl, body, CartLine (+47 more)

### Community 7 - "RecordedPayment"
Cohesion: 0.12
Nodes (12): PurgeExpiredPaymentProofs, PaymentMethod, RecordedPaymentContext, RecordedPaymentStatus, RecordedPaymentException, RecordedPaymentController, RecordedPayment, RecordedPaymentPayload (+4 more)

### Community 8 - "index.ts"
Cohesion: 0.11
Nodes (34): msw, db, findUserByToken(), randomId(), tokenFromAuthHeader(), authHandlers, authResponse(), healthHandlers (+26 more)

### Community 9 - "storefront_store_test.dart"
Cohesion: 0.08
Nodes (25): AuthSession, main, cancelOrder, chooseBalanceMethod, close, failNextOrderRefresh, failNextPayment, failNextPlacement (+17 more)

### Community 10 - "package.json"
Cohesion: 0.04
Nodes (46): autoprefixer, cmdk, eslint, eslint-config-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, @hookform/resolvers, jsdom (+38 more)

### Community 11 - "api/orders.ts"
Cohesion: 0.10
Nodes (24): StorefrontCartLine, StorefrontCartState, useStorefrontCartStore, StorefrontPage(), getOrder(), getStorefront(), listCustomerOrders(), listOrders() (+16 more)

### Community 12 - "app.dart"
Cohesion: 0.11
Nodes (18): core/messaging/messaging_api.dart, core/storefront/storefront_api.dart, _auth, build, createState, didChangeAppLifecycleState, dispose, _handleAuthChange (+10 more)

### Community 13 - "../theme/app_typography.dart"
Cohesion: 0.07
Nodes (40): ../core/messaging/messaging_models.dart, ../../core/messaging/messaging_store.dart, ../../core/storefront/storefront_store.dart, build, CartTab, CategoriesTab, category, CategoryBrowseScreen (+32 more)

### Community 14 - "app_routes.dart"
Cohesion: 0.04
Nodes (53): addresses, AppRoutes, _build, cartTab, categoriesTab, categoryBrowse, chatList, chatThread (+45 more)

### Community 16 - "app_search_field.dart"
Cohesion: 0.07
Nodes (25): CartLine, AppBottomNavBar, badge, build, cartBadge, _CartIcon, currentIndex, filled (+17 more)

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
Nodes (29): @radix-ui/react-switch, react-hook-form, @tanstack/react-query-devtools, queryClient, QueryProvider(), ProductFormPage, UserFormPage, FormValues (+21 more)

### Community 21 - "pdf.tsx"
Cohesion: 0.21
Nodes (10): @react-pdf/renderer, AdminDashboard(), formatPHP(), PHP, sum(), toNumber(), PdfColumn, PdfReportProps (+2 more)

### Community 22 - "app_colors.dart"
Cohesion: 0.07
Nodes (26): AppColors, brandAccentAmber, brandAccentYellow, brandAccentYellowBold, brandPrimary, brandPrimarySurface, neutralBorder, neutralInk (+18 more)

### Community 23 - "error_state.dart"
Cohesion: 0.29
Nodes (6): build, description, ErrorState, onRetry, title, secondary_button.dart

### Community 24 - "State"
Cohesion: 0.06
Nodes (41): dart:async, LoginScreen, _LoginScreenState, RegisterScreen, _RegisterScreenState, build, createState, _methods (+33 more)

### Community 25 - "Illuminate\Database\Migrations\Migration"
Cohesion: 0.06
Nodes (3): Illuminate\Database\Migrations\Migration, Illuminate\Database\Schema\Blueprint, Illuminate\Support\Facades\Schema

### Community 26 - "Business"
Cohesion: 0.05
Nodes (35): BillingStatus, BusinessStatus, SubscriptionStatus, PlatformDashboardController, BillingRecord, Business, Membership, Subscription (+27 more)

### Community 27 - "Illuminate\Http\JsonResponse"
Cohesion: 0.06
Nodes (12): AuthController, PlatformBusinessController, PlatformPlanController, PlatformSubscriptionController, SubscriptionRequestController, Entitlement, PlatformWallet, SaasPayload (+4 more)

### Community 28 - "dependencies"
Cohesion: 0.05
Nodes (39): dependencies, axios, class-variance-authority, clsx, cmdk, date-fns, @hookform/resolvers, lucide-react (+31 more)

### Community 29 - "messaging_models.dart"
Cohesion: 0.05
Nodes (37): AppUserNotification, body, content, copyWith, createdAt, cursor, customerName, EventPollResult (+29 more)

### Community 30 - "messaging_store.dart"
Cohesion: 0.05
Nodes (36): int get, messaging_api.dart, aiKnowledge, askAssistant, busy, consumeForegroundNotice, createGeneralThread, _cursor (+28 more)

### Community 31 - "login.ts"
Cohesion: 0.14
Nodes (19): BusinessSettingsContent(), http, listInventory(), listMovements(), listBusinessPayments(), updateSettings(), createUser(), CreateUserPayload (+11 more)

### Community 33 - "Illuminate\Database\Eloquent\Model"
Cohesion: 0.07
Nodes (9): AiKnowledgeType, BusinessSetting, CustomerProfile, OrderCounterPayment, OrderRefund, Illuminate\Database\Eloquent\Attributes\Fillable, Illuminate\Database\Eloquent\Attributes\Hidden, Illuminate\Database\Eloquent\Model (+1 more)

### Community 34 - "Illuminate\Http\Request"
Cohesion: 0.05
Nodes (30): ConversationMessageKind, OrderStatus, OrderWorkflowException, BusinessRegistrationController, BusinessSettingsController, ContextController, CustomerOrderController, CustomerProfileController (+22 more)

### Community 35 - "main.tsx"
Cohesion: 0.09
Nodes (17): @stomp/stompjs, ToastProvider(), router, enableMswIfNeeded(), env, flags, schema, ServiceReachability (+9 more)

### Community 36 - "RuntimeException"
Cohesion: 0.22
Nodes (4): InsufficientStockException, Illuminate\Foundation\Testing\TestCase, RuntimeException, HealthTest

### Community 37 - "StorefrontPage.tsx"
Cohesion: 0.06
Nodes (67): BusinessApplicationPage, PaymentsPage, PlatformApplicationsPage, StorefrontPage, SubscriptionPage, BusinessApplicationPage(), BusinessRegistrationPage(), schema (+59 more)

### Community 38 - "messaging_store_test.dart"
Cohesion: 0.04
Nodes (43): MessagingThread get, main, main, main, askAssistant, close, createGeneralThread, _expiry (+35 more)

### Community 39 - "Illuminate\Database\Eloquent\Relations\BelongsTo"
Cohesion: 0.04
Nodes (7): AiSupportRun, AiSupportSetting, PaymentReviewEvent, ProductImage, SaleLine, SupportHandoff, Illuminate\Database\Eloquent\Relations\BelongsTo

### Community 40 - "AuthTokenService"
Cohesion: 0.09
Nodes (13): AuthenticateAccessToken, EnsureEntitlement, EnsureRole, ResolveTenant, SecurityHeaders, AccessToken, RefreshToken, AuthTokenService (+5 more)

### Community 41 - "react"
Cohesion: 0.07
Nodes (47): @radix-ui/react-scroll-area, react, @tanstack/react-table, ChatPage, InventoryListPage, ProductListPage(), CashierDashboard(), DashboardPage() (+39 more)

### Community 42 - "edit_profile_screen.dart"
Cohesion: 0.09
Nodes (21): build, ForgotPasswordScreen, avatarUrl, build, bytes, _chooseAvatar, createState, didChangeDependencies (+13 more)

### Community 43 - "useApi.ts"
Cohesion: 0.05
Nodes (92): initialsOf(), Topbar(), AiSupportPage(), CategoryListPage(), ProductFormPage(), ChatPage(), createAiKnowledge(), deactivateAiKnowledge() (+84 more)

### Community 44 - "empty_state.dart"
Cohesion: 0.05
Nodes (40): Color, IconData?, build, createState, initState, AppIconButton, background, build (+32 more)

### Community 46 - "register_screen.dart"
Cohesion: 0.06
Nodes (31): ../../core/auth/auth_api.dart, ../../core/auth/auth_models.dart, build, _businesses, _businessId, createState, dispose, _emailController (+23 more)

### Community 47 - "package:flutter/material.dart"
Cohesion: 0.06
Nodes (34): app.dart, MessagingMessage, main, AccentButton, build, expand, label, onPressed (+26 more)

### Community 48 - "storefront_store.dart"
Cohesion: 0.07
Nodes (28): ../auth/auth_models.dart, Map, StorefrontCatalog, add, busy, cancel, cart, catalog (+20 more)

### Community 49 - "orders_tab.dart"
Cohesion: 0.08
Nodes (24): ../../core/storefront/storefront_models.dart, CustomerOrder, build, claimedAmount, claimedController, method, order, OrderDetailScreen (+16 more)

### Community 51 - "devDependencies"
Cohesion: 0.05
Nodes (39): devDependencies, autoprefixer, eslint, eslint-config-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, lighthouse (+31 more)

### Community 52 - "api/reports.ts"
Cohesion: 0.11
Nodes (22): mockSalesDaily, mockSalesMonthly, mockSalesWeekly, seededDay(), sevenDaySales, LowStockItem, DashboardSnapshot, getAnalyticsOverview() (+14 more)

### Community 53 - "AiSupportContext"
Cohesion: 0.09
Nodes (11): AiSupportProvider, AppServiceProvider, AiProviderResult, AiSupportContext, AiSupportProviderSelector, GeminiAiProvider, LocalGroundedAiProvider, Illuminate\Support\Facades\Gate (+3 more)

### Community 54 - "Illuminate\Database\Eloquent\Relations\HasOne"
Cohesion: 0.18
Nodes (3): Illuminate\Database\Eloquent\Relations\HasOne, Illuminate\Foundation\Auth\User, Illuminate\Notifications\Notifiable

### Community 55 - "messaging_api.dart"
Cohesion: 0.08
Nodes (24): messaging_models.dart, askAssistant, _baseUrl, _client, close, createGeneralThread, getPreferences, listMessages (+16 more)

### Community 57 - "app_shadows.dart"
Cohesion: 0.09
Nodes (20): app_colors.dart, app_radii.dart, app_typography.dart, AppShadows, shadow1, shadow2, shadow3, shadow4 (+12 more)

### Community 59 - "PosPage.tsx"
Cohesion: 0.09
Nodes (26): AiSupportPage, usePosCartStore, emptyKnowledge, KnowledgeDraft, PaymentDialog(), Props, PosProductTile(), PosProductTileProps (+18 more)

### Community 60 - "auth_models.dart"
Cohesion: 0.06
Nodes (33): DateTime, accessExpiresAt, accessToken, AuthRole, AuthSession, AuthUser, avatarUrl, businessId (+25 more)

### Community 61 - "AiAdministrationController"
Cohesion: 0.18
Nodes (4): AiAdministrationController, AiSupportController, AiKnowledgeEntry, AiSupportPayload

### Community 62 - "DomainException"
Cohesion: 0.15
Nodes (6): AiSupportException, PosSaleException, PosSaleController, PosPayload, PosSaleService, DomainException

### Community 63 - "auth_api.dart"
Cohesion: 0.07
Nodes (26): auth_models.dart, _baseUrl, businesses, _client, close, code, deleteAddress, _imageContentType (+18 more)

### Community 64 - "List"
Cohesion: 0.10
Nodes (18): double get, List, mockCart, mockCartSubtotal, mockCartTotal, mockDeliveryFee, mockCategories, mockChatList (+10 more)

### Community 67 - "storefront_api.dart"
Cohesion: 0.08
Nodes (26): dart:typed_data, Exception, HttpClient, AuthApiException, MessagingApiException, _baseUrl, cancelOrder, chooseBalanceMethod (+18 more)

### Community 68 - "LogicException"
Cohesion: 0.11
Nodes (6): AiSupportRunStatus, SubscriptionEvent, UserFactory, Illuminate\Database\Eloquent\Factories\Factory, LogicException, static

### Community 69 - "auth_session_store.dart"
Cohesion: 0.06
Nodes (32): auth_api.dart, AuthSession? get, bool get, ChangeNotifier, InheritedNotifier, _addressError, _addresses, _addressesBusy (+24 more)

### Community 70 - "app_text_field.dart"
Cohesion: 0.10
Nodes (19): int?, AppTextField, build, controller, hint, keyboardType, label, maxLines (+11 more)

### Community 71 - "app_spacing.dart"
Cohesion: 0.11
Nodes (16): AppIconSize, lg, md, sm, xs, AppSpacing, lg, lgPlus (+8 more)

### Community 73 - "String?"
Cohesion: 0.10
Nodes (20): dart:convert, dart:io, HttpServer, AuthApi, api, main, server, login (+12 more)

### Community 74 - "MessagingPayload"
Cohesion: 0.11
Nodes (7): SupportHandoffStatus, NotificationController, ConversationMessage, NotificationPreference, RealtimeEvent, UserNotification, MessagingPayload

### Community 76 - "home_shell.dart"
Cohesion: 0.07
Nodes (29): ../auth/login_screen.dart, ../cart/cart_tab.dart, ../categories/categories_tab.dart, ../../core/auth/auth_session_store.dart, edit_profile_screen.dart, home_tab.dart, build, build (+21 more)

### Community 77 - "Topbar.tsx"
Cohesion: 0.09
Nodes (34): sonner, @tanstack/react-query, @zxing/browser, PwForm, pwSchema, FormValues, LoginPage(), schema (+26 more)

### Community 78 - "loading_skeleton.dart"
Cohesion: 0.15
Nodes (13): AnimationController, BorderRadius, double?, borderRadius, build, _c, createState, dispose (+5 more)

### Community 79 - "Role"
Cohesion: 0.13
Nodes (5): Role, AuthenticationTest, BusinessSettingsTest, CatalogInventoryTest, CustomerProfileTest

### Community 81 - "axios.ts"
Cohesion: 0.13
Nodes (14): axios, axios, AxiosRequestConfig, InternalAxiosRequestConfig, ApiError, attachAuthInterceptor(), attachErrorInterceptor(), ServerError (+6 more)

### Community 82 - "Product"
Cohesion: 0.09
Nodes (13): InventoryReason, ReorderAlertStatus, InventoryController, ProductController, InventoryMovement, InventoryStock, Product, ProductPolicy (+5 more)

### Community 83 - "home_tab.dart"
Cohesion: 0.14
Nodes (14): build, build, build, createState, didChangeDependencies, HomeTab, _HomeTabState, _requested (+6 more)

### Community 85 - "app_motion.dart"
Cohesion: 0.17
Nodes (11): AppMotion, easeInOut, easeOut, emphasized, emphasizedCurve, fast, slow, standard (+3 more)

### Community 86 - "app_primary_app_bar.dart"
Cohesion: 0.17
Nodes (11): actions, AppPrimaryAppBar, backgroundColor, build, centerTitle, foregroundColor, preferredSize, showBack (+3 more)

### Community 87 - "quantity_stepper.dart"
Cohesion: 0.09
Nodes (22): app_icon_button.dart, build, onAdd, onTap, product, ProductCard, build, _CellBtn (+14 more)

### Community 89 - "chat_thread_screen.dart"
Cohesion: 0.20
Nodes (10): _askAi, build, ChatThreadScreen, _ChatThreadScreenState, _controller, createState, dispose, initState (+2 more)

### Community 91 - "Category"
Cohesion: 0.14
Nodes (4): CategoryController, Category, CategoryPolicy, RecordedPaymentTest

### Community 92 - "ReleaseSecurityTest"
Cohesion: 0.27
Nodes (3): Illuminate\Routing\Route, Illuminate\Support\Facades\Route, ReleaseSecurityTest

### Community 94 - "app_radii.dart"
Cohesion: 0.11
Nodes (18): AppRadii, brFull, brLg, brMd, brPill, brSheetTop, brSm, brXl (+10 more)

### Community 95 - "ReportController"
Cohesion: 0.18
Nodes (6): CarbonImmutable, ReportController, AnalyticsService, CarbonImmutable, Carbon\CarbonImmutable, Illuminate\Support\Collection

### Community 101 - "logging.php"
Cohesion: 0.40
Nodes (4): Monolog\Handler\NullHandler, Monolog\Handler\StreamHandler, Monolog\Handler\SyslogUdpHandler, Monolog\Processor\PsrLogMessageProcessor

### Community 104 - "routes.tsx"
Cohesion: 0.05
Nodes (47): react-router-dom, PlatformNavItem, PlatformShell(), PlatformTopbar(), apiMocks, AuthProvider(), RequireAuth(), RequireRole() (+39 more)

### Community 121 - "roleGuards.ts"
Cohesion: 0.38
Nodes (8): allowedTransitions(), canAdjustInventory(), canApplyLineDiscount(), canEditCatalog(), canManageSettings(), canManageUsers(), canViewReports(), isAdmin()

### Community 122 - "types/pos.ts"
Cohesion: 0.23
Nodes (9): zustand, PosCartState, FinalizeSalePayload, CartLine, cartLineSchema, PaymentMethod, paymentMethodSchema, PosSale (+1 more)

### Community 124 - "ConversationThread"
Cohesion: 0.13
Nodes (4): UserNotificationType, ConversationController, ConversationThread, MessagingService

## Knowledge Gaps
- **1032 isolated node(s):** `$schema`, `name`, `type`, `description`, `keywords` (+1027 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1329 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `State` connect `State` to `db.ts`, `edit_profile_screen.dart`, `app.dart`, `home_shell.dart`, `loading_skeleton.dart`, `addresses_screen.dart`, `home_tab.dart`, `quantity_stepper.dart`, `chat_thread_screen.dart`?**
  _High betweenness centrality (0.416) - this node is a cross-community bridge._
- **Why does `_AddressesScreenState` connect `addresses_screen.dart` to `State`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `_AddressDialogState` connect `addresses_screen.dart` to `State`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **What connects `$schema`, `name`, `type` to the rest of the system?**
  _1032 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.04984779299847793 - nodes in this community are weakly interconnected._
- **Should `api/aiSupport.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Illuminate\Database\Eloquent\Relations\HasMany` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._