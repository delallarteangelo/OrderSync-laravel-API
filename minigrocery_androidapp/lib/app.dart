import 'package:flutter/material.dart';

import 'routes/app_routes.dart';
import 'theme/app_theme.dart';

class TonettesMinimartApp extends StatelessWidget {
  const TonettesMinimartApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "Tonette's Minimart",
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      initialRoute: AppRoutes.splash,
      onGenerateRoute: AppRoutes.onGenerateRoute,
    );
  }
}
