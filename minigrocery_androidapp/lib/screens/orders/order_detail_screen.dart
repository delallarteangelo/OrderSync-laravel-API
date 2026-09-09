import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/storefront/storefront_models.dart';
import '../../core/storefront/storefront_store.dart';
import '../../mock/models.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';
import '../../widgets/order_status_badge.dart';
import '../../widgets/secondary_button.dart';

class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({super.key, required this.order});
  final CustomerOrder order;

  @override
  Widget build(BuildContext context) {
    final store = StorefrontScope.of(context);
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) {
        final current =
            store.orders.where((item) => item.id == order.id).firstOrNull ??
            order;
        return Scaffold(
          backgroundColor: AppColors.neutralSurface,
          appBar: AppPrimaryAppBar(title: current.code, showBack: true),
          body: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    current.businessName,
                    style: AppTypography.textTheme.titleLarge,
                  ),
                  OrderStatusBadge(status: current.status),
                ],
              ),
              const SizedBox(height: 4),
              Text('Pickup order', style: AppTypography.textTheme.bodySmall),
              const Divider(height: 28),
              Text('Items', style: AppTypography.textTheme.titleLarge),
              ...current.items.map(
                (item) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(item.productName),
                  subtitle: Text(
                    '${item.quantity} × ₱${item.unitPrice.toStringAsFixed(2)}',
                  ),
                  trailing: Text('₱${item.lineTotal.toStringAsFixed(2)}'),
                ),
              ),
              const Divider(height: 28),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total', style: AppTypography.textTheme.titleLarge),
                  Text(
                    '₱${current.total.toStringAsFixed(2)}',
                    style: AppTypography.textTheme.titleLarge,
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text('Payment', style: AppTypography.textTheme.titleLarge),
              const SizedBox(height: 8),
              const Text(
                'GCash and Maya proofs are checked manually by the store. Uploading a proof does not confirm provider payment.',
              ),
              const SizedBox(height: 12),
              ...current.payments.map(
                (payment) => Card(
                  child: ListTile(
                    leading: Icon(
                      payment.status == RecordedPaymentStatus.verified
                          ? Icons.verified_rounded
                          : payment.status == RecordedPaymentStatus.rejected
                          ? Icons.error_outline_rounded
                          : Icons.hourglass_top_rounded,
                      color: payment.status == RecordedPaymentStatus.verified
                          ? AppColors.brandPrimary
                          : null,
                    ),
                    title: Text(
                      '${payment.method == WalletMethod.maya ? 'Maya' : 'GCash'} · ${payment.referenceNumber}',
                    ),
                    subtitle: Text(
                      payment.status == RecordedPaymentStatus.verified
                          ? 'Manually verified · Receipt ${payment.receiptNumber ?? 'available'}'
                          : payment.status == RecordedPaymentStatus.rejected
                          ? 'Rejected${payment.rejectionReason == null ? '' : ': ${payment.rejectionReason}'}'
                          : 'Submitted for manual review',
                    ),
                  ),
                ),
              ),
              if (current.status == OrderStatus.pending &&
                  !current.payments.any(
                    (payment) =>
                        payment.status != RecordedPaymentStatus.rejected,
                  )) ...[
                ...store.paymentInstructions.map(
                  (instruction) => Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.neutralBorder),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${instruction.method == WalletMethod.maya ? 'Maya' : 'GCash'}\n${instruction.accountName} · ${instruction.accountNumber}${instruction.instructions == null ? '' : '\n${instruction.instructions}'}',
                        ),
                        if (store.paymentQrImages[instruction.id]
                            case final qr?) ...[
                          const SizedBox(height: 12),
                          Center(
                            child: Image.memory(
                              qr,
                              width: 180,
                              height: 180,
                              fit: BoxFit.contain,
                              semanticLabel:
                                  '${instruction.method.name} payment QR',
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                FilledButton.icon(
                  onPressed: store.busy
                      ? null
                      : () => _showPaymentSheet(context, store, current),
                  icon: const Icon(Icons.upload_file_rounded),
                  label: const Text('Upload payment proof'),
                ),
              ],
              const SizedBox(height: 24),
              Text('Status history', style: AppTypography.textTheme.titleLarge),
              const SizedBox(height: 8),
              ...current.statusHistory.map(
                (event) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(
                    Icons.check_circle_outline_rounded,
                    color: AppColors.brandPrimary,
                  ),
                  title: Text(
                    event.status.name.replaceAll(
                      'readyForPickup',
                      'ready for pickup',
                    ),
                  ),
                  subtitle: Text(
                    '${event.actorName}${event.note == null ? '' : ' · ${event.note}'}',
                  ),
                ),
              ),
              if (current.status == OrderStatus.pending &&
                  !current.payments.any(
                    (payment) =>
                        payment.status == RecordedPaymentStatus.verified,
                  )) ...[
                const SizedBox(height: 16),
                SecondaryButton(
                  label: 'Cancel pending order',
                  onPressed: store.busy ? null : () => store.cancel(current),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

Future<void> _showPaymentSheet(
  BuildContext context,
  StorefrontStore store,
  CustomerOrder order,
) async {
  var method = WalletMethod.gcash;
  var reference = '';
  String? proofPath;
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    builder: (sheetContext) => StatefulBuilder(
      builder: (context, setState) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          20,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Submit payment proof',
              style: AppTypography.textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            const Text(
              'The store will manually compare your reference and proof before confirming payment.',
            ),
            const SizedBox(height: 12),
            SegmentedButton<WalletMethod>(
              segments: const [
                ButtonSegment(value: WalletMethod.gcash, label: Text('GCash')),
                ButtonSegment(value: WalletMethod.maya, label: Text('Maya')),
              ],
              selected: {method},
              onSelectionChanged: (value) =>
                  setState(() => method = value.first),
            ),
            const SizedBox(height: 12),
            TextField(
              decoration: const InputDecoration(labelText: 'Reference number'),
              onChanged: (value) => setState(() => reference = value.trim()),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.photo_library_outlined),
                    label: const Text('Gallery'),
                    onPressed: () async {
                      final image = await ImagePicker().pickImage(
                        source: ImageSource.gallery,
                        imageQuality: 85,
                        maxWidth: 1800,
                      );
                      if (image != null) setState(() => proofPath = image.path);
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.camera_alt_outlined),
                    label: const Text('Camera'),
                    onPressed: () async {
                      final image = await ImagePicker().pickImage(
                        source: ImageSource.camera,
                        imageQuality: 85,
                        maxWidth: 1800,
                      );
                      if (image != null) setState(() => proofPath = image.path);
                    },
                  ),
                ),
              ],
            ),
            if (proofPath != null)
              const Padding(
                padding: EdgeInsets.only(bottom: 8),
                child: Text('Proof image selected.'),
              ),
            FilledButton(
              onPressed: reference.isEmpty || proofPath == null
                  ? null
                  : () async {
                      final saved = await store.submitPayment(
                        order: order,
                        method: method,
                        referenceNumber: reference,
                        proofPath: proofPath!,
                      );
                      if (saved && sheetContext.mounted) {
                        Navigator.pop(sheetContext);
                      }
                    },
              child: const Text('Submit for manual review'),
            ),
          ],
        ),
      ),
    ),
  );
}
