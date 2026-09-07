import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_radii.dart';
import '../theme/app_shadows.dart';

/// AppIconButton — Design.md §4.3 (floating circular icon button).
class AppIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final double size;
  final Color background;
  final Color foreground;
  final bool elevated;

  const AppIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.size = 38,
    this.background = AppColors.neutralSurface,
    this.foreground = AppColors.neutralInkBlack,
    this.elevated = true,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: AppRadii.brPill,
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: background,
            borderRadius: AppRadii.brPill,
            border: Border.all(color: AppColors.neutralBorder),
            boxShadow: elevated ? AppShadows.shadow2 : null,
          ),
          child: Icon(icon, size: 18, color: foreground),
        ),
      ),
    );
  }
}
