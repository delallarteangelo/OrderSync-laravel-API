// Design.md §5.24 — Settings screen
import 'package:flutter/material.dart';

import '../../core/messaging/messaging_models.dart';
import '../../core/messaging/messaging_store.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final store = MessagingScope.of(context);
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) {
        final preferences = store.preferences;
        return Scaffold(
          backgroundColor: AppColors.neutralSurface,
          appBar: const AppPrimaryAppBar(title: 'Settings', showBack: true),
          body: ListView(
            children: [
              _header('Notifications'),
              if (preferences == null)
                const Padding(
                  padding: EdgeInsets.all(20),
                  child: LinearProgressIndicator(),
                )
              else ...[
                _preference(
                  store,
                  preferences,
                  'Messages',
                  'New customer and store replies',
                  preferences.messagesEnabled,
                  (value) => preferences.copyWith(messagesEnabled: value),
                ),
                _preference(
                  store,
                  preferences,
                  'Orders',
                  'Order placement and status updates',
                  preferences.ordersEnabled,
                  (value) => preferences.copyWith(ordersEnabled: value),
                ),
                _preference(
                  store,
                  preferences,
                  'Payments',
                  'Payment proof and review updates',
                  preferences.paymentsEnabled,
                  (value) => preferences.copyWith(paymentsEnabled: value),
                ),
              ],
              _header('Delivery'),
              const ListTile(
                leading: Icon(Icons.sync_rounded),
                title: Text('Foreground updates'),
                subtitle: Text(
                  'Updates are checked while OrderSync is open. Background push is not enabled.',
                ),
              ),
              _header('About'),
              const ListTile(title: Text('Version'), trailing: Text('1.0.0')),
              const ListTile(title: Text('Terms of Service')),
              const ListTile(title: Text('Privacy Policy')),
            ],
          ),
        );
      },
    );
  }

  Widget _preference(
    MessagingStore store,
    NotificationPreferences preferences,
    String title,
    String subtitle,
    bool enabled,
    NotificationPreferences Function(bool) update,
  ) => SwitchListTile(
    value: enabled,
    onChanged: store.busy
        ? null
        : (value) => store.updatePreferences(update(value)),
    title: Text(title),
    subtitle: Text(subtitle),
    activeColor: AppColors.brandPrimary,
  );

  Widget _header(String label) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
    child: Text(
      label,
      style: AppTypography.textTheme.labelMedium?.copyWith(
        color: AppColors.neutralInkSecondary,
      ),
    ),
  );
}
