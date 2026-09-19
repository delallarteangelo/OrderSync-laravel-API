# Graph Report - minigrocery  (2026-09-17)

## Corpus Check
- 486 files · ~135,151 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 3411 nodes · 9472 edges · 127 communities (97 shown, 19 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 79 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5acab57e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- db.ts
- Illuminate\Database\Eloquent\Relations\HasMany
- mockOrders.ts
- api/platform.ts
- OrderDetailPage.tsx
- models.dart
- RecordedPayment
- index.ts
- storefront_store_test.dart
- package.json
- Controller
- routes.tsx
- package:flutter/material.dart
- app_routes.dart
- Illuminate\Http\JsonResponse
- DomainException
- Topbar.tsx
- storefront_models.dart
- composer.json
- ProductFormPage.tsx
- react
- app_colors.dart
- app_icon_button.dart
- onboarding_screen.dart
- Illuminate\Database\Migrations\Migration
- Membership
- Illuminate\Database\Eloquent\Relations\HasOne
- dependencies
- messaging_models.dart
- messaging_store.dart
- login.ts
- AuditLog
- Illuminate\Database\Eloquent\Model
- Order
- main.tsx
- User
- StorefrontPage.tsx
- messaging_store_test.dart
- Illuminate\Database\Eloquent\Relations\BelongsTo
- AuthTokenService
- RuntimeException
- edit_profile_screen.dart
- useApi.ts
- empty_state.dart
- ConversationThread
- addresses_screen.dart
- ../theme/app_colors.dart
- storefront_store.dart
- orders_tab.dart
- BusinessUserController
- devDependencies
- api/reports.ts
- AiSupportContext
- ReorderAlert
- messaging_api.dart
- home_tab.dart
- app_shadows.dart
- api/catalog.ts
- api/orders.ts
- auth_models.dart
- AiAdministrationController
- Illuminate\Http\Request
- auth_api.dart
- List
- roleGuards.ts
- Closure
- storefront_api.dart
- LogicException
- auth_session_store.dart
- app_text_field.dart
- app_spacing.dart
- PlatformAdministrationTest
- String?
- ConversationMessage
- types/orders.ts
- home_shell.dart
- BusinessSettingsPage.tsx
- loading_skeleton.dart
- Role
- http
- axios.ts
- Product
- app.dart
- mockDataStore.ts
- app_motion.dart
- app_primary_app_bar.dart
- quantity_stepper.dart
- useBusinessId
- chat_thread_screen.dart
- AuthController
- RecordedPaymentTest
- ReleaseSecurityTest
- Category
- error_state.dart
- Business
- Sale
- api/inventory.ts
- AiSupportRun
- CatalogPayload
- OrderLine
- logging.php
- ExampleTest
- console.php
- useAuthStore
- @example
- CatalogInventoryTest
- CustomerOrderTest
- useSettings
- scripts
- BusinessUserManagementTest
- types/catalog.ts
- AiSupportSetting
- .owner
- CustomerRegistrationTest
- MessagingNotificationTest

## God Nodes (most connected - your core abstractions)
1. `Business` - 200 edges
2. `User` - 193 edges
3. `cn()` - 124 edges
4. `Role` - 92 edges
5. `react` - 84 edges
6. `Product` - 76 edges
7. `Membership` - 66 edges
8. `Order` - 62 edges
9. `Controller` - 61 edges
10. `AuditLogger` - 61 edges

## Surprising Connections (you probably didn't know these)
- `_OrderSyncAppState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/app.dart → web/src/app/stores/mockDataStore.ts
- `_ChatThreadScreenState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/screens/chat/chat_thread_screen.dart → web/src/app/stores/mockDataStore.ts
- `_PaymentMethodScreenState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/screens/checkout/payment_method_screen.dart → web/src/app/stores/mockDataStore.ts
- `_PaymentProcessingScreenState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/screens/checkout/payment_processing_screen.dart → web/src/app/stores/mockDataStore.ts
- `_HomeShellState` --inherits--> `State`  [EXTRACTED]
  minigrocery_androidapp/lib/screens/home/home_shell.dart → web/src/app/stores/mockDataStore.ts

## Import Cycles
- None detected.

## Communities (127 total, 19 thin omitted)

### Community 0 - "cn"
Cohesion: 0.06
Nodes (43): class-variance-authority, clsx, @radix-ui/react-checkbox, @radix-ui/react-dialog, @radix-ui/react-popover, @radix-ui/react-scroll-area, @radix-ui/react-separator, tailwind-merge (+35 more)

### Community 1 - "db.ts"
Cohesion: 0.14
Nodes (19): mockMessages, mockThreads, AiAssistantResponse, AiKnowledgeEntry, AiKnowledgeType, AiSupportRun, AiSupportSettings, AiUsage (+11 more)

### Community 3 - "mockOrders.ts"
Cohesion: 0.17
Nodes (14): makeMessages(), makeMovements(), reasons, mockNotifications, NotificationItem, customers, makeOrder(), statusOrder (+6 more)

### Community 4 - "api/platform.ts"
Cohesion: 0.07
Nodes (45): BillingDialog(), BusinessActions(), money(), PlanEditor(), PlatformHomePage(), shortDate(), PlanPerkList(), featureLabels (+37 more)

### Community 5 - "OrderDetailPage.tsx"
Cohesion: 0.07
Nodes (53): date-fns, lucide-react, papaparse, react-day-picker, recharts, statusActionLabel, platformKeys, PlatformSection (+45 more)

### Community 6 - "models.dart"
Cohesion: 0.04
Nodes (55): ImageProvider get, Address, AppNotification, AppOrder, at, avatarUrl, body, CartLine (+47 more)

### Community 7 - "RecordedPayment"
Cohesion: 0.09
Nodes (12): PaymentMethod, RecordedPaymentContext, RecordedPaymentStatus, RecordedPaymentException, PaymentInstructionController, RecordedPaymentController, PaymentInstruction, RecordedPayment (+4 more)

### Community 8 - "index.ts"
Cohesion: 0.11
Nodes (28): msw, db, findUserByToken(), tokenFromAuthHeader(), authHandlers, authResponse(), healthHandlers, issueSession() (+20 more)

### Community 9 - "storefront_store_test.dart"
Cohesion: 0.08
Nodes (25): AuthSession, main, cancelOrder, chooseBalanceMethod, close, failNextOrderRefresh, failNextPayment, failNextPlacement (+17 more)

### Community 10 - "package.json"
Cohesion: 0.05
Nodes (42): autoprefixer, cmdk, eslint, eslint-config-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, @hookform/resolvers, jsdom (+34 more)

### Community 11 - "Controller"
Cohesion: 0.06
Nodes (20): PurgeExpiredPaymentProofs, BusinessRegistrationController, BusinessSettingsController, ContextController, CustomerAddressController, CustomerProfileController, HealthController, PlatformUserController (+12 more)

### Community 12 - "routes.tsx"
Cohesion: 0.07
Nodes (26): BusinessRegistrationPage, businessWorkspaceRoles, CategoryListPage, ForbiddenPage, InventoryListPage, inventoryManagerRoles, InventoryReportPage, MovementLogPage (+18 more)

### Community 13 - "package:flutter/material.dart"
Cohesion: 0.05
Nodes (53): app.dart, ../core/messaging/messaging_models.dart, ../../core/messaging/messaging_store.dart, ../../core/storefront/storefront_store.dart, main, build, ForgotPasswordScreen, build (+45 more)

### Community 14 - "app_routes.dart"
Cohesion: 0.04
Nodes (53): addresses, AppRoutes, _build, cartTab, categoriesTab, categoryBrowse, chatList, chatThread (+45 more)

### Community 15 - "Illuminate\Http\JsonResponse"
Cohesion: 0.08
Nodes (10): PlatformBusinessController, PlatformPlanController, PlatformSubscriptionController, SubscriptionRequestController, TenantSubscriptionController, Entitlement, PlatformWallet, SaasPayload (+2 more)

### Community 16 - "DomainException"
Cohesion: 0.16
Nodes (5): PosSaleException, PosSaleController, PosPayload, PosSaleService, DomainException

### Community 17 - "Topbar.tsx"
Cohesion: 0.10
Nodes (24): @radix-ui/react-avatar, @radix-ui/react-dropdown-menu, PwForm, pwSchema, AuthProvider(), allowedTypes, initialsOf(), ProfilePictureDialog() (+16 more)

### Community 18 - "storefront_models.dart"
Cohesion: 0.04
Nodes (51): accountName, accountNumber, actorName, amount, amountReceived, api, apiPrefix, at (+43 more)

### Community 19 - "composer.json"
Cohesion: 0.04
Nodes (47): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+39 more)

