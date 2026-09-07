import 'package:flutter/material.dart';

import '../mock/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_radii.dart';
import '../theme/app_typography.dart';

/// ChatBubble — Design.md §4.11.
class ChatBubble extends StatelessWidget {
  final ChatMessage message;
  const ChatBubble({super.key, required this.message});

  String _hhmm(DateTime t) {
    final h = t.hour.toString().padLeft(2, '0');
    final m = t.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  @override
  Widget build(BuildContext context) {
    if (message.direction == MessageDirection.system) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Center(
          child: Text(
            message.text,
            textAlign: TextAlign.center,
            style: AppTypography.textTheme.bodySmall?.copyWith(
              fontStyle: FontStyle.italic,
              color: AppColors.neutralInkSecondary,
            ),
          ),
        ),
      );
    }

    final isSent = message.direction == MessageDirection.sent;
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
                  message.text,
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
