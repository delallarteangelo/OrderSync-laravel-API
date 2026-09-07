// Design.md §5.13 — Payment method screen
import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';
import '../../widgets/primary_button.dart';

class PaymentMethodScreen extends StatefulWidget {
  const PaymentMethodScreen({super.key});
  @override
  State<PaymentMethodScreen> createState() => _PaymentMethodScreenState();
}

class _PaymentMethodScreenState extends State<PaymentMethodScreen> {
  int _selected = 0;
  static const _methods = [
    ('Cash on Delivery', Icons.payments_outlined),
    ('GCash', Icons.account_balance_wallet_outlined),
    ('Credit / Debit Card', Icons.credit_card_rounded),
    ('Maya', Icons.account_balance_wallet_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: const AppPrimaryAppBar(title: 'Payment method', showBack: true),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: _methods.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final sel = i == _selected;
                  return InkWell(
                    onTap: () => setState(() => _selected = i),
                    borderRadius: AppRadii.brLg,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.neutralSurface,
                        borderRadius: AppRadii.brLg,
                        border: Border.all(
                          color: sel
                              ? AppColors.brandPrimary
                              : AppColors.neutralBorder,
                          width: sel ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(_methods[i].$2, color: AppColors.brandPrimary),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _methods[i].$1,
                              style: AppTypography.textTheme.bodyMedium,
                            ),
                          ),
                          Icon(
                            sel
                                ? Icons.radio_button_checked
                                : Icons.radio_button_off,
                            color: sel
                                ? AppColors.brandPrimary
                                : AppColors.neutralBorder,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              child: PrimaryButton(
                label: 'Confirm',
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