### Community 20 - "ProductFormPage.tsx"
Cohesion: 0.08
Nodes (39): @radix-ui/react-label, @radix-ui/react-slot, @radix-ui/react-switch, react-hook-form, sonner, @tanstack/react-query-devtools, queryClient, QueryProvider() (+31 more)

### Community 21 - "react"
Cohesion: 0.08
Nodes (47): react, @tanstack/react-table, ChatPage, DashboardPage, PosPage, AdminDashboard(), CashierDashboard(), MovementLogPage() (+39 more)

### Community 22 - "app_colors.dart"
Cohesion: 0.04
Nodes (44): AppColors, brandAccentAmber, brandAccentYellow, brandAccentYellowBold, brandPrimary, brandPrimarySurface, neutralBorder, neutralInk (+36 more)

### Community 23 - "app_icon_button.dart"
Cohesion: 0.05
Nodes (35): app_icon_button.dart, IconData?, AccentButton, build, expand, label, onPressed, AppIconButton (+27 more)

### Community 24 - "onboarding_screen.dart"
Cohesion: 0.11
Nodes (18): build, createState, _methods, PaymentMethodScreen, _PaymentMethodScreenState, _selected, body, build (+10 more)

### Community 25 - "Illuminate\Database\Migrations\Migration"
Cohesion: 0.06
Nodes (3): Illuminate\Database\Migrations\Migration, Illuminate\Database\Schema\Blueprint, Illuminate\Support\Facades\Schema

