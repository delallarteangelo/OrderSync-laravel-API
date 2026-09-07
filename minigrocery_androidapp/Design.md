# OrderSync — Customer Android App Design System

> Visual design language, component system, and screen-level specs for the **OrderSync** Flutter customer app. The existing grocery assets remain visual inspiration, while product branding, business names, catalogs, and storefront themes are tenant-driven. Concrete values are extracted from the Figma-exported CSS and reconciled against the SVG layouts; where sources conflict, CSS wins for values and SVGs win for layout.

The same responsive tokens, tenant-branding rules, payment states, and AI-support patterns should be mirrored by the customer-ordering Progressive Web App (PWA), while navigation adapts to the browser form factor.

---

## 1. Overview

The OrderSync customer app is a **clean, white-surfaced, green-accented** ordering experience optimized for fast browsing, frictionless cart building, trustworthy payment submission, and clear order tracking. The default design uses **Inter**, generous whitespace, `#F6F6F6` media surfaces, and OrderSync green (`#0CA201`) for primary actions. An approved business logo/name may personalize the storefront header, but the OrderSync product identity, semantic colors, accessibility, and interaction patterns remain consistent.

- **Target platform:** Android, **Flutter 3.x**, **Material 3** baseline with custom `ColorScheme` + `TextTheme`.
- **Display target:** designs authored at 430×932 (iPhone 14 Pro Max viewport in Figma) → re-baselined to **Android density-independent pixels (dp)** at 1:1 (px → dp) for implementation. All scaling follows MediaQuery / `LayoutBuilder`.
- **Design principles:**
  1. **Clarity** — one primary action per screen, in brand green.
  2. **Fast product scanning** — uniform 170×245 product cards, 8 px content gutter, photographic hero on `#F6F6F6`.
   3. **Trust** — neutral typography, dark navy `#170E2B` for high-value semantic surfaces, explicit payment-verification states, and shadows used sparingly.
   4. **Accessibility** — minimum **WCAG 2.1 AA** contrast on text/background pairs, minimum **48×48 dp** tap targets, dynamic text scaling supported.
   5. **Tenant clarity** — always show which business storefront is active before catalog, cart, order, payment, or support actions.
   6. **AI transparency** — label automated answers and keep human handoff visible.

---

## 2. Source Inspiration Inventory

### 2.1 SVG screens analysed

| File | Screen / fragment represented | Key UI elements observed |
| --- | --- | --- |
| [splash screen.svg](assets/svg%20grocery%20app%20inspiration/splash%20screen.svg) | Splash | Status bar (icons in `#170E2B`), centered hero illustration, brand wordmark **"Grobery"** in `#0CA201`, white background, soft fade gradient at bottom |
| [home.svg](assets/svg%20grocery%20app%20inspiration/home.svg) | Home / Catalog | Status bar, address row, search field, horizontal promo slider, category chips (circular `#F6F6F6` tiles), "See all" links in brand green, 2-col product card grid, bottom nav |
| [Slider.svg](assets/svg%20grocery%20app%20inspiration/Slider.svg) | Promo carousel (component-level) | 3 slide variants: light-mint (`#D7FFD4`), brand-green (`#0CA201`), warm-yellow (`#FFDB24`); each with image, headline, sub, and CTA button |
| [promo.svg](assets/svg%20grocery%20app%20inspiration/promo.svg) | Promo / slider standalone | Same slider artefacts, ellipse shadow under product photo |
| [Card.svg](assets/svg%20grocery%20app%20inspiration/Card.svg) | Product Card (component + Product Detail context) | Image area (`#F6F6F6`, radius 10), title, star + rating, price, floating round add/remove button (radius 40, shadow 2) |
| [cart.svg](assets/svg%20grocery%20app%20inspiration/cart.svg) | Cart — empty state | App bar "My Cart", empty illustration, dark navy promo strip (`#170E2B`), bottom nav |
| [cart-filled.svg](assets/svg%20grocery%20app%20inspiration/cart-filled.svg) | Cart — populated | Address summary card, list of cart-item rows, quantity stepper, sub-total/total summary, primary "Checkout" button in brand green |
| [cart-filled2.svg](assets/svg%20grocery%20app%20inspiration/cart-filled2.svg) | Cart — populated (variant) | Same as cart-filled but with promo-code field and a yellow promotional CTA (`#FFD500`) |
| [basket1.svg](assets/svg%20grocery%20app%20inspiration/basket1.svg) | Cart row / mini-basket variant 1 | Single cart-item row anatomy: thumbnail, name, unit price, quantity stepper |
| [basket2.svg](assets/svg%20grocery%20app%20inspiration/basket2.svg) | Cart row variant 2 | Row with swipe-style trailing action affordance |
| [basket3.svg](assets/svg%20grocery%20app%20inspiration/basket3.svg) | Cart row variant 3 | Row with deletion / remove control highlighted |
| [Checkout.svg](assets/svg%20grocery%20app%20inspiration/Checkout.svg) | Checkout | Dark navy hero strip (`#170E2B`), address card, order summary list, payment method picker, primary CTA |
| [Payment-27.svg](assets/svg%20grocery%20app%20inspiration/Payment-27.svg) | Payment — method selection | Radio-style method tiles, card-form preview, primary CTA |
| [Payment-28.svg](assets/svg%20grocery%20app%20inspiration/Payment-28.svg) | Payment — confirm / processing | Confirmation panel, total row, processing affordance |

### 2.2 CSS files analysed

| File | Tokens / components contributed |
| --- | --- |
| [homepage.css](assets/css%20grocery%20app%20inspiration/homepage.css) | Brand green `#0CA201`, slider tints `#D7FFD4` / `#FFDB24`, neutral surface `#F6F6F6`, text-primary `#0A0B0A` / `#000000`, text-secondary `#5A5555`, border `#ECECEC`, Inter typography scale (20/16/14/13/12), spacing (5/8/10/14/15/17/20/25), radii (5/7/10/15/40/100), shadow-2 (`0px 7px 40px rgba(0,0,0,0.05)`) |
| [slider.css](assets/css%20grocery%20app%20inspiration/slider.css) | Promo card backgrounds (`#D7FFD4`, `#0CA201`, `#FFDB24`), white-on-brand CTA pattern, radial ellipse shadow under product photo |
| [card.css](assets/css%20grocery%20app%20inspiration/card.css) | Product card anatomy, image radius 8/6/10, star accent `#FBB400`, floating button border `#ECECEC` + shadow-2 + radius 40 |
| [Cart.css](assets/css%20grocery%20app%20inspiration/Cart.css) | Dark navy promo strip `#170E2B`, dim secondary stroke `#726C6C`, accent yellow `#FFD500`, divider `#ECECEC`, bottom-sheet shadow `0px 4px 30px rgba(0,0,0,0.1)`, floating bottom-bar shadow `0px 4px 20px rgba(0,0,0,0.07)`, blur 10 px |
| [cart_filled.css](assets/css%20grocery%20app%20inspiration/cart_filled.css) | Cart row spacing, quantity stepper geometry, floating action bar shadow `0px 4px 40px rgba(0,0,0,0.1)`, badge shadow `0px 4px 15px rgba(0,0,0,0.05)` |
| [on_item_on_cart.css](assets/css%20grocery%20app%20inspiration/on_item_on_cart.css) | "Item added to cart" toast / inline snackbar pattern, brand-green confirmation surface |
| [Checkout.css](assets/css%20grocery%20app%20inspiration/Checkout.css) | Section dividers, dark navy delivery summary, address card patterns, confirmation CTA |
| [Payment1.css](assets/css%20grocery%20app%20inspiration/Payment1.css) | Payment method tile (radius 10, border `#ECECEC`), card preview radius 20, radio dot `#726C6C` / `#000000` selected |
| [Payment2.css](assets/css%20grocery%20app%20inspiration/Payment2.css) | Processing screen pattern, confirm CTA, status indicator geometry |

