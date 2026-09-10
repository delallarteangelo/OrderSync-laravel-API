import 'package:flutter/material.dart';

import '../../core/messaging/messaging_store.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../widgets/app_primary_app_bar.dart';
import '../../widgets/chat_bubble.dart';

class ChatThreadScreen extends StatefulWidget {
  const ChatThreadScreen({super.key, required this.threadId});
  final String threadId;

  @override
  State<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends State<ChatThreadScreen> {
  final _controller = TextEditingController();
  bool _askAi = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final store = MessagingScope.of(context);
      store.loadThread(widget.threadId);
      store.loadPublishedAiKnowledge();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final store = MessagingScope.of(context);
    final thread = store.threads
        .where((item) => item.id == widget.threadId)
        .firstOrNull;
    final messages = store.messages[widget.threadId] ?? const [];
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) => Scaffold(
        backgroundColor: AppColors.neutralSurface,
        appBar: AppPrimaryAppBar(
          title: thread?.kind == 'ORDER'
              ? (thread?.orderCode ?? 'Order support')
              : 'Store support',
          showBack: true,
        ),
        body: SafeArea(
          child: Column(
            children: [
              if (store.error != null)
                MaterialBanner(
                  content: Text(store.error!),
                  actions: [
                    TextButton(
                      onPressed: () => store.loadThread(widget.threadId),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => store.loadThread(widget.threadId),
                  child: messages.isEmpty
                      ? ListView(
                          children: const [
                            SizedBox(height: 180),
                            Center(
                              child: Text(
                                'Start the conversation with the store.',
                              ),
                            ),
                          ],
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          itemCount: messages.length,
                          itemBuilder: (_, i) =>
                              ChatBubble(message: messages[i]),
                        ),
                ),
              ),
              if (store.aiKnowledge.isNotEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
                  color: AppColors.neutralSurface,
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: store.aiKnowledge.take(4).map((entry) {
                        final suggestion = entry.question ?? entry.title;
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: ActionChip(
                            avatar: Icon(
                              entry.type == 'ANNOUNCEMENT'
                                  ? Icons.campaign_outlined
                                  : Icons.help_outline,
                              size: 16,
                            ),
                            label: Text(suggestion),
                            onPressed: () {
                              _controller.text = suggestion;
                              setState(() => _askAi = true);
                            },
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              Container(
                decoration: const BoxDecoration(
                  color: AppColors.neutralSurface,
                  border: Border(
                    top: BorderSide(color: AppColors.neutralBorder),
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
                child: Column(
                  children: [
                    Row(
                      children: [
                        FilterChip(
                          avatar: const Icon(Icons.auto_awesome, size: 16),
                          label: const Text('Ask AI'),
                          selected: _askAi,
                          onSelected: (value) => setState(() => _askAi = value),
                        ),
                        const Spacer(),
                        TextButton.icon(
                          onPressed: store.busy
                              ? null
                              : () async {
                                  final requested = await store
                                      .requestHumanHandoff(widget.threadId);
                                  if (requested && context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'A store team member has been requested.',
                                        ),
                                      ),
                                    );
                                  }
                                },
                          icon: const Icon(Icons.support_agent, size: 18),
                          label: const Text('Human support'),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.neutralSurfaceAlt,
                              borderRadius: AppRadii.brPill,
                            ),
                            child: TextField(
                              controller: _controller,
                              minLines: 1,
                              maxLines: 4,
                              maxLength: _askAi ? 1000 : 4000,
                              decoration: InputDecoration(
                                hintText: _askAi
                                    ? 'Ask about products, stock, orders, or FAQs…'
                                    : 'Type a message to the store…',
                                border: InputBorder.none,
                                counterText: '',
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        IconButton.filled(
                          onPressed: store.busy
                              ? null
                              : () async {
                                  final text = _controller.text.trim();
                                  if (text.isEmpty) return;
                                  final sent = _askAi
                                      ? await store.askAssistant(
                                          widget.threadId,
                                          text,
                                        )
                                      : await store.send(widget.threadId, text);
                                  if (sent) _controller.clear();
                                },
                          icon: Icon(
                            _askAi ? Icons.auto_awesome : Icons.send_rounded,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
