// Design.md §5.19 — Chat list screen
import 'package:flutter/material.dart';

import '../../mock/mock_messages.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';

class ChatListScreen extends StatelessWidget {
  const ChatListScreen({super.key});

  String _hhmm(DateTime t) {
    final h = t.hour.toString().padLeft(2, '0');
    final m = t.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: const AppPrimaryAppBar(title: 'Messages', showBack: true),
      body: ListView.separated(
        itemCount: mockChatList.length,
        separatorBuilder: (_, __) => const Divider(height: 1, indent: 76),
        itemBuilder: (_, i) {
          final t = mockChatList[i];
          return ListTile(
            onTap: () => Navigator.of(
              context,
            ).pushNamed(AppRoutes.chatThread, arguments: t.id),
            leading: CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.brandPrimarySurface,
              child: const Icon(
                Icons.storefront_rounded,
                color: AppColors.brandPrimary,
              ),
            ),
            title: Text(
              t.partnerName,
              style: AppTypography.textTheme.titleLarge,
            ),
            subtitle: Text(
              t.lastMessage,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.textTheme.bodySmall,
            ),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  _hhmm(t.lastAt),
                  style: AppTypography.textTheme.labelSmall,
                ),
                const SizedBox(height: 4),
                if (t.unread > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.brandPrimary,
                      borderRadius: AppRadii.brPill,
                    ),
                    child: Text(
                      '${t.unread}',
                      style: const TextStyle(
                        color: AppColors.onBrand,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