---

## 3. Design Tokens

> All values below are taken **verbatim** from the CSS source files cited inline. Token names follow Material 3 + custom semantic naming.

### 3.1 Color Palette

| Token | Hex | Usage | Source |
| --- | --- | --- | --- |
| `brandPrimary` | `#0CA201` | Primary CTAs, brand wordmark, "See all" links, active nav, success badge | homepage.css:107, slider.css:99, splash screen.svg |
| `brandPrimarySurface` | `#D7FFD4` | Light brand tint for promo slider 1 | homepage.css:57, slider.css:35 |
| `brandAccentYellow` | `#FFDB24` | Promo slider 3 background, secondary highlights | homepage.css (Slider 3) |
| `brandAccentYellowBold` | `#FFD500` | Promo / referral CTA fill, star fill | Cart.css:2316, homepage.css (star) |
| `brandAccentAmber` | `#FBB400` | Star rating fill (alt), warning highlight | card.css:142 |
| `neutralSurface` | `#FFFFFF` | Screen background, card surface | homepage.css:8 (universal) |
| `neutralSurfaceAlt` | `#F6F6F6` | Image / category tile fills, input field background | homepage.css (Frame 402 et al.) |
| `neutralBorder` | `#ECECEC` | Dividers, card borders, floating button stroke | card.css:207, Cart.css:273 |
| `neutralStrokeMuted` | `#726C6C` | Disabled / unselected stroke (radio outer ring) | Cart.css:1670, Payment1.css:253 |
| `neutralInk` | `#0A0B0A` | Primary text (long-form) | homepage.css ("Fruits" header) |
| `neutralInkBlack` | `#000000` | Primary text (titles / prices), icon stroke | homepage.css ("Banana" price) |
| `neutralInkSecondary` | `#5A5555` | Secondary captions ("Fruits" category label) | homepage.css (category label) |
| `surfaceNavy` | `#170E2B` | Dark hero strip (Cart, Checkout, Payment), status bar icon ink | Cart.css:60, Checkout.css:93, splash screen.svg |
| `onBrand` | `#FFFFFF` | Text/icons on `brandPrimary` & `surfaceNavy` | slider.css:148 |
| `shadowSoft` | `rgba(0,0,0,0.05)` | Card / floating button shadow (shadow-2) | card.css:209 (universal) |
| `shadowMedium` | `rgba(0,0,0,0.07)` | Bottom action bar | Cart.css:5082 |
| `shadowStrong` | `rgba(0,0,0,0.1)` | Bottom sheet / modal | Cart.css:4990 |
| `overlayRadial` | `radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%)` | Product photo ellipse shadow | slider.css:52 |

#### Semantic / Status (derived — see §9)

| Token | Hex | Usage |
| --- | --- | --- |
| `statusPending` | `#FBB400` | Order status: PENDING (warm amber) — reuses `brandAccentAmber` |
| `statusConfirmed` | `#0CA201` | Order status: CONFIRMED — reuses `brandPrimary` |
| `statusPreparing` | `#2D8CFF` | Order status: PREPARING — derived (blue, distinct from brand) |
| `statusReadyForPickup` | `#7A5AF8` | Order status: READY_FOR_PICKUP — derived (violet) |
| `statusCompleted` | `#0A7A02` | Order status: COMPLETED — derived (darker brand-green for finality) |
| `statusRejected` | `#D7263D` | Order status: REJECTED — derived (semantic error red) |
| `statusCancelled` | `#5A5555` | Order status: CANCELLED — reuses `neutralInkSecondary` |
| `info` | `#170E2B` | Info banner background — reuses `surfaceNavy` |

```dart
// lib/theme/app_colors.dart
import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Brand
  static const Color brandPrimary         = Color(0xFF0CA201);
  static const Color brandPrimarySurface  = Color(0xFFD7FFD4);
  static const Color brandAccentYellow    = Color(0xFFFFDB24);
  static const Color brandAccentYellowBold= Color(0xFFFFD500);
  static const Color brandAccentAmber     = Color(0xFFFBB400);

  // Neutral
  static const Color neutralSurface       = Color(0xFFFFFFFF);
  static const Color neutralSurfaceAlt    = Color(0xFFF6F6F6);
  static const Color neutralBorder        = Color(0xFFECECEC);
  static const Color neutralStrokeMuted   = Color(0xFF726C6C);
  static const Color neutralInk           = Color(0xFF0A0B0A);
  static const Color neutralInkBlack      = Color(0xFF000000);
  static const Color neutralInkSecondary  = Color(0xFF5A5555);

  // Surfaces
  static const Color surfaceNavy          = Color(0xFF170E2B);
  static const Color onBrand              = Color(0xFFFFFFFF);

  // Shadows
  static const Color shadowSoft           = Color(0x0D000000); // rgba(0,0,0,0.05)
  static const Color shadowMedium         = Color(0x12000000); // rgba(0,0,0,0.07)
  static const Color shadowStrong         = Color(0x1A000000); // rgba(0,0,0,0.10)

  // Order Status (derived — see Design.md §9)
  static const Color statusPending        = brandAccentAmber;
  static const Color statusConfirmed      = brandPrimary;
  static const Color statusPreparing      = Color(0xFF2D8CFF);
  static const Color statusReadyForPickup = Color(0xFF7A5AF8);
  static const Color statusCompleted      = Color(0xFF0A7A02);
  static const Color statusRejected       = Color(0xFFD7263D);
  static const Color statusCancelled      = neutralInkSecondary;
}
```

### 3.2 Typography

Font family from every CSS file is `'Inter'` (`font-family: 'Inter';`). The recurring size/weight/line-height pairs harvested from CSS are mapped to a Material 3 type scale below.

| Token (M3 role) | Size | Weight | Line-height | Letter-spacing | Source / usage |
| --- | --- | --- | --- | --- | --- |
| `displayLarge` *(derived)* | 32 | 700 | 38 | -0.5 | Splash wordmark scale (derived from splash SVG visual) |
| `displayMedium` *(derived)* | 28 | 700 | 34 | -0.25 | Onboarding hero (derived) |
| `headlineLarge` | 24 | 700 | 28 | 0 | App-bar large titles (derived from 20-px Inter Bold pattern, scaled) |
| `headlineMedium` | 20 | 700 | 24 | 0 | Promo slider headline "Up to 30% offer" — homepage.css:75 |
| `headlineSmall` | 18 | 600 | 22 | 0 | Section sub-headers (derived from 16 px scale) |
| `titleLarge` | 16 | 600 | 19 | 0 | Product title "Banana", row titles — homepage.css:88 |
| `titleMedium` | 14 | 600 | 17 | 0.1 | "See all" link, secondary buttons — homepage.css:153 |
| `titleSmall` | 13 | 600 | 16 | 0.1 | Promo body "Enjoy our big offer" — homepage.css:107 |
| `bodyLarge` | 16 | 500 | 20 | 0.15 | Form input text (derived) |
| `bodyMedium` | 14 | 500 | 20 | 0.25 | Secondary text "4.8 (287)" — homepage.css:519 |
| `bodySmall` | 12 | 500 | 15 | 0.4 | Captions, helper text |
| `labelLarge` | 14 | 600 | 20 | 0.1 | Button labels — homepage.css ("Button") |
| `labelMedium` | 13 | 600 | 16 | 0.5 | Chip labels, small CTAs |
| `labelSmall` | 12 | 600 | 15 | 0.5 | Category tile labels "Fruits" — homepage.css (category) |

