// Design.md §5.8 — Category browse screen
import 'package:flutter/material.dart';

import '../../mock/mock_products.dart';
import '../../mock/models.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../widgets/app_primary_app_bar.dart';
import '../../widgets/product_card.dart';

class CategoryBrowseScreen extends StatelessWidget {
  final Category category;
  const CategoryBrowseScreen({super.key, required this.category});

  @override
  Widget build(BuildContext context) {
    final items = mockProducts
        .where((p) => p.categoryId == category.id)
        .toList(growable: false);
    final display = items.isEmpty ? mockProducts.take(6).toList() : items;
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: AppPrimaryAppBar(title: category.name, showBack: true),
      body: GridView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: display.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 170 / 245,
        ),
        itemBuilder: (_, i) => ProductCard(
          product: display[i],
          onTap: () => Navigator.of(
            context,
          ).pushNamed(AppRoutes.productDetail, arguments: display[i]),
        ),
      ),
    );
  }
}