### Community 26 - "Membership"
Cohesion: 0.11
Nodes (18): BusinessStatus, SubscriptionStatus, Membership, SubscriptionPlan, Carbon\Carbon, Illuminate\Database\UniqueConstraintViolationException, Illuminate\Foundation\Testing\DatabaseMigrations, Illuminate\Foundation\Testing\RefreshDatabase (+10 more)

### Community 27 - "Illuminate\Database\Eloquent\Relations\HasOne"
Cohesion: 0.14
Nodes (4): Illuminate\Database\Eloquent\Factories\HasFactory, Illuminate\Database\Eloquent\Relations\HasOne, Illuminate\Foundation\Auth\User, Illuminate\Notifications\Notifiable

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
Cohesion: 0.15
Nodes (18): listInventory(), listMovements(), getDashboard(), getInventoryReport(), createUser(), CreateUserPayload, deactivateUser(), getUser() (+10 more)

### Community 33 - "Illuminate\Database\Eloquent\Model"
Cohesion: 0.08
Nodes (9): AiKnowledgeType, BusinessSetting, CustomerProfile, OrderCounterPayment, OrderRefund, Illuminate\Database\Eloquent\Attributes\Fillable, Illuminate\Database\Eloquent\Attributes\Hidden, Illuminate\Database\Eloquent\Model (+1 more)

### Community 34 - "Order"
Cohesion: 0.15
Nodes (9): OrderStatus, OrderWorkflowException, CustomerOrderController, OrderController, Order, CustomerOrderService, OrderPayload, OrderSettlementService (+1 more)

