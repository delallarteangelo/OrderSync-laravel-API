// Design.md §5.6 — Home shell with bottom navigation
import 'package:flutter/material.dart';

import '../../core/storefront/storefront_store.dart';
import '../../widgets/app_bottom_nav_bar.dart';
import '../cart/cart_tab.dart';
import '../categories/categories_tab.dart';
import '../orders/orders_tab.dart';
import '../profile/profile_tab.dart';
import 'home_tab.dart';

class HomeShell extends StatefulWidget {
  final int initialIndex;
  const HomeShell({super.key, this.initialIndex = 0});
  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  late int _index = widget.initialIndex;

  late final _tabs = const [
    HomeTab(),
    CategoriesTab(),
    CartTab(),
    OrdersTab(),
    ProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _index, children: _tabs),
      bottomNavigationBar: AnimatedBuilder(
        animation: StorefrontScope.of(context),
        builder: (context, _) => AppBottomNavBar(
          currentIndex: _index,
          cartBadge: StorefrontScope.of(context).cart.length,
          onTap: (i) => setState(() => _index = i),
        ),
      ),
    );
  }
}
