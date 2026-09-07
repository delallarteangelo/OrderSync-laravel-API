import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_radii.dart';
import '../theme/app_shadows.dart';
import '../theme/app_typography.dart';

/// QuantityStepper — Design.md §4.9. Holds its own visual count.
class QuantityStepper extends StatefulWidget {
  final int initial;
  final int min;
  final int max;
  final ValueChanged<int>? onChanged;
  final double height;
  const QuantityStepper({
    super.key,
    this.initial = 1,
    this.min = 1,
    this.max = 99,
    this.onChanged,
    this.height = 38,
  });

  @override
  State<QuantityStepper> createState() => _QuantityStepperState();
}

class _QuantityStepperState extends State<QuantityStepper> {
  late int _value = widget.initial;

  void _update(int delta) {
    final next = (_value + delta).clamp(widget.min, widget.max);
    if (next == _value) return;
    setState(() => _value = next);
    widget.onChanged?.call(_value);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: widget.height,
      decoration: BoxDecoration(
        color: AppColors.neutralSurface,
        borderRadius: AppRadii.brPill,
        border: Border.all(color: AppColors.neutralBorder),
        boxShadow: AppShadows.shadow2,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _CellBtn(
            icon: Icons.remove_rounded,
            enabled: _value > widget.min,
            onTap: () => _update(-1),
          ),
          SizedBox(
            width: 28,
            child: Center(
              child: Text(
                '$_value',
                style: AppTypography.textTheme.titleMedium,
              ),
            ),
          ),
          _CellBtn(
            icon: Icons.add_rounded,
            enabled: _value < widget.max,
            onTap: () => _update(1),
          ),
        ],
      ),
    );
  }
}

class _CellBtn extends StatelessWidget {
  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;
  const _CellBtn({
    required this.icon,
    required this.enabled,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.4,
      child: InkResponse(
        onTap: enabled ? onTap : null,
        radius: 18,
        child: SizedBox(
          width: 30,
          height: 30,
          child: Icon(icon, size: 18, color: AppColors.neutralInkBlack),
        ),
      ),
    );
  }
}