```dart
// lib/theme/app_typography.dart
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTypography {
  AppTypography._();

  static TextStyle _inter({
    required double size,
    required FontWeight weight,
    required double height,   // px line-height
    double letterSpacing = 0,
    Color color = AppColors.neutralInkBlack,
  }) =>
      GoogleFonts.inter(
        fontSize: size,
        fontWeight: weight,
        height: height / size,
        letterSpacing: letterSpacing,
        color: color,
      );

  static final TextTheme textTheme = TextTheme(
    displayLarge:   _inter(size: 32, weight: FontWeight.w700, height: 38, letterSpacing: -0.5),
    displayMedium:  _inter(size: 28, weight: FontWeight.w700, height: 34, letterSpacing: -0.25),
    headlineLarge:  _inter(size: 24, weight: FontWeight.w700, height: 28),
    headlineMedium: _inter(size: 20, weight: FontWeight.w700, height: 24),
    headlineSmall:  _inter(size: 18, weight: FontWeight.w600, height: 22),
    titleLarge:     _inter(size: 16, weight: FontWeight.w600, height: 19),
    titleMedium:    _inter(size: 14, weight: FontWeight.w600, height: 17, letterSpacing: 0.1),
    titleSmall:     _inter(size: 13, weight: FontWeight.w600, height: 16, letterSpacing: 0.1),
    bodyLarge:      _inter(size: 16, weight: FontWeight.w500, height: 20, letterSpacing: 0.15),
    bodyMedium:     _inter(size: 14, weight: FontWeight.w500, height: 20, letterSpacing: 0.25),
    bodySmall:      _inter(size: 12, weight: FontWeight.w500, height: 15, letterSpacing: 0.4,
                            color: AppColors.neutralInkSecondary),
    labelLarge:     _inter(size: 14, weight: FontWeight.w600, height: 20, letterSpacing: 0.1),
    labelMedium:    _inter(size: 13, weight: FontWeight.w600, height: 16, letterSpacing: 0.5),
    labelSmall:     _inter(size: 12, weight: FontWeight.w600, height: 15, letterSpacing: 0.5,
                            color: AppColors.neutralInkSecondary),
  );
}
```

### 3.3 Spacing Scale

Distilled from recurring `padding` and `gap` values across all 9 CSS files (e.g., `padding: 20px 0px; gap: 17px;` homepage.css:14, `padding: 0px 15px; gap: 14px;` homepage.css:35, `padding: 10px 25px; gap: 10px;` homepage.css:520).

| Token | Value (dp) | Common usage | Source examples |
| --- | --- | --- | --- |
| `xxs` | 4 | Icon-to-label gap, chip inner gap | card.css (Frame 47 gap 8 → scaled) |
| `xs` | 8 | Card padding inner, gap between price/rating | homepage.css (Frame 48 padding 0 8) |
| `sm` | 10 | Component padding, gap between cards | homepage.css (Buttons padding 10) |
| `md` | 14 | Slider gap, primary inner gap | homepage.css (Slider gap 14) |
| `mdPlus` | 15 | Horizontal screen padding | homepage.css (Slider padding 0 15) |
| `lg` | 17 | Section vertical gap | homepage.css (Frame 43548 gap 17) |
| `lgPlus` | 20 | Top/bottom container padding, screen vertical | homepage.css (padding 20 0) |
| `xl` | 25 | Search bar horizontal padding | homepage.css (Search padding 10 25) |
| `xxl` | 32 | Major section vertical (derived for screens lacking it) |

```dart
// lib/theme/app_spacing.dart
class AppSpacing {
  AppSpacing._();
  static const double xxs    = 4;
  static const double xs     = 8;
  static const double sm     = 10;
  static const double md     = 14;
  static const double mdPlus = 15;
  static const double lg     = 17;
  static const double lgPlus = 20;
  static const double xl     = 25;
  static const double xxl    = 32;
}
```

### 3.4 Border Radius Scale

| Token | Value (dp) | Usage | Source |
| --- | --- | --- | --- |
| `rXs` | 5 | Small buttons, inline chips | homepage.css:108 (slider CTA), Cart.css:445 |
| `rSm` | 7 | Floating bottom-bar pill, mini tile | Cart.css:5008, cart_filled.css:8512 |
| `rMd` | 10 | Slider cards, image containers, payment tile | homepage.css:57, Cart.css:421, Payment1.css:142 |
| `rLg` | 15 | Product card, cart-item card | homepage.css (Card width 170; radius 15), Cart.css:2189 |
| `rXl` | 20 | Bottom sheet (top-only), card preview | Cart.css:4991, Payment1.css:8 |
| `rPill` | 40 | Floating circular icon button (38×38) | card.css:210 |
| `rFull` | 100 | Category circular tile (70×70), avatar | homepage.css (Frame 402) |

```dart
// lib/theme/app_radii.dart
import 'package:flutter/material.dart';

class AppRadii {
  AppRadii._();
  static const Radius xs    = Radius.circular(5);
  static const Radius sm    = Radius.circular(7);
  static const Radius md    = Radius.circular(10);
  static const Radius lg    = Radius.circular(15);
  static const Radius xl    = Radius.circular(20);
  static const Radius pill  = Radius.circular(40);
  static const Radius full  = Radius.circular(100);

  static const BorderRadius brXs   = BorderRadius.all(xs);
  static const BorderRadius brSm   = BorderRadius.all(sm);
  static const BorderRadius brMd   = BorderRadius.all(md);
  static const BorderRadius brLg   = BorderRadius.all(lg);
  static const BorderRadius brXl   = BorderRadius.all(xl);
  static const BorderRadius brPill = BorderRadius.all(pill);
  static const BorderRadius brFull = BorderRadius.all(full);

  // Bottom-sheet: top-corners only (Cart.css:4991)
  static const BorderRadius brSheetTop = BorderRadius.only(
    topLeft: xl, topRight: xl,
  );
}
```

### 3.5 Elevation / Shadows

| Token | Value | Usage | Source |
| --- | --- | --- | --- |
| `shadow1` | `0px 4px 15px rgba(0,0,0,0.05)` | Badge / chip-level lift | cart_filled.css:8637 |
| `shadow2` | `0px 7px 40px rgba(0,0,0,0.05)` | Floating product-card add button, card hover | card.css:209 (universal) |
| `shadow3` | `0px 4px 20px rgba(0,0,0,0.07)` | Floating bottom action bar (Cart total) | Cart.css:5082, cart_filled.css:9027 |
| `shadow4` | `0px 4px 30px rgba(0,0,0,0.1)` | Bottom sheet | Cart.css:4990 |
| `shadow5` | `0px 4px 40px rgba(0,0,0,0.1)` | Floating "go to cart" / sticky CTA bar | cart_filled.css:8509 |

```dart
// lib/theme/app_shadows.dart
import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppShadows {
  AppShadows._();

  static const List<BoxShadow> shadow1 = [
    BoxShadow(color: AppColors.shadowSoft,   offset: Offset(0, 4),  blurRadius: 15),
  ];
  static const List<BoxShadow> shadow2 = [
    BoxShadow(color: AppColors.shadowSoft,   offset: Offset(0, 7),  blurRadius: 40),
  ];
  static const List<BoxShadow> shadow3 = [
    BoxShadow(color: AppColors.shadowMedium, offset: Offset(0, 4),  blurRadius: 20),
  ];
  static const List<BoxShadow> shadow4 = [
    BoxShadow(color: AppColors.shadowStrong, offset: Offset(0, 4),  blurRadius: 30),
  ];
  static const List<BoxShadow> shadow5 = [
    BoxShadow(color: AppColors.shadowStrong, offset: Offset(0, 4),  blurRadius: 40),
  ];
}
```

