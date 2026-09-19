# Graph Report - minigrocery  (2026-09-16)

## Corpus Check
- 476 files · ~130,006 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 3372 nodes · 9291 edges · 127 communities (95 shown, 21 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 76 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5acab57e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- OrderDetailPage.tsx
- cn
- Illuminate\Database\Eloquent\Relations\HasMany
- mockOrders.ts
- PlatformHomePage.tsx
- api/catalog.ts
- models.dart
- RecordedPayment
- index.ts
- storefront_store_test.dart
- package.json
- SubscriptionRequestController
- routes.tsx
- StatelessWidget
- app_routes.dart
- StorefrontPage.tsx
- Controller
- Illuminate\Http\Request
- storefront_models.dart
- composer.json
- ProductFormPage.tsx
- MessagingService
- app_colors.dart
- package:flutter/material.dart
- onboarding_screen.dart
- Illuminate\Database\Migrations\Migration
- Business
- Illuminate\Database\Eloquent\Relations\HasOne
- dependencies
- messaging_models.dart
- messaging_store.dart
- ChatPage.tsx
- db.ts
- Illuminate\Database\Eloquent\Relations\BelongsTo
- Order
- SubscriptionPage.tsx
- Illuminate\Http\JsonResponse
- useApi.ts
- messaging_store_test.dart
- AiSupportService.php
- BusinessUserController
- app_text_field.dart
- edit_profile_screen.dart
- AiSupportService
- app_search_field.dart
- AiAdministrationController
- addresses_screen.dart
- app.dart
- storefront_store.dart
- orders_tab.dart
- ConversationThread
- devDependencies
- api/reports.ts
- AiSupportContext
- primary_button.dart
- messaging_api.dart
- PaymentsPage.tsx
- app_shadows.dart
- api/auth.ts
- app_radii.dart
- auth_models.dart
- RecordedPaymentService.php
- .dashboard
- auth_api.dart
- List
- types/orders.ts
- Closure
- storefront_api.dart
- LogicException
- auth_session_store.dart
- api/orders.ts
- app_spacing.dart
- User
- String?
- MessagingPayload
- quantity_stepper.dart
- home_shell.dart
- react
- loading_skeleton.dart
- home_tab.dart
- Sale
- axios.ts
- api/aiSupport.ts
- scripts
- AuthTokenService
- app_motion.dart
- app_primary_app_bar.dart
- RecordedPaymentTest
- ReportController
- OrderLine
- chat_thread_screen.dart
- PaymentInstruction
- ReleaseSecurityTest
- Category
- Role
- api/messages.ts
- CustomerAddressController
- useSettings
- vitest
- Product
- mockDataStore.ts
- logging.php
- ExampleTest
- console.php
- roleGuards.ts
- @example
- types/inventory.ts
- .update
- users.test.ts
- CustomerOrderTest
- SupportHandoff
- types/pos.ts
- AiSupportController
- BusinessSettingsController
- ConversationReadState
- ConversationKind

## God Nodes (most connected - your core abstractions)
1. `Business` - 200 edges
2. `User` - 193 edges
3. `cn()` - 121 edges
4. `Role` - 91 edges
5. `react` - 79 edges
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

## Communities (127 total, 21 thin omitted)

### Community 0 - "OrderDetailPage.tsx"
Cohesion: 0.09
Nodes (43): date-fns, papaparse, @react-pdf/renderer, recharts, AdminDashboard(), CashierDashboard(), Row, OrderDetailPage() (+35 more)

### Community 1 - "cn"
Cohesion: 0.05
Nodes (60): clsx, cmdk, @radix-ui/react-avatar, @radix-ui/react-checkbox, @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @radix-ui/react-popover, @radix-ui/react-scroll-area (+52 more)

### Community 3 - "mockOrders.ts"
Cohesion: 0.14
Nodes (17): makeMessages(), makeMovements(), mockMovements, reasons, mockNotifications, NotificationItem, customers, makeOrder() (+9 more)

### Community 4 - "PlatformHomePage.tsx"
Cohesion: 0.08
Nodes (48): BillingDialog(), BusinessActions(), money(), PlanEditor(), PlatformHomePage(), platformKeys, shortDate(), PlanPerkList() (+40 more)

### Community 5 - "api/catalog.ts"
Cohesion: 0.11
Nodes (24): CategoryListPage(), ProductListPage(), InventoryListPage(), RestockPage(), PosPage(), createCategory(), deactivateProduct(), deleteCategory() (+16 more)

### Community 6 - "models.dart"
Cohesion: 0.04
Nodes (55): ImageProvider get, Address, AppNotification, AppOrder, at, avatarUrl, body, CartLine (+47 more)

### Community 7 - "RecordedPayment"
Cohesion: 0.14
Nodes (7): PurgeExpiredPaymentProofs, RecordedPaymentContext, RecordedPaymentController, RecordedPayment, RecordedPaymentPayload, Illuminate\Console\Command, Symfony\Component\HttpFoundation\StreamedResponse

### Community 8 - "index.ts"
Cohesion: 0.08
Nodes (40): msw, enableMswIfNeeded(), OrderStatusEvent, worker, db, findUserByToken(), randomId(), tokenFromAuthHeader() (+32 more)

### Community 9 - "storefront_store_test.dart"
Cohesion: 0.08
Nodes (25): AuthSession, main, cancelOrder, chooseBalanceMethod, close, failNextOrderRefresh, failNextPayment, failNextPlacement (+17 more)

### Community 10 - "package.json"
Cohesion: 0.03
Nodes (58): autoprefixer, eslint, eslint-config-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, @hookform/resolvers, jsdom, lighthouse (+50 more)

### Community 11 - "SubscriptionRequestController"
Cohesion: 0.21
Nodes (3): SubscriptionRequestController, PlatformWallet, SubscriptionRequestPayload

### Community 12 - "routes.tsx"
Cohesion: 0.05
Nodes (51): react-router-dom, @tanstack/react-query, @testing-library/react, AuthProvider(), RequireAuth(), RequireRole(), BusinessSettingsPage, businessWorkspaceRoles (+43 more)

### Community 13 - "StatelessWidget"
Cohesion: 0.06
Nodes (39): ../core/messaging/messaging_models.dart, ../../core/messaging/messaging_store.dart, ../../core/storefront/storefront_store.dart, build, CartTab, CategoriesTab, category, CategoryBrowseScreen (+31 more)

### Community 14 - "app_routes.dart"
Cohesion: 0.04
Nodes (53): addresses, AppRoutes, _build, cartTab, categoriesTab, categoryBrowse, chatList, chatThread (+45 more)

### Community 15 - "StorefrontPage.tsx"
Cohesion: 0.08
Nodes (40): class-variance-authority, lucide-react, @radix-ui/react-select, react-day-picker, @tanstack/react-table, MovementLogPage(), reasonColor, ALL_STATUSES (+32 more)

### Community 16 - "Controller"
Cohesion: 0.06
Nodes (12): PosSaleException, BusinessRegistrationController, CustomerProfileController, PlatformUserController, ProductImageController, Controller, AuditLogger, PosSaleService (+4 more)

### Community 17 - "Illuminate\Http\Request"
Cohesion: 0.05
Nodes (15): BillingStatus, PlatformDashboardController, PlatformSubscriptionController, TenantSubscriptionController, BillingRecord, Subscription, SubscriptionRequest, SaasPayload (+7 more)

### Community 18 - "storefront_models.dart"
Cohesion: 0.04
Nodes (51): accountName, accountNumber, actorName, amount, amountReceived, api, apiPrefix, at (+43 more)

### Community 19 - "composer.json"
Cohesion: 0.04
Nodes (47): pestphp/pest-plugin, php-http/discovery, autoload, autoload-dev, psr-4, psr-4, config, allow-plugins (+39 more)

### Community 20 - "ProductFormPage.tsx"
Cohesion: 0.09
Nodes (33): @radix-ui/react-label, @radix-ui/react-slot, @radix-ui/react-switch, react-hook-form, BusinessRegistrationPage, ProductFormPage, UserFormPage, BusinessRegistrationPage() (+25 more)

### Community 21 - "MessagingService"
Cohesion: 0.16
Nodes (3): UserNotificationType, ConversationMessage, MessagingService

### Community 22 - "app_colors.dart"
Cohesion: 0.07
Nodes (26): AppColors, brandAccentAmber, brandAccentYellow, brandAccentYellowBold, brandPrimary, brandPrimarySurface, neutralBorder, neutralInk (+18 more)

### Community 23 - "package:flutter/material.dart"
Cohesion: 0.03
Nodes (78): app.dart, app_icon_button.dart, IconData?, MessagingMessage, main, build, AccentButton, build (+70 more)

### Community 24 - "onboarding_screen.dart"
Cohesion: 0.11
Nodes (18): build, createState, _methods, PaymentMethodScreen, _PaymentMethodScreenState, _selected, body, build (+10 more)

### Community 25 - "Illuminate\Database\Migrations\Migration"
Cohesion: 0.06
Nodes (3): Illuminate\Database\Migrations\Migration, Illuminate\Database\Schema\Blueprint, Illuminate\Support\Facades\Schema

### Community 26 - "Business"
Cohesion: 0.08
Nodes (22): BusinessStatus, SubscriptionStatus, Business, Membership, SubscriptionPlan, Illuminate\Database\Eloquent\Factories\HasFactory, Illuminate\Database\UniqueConstraintViolationException, Illuminate\Foundation\Testing\DatabaseMigrations (+14 more)

### Community 28 - "dependencies"
Cohesion: 0.05
Nodes (39): dependencies, axios, class-variance-authority, clsx, cmdk, date-fns, @hookform/resolvers, lucide-react (+31 more)

### Community 29 - "messaging_models.dart"
Cohesion: 0.05
Nodes (37): AppUserNotification, body, content, copyWith, createdAt, cursor, customerName, EventPollResult (+29 more)

### Community 30 - "messaging_store.dart"
Cohesion: 0.05
Nodes (38): int get, messaging_api.dart, aiKnowledge, askAssistant, busy, consumeForegroundNotice, createGeneralThread, _cursor (+30 more)

### Community 31 - "ChatPage.tsx"
Cohesion: 0.19
Nodes (15): ChatPage, ChatPage(), CustomerSupportPanel(), askAiAssistant(), listPublishedAiKnowledge(), requestHumanHandoff(), createThread(), EmptyState() (+7 more)

### Community 32 - "db.ts"
Cohesion: 0.19
Nodes (14): mockMessages, mockThreads, mockSettings, ChatThread, Message, NotificationPreferences, RealtimeEvent, ThreadKind (+6 more)

### Community 33 - "Illuminate\Database\Eloquent\Relations\BelongsTo"
Cohesion: 0.08
Nodes (9): BusinessSetting, CustomerProfile, OrderCounterPayment, OrderRefund, ProductImage, Illuminate\Database\Eloquent\Attributes\Fillable, Illuminate\Database\Eloquent\Attributes\Hidden, Illuminate\Database\Eloquent\Model (+1 more)

### Community 34 - "Order"
Cohesion: 0.09
Nodes (11): OrderStatus, OrderWorkflowException, CustomerOrderController, OrderController, Order, CustomerOrderService, OrderPayload, OrderSettlementService (+3 more)

### Community 35 - "SubscriptionPage.tsx"
Cohesion: 0.15
Nodes (23): BusinessApplicationPage, PlatformApplicationsPage, SubscriptionPage, BusinessApplicationPage(), PlatformApplicationsPage(), WalletForm(), money(), SubscriptionPage() (+15 more)

### Community 36 - "Illuminate\Http\JsonResponse"
Cohesion: 0.14
Nodes (9): ContextController, HealthController, PlatformBusinessController, PosSaleController, StorefrontController, PosPayload, Illuminate\Http\JsonResponse, Illuminate\Support\Facades\Route (+1 more)

### Community 37 - "useApi.ts"
Cohesion: 0.09
Nodes (42): initialsOf(), Topbar(), getProduct(), uploadProductImage(), listLowStock(), MovementFilters, getOrder(), listOrders() (+34 more)

### Community 38 - "messaging_store_test.dart"
Cohesion: 0.06
Nodes (33): MessagingThread get, askAssistant, close, createGeneralThread, _expiry, gateway, getPreferences, handoffThreads (+25 more)

### Community 39 - "AiSupportService.php"
Cohesion: 0.09
Nodes (5): AiSupportRunStatus, ConversationMessageKind, AiSupportRun, AiSupportSetting, PromptInjectionGuard

### Community 41 - "app_text_field.dart"
Cohesion: 0.10
Nodes (19): int?, AppTextField, build, controller, hint, keyboardType, label, maxLines (+11 more)

### Community 42 - "edit_profile_screen.dart"
Cohesion: 0.09
Nodes (21): build, ForgotPasswordScreen, avatarUrl, build, bytes, _chooseAvatar, createState, didChangeDependencies (+13 more)

### Community 44 - "app_search_field.dart"
Cohesion: 0.07
Nodes (25): CartLine, AppBottomNavBar, badge, build, cartBadge, _CartIcon, currentIndex, filled (+17 more)

### Community 45 - "AiAdministrationController"
Cohesion: 0.21
Nodes (4): AiKnowledgeType, AiAdministrationController, AiKnowledgeEntry, AiSupportPayload

### Community 46 - "addresses_screen.dart"
Cohesion: 0.04
Nodes (59): ../../core/auth/auth_api.dart, ../../core/auth/auth_models.dart, FormState, build, _businesses, _businessId, createState, dispose (+51 more)

### Community 47 - "app.dart"
Cohesion: 0.11
Nodes (18): core/messaging/messaging_api.dart, core/storefront/storefront_api.dart, _auth, build, createState, didChangeAppLifecycleState, dispose, _handleAuthChange (+10 more)

### Community 48 - "storefront_store.dart"
Cohesion: 0.07
Nodes (26): ../auth/auth_models.dart, Map, StorefrontCatalog, add, busy, cancel, cart, catalog (+18 more)

### Community 49 - "orders_tab.dart"
Cohesion: 0.08
Nodes (26): ../../core/storefront/storefront_models.dart, CustomerOrder, build, claimedAmount, claimedController, method, order, OrderDetailScreen (+18 more)

### Community 51 - "devDependencies"
Cohesion: 0.08
Nodes (26): devDependencies, autoprefixer, eslint, eslint-config-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, jsdom, lighthouse (+18 more)

### Community 52 - "api/reports.ts"
Cohesion: 0.14
Nodes (17): mockSalesDaily, mockSalesMonthly, mockSalesWeekly, seededDay(), sevenDaySales, LowStockItem, DashboardSnapshot, ReportRange (+9 more)

### Community 53 - "AiSupportContext"
Cohesion: 0.07
Nodes (14): AiSupportProvider, AppServiceProvider, AiProviderResult, AiSupportContext, AiSupportProviderSelector, GeminiAiProvider, LocalGroundedAiProvider, Illuminate\Foundation\Testing\TestCase (+6 more)

### Community 54 - "primary_button.dart"
Cohesion: 0.10
Nodes (19): Color, dart:async, build, createState, initState, PaymentProcessingScreen, _PaymentProcessingScreenState, build (+11 more)

### Community 55 - "messaging_api.dart"
Cohesion: 0.08
Nodes (24): messaging_models.dart, askAssistant, _baseUrl, _client, close, createGeneralThread, getPreferences, listMessages (+16 more)

### Community 56 - "PaymentsPage.tsx"
Cohesion: 0.10
Nodes (33): PaymentProofPreview(), InstructionForm(), InstructionManager(), PaymentReviewCard(), PaymentsPage(), payment, SubscriptionBill(), SubscriptionPayments() (+25 more)

### Community 57 - "app_shadows.dart"
Cohesion: 0.09
Nodes (20): app_colors.dart, app_radii.dart, app_typography.dart, AppShadows, shadow1, shadow2, shadow3, shadow4 (+12 more)

### Community 58 - "api/auth.ts"
Cohesion: 0.14
Nodes (11): adminUser, cashierUser, mockUsers, superAdminUser, AuthResponse, changePassword(), LoginPayload, AuthSession (+3 more)

### Community 59 - "app_radii.dart"
Cohesion: 0.11
Nodes (18): AppRadii, brFull, brLg, brMd, brPill, brSheetTop, brSm, brXl (+10 more)

### Community 60 - "auth_models.dart"
Cohesion: 0.06
Nodes (33): DateTime, accessExpiresAt, accessToken, AuthRole, AuthSession, AuthUser, avatarUrl, businessId (+25 more)

### Community 61 - "RecordedPaymentService.php"
Cohesion: 0.33
Nodes (5): PaymentMethod, RecordedPaymentStatus, RecordedPaymentException, RecordedPaymentService, Illuminate\Http\UploadedFile

### Community 62 - ".dashboard"
Cohesion: 0.17
Nodes (5): AnalyticsService, CarbonImmutable, Carbon\CarbonImmutable, AnalyticsReportTest, CarbonImmutable

### Community 63 - "auth_api.dart"
Cohesion: 0.07
Nodes (26): auth_models.dart, _baseUrl, businesses, _client, close, code, deleteAddress, _imageContentType (+18 more)

### Community 64 - "List"
Cohesion: 0.10
Nodes (18): double get, List, mockCart, mockCartSubtotal, mockCartTotal, mockDeliveryFee, mockCategories, mockChatList (+10 more)

### Community 65 - "types/orders.ts"
Cohesion: 0.20
Nodes (9): StorefrontCartLine, StorefrontCartState, useStorefrontCartStore, OrderItem, orderStatusSchema, Storefront, StorefrontCategory, StorefrontProduct (+1 more)

### Community 66 - "Closure"
Cohesion: 0.18
Nodes (10): AuthenticateAccessToken, EnsureEntitlement, EnsureRole, ResolveTenant, SecurityHeaders, Closure, Illuminate\Foundation\Application, Illuminate\Foundation\Configuration\Exceptions (+2 more)

### Community 67 - "storefront_api.dart"
Cohesion: 0.08
Nodes (26): dart:typed_data, Exception, HttpClient, AuthApiException, MessagingApiException, _baseUrl, cancelOrder, chooseBalanceMethod (+18 more)

### Community 68 - "LogicException"
Cohesion: 0.08
Nodes (7): AuditLog, PaymentReviewEvent, SubscriptionEvent, UserFactory, Illuminate\Database\Eloquent\Factories\Factory, LogicException, static

### Community 69 - "auth_session_store.dart"
Cohesion: 0.06
Nodes (32): auth_api.dart, AuthSession? get, bool get, ChangeNotifier, InheritedNotifier, _addressError, _addresses, _addressesBusy (+24 more)

### Community 70 - "api/orders.ts"
Cohesion: 0.19
Nodes (13): StorefrontPage(), cancelCustomerOrder(), getStorefront(), listCustomerOrders(), listStorefronts(), OrderFilters, placeCustomerOrder(), PlaceOrderPayload (+5 more)

### Community 71 - "app_spacing.dart"
Cohesion: 0.11
Nodes (16): AppIconSize, lg, md, sm, xs, AppSpacing, lg, lgPlus (+8 more)

### Community 72 - "User"
Cohesion: 0.08
Nodes (10): AuthController, User, BusinessPolicy, ProductPolicy, Cookie, Illuminate\Foundation\Auth\User, Illuminate\Notifications\Notifiable, Illuminate\Support\Facades\Cookie (+2 more)

### Community 73 - "String?"
Cohesion: 0.07
Nodes (27): dart:convert, dart:io, HttpServer, AuthApi, api, main, server, main (+19 more)

### Community 74 - "MessagingPayload"
Cohesion: 0.13
Nodes (6): SupportHandoffStatus, NotificationController, NotificationPreference, RealtimeEvent, UserNotification, MessagingPayload

### Community 75 - "quantity_stepper.dart"
Cohesion: 0.13
Nodes (15): build, _CellBtn, createState, enabled, height, icon, initial, max (+7 more)

### Community 76 - "home_shell.dart"
Cohesion: 0.07
Nodes (29): ../auth/login_screen.dart, ../cart/cart_tab.dart, ../categories/categories_tab.dart, ../../core/auth/auth_session_store.dart, edit_profile_screen.dart, home_tab.dart, build, build (+21 more)

### Community 77 - "react"
Cohesion: 0.09
Nodes (29): @radix-ui/react-tabs, react, @testing-library/user-event, AiSupportPage, emptyKnowledge, KnowledgeDraft, AdjustStockDialog(), PaymentDialog() (+21 more)

### Community 78 - "loading_skeleton.dart"
Cohesion: 0.15
Nodes (13): AnimationController, BorderRadius, double?, borderRadius, build, _c, createState, dispose (+5 more)

### Community 79 - "home_tab.dart"
Cohesion: 0.10
Nodes (20): build, build, build, createState, didChangeDependencies, HomeTab, _HomeTabState, _requested (+12 more)

### Community 81 - "axios.ts"
Cohesion: 0.15
Nodes (14): axios, axios, AxiosRequestConfig, http, InternalAxiosRequestConfig, ApiError, attachAuthInterceptor(), attachErrorInterceptor() (+6 more)

### Community 82 - "api/aiSupport.ts"
Cohesion: 0.11
Nodes (25): AiSupportPage(), createAiKnowledge(), deactivateAiKnowledge(), getAiSupportSettings(), getAiUsage(), KnowledgeInput, listAiKnowledge(), listSupportHandoffs() (+17 more)

### Community 83 - "scripts"
Cohesion: 0.15
Nodes (13): scripts, build, dev, e2e, e2e:install, format, format:check, lint (+5 more)

### Community 84 - "AuthTokenService"
Cohesion: 0.18
Nodes (3): AccessToken, RefreshToken, AuthTokenService

### Community 85 - "app_motion.dart"
Cohesion: 0.17
Nodes (11): AppMotion, easeInOut, easeOut, emphasized, emphasizedCurve, fast, slow, standard (+3 more)

### Community 86 - "app_primary_app_bar.dart"
Cohesion: 0.17
Nodes (11): actions, AppPrimaryAppBar, backgroundColor, build, centerTitle, foregroundColor, preferredSize, showBack (+3 more)

### Community 90 - "chat_thread_screen.dart"
Cohesion: 0.20
Nodes (10): _askAi, build, ChatThreadScreen, _ChatThreadScreenState, _controller, createState, dispose, initState (+2 more)

### Community 93 - "Category"
Cohesion: 0.24
Nodes (3): CategoryController, Category, CategoryPolicy

### Community 94 - "Role"
Cohesion: 0.12
Nodes (5): Role, AuthenticationTest, CatalogInventoryTest, CustomerProfileTest, PosSaleTest

### Community 95 - "api/messages.ts"
Cohesion: 0.24
Nodes (12): getNotificationPreferences(), listMessages(), listNotifications(), listThreads(), markAllNotificationsRead(), markNotificationRead(), markThreadRead(), pollEvents() (+4 more)

### Community 97 - "useSettings"
Cohesion: 0.20
Nodes (10): ProductFormPage(), BusinessSettingsContent(), createProduct(), updateProduct(), getSettings(), updateSettings(), useCreateProduct(), useSettings() (+2 more)

### Community 98 - "vitest"
Cohesion: 0.29
Nodes (10): vitest, adjustStock(), listInventory(), listMovements(), restock(), loginAs(), loginAsAdmin(), loginAsCashier() (+2 more)

### Community 99 - "Product"
Cohesion: 0.07
Nodes (15): InventoryReason, ReorderAlertStatus, InsufficientStockException, InventoryController, ProductController, InventoryMovement, InventoryStock, Product (+7 more)

### Community 100 - "mockDataStore.ts"
Cohesion: 0.19
Nodes (10): recordMovement(), useMockDataStore, PosProductTile(), PosProductTileProps, product, mockCategories, Category, categorySchema (+2 more)

### Community 101 - "logging.php"
Cohesion: 0.40
Nodes (4): Monolog\Handler\NullHandler, Monolog\Handler\StreamHandler, Monolog\Handler\SyslogUdpHandler, Monolog\Processor\PsrLogMessageProcessor

### Community 104 - "roleGuards.ts"
Cohesion: 0.38
Nodes (8): allowedTransitions(), canAdjustInventory(), canApplyLineDiscount(), canEditCatalog(), canManageSettings(), canManageUsers(), canViewReports(), isAdmin()

### Community 116 - "types/inventory.ts"
Cohesion: 0.29
Nodes (8): InventoryMovement, inventoryMovementSchema, ReasonCode, reasonCodeSchema, RestockEntry, restockEntrySchema, StockAdjustment, stockAdjustmentSchema

### Community 117 - ".update"
Cohesion: 0.31
Nodes (3): PlatformPlanController, Entitlement, Illuminate\Database\Eloquent\Relations\BelongsToMany

### Community 118 - "users.test.ts"
Cohesion: 0.33
Nodes (7): createUser(), CreateUserPayload, deactivateUser(), getUser(), listUsers(), resetUserPassword(), updateUser()

### Community 122 - "types/pos.ts"
Cohesion: 0.23
Nodes (8): zustand, PosCartState, usePosCartStore, CartLine, cartLineSchema, paymentMethodSchema, PosSale, posSaleSchema

## Knowledge Gaps
- **1015 isolated node(s):** `$schema`, `name`, `type`, `description`, `keywords` (+1010 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1310 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `State` connect `addresses_screen.dart` to `mockDataStore.ts`, `edit_profile_screen.dart`, `quantity_stepper.dart`, `home_shell.dart`, `loading_skeleton.dart`, `app.dart`, `home_tab.dart`, `orders_tab.dart`, `primary_button.dart`, `onboarding_screen.dart`, `chat_thread_screen.dart`?**
  _High betweenness centrality (0.407) - this node is a cross-community bridge._
- **What connects `$schema`, `name`, `type` to the rest of the system?**
  _1015 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `OrderDetailPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09360126916975145 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.05028305028305028 - nodes in this community are weakly interconnected._
- **Should `Illuminate\Database\Eloquent\Relations\HasMany` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `mockOrders.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13768115942028986 - nodes in this community are weakly interconnected._
- **Should `PlatformHomePage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0750151240169389 - nodes in this community are weakly interconnected._