import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Shadow tokens — verbatim from Design.md §3.5.
class AppShadows {
  AppShadows._();

  static const List<BoxShadow> shadow1 = [
    BoxShadow(
      color: AppColors.shadowSoft,
      offset: Offset(0, 4),
      blurRadius: 15,
    ),
  ];
  static const List<BoxShadow> shadow2 = [
    BoxShadow(
      color: AppColors.shadowSoft,
      offset: Offset(0, 7),
      blurRadius: 40,
    ),
  ];
  static const List<BoxShadow> shadow3 = [
    BoxShadow(
      color: AppColors.shadowMedium,
      offset: Offset(0, 4),
      blurRadius: 20,
    ),
  ];
  static const List<BoxShadow> shadow4 = [
    BoxShadow(
      color: AppColors.shadowStrong,
      offset: Offset(0, 4),
      blurRadius: 30,
    ),
  ];
  static const List<BoxShadow> shadow5 = [
    BoxShadow(
      color: AppColors.shadowStrong,
      offset: Offset(0, 4),
      blurRadius: 40,
    ),
  ];
}
