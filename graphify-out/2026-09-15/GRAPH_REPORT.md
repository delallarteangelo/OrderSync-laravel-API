# Graph Report - minigrocery  (2026-09-15)

## Corpus Check
- 468 files · ~126,097 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 3321 nodes · 9134 edges · 121 communities (89 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5acab57e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- cn
- Business
- mockDataStore.ts
- PlatformHomePage.tsx
- useApi.ts
- models.dart
- RecordedPayment
- index.ts
- package:flutter/material.dart
- package.json
- SubscriptionRequestController
- routes.tsx
- ../theme/app_colors.dart
- app_routes.dart
- lucide-react
- Controller
- User
- storefront_models.dart
- composer.json
- ProductFormPage.tsx
- Product
- app_colors.dart
- ConversationThread
- State
- Illuminate\Database\Migrations\Migration
- Role
- Category
- dependencies
- messaging_models.dart
- messaging_store.dart
- ChatPage.tsx
- db.ts
- Illuminate\Database\Eloquent\Model
- Order
- PaymentsPage.tsx
- Illuminate\Http\JsonResponse
- StorefrontPage.tsx
- messaging_store_test.dart
- Illuminate\Database\Eloquent\Relations\BelongsTo
- Membership
- app_text_field.dart
- edit_profile_screen.dart
- Illuminate\Http\Request
- StatelessWidget
- AiAdministrationController
- register_screen.dart
- app.dart
- storefront_store.dart
- orders_tab.dart
- addresses_screen.dart
- devDependencies
- api/reports.ts
- AiSupportContext
- empty_state.dart
- messaging_api.dart
- storefront_store_test.dart
- app_shadows.dart
- PosSaleController.php
- app_radii.dart
- auth_models.dart
- refreshInterceptor.test.ts
- AnalyticsReportTest
- auth_api.dart
- List
- types/orders.ts
- Closure
- storefront_api.dart
- LogicException
- auth_session_store.dart
- main.tsx
- app_spacing.dart
- AuthController
- String?
- NotificationPreference
- quantity_stepper.dart
- home_shell.dart
- types/pos.ts
- loading_skeleton.dart
- home_tab.dart
- Sale
- OrderPayload
- CustomerRegistrationTest
- scripts
- AiSupportRun
- app_motion.dart
- app_primary_app_bar.dart
- RecordedPaymentTest
- ReportController
- OrderLine
- chat_thread_screen.dart
- PlatformAdministrationTest
- ReleaseSecurityTest
- AiSupportService
- PosSaleTest
- @testing-library/react
- CustomerAddressController
- AuditLog
- ConversationReadState
- ReorderAlert
- types/auth.ts
- logging.php
- ExampleTest
- console.php
- roleGuards.ts
- @example
- BusinessUserManagementTest
- StompService
- MessagingNotificationTest
- AiSupportSetting

## God Nodes (most connected - your core abstractions)
1. `Business` - 200 edges
2. `User` - 189 edges
3. `cn()` - 121 edges
4. `Role` - 91 edges
5. `react` - 79 edges
6. `Product` - 76 edges
7. `Membership` - 66 edges
8. `Controller` - 61 edges
9. `AuditLogger` - 59 edges
10. `SubscriptionPlan` - 58 edges

## Surprising Connections (you probably didn't know these)
- `_OrderSyncAppState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/app.dart → web/src/app/stores/mockDataStore.ts
- `_RegisterScreenState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/screens/auth/register_screen.dart → web/src/app/stores/mockDataStore.ts
- `_ChatThreadScreenState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/screens/chat/chat_thread_screen.dart → web/src/app/stores/mockDataStore.ts
- `_PaymentProcessingScreenState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/screens/checkout/payment_processing_screen.dart → web/src/app/stores/mockDataStore.ts
- `_HomeShellState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/screens/home/home_shell.dart → web/src/app/stores/mockDataStore.ts

## Import Cycles
- None detected.

## Communities (121 total, 21 thin omitted)

### Community 0 - "react"
Cohesion: 0.10
Nodes (41): date-fns, react, react-day-picker, recharts, Row, statusActionLabel, InventoryReportPage(), OrdersReportPage() (+33 more)

### Community 1 - "cn"
Cohesion: 0.05
Nodes (62): cmdk, @radix-ui/react-dialog, @testing-library/user-event, initialsOf(), PwForm, pwSchema, PosPage, PaymentDialog() (+54 more)

### Community 2 - "Business"
Cohesion: 0.05
Nodes (9): BusinessRegistrationController, StorefrontController, Business, BusinessPolicy, Illuminate\Database\Eloquent\Factories\HasFactory, Illuminate\Database\Eloquent\Relations\HasMany, Illuminate\Database\Eloquent\Relations\HasOne, Illuminate\Foundation\Auth\User (+1 more)

### Community 3 - "mockDataStore.ts"
Cohesion: 0.11
Nodes (25): recordMovement(), useMockDataStore, makeMovements(), mockMovements, reasons, customers, makeOrder(), mockOrders (+17 more)

### Community 4 - "PlatformHomePage.tsx"
Cohesion: 0.05
Nodes (59): axios, PlatformHomePage, BillingDialog(), BusinessActions(), money(), PlanEditor(), PlatformHomePage(), platformKeys (+51 more)

### Community 5 - "useApi.ts"
Cohesion: 0.04
Nodes (109): Topbar(), AiSupportPage, AiSupportPage(), emptyKnowledge, KnowledgeDraft, CategoryListPage(), ProductFormPage(), ProductListPage() (+101 more)

### Community 6 - "models.dart"
Cohesion: 0.04
Nodes (55): ImageProvider get, Address, AppNotification, AppOrder, at, avatarUrl, body, CartLine (+47 more)

### Community 7 - "RecordedPayment"
Cohesion: 0.10
Nodes (12): PaymentMethod, RecordedPaymentContext, RecordedPaymentStatus, RecordedPaymentException, PaymentInstructionController, RecordedPaymentController, PaymentInstruction, RecordedPayment (+4 more)

### Community 8 - "index.ts"
Cohesion: 0.10
Nodes (36): msw, OrderStatusEvent, db, findUserByToken(), randomId(), tokenFromAuthHeader(), authHandlers, authResponse() (+28 more)

### Community 9 - "package:flutter/material.dart"
Cohesion: 0.05
Nodes (39): app.dart, app_icon_button.dart, main, AccentButton, build, expand, label, onPressed (+31 more)

### Community 10 - "package.json"
Cohesion: 0.04
Nodes (44): autoprefixer, clsx, eslint, eslint-config-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, @hookform/resolvers, jsdom (+36 more)

### Community 11 - "SubscriptionRequestController"
Cohesion: 0.18
Nodes (3): SubscriptionRequestController, PlatformWallet, SubscriptionRequestPayload

### Community 12 - "routes.tsx"
Cohesion: 0.04
Nodes (54): class-variance-authority, react-hook-form, AppShell(), groups, NavGroup, NavItem, Sidebar(), AuthProvider() (+46 more)

### Community 13 - "../theme/app_colors.dart"
Cohesion: 0.05
Nodes (59): ../core/messaging/messaging_models.dart, ../../core/messaging/messaging_store.dart, ../../core/storefront/storefront_store.dart, MessagingMessage, build, CartTab, CategoriesTab, category (+51 more)

### Community 14 - "app_routes.dart"
Cohesion: 0.04
Nodes (53): addresses, AppRoutes, _build, cartTab, categoriesTab, categoryBrowse, chatList, chatThread (+45 more)

### Community 15 - "lucide-react"
Cohesion: 0.08
Nodes (45): lucide-react, @react-pdf/renderer, react-router-dom, @tanstack/react-table, DashboardPage, AdminDashboard(), CashierDashboard(), DashboardPage() (+37 more)

### Community 16 - "Controller"
Cohesion: 0.07
Nodes (16): PurgeExpiredPaymentProofs, BusinessSettingsController, ContextController, CustomerProfileController, HealthController, PlatformDashboardController, PlatformPlanController, PlatformUserController (+8 more)

### Community 17 - "User"
Cohesion: 0.06
Nodes (26): BillingStatus, BusinessStatus, SubscriptionStatus, BillingRecord, Subscription, SubscriptionPlan, SubscriptionRequest, User (+18 more)

### Community 18 - "storefront_models.dart"
Cohesion: 0.04
Nodes (46): accountName, accountNumber, actorName, amount, api, apiPrefix, at, businessId (+38 more)

### Community 19 - "composer.json"
Cohesion: 0.04
Nodes (47): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+39 more)

### Community 20 - "ProductFormPage.tsx"
Cohesion: 0.08
Nodes (35): @radix-ui/react-label, @radix-ui/react-slot, zod, ProductFormPage, UserFormPage, PosCartState, usePosCartStore, FormValues (+27 more)

### Community 21 - "Product"
Cohesion: 0.08
Nodes (14): InventoryReason, ReorderAlertStatus, InventoryMovement, InventoryStock, Product, ProductPolicy, AnalyticsService, CarbonImmutable (+6 more)

### Community 22 - "app_colors.dart"
Cohesion: 0.07
Nodes (26): AppColors, brandAccentAmber, brandAccentYellow, brandAccentYellowBold, brandPrimary, brandPrimarySurface, neutralBorder, neutralInk (+18 more)

### Community 23 - "ConversationThread"
Cohesion: 0.09
Nodes (5): UserNotificationType, ConversationMessage, ConversationThread, MessagingService, PromptInjectionGuard

### Community 24 - "State"
Cohesion: 0.08
Nodes (27): LoginScreen, _LoginScreenState, build, createState, _methods, PaymentMethodScreen, _PaymentMethodScreenState, _selected (+19 more)

### Community 25 - "Illuminate\Database\Migrations\Migration"
Cohesion: 0.06
Nodes (3): Illuminate\Database\Migrations\Migration, Illuminate\Database\Schema\Blueprint, Illuminate\Support\Facades\Schema

### Community 26 - "Role"
Cohesion: 0.10
Nodes (6): Role, AuthenticationTest, BusinessSettingsTest, CatalogInventoryTest, CustomerOrderTest, CustomerProfileTest

### Community 27 - "Category"
Cohesion: 0.16
Nodes (5): CategoryController, InventoryController, ProductController, Category, CatalogPayload

### Community 28 - "dependencies"
Cohesion: 0.05
Nodes (39): dependencies, axios, class-variance-authority, clsx, cmdk, date-fns, @hookform/resolvers, lucide-react (+31 more)

### Community 29 - "messaging_models.dart"
Cohesion: 0.05
Nodes (37): AppUserNotification, body, content, copyWith, createdAt, cursor, customerName, EventPollResult (+29 more)

### Community 30 - "messaging_store.dart"
Cohesion: 0.05
Nodes (36): int get, messaging_api.dart, aiKnowledge, askAssistant, busy, consumeForegroundNotice, createGeneralThread, _cursor (+28 more)

### Community 31 - "ChatPage.tsx"
Cohesion: 0.14
Nodes (21): sonner, ChatPage(), Props, ReceiptView(), CustomerSupportPanel(), askAiAssistant(), listPublishedAiKnowledge(), requestHumanHandoff() (+13 more)

### Community 32 - "db.ts"
Cohesion: 0.13
Nodes (18): mockCategories, makeMessages(), mockMessages, mockThreads, mockNotifications, NotificationItem, mockSettings, isoMinutesAgo() (+10 more)

### Community 33 - "Illuminate\Database\Eloquent\Model"
Cohesion: 0.08
Nodes (8): AiKnowledgeType, ConversationKind, BusinessSetting, CustomerProfile, Illuminate\Database\Eloquent\Attributes\Fillable, Illuminate\Database\Eloquent\Attributes\Hidden, Illuminate\Database\Eloquent\Model, Illuminate\Database\Eloquent\Relations\BelongsToMany

### Community 34 - "Order"
Cohesion: 0.11
Nodes (9): OrderStatus, OrderWorkflowException, Order, CustomerOrderService, Illuminate\Contracts\Console\Kernel, Illuminate\Foundation\Testing\DatabaseMigrations, Symfony\Component\Process\Process, AiCustomerSupportTest (+1 more)

### Community 35 - "PaymentsPage.tsx"
Cohesion: 0.06
Nodes (67): @tanstack/react-query, BusinessApplicationPage, BusinessRegistrationPage, BusinessSettingsPage, PaymentsPage, PlatformApplicationsPage, SubscriptionPage, BusinessApplicationPage() (+59 more)

### Community 36 - "Illuminate\Http\JsonResponse"
Cohesion: 0.14
Nodes (5): PlatformBusinessController, PlatformSubscriptionController, TenantSubscriptionController, SaasPayload, Illuminate\Http\JsonResponse

### Community 37 - "StorefrontPage.tsx"
Cohesion: 0.10
Nodes (34): vitest, StorefrontPage, AdjustStockDialog(), CustomerPaymentPanel(), StorefrontPage(), isApiError(), adjustStock(), listInventory() (+26 more)

### Community 38 - "messaging_store_test.dart"
Cohesion: 0.06
Nodes (33): MessagingThread get, askAssistant, close, createGeneralThread, _expiry, gateway, getPreferences, handoffThreads (+25 more)

### Community 39 - "Illuminate\Database\Eloquent\Relations\BelongsTo"
Cohesion: 0.04
Nodes (4): PaymentReviewEvent, ProductImage, SupportHandoff, Illuminate\Database\Eloquent\Relations\BelongsTo

### Community 40 - "Membership"
Cohesion: 0.12
Nodes (7): BusinessUserController, AuthenticateAccessToken, AccessToken, Membership, RefreshToken, AuthTokenService, TenantIsolationTest

### Community 41 - "app_text_field.dart"
Cohesion: 0.10
Nodes (19): int?, AppTextField, build, controller, hint, keyboardType, label, maxLines (+11 more)

### Community 42 - "edit_profile_screen.dart"
Cohesion: 0.09
Nodes (22): build, ForgotPasswordScreen, avatarUrl, build, bytes, _chooseAvatar, createState, didChangeDependencies (+14 more)

### Community 43 - "Illuminate\Http\Request"
Cohesion: 0.29
Nodes (4): ConversationController, NotificationController, MessagingPayload, Illuminate\Http\Request

### Community 44 - "StatelessWidget"
Cohesion: 0.08
Nodes (26): CartLine, AppBottomNavBar, badge, build, cartBadge, _CartIcon, currentIndex, filled (+18 more)

### Community 45 - "AiAdministrationController"
Cohesion: 0.22
Nodes (4): AiAdministrationController, AiSupportController, AiKnowledgeEntry, AiSupportPayload

### Community 46 - "register_screen.dart"
Cohesion: 0.06
Nodes (33): ../../core/auth/auth_api.dart, ../../core/auth/auth_models.dart, build, _businesses, _businessId, createState, dispose, _emailController (+25 more)

### Community 47 - "app.dart"
Cohesion: 0.11
Nodes (18): core/messaging/messaging_api.dart, core/storefront/storefront_api.dart, _auth, build, createState, didChangeAppLifecycleState, dispose, _handleAuthChange (+10 more)

### Community 48 - "storefront_store.dart"
Cohesion: 0.07
Nodes (27): ../auth/auth_models.dart, Map, StorefrontCatalog, add, busy, cancel, cart, catalog (+19 more)

### Community 49 - "orders_tab.dart"
Cohesion: 0.09
Nodes (24): ../../core/storefront/storefront_models.dart, CustomerOrder, build, method, order, OrderDetailScreen, proofPath, reference (+16 more)

### Community 50 - "addresses_screen.dart"
Cohesion: 0.09
Nodes (22): FormState, address, _AddressDialog, _AddressDialogState, _AddressDraft, AddressesScreen, _AddressesScreenState, build (+14 more)

### Community 51 - "devDependencies"
Cohesion: 0.08
Nodes (26): devDependencies, autoprefixer, eslint, eslint-config-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, lighthouse (+18 more)

### Community 52 - "api/reports.ts"
Cohesion: 0.15
Nodes (16): mockSalesDaily, mockSalesMonthly, mockSalesWeekly, seededDay(), sevenDaySales, DashboardSnapshot, ReportRange, BucketSelectorProps (+8 more)

### Community 53 - "AiSupportContext"
Cohesion: 0.06
Nodes (15): AiSupportProvider, InsufficientStockException, CategoryPolicy, AppServiceProvider, AiProviderResult, AiSupportContext, AiSupportProviderSelector, GeminiAiProvider (+7 more)

### Community 54 - "empty_state.dart"
Cohesion: 0.06
Nodes (30): Color, dart:async, IconData?, build, createState, initState, PaymentProcessingScreen, _PaymentProcessingScreenState (+22 more)

### Community 55 - "messaging_api.dart"
Cohesion: 0.08
Nodes (24): messaging_models.dart, askAssistant, _baseUrl, _client, close, createGeneralThread, getPreferences, listMessages (+16 more)

### Community 56 - "storefront_store_test.dart"
Cohesion: 0.08
Nodes (24): AuthSession, main, cancelOrder, close, failNextOrderRefresh, failNextPayment, failNextPlacement, gateway (+16 more)

### Community 57 - "app_shadows.dart"
Cohesion: 0.09
Nodes (20): app_colors.dart, app_radii.dart, app_typography.dart, AppShadows, shadow1, shadow2, shadow3, shadow4 (+12 more)

### Community 58 - "PosSaleController.php"
Cohesion: 0.28
Nodes (3): PosSaleController, PosPayload, PosSaleService

### Community 59 - "app_radii.dart"
Cohesion: 0.11
Nodes (18): AppRadii, brFull, brLg, brMd, brPill, brSheetTop, brSm, brXl (+10 more)

### Community 60 - "auth_models.dart"
Cohesion: 0.06
Nodes (33): DateTime, accessExpiresAt, accessToken, AuthRole, AuthSession, AuthUser, avatarUrl, businessId (+25 more)

### Community 63 - "auth_api.dart"
Cohesion: 0.07
Nodes (26): auth_models.dart, _baseUrl, businesses, _client, close, code, deleteAddress, _imageContentType (+18 more)

### Community 64 - "List"
Cohesion: 0.10
Nodes (18): double get, List, mockCart, mockCartSubtotal, mockCartTotal, mockDeliveryFee, mockCategories, mockChatList (+10 more)

### Community 65 - "types/orders.ts"
Cohesion: 0.18
Nodes (10): zustand, StorefrontCartLine, StorefrontCartState, useStorefrontCartStore, OrderItem, orderStatusSchema, Storefront, StorefrontCategory (+2 more)

### Community 66 - "Closure"
Cohesion: 0.20
Nodes (9): EnsureEntitlement, EnsureRole, ResolveTenant, SecurityHeaders, Closure, Illuminate\Foundation\Application, Illuminate\Foundation\Configuration\Exceptions, Illuminate\Foundation\Configuration\Middleware (+1 more)

### Community 67 - "storefront_api.dart"
Cohesion: 0.08
Nodes (25): dart:typed_data, Exception, HttpClient, AuthApiException, MessagingApiException, _baseUrl, cancelOrder, _client (+17 more)

### Community 68 - "LogicException"
Cohesion: 0.13
Nodes (5): SubscriptionEvent, UserFactory, Illuminate\Database\Eloquent\Factories\Factory, LogicException, static

### Community 69 - "auth_session_store.dart"
Cohesion: 0.06
Nodes (32): auth_api.dart, AuthSession? get, bool get, ChangeNotifier, InheritedNotifier, _addressError, _addresses, _addressesBusy (+24 more)

### Community 70 - "main.tsx"
Cohesion: 0.15
Nodes (13): @stomp/stompjs, @tanstack/react-query-devtools, queryClient, QueryProvider(), ToastProvider(), router, enableMswIfNeeded(), env (+5 more)

### Community 71 - "app_spacing.dart"
Cohesion: 0.11
Nodes (16): AppIconSize, lg, md, sm, xs, AppSpacing, lg, lgPlus (+8 more)

### Community 72 - "AuthController"
Cohesion: 0.19
Nodes (3): AuthController, Cookie, Illuminate\Support\Facades\Cookie

### Community 73 - "String?"
Cohesion: 0.07
Nodes (27): dart:convert, dart:io, HttpServer, AuthApi, api, main, server, main (+19 more)

### Community 74 - "NotificationPreference"
Cohesion: 0.12
Nodes (4): SupportHandoffStatus, NotificationPreference, RealtimeEvent, UserNotification

### Community 75 - "quantity_stepper.dart"
Cohesion: 0.13
Nodes (15): build, _CellBtn, createState, enabled, height, icon, initial, max (+7 more)

### Community 76 - "home_shell.dart"
Cohesion: 0.07
Nodes (29): ../auth/login_screen.dart, ../cart/cart_tab.dart, ../categories/categories_tab.dart, ../../core/auth/auth_session_store.dart, edit_profile_screen.dart, home_tab.dart, build, build (+21 more)

### Community 77 - "types/pos.ts"
Cohesion: 0.33
Nodes (7): FinalizeSalePayload, CartLine, cartLineSchema, PaymentMethod, paymentMethodSchema, PosSale, posSaleSchema

### Community 78 - "loading_skeleton.dart"
Cohesion: 0.15
Nodes (13): AnimationController, BorderRadius, double?, borderRadius, build, _c, createState, dispose (+5 more)

### Community 79 - "home_tab.dart"
Cohesion: 0.09
Nodes (21): build, build, build, createState, didChangeDependencies, HomeTab, _HomeTabState, _requested (+13 more)

### Community 81 - "OrderPayload"
Cohesion: 0.27
Nodes (3): CustomerOrderController, OrderController, OrderPayload

### Community 83 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, e2e, e2e:install, format, format:check, lint (+5 more)

### Community 85 - "app_motion.dart"
Cohesion: 0.17
Nodes (11): AppMotion, easeInOut, easeOut, emphasized, emphasizedCurve, fast, slow, standard (+3 more)

### Community 86 - "app_primary_app_bar.dart"
Cohesion: 0.17
Nodes (11): actions, AppPrimaryAppBar, backgroundColor, build, centerTitle, foregroundColor, preferredSize, showBack (+3 more)

### Community 90 - "chat_thread_screen.dart"
Cohesion: 0.20
Nodes (10): _askAi, build, ChatThreadScreen, _ChatThreadScreenState, _controller, createState, dispose, initState (+2 more)

### Community 92 - "ReleaseSecurityTest"
Cohesion: 0.27
Nodes (3): Illuminate\Routing\Route, Illuminate\Support\Facades\Route, ReleaseSecurityTest

### Community 93 - "AiSupportService"
Cohesion: 0.13
Nodes (5): ConversationMessageKind, AiSupportException, PosSaleException, AiSupportService, DomainException

### Community 95 - "@testing-library/react"
Cohesion: 0.25
Nodes (8): @testing-library/react, ServiceReachability, useOnlineStatus(), useServiceReachability(), InstallPromptEvent, isPublicCatalogPath(), registerOrderSyncServiceWorker(), PwaManager()

### Community 100 - "types/auth.ts"
Cohesion: 0.20
Nodes (9): adminUser, cashierUser, mockUsers, superAdminUser, AuthSession, BusinessMembership, BusinessSummary, User (+1 more)

### Community 101 - "logging.php"
Cohesion: 0.40
Nodes (4): Monolog\Handler\NullHandler, Monolog\Handler\StreamHandler, Monolog\Handler\SyslogUdpHandler, Monolog\Processor\PsrLogMessageProcessor

### Community 104 - "roleGuards.ts"
Cohesion: 0.38
Nodes (8): allowedTransitions(), canAdjustInventory(), canApplyLineDiscount(), canEditCatalog(), canManageSettings(), canManageUsers(), canViewReports(), isAdmin()

## Knowledge Gaps
- **1002 isolated node(s):** `$schema`, `name`, `type`, `description`, `keywords` (+997 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1291 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `State` connect `State` to `mockDataStore.ts`, `edit_profile_screen.dart`, `quantity_stepper.dart`, `home_shell.dart`, `register_screen.dart`, `app.dart`, `home_tab.dart`, `orders_tab.dart`, `addresses_screen.dart`, `loading_skeleton.dart`, `empty_state.dart`, `chat_thread_screen.dart`?**
  _High betweenness centrality (0.420) - this node is a cross-community bridge._
- **Why does `_AddressesScreenState` connect `addresses_screen.dart` to `State`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `_AddressDialogState` connect `addresses_screen.dart` to `State`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **What connects `$schema`, `name`, `type` to the rest of the system?**
  _1002 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.09633418584825235 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.050980392156862744 - nodes in this community are weakly interconnected._
- **Should `Business` be split into smaller, more focused modules?**
  _Cohesion score 0.048633879781420766 - nodes in this community are weakly interconnected._