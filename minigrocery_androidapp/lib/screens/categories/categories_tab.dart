import 'package:flutter/material.dart';

import '../../core/storefront/storefront_store.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';

class CategoriesTab extends StatelessWidget {
  const CategoriesTab({super.key});

  @override
  Widget build(BuildContext context) {
    final store = StorefrontScope.of(context);
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) {
        final categories = store.catalog?.categories ?? const [];
        return Scaffold(
          backgroundColor: AppColors.neutralSurface,
          appBar: const AppPrimaryAppBar(title: 'Categories'),
          body: GridView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: categories.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.5,
            ),
            itemBuilder: (_, index) {
              final category = categories[index];
              return InkWell(
                onTap: () => Navigator.of(
                  context,
                ).pushNamed(AppRoutes.categoryBrowse, arguments: category),
                borderRadius: AppRadii.brLg,
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: category.tint,
                    borderRadius: AppRadii.brLg,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Icon(category.icon, size: 32),
                      Text(
                        category.name,
                        style: AppTypography.textTheme.titleLarge,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }
}
