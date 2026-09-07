import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_radii.dart';

/// LoadingSkeleton — Design.md §4.12 (hand-rolled pulse, no shimmer dep).
class LoadingSkeleton extends StatefulWidget {
  final double? width;
  final double? height;
  final BorderRadius borderRadius;
  const LoadingSkeleton({
    super.key,
    this.width,
    this.height,
    this.borderRadius = AppRadii.brMd,
  });

  @override
  State<LoadingSkeleton> createState() => _LoadingSkeletonState();
}

class _LoadingSkeletonState extends State<LoadingSkeleton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1200),
  )..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _c,
      builder: (_, __) {
        final t = _c.value;
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            color: Color.lerp(
              AppColors.neutralBorder,
              AppColors.neutralSurfaceAlt,
              t,
            )!,
            borderRadius: widget.borderRadius,
          ),
        );
      },
    );
  }
}