### Community 35 - "main.tsx"
Cohesion: 0.09
Nodes (19): @stomp/stompjs, ToastProvider(), router, enableMswIfNeeded(), env, flags, schema, ServiceReachability (+11 more)

### Community 36 - "User"
Cohesion: 0.11
Nodes (9): BillingStatus, PlatformDashboardController, BillingRecord, Subscription, SubscriptionRequest, User, SubscriptionAdministrationService, SubscriptionRequestService (+1 more)

### Community 37 - "StorefrontPage.tsx"
Cohesion: 0.06
Nodes (63): BusinessApplicationPage, PlatformApplicationsPage, StorefrontPage, SubscriptionPage, BusinessApplicationPage(), PaymentProofPreview(), PrivatePaymentProofPreview(), Props (+55 more)

### Community 38 - "messaging_store_test.dart"
Cohesion: 0.05
Nodes (41): MessagingThread get, main, main, askAssistant, close, createGeneralThread, _expiry, gateway (+33 more)

### Community 39 - "Illuminate\Database\Eloquent\Relations\BelongsTo"
Cohesion: 0.06
Nodes (5): ConversationReadState, PaymentReviewEvent, ProductImage, SupportHandoff, Illuminate\Database\Eloquent\Relations\BelongsTo

### Community 40 - "AuthTokenService"
Cohesion: 0.18
Nodes (3): AccessToken, RefreshToken, AuthTokenService

### Community 41 - "RuntimeException"
Cohesion: 0.22
Nodes (4): ReorderAlertStatus, InsufficientStockException, RuntimeException, HealthTest

### Community 42 - "edit_profile_screen.dart"
Cohesion: 0.11
Nodes (19): dart:typed_data, avatarUrl, build, bytes, _chooseAvatar, createState, didChangeDependencies, dispose (+11 more)

### Community 43 - "useApi.ts"
Cohesion: 0.10
Nodes (38): AiSupportPage(), askAiAssistant(), createAiKnowledge(), deactivateAiKnowledge(), getAiSupportSettings(), getAiUsage(), KnowledgeInput, listAiKnowledge() (+30 more)

### Community 44 - "empty_state.dart"
Cohesion: 0.09
Nodes (21): Color, dart:async, build, createState, initState, PaymentProcessingScreen, _PaymentProcessingScreenState, build (+13 more)

### Community 45 - "ConversationThread"
Cohesion: 0.08
Nodes (7): ConversationMessageKind, UserNotificationType, AiSupportException, ConversationThread, AiSupportService, MessagingService, PromptInjectionGuard

### Community 46 - "addresses_screen.dart"
Cohesion: 0.04
Nodes (59): ../../core/auth/auth_api.dart, ../../core/auth/auth_models.dart, FormState, build, _businesses, _businessId, createState, dispose (+51 more)

### Community 47 - "../theme/app_colors.dart"
Cohesion: 0.07
Nodes (26): MessagingMessage, isScrollControlled, cancelLabel, AppSnackBar, _show, showError, showInfo, showSuccess (+18 more)

### Community 48 - "storefront_store.dart"
Cohesion: 0.07
Nodes (28): ../auth/auth_models.dart, Map, StorefrontCatalog, add, busy, cancel, cart, catalog (+20 more)

### Community 49 - "orders_tab.dart"
Cohesion: 0.07
Nodes (31): ../../core/storefront/storefront_models.dart, CustomerOrder, build, claimedAmount, claimedController, method, order, OrderDetailScreen (+23 more)

### Community 51 - "devDependencies"
Cohesion: 0.08
Nodes (26): devDependencies, autoprefixer, eslint, eslint-config-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, lighthouse (+18 more)

### Community 52 - "api/reports.ts"
Cohesion: 0.15
Nodes (16): mockSalesDaily, mockSalesMonthly, mockSalesWeekly, seededDay(), sevenDaySales, DashboardSnapshot, ReportRange, BucketSelectorProps (+8 more)

