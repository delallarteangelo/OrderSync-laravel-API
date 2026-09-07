// Design.md §5.20 — Chat thread screen
import 'package:flutter/material.dart';

import '../../mock/mock_messages.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../widgets/app_primary_app_bar.dart';
import '../../widgets/chat_bubble.dart';

class ChatThreadScreen extends StatelessWidget {
  final String threadId;
  const ChatThreadScreen({super.key, required this.threadId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: const AppPrimaryAppBar(
        title: "Tonette's Minimart",
        showBack: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(vertical: 12),
                itemCount: mockChatThread.length,
                itemBuilder: (_, i) => ChatBubble(message: mockChatThread[i]),
              ),
            ),
            Container(
              decoration: const BoxDecoration(
                color: AppColors.neutralSurface,
                border: Border(top: BorderSide(color: AppColors.neutralBorder)),
              ),
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.attach_file_rounded),
                    onPressed: () {},
                  ),
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
                      child: const TextField(
                        decoration: InputDecoration(
                          hintText: 'Type a message…',
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  Material(
                    color: AppColors.brandPrimary,
                    shape: const CircleBorder(),
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: () {},
                      child: const SizedBox(
                        width: 44,
                        height: 44,
                        child: Icon(
                          Icons.send_rounded,
                          color: AppColors.onBrand,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