### 3.6 Iconography

- **Default icon set:** **Material Symbols Rounded** (built into Flutter `Icons` + `material_symbols_icons` package for the Rounded variant). The inspiration SVGs use custom line icons that closely resemble Lucide / Feather; Material Symbols Rounded is the closest first-class Flutter equivalent.
- **Default sizes:** `iconXs = 16`, `iconSm = 18`, `iconMd = 24`, `iconLg = 32`.
- **Default stroke / fill color:** `AppColors.neutralInkBlack` for primary icons (matches CSS `border: 1.3px solid #000000;` on icon vector paths — card.css:250). On dark surfaces, use `AppColors.onBrand`.
- **Active nav icon:** `AppColors.brandPrimary`.
- **Star rating icon:** `AppColors.brandAccentYellowBold` fill (`#FFD500`, homepage.css star fill).

```dart
// lib/theme/app_icons.dart
class AppIconSize {
  AppIconSize._();
  static const double xs = 16;
  static const double sm = 18;
  static const double md = 24;
  static const double lg = 32;
}
```

### 3.7 Motion

The CSS files do not encode motion (no `transition`, `animation`, or `cubic-bezier` declarations were found). The following are **sensible Material 3 defaults** to be confirmed (see §9):

| Token | Duration | Curve | Usage |
| --- | --- | --- | --- |
| `motionFast` | 150 ms | `Curves.easeOut` | Button press, ripple, chip toggle |
| `motionStandard` | 250 ms | `Curves.easeInOut` | Bottom-sheet open, dialog scale-in, route fade |
| `motionEmphasized` | 400 ms | `Curves.easeInOutCubicEmphasized` | Page transitions, hero |
| `motionSlow` | 600 ms | `Curves.easeInOut` | Splash → home transition, list stagger |

```dart
// lib/theme/app_motion.dart
import 'package:flutter/animation.dart';

class AppMotion {
  AppMotion._();
  static const Duration fast       = Duration(milliseconds: 150);
  static const Duration standard   = Duration(milliseconds: 250);
  static const Duration emphasized = Duration(milliseconds: 400);
  static const Duration slow       = Duration(milliseconds: 600);

  static const Curve easeOut          = Curves.easeOut;
  static const Curve easeInOut        = Curves.easeInOut;
  static const Curve emphasizedCurve  = Curves.easeInOutCubicEmphasized;
}
```

---

## 4. Core Component Library

Every component lists: **Purpose**, **Anatomy**, **States**, **Tokens used**, and a **Flutter skeleton**.

### 4.1 `AppPrimaryAppBar`

- **Purpose:** Top app bar with optional back arrow, screen title, and trailing actions (cart, notifications).
- **Anatomy:** Leading icon (24 dp, `iconMd`) · Title (`titleLarge`, centered or start-aligned) · Trailing icon row (cart-badge, notifications-badge).
- **States:** default · scrolled (adds 1 px bottom border `neutralBorder`).
- **Tokens:** `neutralSurface` bg · `neutralInkBlack` foreground · `headlineMedium`/`titleLarge` for title · `xl` (25 dp) horizontal padding.

```dart
class AppPrimaryAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final bool showBack;
  final List<Widget> actions;
  const AppPrimaryAppBar({super.key, required this.title, this.showBack = false, this.actions = const []});
  @override Size get preferredSize => const Size.fromHeight(56);
  @override Widget build(BuildContext context) => /* AppBar(...) */ throw UnimplementedError();
}
```

### 4.2 `AppBottomNavBar`

- **Purpose:** 5-tab persistent bottom navigation: Home, Categories, Cart, Orders, Profile (derived order — Cart is centered to match retail-app convention from SVGs).
- **Anatomy:** 5 `BottomNavigationBarItem`s; active label `labelMedium` in `brandPrimary`, inactive in `neutralInkSecondary`.
- **States:** default · selected (icon + label switch to `brandPrimary`) · with badge (cart count).
- **Tokens:** `neutralSurface` bg · `brandPrimary` selected · `neutralInkSecondary` unselected · `shadow1` top elevation (1 px top border `neutralBorder`).

### 4.3 Buttons

| Component | Bg | Fg | Border | Radius | Min height | Source |
| --- | --- | --- | --- | --- | --- | --- |
| `PrimaryButton` | `brandPrimary` | `onBrand` | none | `rXs` (5) | 48 dp (AA) — CSS shows 36 px but Android needs ≥48 | homepage.css:107 |
| `SecondaryButton` | `neutralSurface` | `neutralInkBlack` | 1 px `neutralBorder` | `rXs` (5) | 48 dp | homepage.css (Slider 3 white CTA) |
| `TextButton` | transparent | `brandPrimary` | none | n/a | 48 dp | homepage.css "See all" :555 |
| `IconButton` | `neutralSurface` | `neutralInkBlack` | 1 px `neutralBorder` | `rPill` (40) | 38×38 visual / 48×48 hit | card.css:206-210 |
| `AccentButton` (promo) | `brandAccentYellowBold` | `neutralInkBlack` | 2 px `brandAccentYellowBold` | `rXs` | 48 dp | Cart.css:2316 |

- **States (all):** default · pressed (10% darker overlay) · disabled (40% opacity, no shadow) · loading (replaces label with 18 dp `CircularProgressIndicator`).

```dart
class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;
  const PrimaryButton({super.key, required this.label, this.onPressed, this.loading = false, this.icon});
  @override Widget build(BuildContext context) => /* ElevatedButton(...) */ throw UnimplementedError();
}
```

### 4.4 `AppTextField` / `AppSearchField`

- **Purpose:** Single-line input + search variant with leading icon and optional clear/trailing.
- **Anatomy:** Prefix icon (24 dp, `neutralInkSecondary`) · placeholder (`bodyMedium`) · trailing clear/voice icon.
- **States:** rest · focused (1.5 px `brandPrimary` border) · error (1 px `statusRejected` border + helper text in `statusRejected`) · disabled (`neutralBorder` bg, 40% opacity).
- **Tokens:** `neutralSurfaceAlt` (`#F6F6F6`) fill · `rMd` (10) radius · `xl` (25) horizontal content padding · 48–55 dp tall (homepage.css Search height 55).

### 4.5 `ProductCard` (Grid variant)

- **Purpose:** Product tile used in 2-column home grid and category lists.
- **Anatomy:** 170×245 frame · image area 160×147 on `neutralSurfaceAlt` `rMd` · title (`titleLarge`) · row[star icon `xs` + rating `bodyMedium`] · price (`titleLarge`) · floating add button bottom-right (38×38, `rPill`, `shadow2`).
- **States:** default · pressed (4% surface tint overlay) · out-of-stock (60% opacity image + "Out of stock" pill in `statusCancelled`).
- **Tokens:** `neutralSurface` bg · `rLg` outer radius · padding 5 (homepage.css Card padding 5) · gap 14 between image and text block.

### 4.6 `ProductCard` (List variant) — derived

Used in Search results / Order Detail. Horizontal layout: thumbnail 80×80 (`rMd`) · column[title, sub, price] · trailing quantity stepper.

### 4.7 `CategoryChip` / `CategoryTile`

