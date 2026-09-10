// Design.md §5.19 — Chat list screen
import 'package:flutter/material.dart';

import '../../core/messaging/messaging_store.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';

class ChatListScreen extends StatelessWidget {
  const ChatListScreen({super.key});

  String _hhmm(DateTime? t) {
    if (t == null) return 'New';
    final h = t.hour.toString().padLeft(2, '0');
    final m = t.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  @override
  Widget build(BuildContext context) {
    final store = MessagingScope.of(context);
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) => Scaffold(
        backgroundColor: AppColors.neutralSurface,
        appBar: const AppPrimaryAppBar(title: 'Messages', showBack: true),
        floatingActionButton:
            store.threads.any((thread) => thread.kind == 'GENERAL')
            ? null
            : FloatingActionButton.extended(
                onPressed: store.busy
                    ? null
                    : () async {
                        final thread = await store.createGeneralThread();
                        if (thread != null && context.mounted) {
                          Navigator.of(context).pushNamed(
                            AppRoutes.chatThread,
                            arguments: thread.id,
                          );
                        }
                      },
                icon: const Icon(Icons.support_agent_rounded),
                label: const Text('Contact store'),
              ),
        body: store.threads.isEmpty
            ? const Center(
                child: Text(
                  'No conversations yet. Contact the store to get started.',
                ),
              )
            : RefreshIndicator(
                onRefresh: store.refresh,
                child: ListView.separated(
                  itemCount: store.threads.length,
                  separatorBuilder: (_, _) =>
                      const Divider(height: 1, indent: 76),
                  itemBuilder: (_, i) {
                    final t = store.threads[i];
                    return ListTile(
                      onTap: () async {
                        await store.loadThread(t.id);
                        if (context.mounted) {
                          Navigator.of(
                            context,
                          ).pushNamed(AppRoutes.chatThread, arguments: t.id);
                        }
                      },
                      leading: CircleAvatar(
                        radius: 24,
                        backgroundColor: AppColors.brandPrimarySurface,
                        child: const Icon(
                          Icons.storefront_rounded,
                          color: AppColors.brandPrimary,
                        ),
                      ),
                      title: Text(
                        t.kind == 'ORDER'
                            ? (t.orderCode ?? 'Order support')
                            : 'Store support',
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
                            _hhmm(t.lastMessageAt),
                            style: AppTypography.textTheme.labelSmall,
                          ),
                          const SizedBox(height: 4),
                          if (t.unreadCount > 0)
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
                                '${t.unreadCount}',
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
              ),
      ),
    );
  }
}