### Community 53 - "AiSupportContext"
Cohesion: 0.11
Nodes (8): AiSupportProvider, AiProviderResult, AiSupportContext, AiSupportProviderSelector, GeminiAiProvider, LocalGroundedAiProvider, Illuminate\Support\Facades\Http, GeminiAiProviderTest

### Community 55 - "messaging_api.dart"
Cohesion: 0.08
Nodes (24): messaging_models.dart, askAssistant, _baseUrl, _client, close, createGeneralThread, getPreferences, listMessages (+16 more)

### Community 56 - "home_tab.dart"
Cohesion: 0.09
Nodes (21): build, build, build, createState, didChangeDependencies, HomeTab, _HomeTabState, _requested (+13 more)

### Community 57 - "app_shadows.dart"
Cohesion: 0.09
Nodes (20): app_colors.dart, app_radii.dart, app_typography.dart, AppShadows, shadow1, shadow2, shadow3, shadow4 (+12 more)

### Community 58 - "api/catalog.ts"
Cohesion: 0.16
Nodes (17): ProductFormPage(), createCategory(), createProduct(), deactivateProduct(), getProduct(), getProductByBarcode(), listCategories(), listProducts() (+9 more)

### Community 59 - "api/orders.ts"
Cohesion: 0.12
Nodes (19): StorefrontPage(), cancelCustomerOrder(), getOrder(), getStorefront(), listCustomerOrders(), listOrders(), listStorefronts(), OrderFilters (+11 more)

### Community 60 - "auth_models.dart"
Cohesion: 0.06
Nodes (33): DateTime, accessExpiresAt, accessToken, AuthRole, AuthSession, AuthUser, avatarUrl, businessId (+25 more)

### Community 61 - "AiAdministrationController"
Cohesion: 0.18
Nodes (4): AiAdministrationController, AiSupportController, AiKnowledgeEntry, AiSupportPayload

### Community 62 - "Illuminate\Http\Request"
Cohesion: 0.17
Nodes (6): ConversationController, NotificationController, CarbonImmutable, ReportController, MessagingPayload, Illuminate\Http\Request

### Community 63 - "auth_api.dart"
Cohesion: 0.07
Nodes (26): auth_models.dart, _baseUrl, businesses, _client, close, code, deleteAddress, _imageContentType (+18 more)

### Community 64 - "List"
Cohesion: 0.10
Nodes (18): double get, List, mockCart, mockCartSubtotal, mockCartTotal, mockDeliveryFee, mockCategories, mockChatList (+10 more)

### Community 65 - "roleGuards.ts"
Cohesion: 0.38
Nodes (8): allowedTransitions(), canAdjustInventory(), canApplyLineDiscount(), canEditCatalog(), canManageSettings(), canManageUsers(), canViewReports(), isAdmin()

### Community 66 - "Closure"
Cohesion: 0.18
Nodes (10): AuthenticateAccessToken, EnsureEntitlement, EnsureRole, ResolveTenant, SecurityHeaders, Closure, Illuminate\Foundation\Application, Illuminate\Foundation\Configuration\Exceptions (+2 more)

### Community 67 - "storefront_api.dart"
Cohesion: 0.08
Nodes (25): Exception, HttpClient, AuthApiException, MessagingApiException, _baseUrl, cancelOrder, chooseBalanceMethod, _client (+17 more)

### Community 68 - "LogicException"
Cohesion: 0.12
Nodes (5): SubscriptionEvent, UserFactory, Illuminate\Database\Eloquent\Factories\Factory, LogicException, static

### Community 69 - "auth_session_store.dart"
Cohesion: 0.06
Nodes (32): auth_api.dart, AuthSession? get, bool get, ChangeNotifier, InheritedNotifier, _addressError, _addresses, _addressesBusy (+24 more)

