import 'package:flutter/material.dart';

import 'core/auth/auth_api.dart';
import 'core/auth/auth_session_store.dart';
import 'routes/app_routes.dart';
import 'theme/app_theme.dart';

class TonettesMinimartApp extends StatefulWidget {
  const TonettesMinimartApp({super.key});

  @override
  State<TonettesMinimartApp> createState() => _TonettesMinimartAppState();
}

class _TonettesMinimartAppState extends State<TonettesMinimartApp> {
  late final AuthSessionStore _auth = AuthSessionStore(AuthApi());

  @override
  void dispose() {
    _auth.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuthScope(
      store: _auth,
      child: MaterialApp(
        title: 'OrderSync',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        initialRoute: AppRoutes.splash,
        onGenerateRoute: AppRoutes.onGenerateRoute,
      ),
    );
  }
}
