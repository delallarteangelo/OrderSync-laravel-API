import 'package:flutter/material.dart';

/// Radius tokens — verbatim from Design.md §3.4.
class AppRadii {
  AppRadii._();
  static const Radius xs = Radius.circular(5);
  static const Radius sm = Radius.circular(7);
  static const Radius md = Radius.circular(10);
  static const Radius lg = Radius.circular(15);
  static const Radius xl = Radius.circular(20);
  static const Radius pill = Radius.circular(40);
  static const Radius full = Radius.circular(100);

  static const BorderRadius brXs = BorderRadius.all(xs);
  static const BorderRadius brSm = BorderRadius.all(sm);
  static const BorderRadius brMd = BorderRadius.all(md);
  static const BorderRadius brLg = BorderRadius.all(lg);
  static const BorderRadius brXl = BorderRadius.all(xl);
  static const BorderRadius brPill = BorderRadius.all(pill);
  static const BorderRadius brFull = BorderRadius.all(full);

  // Bottom-sheet: top-corners only (Cart.css:4991).
  static const BorderRadius brSheetTop = BorderRadius.only(
    topLeft: xl,
    topRight: xl,
  );
}
