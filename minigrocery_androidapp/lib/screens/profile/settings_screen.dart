// Design.md §5.24 — Settings screen
import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _push = true;
  bool _email = false;
  bool _dark = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: const AppPrimaryAppBar(title: 'Settings', showBack: true),
      body: ListView(
        children: [
          _header('Notifications'),
          SwitchListTile(
            value: _push,
            onChanged: (v) => setState(() => _push = v),
            title: const Text('Push notifications'),
            activeColor: AppColors.brandPrimary,
          ),
          SwitchListTile(
            value: _email,
            onChanged: (v) => setState(() => _email = v),
            title: const Text('Email updates'),
            activeColor: AppColors.brandPrimary,
          ),
          _header('Appearance'),
          SwitchListTile(
            value: _dark,
            onChanged: (v) => setState(() => _dark = v),
            title: const Text('Dark mode'),
            subtitle: const Text('Coming soon'),
            activeColor: AppColors.brandPrimary,
          ),
          _header('About'),
          const ListTile(
            title: Text('Version'),
            trailing: Text('1.0.0 (design)'),
          ),
          const ListTile(title: Text('Terms of Service')),
          const ListTile(title: Text('Privacy Policy')),
        ],
      ),
    );
  }

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
