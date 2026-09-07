// Design.md §5.6 — Home tab
import 'package:flutter/material.dart';

import '../../mock/mock_categories.dart';
import '../../mock/mock_products.dart';
import '../../mock/mock_user.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_search_field.dart';
import '../../widgets/category_tile.dart';
import '../../widgets/product_card.dart';

class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Deliver to',
                            style: AppTypography.textTheme.labelSmall,
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              const Icon(
                                Icons.location_on_rounded,
                                size: 18,
                                color: AppColors.brandPrimary,
                              ),
                              const SizedBox(width: 4),
                              Flexible(
                                child: Text(
                                  '${mockUser.address.line1}, ${mockUser.address.city}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: AppTypography.textTheme.titleMedium,
                                ),
                              ),
                              const Icon(Icons.keyboard_arrow_down_rounded),
                            ],
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.notifications_none_rounded),
                      onPressed: () => Navigator.of(
                        context,
                      ).pushNamed(AppRoutes.notifications),
                    ),
                    IconButton(
                      icon: const Icon(Icons.chat_bubble_outline_rounded),
                      onPressed: () =>
                          Navigator.of(context).pushNamed(AppRoutes.chatList),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                child: AppSearchField(
                  readOnly: true,
                  onTap: () =>
                      Navigator.of(context).pushNamed(AppRoutes.search),
                ),
              ),
            ),
            // Promo
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                child: Container(
                  height: 140,
                  decoration: BoxDecoration(
                    color: AppColors.brandPrimary,
                    borderRadius: AppRadii.brLg,
                  ),
                  padding: const EdgeInsets.fromLTRB(20, 16, 16, 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Save 30%',
                              style: AppTypography.textTheme.headlineSmall
                                  ?.copyWith(color: AppColors.onBrand),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'On selected pantry staples today',
                              style: AppTypography.textTheme.bodyMedium
                                  ?.copyWith(color: AppColors.onBrand),
                            ),
                          ],
                        ),
                      ),
                      const Text('🛒', style: TextStyle(fontSize: 64)),
                    ],
                  ),
                ),
              ),
            ),
            // Categories strip
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Categories',
                      style: AppTypography.textTheme.titleLarge,
                    ),
                    TextButton(
                      onPressed: () => Navigator.of(
                        context,
                      ).pushNamed(AppRoutes.categoryBrowse),
                      child: const Text('See all'),
                    ),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 110,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: mockCategories.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (_, i) => CategoryTile(
                    category: mockCategories[i],
                    onTap: () => Navigator.of(context).pushNamed(
                      AppRoutes.categoryBrowse,
                      arguments: mockCategories[i],
                    ),
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              sliver: SliverToBoxAdapter(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Popular near you',
                      style: AppTypography.textTheme.titleLarge,
                    ),
                    TextButton(
                      onPressed: () =>
                          Navigator.of(context).pushNamed(AppRoutes.search),
                      child: const Text('See all'),
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 170 / 245,
                ),
                delegate: SliverChildBuilderDelegate((_, i) {
                  final p = mockProducts[i];
                  return ProductCard(
                    product: p,
                    onTap: () => Navigator.of(
                      context,
                    ).pushNamed(AppRoutes.productDetail, arguments: p),
                  );
                }, childCount: mockProducts.length),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