- **Tile (home):** 70×70 circular (`rFull` = 100), bg `neutralSurfaceAlt`, image 43–52 dp centered, label below (`labelSmall`, `neutralInkSecondary`).  *(homepage.css Frame 402)*
- **Chip (filters):** 32 dp pill, padding 7 × 14, `rPill`, default bg `neutralSurfaceAlt` / fg `neutralInkBlack`, selected bg `brandPrimary` / fg `onBrand`.

### 4.8 `CartItemRow`

- **Purpose:** A single product in the cart.
- **Anatomy:** thumbnail 64×64 `rMd` on `neutralSurfaceAlt` · column[title `titleLarge`, unit `bodySmall`, price `titleMedium`] · trailing `QuantityStepper` · trailing-most delete icon.
- **States:** default · pressed · swipe-active (basket2.svg) · pending-removal (faded 50%).
- **Tokens:** white surface, border-bottom `neutralBorder`, padding `mdPlus`/`sm`.

### 4.9 `QuantityStepper`

- **Anatomy:** 3 cells [`-` icon · count · `+` icon], 38 dp tall, 1 px `neutralBorder` outline, `rPill`, `shadow2`. *(card.css:206-210 + Cart.css:1745)*
- **States:** default · min-reached (`-` disabled at qty 1, opacity 40%) · max-reached · loading (replaces count with 14-dp spinner).

```dart
class QuantityStepper extends StatelessWidget {
  final int value;
  final int min;
  final int max;
  final ValueChanged<int>? onChanged;
  const QuantityStepper({super.key, required this.value, this.min = 1, this.max = 99, this.onChanged});
  @override Widget build(BuildContext context) => throw UnimplementedError();
}
```

### 4.10 `OrderStatusBadge`

Single pill widget. 24-dp tall, padding 4 × 10, `rPill`, `labelMedium`. Color per status (see §3.1 status tokens). Foreground always `onBrand` (white) except `statusCancelled` (white on `neutralInkSecondary`) and `statusPending` (`neutralInkBlack` on amber for AA contrast).

