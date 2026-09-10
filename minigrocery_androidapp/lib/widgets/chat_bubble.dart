import 'package:flutter/material.dart';

import '../core/messaging/messaging_models.dart';
import '../theme/app_colors.dart';
import '../theme/app_radii.dart';
import '../theme/app_typography.dart';

/// ChatBubble — Design.md §4.11.
class ChatBubble extends StatelessWidget {
  final MessagingMessage message;
  const ChatBubble({super.key, required this.message});

  String _hhmm(DateTime t) {
    final h = t.hour.toString().padLeft(2, '0');
    final m = t.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  @override
  Widget build(BuildContext context) {
    if (message.kind == 'SYSTEM') {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Center(
          child: Text(
            message.body,
            textAlign: TextAlign.center,
            style: AppTypography.textTheme.bodySmall?.copyWith(
              fontStyle: FontStyle.italic,
              color: AppColors.neutralInkSecondary,
            ),
          ),
        ),
      );
    }

    if (message.kind == 'AI') {
      return Align(
        alignment: Alignment.centerLeft,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 12),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.82,
            ),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFEAF3FF),
                border: Border.all(color: const Color(0xFFB8D6FF)),
                borderRadius: const BorderRadius.all(AppRadii.lg),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.auto_awesome, size: 15),
                      SizedBox(width: 4),
                      Text(
                        'AI · grounded assistant',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(message.body),
                  const SizedBox(height: 4),
                  Text(
                    _hhmm(message.sentAt),
                    style: AppTypography.textTheme.labelSmall,
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final isSent = message.mine;
    final bg = isSent ? AppColors.brandPrimary : AppColors.neutralSurfaceAlt;
    final fg = isSent ? AppColors.onBrand : AppColors.neutralInkBlack;
    final radius = isSent
        ? const BorderRadius.only(
            topLeft: AppRadii.lg,
            topRight: AppRadii.lg,
            bottomLeft: AppRadii.lg,
          )
        : const BorderRadius.only(
            topLeft: AppRadii.lg,
            topRight: AppRadii.lg,
            bottomRight: AppRadii.lg,
          );

    return Align(
      alignment: isSent ? Alignment.centerRight : Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 12),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.75,
          ),
          child: Column(
            crossAxisAlignment: isSent
                ? CrossAxisAlignment.end
                : CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(color: bg, borderRadius: radius),
                child: Text(
                  message.body,
                  style: AppTypography.textTheme.bodyMedium?.copyWith(
                    color: fg,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                _hhmm(message.sentAt),
                style: AppTypography.textTheme.labelSmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
