// Design.md §5.22 — Profile tab
import 'package:flutter/material.dart';

import '../../mock/mock_user.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_typography.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          children: [
            Center(
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 44,
                    backgroundColor: AppColors.brandPrimarySurface,
                    backgroundImage: NetworkImage(mockUser.avatarUrl),
                    onBackgroundImageError: (_, __) {},
                  ),
                  const SizedBox(height: 12),
                  Text(
                    mockUser.name,
                    style: AppTypography.textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    mockUser.email,
                    style: AppTypography.textTheme.bodyMedium?.copyWith(
                      color: AppColors.neutralInkSecondary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: () =>
                        Navigator.of(context).pushNamed(AppRoutes.editProfile),
                    icon: const Icon(Icons.edit_rounded, size: 18),
                    label: const Text('Edit profile'),
                    style: OutlinedButton.styleFrom(
                      shape: const RoundedRectangleBorder(
                        borderRadius: AppRadii.brPill,
                      ),
                      side: const BorderSide(color: AppColors.neutralBorder),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            _tile(context, Icons.receipt_long_rounded, 'My orders', () {}),
            _tile(context, Icons.location_on_outlined, 'Addresses', () {}),
            _tile(context, Icons.payments_outlined, 'Payment methods', () {}),
            _tile(
              context,
              Icons.notifications_none_rounded,
              'Notifications',
              () => Navigator.of(context).pushNamed(AppRoutes.notifications),
            ),
            _tile(
              context,
              Icons.chat_bubble_outline_rounded,
              'Messages',
              () => Navigator.of(context).pushNamed(AppRoutes.chatList),
            ),
            _tile(
              context,
              Icons.settings_outlined,
              'Settings',
              () => Navigator.of(context).pushNamed(AppRoutes.settings),
            ),
            _tile(context, Icons.help_outline_rounded, 'Help & support', () {}),
            const SizedBox(height: 12),
            _tile(
              context,
              Icons.logout_rounded,
              'Sign out',
              () => Navigator.of(
                context,
              ).pushNamedAndRemoveUntil(AppRoutes.login, (_) => false),
              isDestructive: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _tile(
    BuildContext context,
    IconData icon,
    String label,
    VoidCallback onTap, {
    bool isDestructive = false,
  }) {
    final color = isDestructive
        ? AppColors.statusRejected
        : AppColors.neutralInkBlack;
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadii.brMd,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
        child: Row(
          children: [
            Icon(icon, color: color),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: AppTypography.textTheme.titleMedium?.copyWith(
                  color: color,
                ),
              ),
            ),
            if (!isDestructive)
              const Icon(
                Icons.chevron_right_rounded,
                color: AppColors.neutralInkSecondary,
              ),
          ],
        ),
      ),
    );
  }
}
