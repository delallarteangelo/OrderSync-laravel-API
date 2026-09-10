import 'package:flutter/material.dart';

import 'core/auth/auth_api.dart';
import 'core/auth/auth_session_store.dart';
import 'core/storefront/storefront_api.dart';
import 'core/storefront/storefront_store.dart';
import 'core/messaging/messaging_api.dart';
import 'core/messaging/messaging_store.dart';
import 'routes/app_routes.dart';
import 'theme/app_theme.dart';

class TonettesMinimartApp extends StatefulWidget {
  const TonettesMinimartApp({super.key});

  @override
  State<TonettesMinimartApp> createState() => _TonettesMinimartAppState();
}

class _TonettesMinimartAppState extends State<TonettesMinimartApp>
    with WidgetsBindingObserver {
  late final AuthSessionStore _auth;
  late final StorefrontStore _storefront;
  late final MessagingStore _messaging;
  final _messengerKey = GlobalKey<ScaffoldMessengerState>();

  @override
  void initState() {
    super.initState();
    _auth = AuthSessionStore(AuthApi());
    _storefront = StorefrontStore(StorefrontApi(), () => _auth.session);
    _messaging = MessagingStore(MessagingApi(), () => _auth.session);
    _auth.addListener(_handleAuthChange);
    _messaging.addListener(_handleMessagingChange);
    WidgetsBinding.instance.addObserver(this);
  }

  void _handleAuthChange() {
    if (!_auth.isAuthenticated) {
      _storefront.reset();
      _messaging.reset();
    } else {
      _messaging.start();
    }
  }

  void _handleMessagingChange() {
    final notice = _messaging.consumeForegroundNotice();
    if (notice == null) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _messengerKey.currentState?.showSnackBar(
        SnackBar(content: Text(notice), behavior: SnackBarBehavior.floating),
      );
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _auth.isAuthenticated) {
      _messaging.start();
    } else {
      _messaging.stopPolling();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _auth.removeListener(_handleAuthChange);
    _messaging.removeListener(_handleMessagingChange);
    _messaging.dispose();
    _storefront.dispose();
    _auth.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthScope(
      store: _auth,
      child: StorefrontScope(
        store: _storefront,
        child: MessagingScope(
          store: _messaging,
          child: MaterialApp(
            scaffoldMessengerKey: _messengerKey,
            title: 'OrderSync',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light,
            initialRoute: AppRoutes.splash,
            onGenerateRoute: AppRoutes.onGenerateRoute,
          ),
        ),
      ),
    );
  }
}
