import 'package:flutter/material.dart';

import 'core/auth/auth_api.dart';
import 'core/auth/auth_session_store.dart';
import 'core/storefront/storefront_api.dart';
import 'core/storefront/storefront_store.dart';
import 'routes/app_routes.dart';
import 'theme/app_theme.dart';

class TonettesMinimartApp extends StatefulWidget {
  const TonettesMinimartApp({super.key});

  @override
  State<TonettesMinimartApp> createState() => _TonettesMinimartAppState();
}

class _TonettesMinimartAppState extends State<TonettesMinimartApp> {
  late final AuthSessionStore _auth;
  late final StorefrontStore _storefront;

  @override
  void initState() {
    super.initState();
    _auth = AuthSessionStore(AuthApi());
    _storefront = StorefrontStore(StorefrontApi(), () => _auth.session);
    _auth.addListener(_handleAuthChange);
  }

  void _handleAuthChange() {
    if (!_auth.isAuthenticated) _storefront.reset();
  }

  @override
  void dispose() {
    _auth.removeListener(_handleAuthChange);
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
        child: MaterialApp(
          title: 'OrderSync',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light,
          initialRoute: AppRoutes.splash,
          onGenerateRoute: AppRoutes.onGenerateRoute,
        ),
      ),
    );
  }
}
