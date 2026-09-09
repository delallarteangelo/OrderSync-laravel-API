// Design.md §5.8 — Category browse screen
import 'package:flutter/material.dart';

import '../../core/storefront/storefront_store.dart';
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
    final store = StorefrontScope.of(context);
    final items = (store.catalog?.products ?? const <Product>[])
        .where((p) => p.categoryId == category.id)
        .toList(growable: false);
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: AppPrimaryAppBar(title: category.name, showBack: true),
      body: GridView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: items.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 170 / 245,
        ),
        itemBuilder: (_, i) => ProductCard(
          product: items[i],
          onAdd: () => store.add(items[i]),
          onTap: () => Navigator.of(
            context,
          ).pushNamed(AppRoutes.productDetail, arguments: items[i]),
        ),
      ),
    );
  }
}
