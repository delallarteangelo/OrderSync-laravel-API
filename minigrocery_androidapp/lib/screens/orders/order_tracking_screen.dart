// Design.md §5.18 — Order tracking screen
import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';
import '../../widgets/secondary_button.dart';

class OrderTrackingScreen extends StatelessWidget {
  const OrderTrackingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final steps = [
      ('Order placed', 'Today, 9:12 AM', true),
      ('Confirmed', 'Today, 9:14 AM', true),
      ('Preparing', 'Today, 9:20 AM', true),
      ('Out for delivery', 'Estimated 9:45 AM', false),
      ('Delivered', '—', false),
    ];
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: const AppPrimaryAppBar(title: 'Track order', showBack: true),
      body: SafeArea(
        child: Column(
          children: [
            Container(
              height: 220,
              margin: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.brandPrimarySurface,
                borderRadius: AppRadii.brLg,
              ),
              child: const Center(
                child: Icon(
                  Icons.map_rounded,
                  size: 64,
                  color: AppColors.brandPrimary,
                ),
              ),
            ),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: steps.length,
                itemBuilder: (_, i) {
                  final s = steps[i];
                  final last = i == steps.length - 1;
                  return IntrinsicHeight(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Column(
                          children: [
                            Container(
                              width: 18,
                              height: 18,
                              decoration: BoxDecoration(
                                color: s.$3
                                    ? AppColors.brandPrimary
                                    : AppColors.neutralBorder,
                                shape: BoxShape.circle,
                              ),
                              child: s.$3
                                  ? const Icon(
                                      Icons.check,
                                      size: 12,
                                      color: AppColors.onBrand,
                                    )
                                  : null,
                            ),
                            if (!last)
                              Expanded(
                                child: Container(
                                  width: 2,
                                  color: AppColors.neutralBorder,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  s.$1,
                                  style: AppTypography.textTheme.titleMedium,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  s.$2,
                                  style: AppTypography.textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: SecondaryButton(label: 'Contact rider', onPressed: () {}),
            ),
          ],
        ),
      ),
    );
  }
}
