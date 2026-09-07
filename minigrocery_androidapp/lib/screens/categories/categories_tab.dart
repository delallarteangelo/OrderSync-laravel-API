// Design.md §5.7 — Categories tab
import 'package:flutter/material.dart';

import '../../mock/mock_categories.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';

class CategoriesTab extends StatelessWidget {
  const CategoriesTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: const AppPrimaryAppBar(title: 'Categories'),
      body: GridView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: mockCategories.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.5,
        ),
        itemBuilder: (_, i) {
          final c = mockCategories[i];
          return InkWell(
            onTap: () => Navigator.of(
              context,
            ).pushNamed(AppRoutes.categoryBrowse, arguments: c),
            borderRadius: AppRadii.brLg,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: c.tint,
                borderRadius: AppRadii.brLg,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Icon(c.icon, size: 32, color: AppColors.neutralInkBlack),
                  Text(c.name, style: AppTypography.textTheme.titleLarge),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
