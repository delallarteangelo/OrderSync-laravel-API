import 'package:flutter/material.dart';

import '../../core/storefront/storefront_store.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';
import '../../widgets/category_tile.dart';
import '../../widgets/error_state.dart';
import '../../widgets/product_card.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  var _requested = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_requested) {
      _requested = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) StorefrontScope.of(context).load();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final store = StorefrontScope.of(context);
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) {
        if (store.busy && store.catalog == null) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (store.catalog == null) {
          return Scaffold(
            body: ErrorState(
              title: 'Store unavailable',
              description:
                  store.error ?? 'Sign in to load your selected store.',
              onRetry: store.load,
            ),
          );
        }
        final catalog = store.catalog!;
        return Scaffold(
          backgroundColor: AppColors.neutralSurface,
          body: SafeArea(
            child: RefreshIndicator(
              onRefresh: store.load,
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Pickup from',
                            style: AppTypography.textTheme.labelSmall,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(
                                Icons.storefront_rounded,
                                color: AppColors.brandPrimary,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  catalog.businessName,
                                  style: AppTypography.textTheme.titleLarge,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: SizedBox(
                      height: 110,
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 8,
                        ),
                        scrollDirection: Axis.horizontal,
                        itemCount: catalog.categories.length,
                        separatorBuilder: (_, _) => const SizedBox(width: 10),
                        itemBuilder: (_, index) {
                          final category = catalog.categories[index];
                          return CategoryTile(
                            category: category,
                            onTap: () => Navigator.of(context).pushNamed(
                              AppRoutes.categoryBrowse,
                              arguments: category,
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                    sliver: SliverToBoxAdapter(
                      child: Text(
                        'Available products',
                        style: AppTypography.textTheme.titleLarge,
                      ),
                    ),
                  ),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 12,
                            crossAxisSpacing: 12,
                            childAspectRatio: 170 / 245,
                          ),
                      delegate: SliverChildBuilderDelegate((_, index) {
                        final product = catalog.products[index];
                        return ProductCard(
                          product: product,
                          onAdd: product.stock > 0
                              ? () => store.add(product)
                              : null,
                          onTap: () => Navigator.of(context).pushNamed(
                            AppRoutes.productDetail,
                            arguments: product,
                          ),
                        );
                      }, childCount: catalog.products.length),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
