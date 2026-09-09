// Design.md §5.9 — Search screen
import 'package:flutter/material.dart';

import '../../core/storefront/storefront_store.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';
import '../../widgets/app_search_field.dart';
import '../../widgets/category_chip.dart';
import '../../widgets/product_card_list_tile.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  String _query = '';
  @override
  Widget build(BuildContext context) {
    final store = StorefrontScope.of(context);
    final products = store.catalog?.products ?? const [];
    final results = _query.isEmpty
        ? const []
        : products
              .where((p) => p.name.toLowerCase().contains(_query.toLowerCase()))
              .toList(growable: false);
    final suggestions = products
        .take(8)
        .map((product) => product.name)
        .toList();
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: const AppPrimaryAppBar(title: 'Search', showBack: true),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
              child: AppSearchField(
                autofocus: true,
                onChanged: (v) => setState(() => _query = v),
              ),
            ),
            Expanded(
              child: _query.isEmpty
                  ? ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      children: [
                        Text(
                          'Browse products',
                          style: AppTypography.textTheme.titleLarge,
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: suggestions
                              .map(
                                (q) => CategoryChip(
                                  label: q,
                                  onTap: () => setState(() => _query = q),
                                ),
                              )
                              .toList(),
                        ),
                      ],
                    )
                  : results.isEmpty
                  ? Center(
                      child: Text(
                        'No results for "$_query"',
                        style: AppTypography.textTheme.bodyMedium,
                      ),
                    )
                  : ListView.separated(
                      itemCount: results.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (_, i) => ProductCardListTile(
                        product: results[i],
                        onAdd: () => store.add(results[i]),
                        onTap: () => Navigator.of(context).pushNamed(
                          AppRoutes.productDetail,
                          arguments: results[i],
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