### Community 70 - "app_text_field.dart"
Cohesion: 0.06
Nodes (28): int?, AppSearchField, autofocus, build, controller, hint, onChanged, onTap (+20 more)

### Community 71 - "app_spacing.dart"
Cohesion: 0.11
Nodes (16): AppIconSize, lg, md, sm, xs, AppSpacing, lg, lgPlus (+8 more)

### Community 73 - "String?"
Cohesion: 0.10
Nodes (20): dart:convert, dart:io, HttpServer, AuthApi, api, main, server, login (+12 more)

### Community 74 - "ConversationMessage"
Cohesion: 0.09
Nodes (5): SupportHandoffStatus, ConversationMessage, NotificationPreference, RealtimeEvent, UserNotification

### Community 75 - "types/orders.ts"
Cohesion: 0.13
Nodes (15): zustand, StorefrontCartLine, StorefrontCartState, useStorefrontCartStore, Order, OrderItem, OrderStatus, OrderStatusEvent (+7 more)

### Community 76 - "home_shell.dart"
Cohesion: 0.07
Nodes (29): ../auth/login_screen.dart, ../cart/cart_tab.dart, ../categories/categories_tab.dart, ../../core/auth/auth_session_store.dart, edit_profile_screen.dart, home_tab.dart, build, build (+21 more)

### Community 77 - "BusinessSettingsPage.tsx"
Cohesion: 0.14
Nodes (14): @radix-ui/react-tabs, AiSupportPage, BusinessSettingsPage, emptyKnowledge, KnowledgeDraft, SubscriptionBill(), SubscriptionPayments(), TenantBill (+6 more)

### Community 78 - "loading_skeleton.dart"
Cohesion: 0.15
Nodes (13): AnimationController, BorderRadius, double?, borderRadius, build, _c, createState, dispose (+5 more)

### Community 79 - "Role"
Cohesion: 0.16
Nodes (4): Role, AuthenticationTest, CustomerProfileTest, PosSaleTest

### Community 80 - "http"
Cohesion: 0.22
Nodes (8): http, finalizeSale(), FinalizeSalePayload, getSale(), listSales(), useFinalizeSale(), useSale(), useSales()

### Community 81 - "axios.ts"
Cohesion: 0.18
Nodes (12): axios, axios, AxiosRequestConfig, InternalAxiosRequestConfig, ApiError, attachAuthInterceptor(), attachErrorInterceptor(), ServerError (+4 more)

### Community 82 - "Product"
Cohesion: 0.11
Nodes (9): InventoryReason, InventoryMovement, InventoryStock, Product, ProductPolicy, CatalogInventoryService, DatabaseSeeder, Illuminate\Database\Console\Seeds\WithoutModelEvents (+1 more)

### Community 83 - "app.dart"
Cohesion: 0.11
Nodes (18): core/messaging/messaging_api.dart, core/storefront/storefront_api.dart, _auth, build, createState, didChangeAppLifecycleState, dispose, _handleAuthChange (+10 more)

### Community 84 - "mockDataStore.ts"
Cohesion: 0.12
Nodes (16): recordMovement(), useMockDataStore, mockCategories, mockMovements, mockOrders, mockSettings, adminUser, cashierUser (+8 more)

### Community 85 - "app_motion.dart"
Cohesion: 0.17
Nodes (11): AppMotion, easeInOut, easeOut, emphasized, emphasizedCurve, fast, slow, standard (+3 more)

### Community 86 - "app_primary_app_bar.dart"
Cohesion: 0.17
Nodes (11): actions, AppPrimaryAppBar, backgroundColor, build, centerTitle, foregroundColor, preferredSize, showBack (+3 more)

### Community 87 - "quantity_stepper.dart"
Cohesion: 0.08
Nodes (23): CartLine, build, CartItemRow, line, onQuantityChanged, onRemove, build, _CellBtn (+15 more)