| status | Bg | Fg | Label |
| --- | --- | --- | --- |
| PENDING | `statusPending` (#FBB400) | `neutralInkBlack` | Pending |
| CONFIRMED | `statusConfirmed` (#0CA201) | `onBrand` | Confirmed |
| REJECTED | `statusRejected` (#D7263D) | `onBrand` | Rejected |
| PREPARING | `statusPreparing` (#2D8CFF) | `onBrand` | Preparing |
| READY_FOR_PICKUP | `statusReadyForPickup` (#7A5AF8) | `onBrand` | Ready |
| COMPLETED | `statusCompleted` (#0A7A02) | `onBrand` | Completed |
| CANCELLED | `statusCancelled` (#5A5555) | `onBrand` | Cancelled |

### 4.11 `ChatBubble`

- **Sent:** bg `brandPrimary`, fg `onBrand`, `BorderRadius.only(topLeft: rLg, topRight: rLg, bottomLeft: rLg)`, max-width 75%, aligned end.
- **Received:** bg `neutralSurfaceAlt`, fg `neutralInkBlack`, mirrored radius, aligned start.
- **System:** centered, bg transparent, `bodySmall` in `neutralInkSecondary`, italic.
- Padding 10 × 14, gap 4 from timestamp underneath (`labelSmall`).

### 4.12 `EmptyState`, `LoadingState`, `ErrorState`

- **EmptyState:** centered SVG illustration (96 dp) · `headlineSmall` title · `bodyMedium` description (`neutralInkSecondary`) · optional `PrimaryButton`. Used on Cart empty (cart.svg), Orders empty, Chat empty.
- **LoadingState:** prefer **skeletons** built from `Container`s with `neutralBorder` fill, `rMd` radius, shimmer via `shimmer` package. Use `CircularProgressIndicator(color: brandPrimary)` only for inline / button-loading.
- **ErrorState:** ⚠ icon (32 dp, `statusRejected`) · `titleLarge` "Something went wrong" · `bodyMedium` description · `SecondaryButton` "Try again".

### 4.13 `AppSnackBar` / Toast

- **Success:** bg `brandPrimary`, fg `onBrand`, leading check icon 18 dp. Pattern source: on_item_on_cart.css "Item added to cart" inline confirmation.
- **Error:** bg `statusRejected`, fg `onBrand`.
- **Info:** bg `surfaceNavy`, fg `onBrand`.
- Geometry: 56 dp tall, `rSm` (7), `shadow3`, action label in `labelLarge`. Floating, 16 dp from screen edges, 8 dp above bottom nav.

### 4.14 `AppBottomSheet`

- Top-only `brSheetTop` (radius 20), `shadow4`, drag handle 36 × 4 dp `neutralBorder` 12 dp from top, content padding 20 / 25, max-height 90% screen. *(Cart.css:4990)*

### 4.15 `AppDialog`

- Centered `Card`, `rLg` (15) radius, padding 20 · 24, max-width 320 dp, `shadow4`, headline (`titleLarge`), body (`bodyMedium`), actions row (TextButton + PrimaryButton).

---

## 5. Screen-Level Specs

> "Derived" screens have no direct SVG reference and were composed from the established tokens; see §9. Spacing values are in dp.

### 5.1 Splash

- **Reference:** [splash screen.svg](assets/svg%20grocery%20app%20inspiration/splash%20screen.svg)
- **Layout (top → bottom):** Status bar (dark `surfaceNavy` icons on white) · 232 dp top spacer · centered hero illustration 289×217 dp · 24 dp gap · **OrderSync** wordmark rendered in `displayLarge` weight 700, color `brandPrimary` · subtitle "Business management and ordering" · soft white-to-transparent fade-up gradient at bottom 54 dp.
- **States:** loading (default), error (network → show retry sheet).
- **Nav:** auto-advances to Login (if no token) or Home (if authenticated) after 1500 ms.

### 5.2 Onboarding — *derived*

- **Layout:** 3-page `PageView` · full-bleed illustration (60% viewport) · `headlineMedium` title · `bodyMedium` description · 8 dp dot indicator (active = `brandPrimary`, inactive = `neutralBorder`) · `PrimaryButton` "Get Started" · `TextButton` "Skip" top-right.
- **Nav:** → Login.

### 5.3 Login — *derived*

- **Layout:** AppBar (back arrow) · `headlineLarge` "Welcome back" · `bodyMedium` subtitle · `AppTextField` email (prefix mail icon) · `AppTextField` password (suffix eye toggle) · `TextButton` "Forgot password?" end-aligned · `PrimaryButton` full-width "Sign in" · divider with "OR" · `SecondaryButton` "Continue with Google" · footer row `bodyMedium` "New here? " + `TextButton` "Create account".
- **Spacing:** screen padding `xl` (25) horizontal, `lgPlus` (20) vertical, gaps `mdPlus` (15) between fields.

### 5.4 Register — *derived*

Same chrome as Login. Fields: Full name, Email, Phone, Password, Confirm. Validations under each field in `bodySmall` `statusRejected`. Primary CTA "Create account".

### 5.5 Forgot Password — *derived*

Single email field + `PrimaryButton` "Send reset link" + success state with `EmptyState` ✓ icon.

### 5.6 Home / Catalog

- **Reference:** [home.svg](assets/svg%20grocery%20app%20inspiration/home.svg), [Slider.svg](assets/svg%20grocery%20app%20inspiration/Slider.svg), [promo.svg](assets/svg%20grocery%20app%20inspiration/promo.svg)
- **Layout (top → bottom, padding 20 vertical, 17 dp gaps — homepage.css:14-18):**
  1. **AppBar** (custom) at top 0–126 dp: status bar · active business logo/name and storefront switch/deep-link context · delivery/pickup row · trailing notification + cart icons.
  2. **Promo slider** 222 dp tall, horizontal scroll, 14 dp gap between slides, 15 dp horizontal padding. Slide variants: mint `#D7FFD4`, brand-green, yellow `#FFDB24`. Each slide: `headlineMedium` headline, `titleSmall` sub in `brandPrimary` (light slide) or `onBrand` (dark slide), `PrimaryButton` (or inverted SecondaryButton on dark) — homepage.css:75-160.
  3. **Category strip** 100 dp tall, horizontal scroll, 20 dp gap, 20 dp horizontal padding. Items use `CategoryTile` (§4.7).
  4. **Section header** row "Fruits  · See all" — `titleLarge` left, `titleMedium` brand-green right, 25 dp horizontal padding (homepage.css:520).
  5. **Product carousel** "Cover 1": horizontal scroll 245 dp tall, 10 dp gap, 15 dp horizontal padding. `ProductCard` grid items.
  6. Repeating sections (Vegetables, Beverages, …).
- **States:** loading (skeleton grid 6 cards), empty (`EmptyState` "No products yet"), error.
- **Nav:** → Product Detail (tap card), → Category Browse (tap chip or "See all"), → Search (tap header search), → Cart (tap cart icon).

### 5.7 Category Browse — *derived*

- AppBar with title `<Category name>` + filter trailing icon. 2-column `ProductCard` grid, padding 15 horizontal, gap 10, infinite scroll.

### 5.8 Product Search & Filter — *derived*

- Top `AppSearchField` (autofocus) · recent searches chips · result list (List variant of ProductCard). Filter `BottomSheet` (price range slider, category multi-select chips, rating ≥, sort radio group).

### 5.9 Product Detail

- **Reference:** [Card.svg](assets/svg%20grocery%20app%20inspiration/Card.svg)
- **Layout:** Hero image 100% width × 320 dp on `neutralSurfaceAlt` with radial ellipse shadow under product · floating back + favorite icon buttons (`shadow2`) · scrollable bottom sheet content `rXl` top corners overlapping image 24 dp: title `headlineMedium` · row[star `xs` + rating + reviews count `bodyMedium`] · price `headlineLarge` · 1 px divider · `bodyMedium` description · "Nutrition" / "About seller" expanders. Sticky bottom action bar: `QuantityStepper` left, `PrimaryButton` "Add to cart" right · `shadow5` (cart_filled.css:8509).

### 5.10 Cart — empty

- **Reference:** [cart.svg](assets/svg%20grocery%20app%20inspiration/cart.svg)
- **Layout:** AppBar "My Cart" centered title · `EmptyState` (basket illustration · "Your cart is empty" `headlineSmall` · `bodyMedium` description · `PrimaryButton` "Browse products") · dark navy promo strip at bottom (`surfaceNavy` bg, `rLg`, padding 17, "Refer & earn" + chevron) above bottom nav.

### 5.11 Cart — populated

- **Reference:** [cart-filled.svg](assets/svg%20grocery%20app%20inspiration/cart-filled.svg), [cart-filled2.svg](assets/svg%20grocery%20app%20inspiration/cart-filled2.svg), [basket1-3.svg](assets/svg%20grocery%20app%20inspiration/basket1.svg)
- **Layout:** AppBar "My Cart" · address summary card (`rLg`, padding 15, leading pin icon, `titleMedium` address line, `TextButton` "Change") · list of `CartItemRow`s separated by 1 px `neutralBorder` · promo code row (input + `AccentButton` "Apply" in `brandAccentYellowBold`) · summary card: Subtotal / Delivery fee / **Total** rows · sticky floating bottom bar (`shadow3`, padding 15) with `PrimaryButton` "Checkout · ₱xxx".

### 5.12 Checkout

- **Reference:** [Checkout.svg](assets/svg%20grocery%20app%20inspiration/Checkout.svg)
- **Layout:** AppBar "Checkout" with active business name · **delivery summary hero** `surfaceNavy` `rLg` padding 20 (Checkout.css:93,150,211) — `titleMedium` `onBrand` "Delivery to" · address detail · ETA chip in `brandPrimary` · sections:
  - "Order items" — collapsed list (3 rows + "+ N more")
  - "Payment method" — selected method tile (logo + last-4)
  - "Notes" — optional `AppTextField` multiline
  - "Order summary" — itemized list, divider, **Total** row (`titleLarge`)
- **Sticky CTA:** `PrimaryButton` "Place order".

### 5.13 Payment Method Selection

- **Reference:** [Payment-27.svg](assets/svg%20grocery%20app%20inspiration/Payment-27.svg)
- **Layout:** AppBar "Payment" · method tiles for **GCash**, **Maya**, and any business-enabled offline method (radius 10 border `neutralBorder` — Payment1.css:140-142). Selecting GCash/Maya shows the business-managed QR/payment instructions and a plain-language notice: "Your payment will be reviewed after you submit its reference and screenshot/receipt." Unselected radio = 2 px `neutralStrokeMuted`; selected radio = 2 px `neutralInkBlack` with `brandPrimary` dot. Sticky `PrimaryButton` "Continue".

### 5.14 Payment Confirm / Processing

- **Reference:** [Payment-28.svg](assets/svg%20grocery%20app%20inspiration/Payment-28.svg)
- **Layout:** Reference-number field · proof-of-payment camera/gallery picker · thumbnail preview with Replace/Remove · upload progress · `PrimaryButton` "Submit for verification". Success state uses an hourglass/check-document icon and the title **"Payment submitted for review"**, not "Payment confirmed". Status variants: Pending verification (`statusPreparing`), Verified (`statusCompleted`), Rejected (`statusRejected` with reason and Resubmit). Never imply that GCash or Maya directly confirmed the payment in the MVP.

### 5.15 Order Confirmation — *derived*

Full-screen success: large ✓ in `brandPrimary` circle (96 dp) · `headlineMedium` "Order placed!" · order number `bodyMedium` · two buttons stacked: `PrimaryButton` "Track order" + `TextButton` "Continue shopping".

### 5.16 Order Tracking — *derived*

- AppBar "Order #1234" · `OrderStatusBadge` prominent · vertical stepper (Pending → Confirmed → Preparing → Ready → Completed) with brand-green active node and `neutralBorder` inactive · estimated time card · contact-merchant row (`SecondaryButton` "Chat") · order details collapsible.

### 5.17 Order History — *derived*

- AppBar "My Orders" with filter chips (All · Active · Completed · Cancelled). List of order rows: thumbnail strip (up to 3 product thumbs), order # `titleMedium`, total `titleMedium` end-aligned, `OrderStatusBadge` below, date `bodySmall`. Empty state when none.

### 5.18 Order Detail — *derived*

- Same hero as Checkout summary but read-only · status timeline · items list (List variant of ProductCard, qty pill on thumbnail) · totals · `SecondaryButton` "Reorder" + `TextButton` "Get help".

### 5.19 Chat List — *derived*

- AppBar "Messages" · `AppSearchField` · list of rows: avatar 48 dp `rFull` · column[name `titleLarge`, last message `bodyMedium` `neutralInkSecondary` truncated] · trailing column[time `labelSmall`, unread count badge in `brandPrimary` `onBrand`]. 1 px `neutralBorder` between rows.

### 5.20 Chat Thread — *derived*

- AppBar with avatar + name + status dot · scrollable bubble list (`ChatBubble`) · input bar bottom: attachment icon, `AppTextField` (multiline) `rPill`, send icon button in `brandPrimary` circular.

### 5.21 Notifications — *derived*

- AppBar "Notifications" · grouped sections (Today / Earlier) · row: leading icon tile 40 dp `rMd` colored by category (Orders = `brandPrimary`, Promos = `brandAccentYellowBold`, System = `neutralInkSecondary`) · title `titleMedium` · body `bodyMedium` · time `labelSmall`. Unread row has 4 dp `brandPrimary` left bar.

### 5.22 Profile — *derived*

- AppBar "Profile" · header card: avatar 80 dp · name `headlineSmall` · phone `bodyMedium neutralInkSecondary` · `SecondaryButton` "Edit profile" · `ListTile`s: My Orders, Addresses, Payment methods, Notifications, Help & Support, About, Logout (in `statusRejected`).

### 5.23 Edit Profile — *derived*

Form: avatar with edit overlay, AppTextFields (Name, Email, Phone), `PrimaryButton` "Save changes".

### 5.24 Settings — *derived*

Grouped `ListTile`s: Notifications (switches), Language (current value + chevron), App Theme (Light / System — Dark deferred per §9), Privacy, Terms, App version.

### 5.25 Business Storefront Selection — *derived*

- Deep links may open a specific active business directly; otherwise show a searchable list of businesses available to the customer.
- Each card shows approved logo, business name, short description, fulfillment options, and open/closed state. OrderSync branding remains in the app chrome.
- Switching businesses warns when the current cart contains items, because carts and orders never cross tenant boundaries.

### 5.26 Payment Proof & History — *derived*

- Payment detail shows business, order number, amount, method, customer-entered reference, submitted proof thumbnail, and an audit-style status timeline.
- Proof opens only after authenticated authorization; screenshots must not appear in notifications, recent-app previews, or analytics events.
- History filters: Pending, Verified, Rejected. Rejected records show the review reason and a primary Resubmit action.

### 5.27 AI Support & Human Handoff — *derived*

- Entry screen offers Product inquiry, Stock availability, Track my order, FAQs, and Business announcements.
- Automated bubbles include an **AI** badge and a short "Information may need confirmation" caption. Order-specific answers show the authorized order number used as context.
- A persistent "Talk to staff" action transfers the conversation to a human thread while preserving relevant messages. Loading, unavailable, rate-limited, and cannot-answer states all offer human handoff.
- Never show model/provider names as the product identity; provider selection is a platform setting.

---

## 6. Theming Implementation Guide (Flutter)

### 6.1 Recommended `lib/theme/` folder layout

```
lib/
└── theme/
    ├── app_colors.dart       // §3.1 — AppColors
    ├── app_typography.dart   // §3.2 — AppTypography.textTheme
    ├── app_spacing.dart      // §3.3 — AppSpacing
    ├── app_radii.dart        // §3.4 — AppRadii
    ├── app_shadows.dart      // §3.5 — AppShadows
    ├── app_motion.dart       // §3.7 — AppMotion
    ├── app_icons.dart        // §3.6 — AppIconSize
    └── app_theme.dart        // Wires everything into ThemeData (below)
```

### 6.2 Full `ThemeData` snippet

```dart
// lib/theme/app_theme.dart
import 'package:flutter/material.dart';
import 'app_colors.dart';
import 'app_radii.dart';
import 'app_typography.dart';

class AppTheme {
  AppTheme._();

  static ColorScheme get _lightScheme => const ColorScheme(
        brightness: Brightness.light,
        primary: AppColors.brandPrimary,
        onPrimary: AppColors.onBrand,
        primaryContainer: AppColors.brandPrimarySurface,
        onPrimaryContainer: AppColors.neutralInkBlack,
        secondary: AppColors.brandAccentYellowBold,
        onSecondary: AppColors.neutralInkBlack,
        secondaryContainer: AppColors.brandAccentYellow,
        onSecondaryContainer: AppColors.neutralInkBlack,
        tertiary: AppColors.surfaceNavy,
        onTertiary: AppColors.onBrand,
        error: Color(0xFFD7263D),
        onError: AppColors.onBrand,
        surface: AppColors.neutralSurface,
        onSurface: AppColors.neutralInkBlack,
        surfaceContainerHighest: AppColors.neutralSurfaceAlt,
        onSurfaceVariant: AppColors.neutralInkSecondary,
        outline: AppColors.neutralBorder,
        outlineVariant: AppColors.neutralStrokeMuted,
        shadow: Colors.black,
        scrim: Colors.black,
        inverseSurface: AppColors.surfaceNavy,
        onInverseSurface: AppColors.onBrand,
        inversePrimary: AppColors.brandPrimarySurface,
      );

  static ThemeData light = ThemeData(
    useMaterial3: true,
    colorScheme: _lightScheme,
    scaffoldBackgroundColor: AppColors.neutralSurface,
    textTheme: AppTypography.textTheme,
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.neutralSurface,
      foregroundColor: AppColors.neutralInkBlack,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      titleTextStyle: AppTypography.textTheme.titleLarge,
      surfaceTintColor: Colors.transparent,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.brandPrimary,
        foregroundColor: AppColors.onBrand,
        minimumSize: const Size.fromHeight(48),
        shape: const RoundedRectangleBorder(borderRadius: AppRadii.brXs),
        textStyle: AppTypography.textTheme.labelLarge,
        elevation: 0,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.neutralInkBlack,
        minimumSize: const Size.fromHeight(48),
        side: const BorderSide(color: AppColors.neutralBorder),
        shape: const RoundedRectangleBorder(borderRadius: AppRadii.brXs),
        textStyle: AppTypography.textTheme.labelLarge,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.brandPrimary,
        minimumSize: const Size(48, 48),
        textStyle: AppTypography.textTheme.labelLarge,
      ),
    ),
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(
        foregroundColor: AppColors.neutralInkBlack,
        minimumSize: const Size(48, 48),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.neutralSurfaceAlt,
      contentPadding: const EdgeInsets.symmetric(horizontal: 25, vertical: 14),
      hintStyle: AppTypography.textTheme.bodyMedium?.copyWith(color: AppColors.neutralInkSecondary),
      labelStyle: AppTypography.textTheme.bodyMedium,
      border: OutlineInputBorder(
        borderRadius: AppRadii.brMd, borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: AppRadii.brMd, borderSide: BorderSide.none,
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: AppRadii.brMd,
        borderSide: const BorderSide(color: AppColors.brandPrimary, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: AppRadii.brMd,
        borderSide: const BorderSide(color: Color(0xFFD7263D)),
      ),
    ),
    cardTheme: CardThemeData(
      color: AppColors.neutralSurface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      shape: const RoundedRectangleBorder(borderRadius: AppRadii.brLg),
      margin: EdgeInsets.zero,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.neutralSurfaceAlt,
      selectedColor: AppColors.brandPrimary,
      labelStyle: AppTypography.textTheme.labelMedium!,
      secondaryLabelStyle: AppTypography.textTheme.labelMedium!.copyWith(color: AppColors.onBrand),
      side: BorderSide.none,
      shape: const StadiumBorder(),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.neutralSurface,
      selectedItemColor: AppColors.brandPrimary,
      unselectedItemColor: AppColors.neutralInkSecondary,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      showUnselectedLabels: true,
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: AppColors.brandPrimary,
      contentTextStyle: AppTypography.textTheme.labelLarge?.copyWith(color: AppColors.onBrand),
      behavior: SnackBarBehavior.floating,
      shape: const RoundedRectangleBorder(borderRadius: AppRadii.brSm),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: AppColors.neutralSurface,
      surfaceTintColor: Colors.transparent,
      shape: const RoundedRectangleBorder(borderRadius: AppRadii.brLg),
      titleTextStyle: AppTypography.textTheme.titleLarge,
      contentTextStyle: AppTypography.textTheme.bodyMedium,
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: AppColors.neutralSurface,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: AppRadii.brSheetTop),
      modalElevation: 0,
    ),
    dividerTheme: const DividerThemeData(
      color: AppColors.neutralBorder, thickness: 1, space: 0,
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: AppColors.brandPrimary,
    ),
  );
}
```

### 6.3 Dark mode

**Deferred.** No dark-mode tokens were found in any of the 9 source CSS files. A dark variant should be authored only after the design team (a) produces dark Figma frames and exports CSS for them, or (b) approves a derived dark palette. Track in §9.

---

## 7. Accessibility

| Concern | Requirement | Implementation |
| --- | --- | --- |
| Tap target size | ≥ 48×48 dp | All buttons / IconButtons / nav items declare `minimumSize: Size(48, 48)` in §6.2 |
| Text/background contrast | WCAG AA (≥ 4.5:1 normal, ≥ 3:1 large) | Verified pairs below |
| Dynamic text scaling | Respect `MediaQuery.textScaler` up to 1.3× | Use `Text` (not raw `Paragraph`); no fixed-height containers wrapping text — use `IntrinsicHeight` / `min/maxLines` |
| Icon-only buttons | Semantic label required | `IconButton(tooltip: '…')` everywhere; for custom widgets wrap with `Semantics(label: …)` |
| Color is not the only signal | Status uses badge label, not just color | `OrderStatusBadge` always carries text |
| Focus traversal | Logical tab order on form screens | Wrap forms in `Form` + `FocusTraversalGroup` |

#### Verified contrast pairs

| Foreground | Background | Ratio | Use |
| --- | --- | --- | --- |
| `#0A0B0A` (neutralInk) | `#FFFFFF` | 20.4 : 1 | Primary text — AAA |
| `#5A5555` (neutralInkSecondary) | `#FFFFFF` | 7.6 : 1 | Secondary text — AAA |
| `#FFFFFF` (onBrand) | `#0CA201` (brandPrimary) | 3.7 : 1 | Primary button label — AA for large/bold ≥14 px 600w (passes for `labelLarge`); avoid on body text |
| `#FFFFFF` | `#170E2B` (surfaceNavy) | 17.1 : 1 | Navy hero text — AAA |
| `#0A0B0A` | `#FBB400` (statusPending bg) | 11.4 : 1 | Status badge text — AAA |
| `#FFFFFF` | `#D7263D` (statusRejected) | 5.0 : 1 | Error badge — AA |

> **Note**: white-on-brand-green just clears AA only for large/bold text. The `PrimaryButton` always uses `labelLarge` (14 px / 600 w), which qualifies. **Do not use white-on-brand-green for body text.**

---

## 8. Asset Pipeline

### 8.1 Production asset folders (to be created)

```
assets/
├── images/       # Photographic + raster product/promo imagery (.webp preferred)
├── icons/        # Custom SVG/PNG icons not covered by Material Symbols
└── illustrations/# Onboarding, empty-state, success illustrations (.svg)
```

### 8.2 `pubspec.yaml` block to register

Add (or merge with the existing) `flutter > assets` section:

```yaml
flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/icons/
    - assets/illustrations/
```

> Required dev packages:
> ```yaml
> dependencies:
>   google_fonts: ^6.2.1     # Inter font
>   flutter_svg: ^2.0.10     # SVG rendering for illustrations & icons
>   shimmer: ^3.0.0          # LoadingState skeletons
>   material_symbols_icons: ^4.2.1  # Rounded variant icons
> ```

### 8.3 Inspiration folder handling

The two folders **must not ship in the production APK / app bundle**:

- `assets/svg grocery app inspiration/`
- `assets/css grocery app inspiration/`

**Do not** add these folders to `pubspec.yaml > flutter > assets`. They remain in the repository for designer reference only.

#### `.gitignore`

Some teams prefer to keep design-source files out of version control entirely. **I have not modified `.gitignore`.** If you'd like the two inspiration folders excluded from git, confirm and I will add:

```gitignore
# Design inspiration — do not ship and (optionally) do not version
minigrocery_androidapp/assets/svg grocery app inspiration/
minigrocery_androidapp/assets/css grocery app inspiration/
```

(Note: excluding them from git is **optional** and unrelated to excluding them from the bundle — `pubspec.yaml` already handles bundling.)

---

## 9. Open Questions / Assumptions

| # | Topic | Assumption made | Confirm? |
| --- | --- | --- | --- |
| 1 | **App name** | **OrderSync** is the platform/app wordmark. Tonette's Minimart is the pilot tenant and other business names are runtime storefront data. | Confirm final OrderSync logo asset. |
| 2 | **Brand wordmark** | Treated splash text as a wordmark in `displayLarge` Inter 700, `brandPrimary`. No custom font / logo image was provided. | Provide a logo SVG, or confirm Inter wordmark is acceptable. |
| 3 | **Icon set** | Defaulted to **Material Symbols Rounded** (closest first-class Flutter match for the line-icon style in the SVGs). | Approve or specify alternative (Lucide, Iconsax, custom). |
| 4 | **Order status palette** | Only `brandPrimary`, `brandAccentAmber`, and `neutralInkSecondary` exist in CSS. Five additional status colors (`#2D8CFF`, `#7A5AF8`, `#0A7A02`, `#D7263D`, plus reuse) were **derived** to give each of the 7 statuses a distinct, accessible hue. | Approve the proposed palette in §3.1 or specify replacements. |
| 5 | **Bottom-nav tabs** | Inferred **Home, Categories, Cart, Orders, Profile** (Cart center). SVGs show a bottom nav but specific icons are illegible. | Confirm tab set + order. |
| 6 | **Dark mode** | Deferred — no dark tokens in CSS. | Acceptable to defer, or do you want a derived dark palette now? |
| 7 | **Currency** | Sample CSS shows `$3.99`. The pilot uses **`₱`**, but currency and locale belong to each business's settings. | Confirm whether MVP is Philippines-only. |
| 8 | **Typography on splash** | Sized at `displayLarge` (32 px). SVG renders the wordmark as a custom outlined path, not text — exact pixel size not in CSS. | Confirm splash wordmark size. |
| 9 | **Motion tokens** | No motion declarations in CSS → §3.7 values are Material 3 defaults. | Approve or override. |
| 10 | **Inspiration folders** | Left in repository, kept out of `pubspec.yaml` bundle. **`.gitignore` not modified.** | Approve git-exclusion (yes/no). |
| 11 | **Screens lacking SVG source** | Derived screens include onboarding/auth, category/search, order flows, messaging, profile/settings, storefront selection, payment proof/history, and AI support/handoff. | Review and request iterations as needed. |
| 12 | **Error color** | Inspiration CSS contains no semantic error red. `#D7263D` was derived to pass AA on white. | Approve or override. |
| 13 | **Form field height** | CSS shows 55 dp tall search; standard inputs in Material 3 are typically 48–56 dp. Used **48 dp min, 14 dp vertical padding** in §6.2 for AA compliance. | Confirm. |

---

*Document version 1.1 — revised for the OrderSync multi-tenant customer app. The 14 SVG and 9 CSS files remain visual inspiration; all tenant, payment-proof, AI-support, and SaaS adaptations are explicitly marked as derived.*
