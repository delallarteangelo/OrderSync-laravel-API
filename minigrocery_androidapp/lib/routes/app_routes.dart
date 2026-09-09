import 'package:flutter/material.dart';

import '../mock/models.dart';
import '../core/storefront/storefront_models.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/cart/cart_tab.dart';
import '../screens/categories/categories_tab.dart';
import '../screens/categories/category_browse_screen.dart';
import '../screens/chat/chat_list_screen.dart';
import '../screens/chat/chat_thread_screen.dart';
import '../screens/checkout/checkout_screen.dart';
import '../screens/checkout/order_confirmation_screen.dart';
import '../screens/checkout/payment_method_screen.dart';
import '../screens/checkout/payment_processing_screen.dart';
import '../screens/home/home_shell.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/onboarding/onboarding_screen.dart';
import '../screens/orders/order_detail_screen.dart';
import '../screens/orders/order_tracking_screen.dart';
import '../screens/orders/orders_tab.dart';
import '../screens/product/product_detail_screen.dart';
import '../screens/profile/edit_profile_screen.dart';
import '../screens/profile/profile_tab.dart';
import '../screens/profile/settings_screen.dart';
import '../screens/search/search_screen.dart';
import '../screens/splash/splash_screen.dart';

class AppRoutes {
  AppRoutes._();

  static const splash = '/';
  static const onboarding = '/onboarding';
  static const login = '/login';
  static const register = '/register';
  static const forgotPassword = '/forgot-password';
  static const home = '/home';
  static const productDetail = '/product';
  static const search = '/search';
  static const categoryBrowse = '/category';
  static const categoriesTab = '/categories';
  static const cartTab = '/cart';
  static const ordersTab = '/orders';
  static const profileTab = '/profile';
  static const checkout = '/checkout';
  static const paymentMethod = '/payment-method';
  static const paymentProcessing = '/payment-processing';
  static const orderConfirmation = '/order-confirmation';
  static const orderDetail = '/order-detail';
  static const orderTracking = '/order-tracking';
  static const chatList = '/chats';
  static const chatThread = '/chat';
  static const notifications = '/notifications';
  static const editProfile = '/edit-profile';
  static const settings = '/settings';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return _build(const SplashScreen(), settings);
      case onboarding:
        return _build(const OnboardingScreen(), settings);
      case login:
        return _build(const LoginScreen(), settings);
      case register:
        return _build(const RegisterScreen(), settings);
      case forgotPassword:
        return _build(const ForgotPasswordScreen(), settings);
      case home:
        return _build(const HomeShell(), settings);
      case categoriesTab:
        return _build(const CategoriesTab(), settings);
      case cartTab:
        return _build(const CartTab(), settings);
      case ordersTab:
        return _build(const OrdersTab(), settings);
      case profileTab:
        return _build(const ProfileTab(), settings);
      case productDetail:
        final p = settings.arguments as Product;
        return _build(ProductDetailScreen(product: p), settings);
      case search:
        return _build(const SearchScreen(), settings);
      case categoryBrowse:
        final c = settings.arguments as Category?;
        if (c == null) {
          return _build(const CategoriesTab(), settings);
        }
        return _build(CategoryBrowseScreen(category: c), settings);
      case checkout:
        return _build(const CheckoutScreen(), settings);
      case paymentMethod:
        return _build(const PaymentMethodScreen(), settings);
      case paymentProcessing:
        return _build(const PaymentProcessingScreen(), settings);
      case orderConfirmation:
        return _build(const OrderConfirmationScreen(), settings);
      case orderDetail:
        final o = settings.arguments as CustomerOrder;
        return _build(OrderDetailScreen(order: o), settings);
      case orderTracking:
        return _build(const OrderTrackingScreen(), settings);
      case chatList:
        return _build(const ChatListScreen(), settings);
      case chatThread:
        final id = (settings.arguments as String?) ?? 't1';
        return _build(ChatThreadScreen(threadId: id), settings);
      case notifications:
        return _build(const NotificationsScreen(), settings);
      case editProfile:
        return _build(const EditProfileScreen(), settings);
      case AppRoutes.settings:
        return _build(const SettingsScreen(), settings);
      default:
        return _build(
          Scaffold(
            body: Center(child: Text('Unknown route: ${settings.name}')),
          ),
          settings,
        );
    }
  }

  static MaterialPageRoute _build(Widget page, RouteSettings s) =>
      MaterialPageRoute(builder: (_) => page, settings: s);
}