### Community 88 - "useBusinessId"
Cohesion: 0.09
Nodes (31): initialsOf(), Topbar(), CategoryListPage(), ProductListPage(), InventoryListPage(), deleteCategory(), updateCategory(), adjustStock() (+23 more)

### Community 89 - "chat_thread_screen.dart"
Cohesion: 0.20
Nodes (10): _askAi, build, ChatThreadScreen, _ChatThreadScreenState, _controller, createState, dispose, initState (+2 more)

### Community 90 - "AuthController"
Cohesion: 0.20
Nodes (3): AuthController, Cookie, Illuminate\Support\Facades\Cookie

### Community 92 - "ReleaseSecurityTest"
Cohesion: 0.27
Nodes (3): Illuminate\Routing\Route, Illuminate\Support\Facades\Route, ReleaseSecurityTest

### Community 93 - "Category"
Cohesion: 0.23
Nodes (5): Category, CategoryPolicy, AppServiceProvider, Illuminate\Support\Facades\Gate, Illuminate\Support\ServiceProvider

### Community 94 - "error_state.dart"
Cohesion: 0.29
Nodes (6): build, description, ErrorState, onRetry, title, secondary_button.dart

### Community 95 - "Business"
Cohesion: 0.08
Nodes (11): StorefrontController, Business, BusinessPolicy, AnalyticsService, CarbonImmutable, Carbon\CarbonImmutable, Illuminate\Support\Collection, AiCustomerSupportTest (+3 more)

### Community 97 - "api/inventory.ts"
Cohesion: 0.20
Nodes (13): LowStockItem, MovementFilters, InventoryMovement, inventoryMovementSchema, ReasonCode, reasonCodeSchema, RestockEntry, restockEntrySchema (+5 more)

### Community 99 - "CatalogPayload"
Cohesion: 0.13
Nodes (4): CategoryController, InventoryController, ProductController, CatalogPayload

### Community 101 - "logging.php"
Cohesion: 0.40
Nodes (4): Monolog\Handler\NullHandler, Monolog\Handler\StreamHandler, Monolog\Handler\SyslogUdpHandler, Monolog\Processor\PsrLogMessageProcessor

### Community 104 - "useAuthStore"
Cohesion: 0.05
Nodes (53): react-router-dom, @tanstack/react-query, @testing-library/react, @testing-library/user-event, vitest, PlatformNavItem, PlatformShell(), PlatformSidebar() (+45 more)

### Community 118 - "useSettings"
Cohesion: 0.40
Nodes (5): BusinessSettingsContent(), getSettings(), updateSettings(), useSettings(), useUpdateSettings()

### Community 119 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, e2e, e2e:install, format, format:check, lint (+5 more)

### Community 122 - "types/catalog.ts"
Cohesion: 0.15
Nodes (13): zod, PosCartState, usePosCartStore, product, categorySchema, Product, productSchema, CartLine (+5 more)

## Knowledge Gaps
- **1028 isolated node(s):** `$schema`, `name`, `type`, `description`, `keywords` (+1023 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1323 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `State` connect `addresses_screen.dart` to `edit_profile_screen.dart`, `empty_state.dart`, `home_shell.dart`, `loading_skeleton.dart`, `orders_tab.dart`, `app.dart`, `mockDataStore.ts`, `quantity_stepper.dart`, `onboarding_screen.dart`, `chat_thread_screen.dart`, `home_tab.dart`?**
  _High betweenness centrality (0.413) - this node is a cross-community bridge._
- **What connects `$schema`, `name`, `type` to the rest of the system?**
  _1028 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.0632996632996633 - nodes in this community are weakly interconnected._
- **Should `db.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14492753623188406 - nodes in this community are weakly interconnected._
- **Should `Illuminate\Database\Eloquent\Relations\HasMany` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._
- **Should `api/platform.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06862745098039216 - nodes in this community are weakly interconnected._
- **Should `OrderDetailPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07387140902872777 - nodes in this community are weakly interconnected._