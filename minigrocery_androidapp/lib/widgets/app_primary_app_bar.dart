import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// AppPrimaryAppBar — Design.md §4.1.
class AppPrimaryAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final bool showBack;
  final List<Widget> actions;
  final bool centerTitle;
  final Color backgroundColor;
  final Color foregroundColor;

  const AppPrimaryAppBar({
    super.key,
    required this.title,
    this.showBack = false,
    this.actions = const [],
    this.centerTitle = true,
    this.backgroundColor = AppColors.neutralSurface,
    this.foregroundColor = AppColors.neutralInkBlack,
  });

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: centerTitle,
      automaticallyImplyLeading: false,
      leading: showBack
          ? IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
              onPressed: () => Navigator.of(context).maybePop(),
              tooltip: 'Back',
            )
          : null,
      title: Text(
        title,
        style: AppTypography.textTheme.titleLarge?.copyWith(
          color: foregroundColor,
        ),
      ),
      actions: actions,
    );
  }
}
