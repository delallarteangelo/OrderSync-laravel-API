import 'models.dart';

final List<ChatMessage> mockChatThread = [
  ChatMessage(
    id: 'm1',
    direction: MessageDirection.system,
    text: "Order #1206 confirmed by Tonette's Minimart",
    sentAt: DateTime(2026, 5, 14, 8, 41),
  ),
  ChatMessage(
    id: 'm2',
    direction: MessageDirection.received,
    text: 'Hello po! Your order is being prepared. Tagal lang 20 minutes.',
    sentAt: DateTime(2026, 5, 14, 8, 42),
  ),
  ChatMessage(
    id: 'm3',
    direction: MessageDirection.sent,
    text: 'Salamat po! Pwede po pala ipa-deliver sa gate guard na lang?',
    sentAt: DateTime(2026, 5, 14, 8, 43),
  ),
  ChatMessage(
    id: 'm4',
    direction: MessageDirection.received,
    text: 'Sure po, sa guard po namin iiwan. Pakihanda na lang ang bayad.',
    sentAt: DateTime(2026, 5, 14, 8, 44),
  ),
  ChatMessage(
    id: 'm5',
    direction: MessageDirection.sent,
    text: 'Sige po, ready na ang ₱619.',
    sentAt: DateTime(2026, 5, 14, 8, 45),
  ),
  ChatMessage(
    id: 'm6',
    direction: MessageDirection.system,
    text: 'Order #1206 is now PREPARING',
    sentAt: DateTime(2026, 5, 14, 8, 50),
  ),
  ChatMessage(
    id: 'm7',
    direction: MessageDirection.received,
    text: 'Papuntang lugar n’yo na po ang rider.',
    sentAt: DateTime(2026, 5, 14, 9, 5),
  ),
  ChatMessage(
    id: 'm8',
    direction: MessageDirection.sent,
    text: 'Salamat po!',
    sentAt: DateTime(2026, 5, 14, 9, 6),
  ),
];

final List<ChatThreadSummary> mockChatList = [
  ChatThreadSummary(
    id: 't1',
    partnerName: "Tonette's Minimart",
    lastMessage: 'Papuntang lugar n’yo na po ang rider.',
    lastAt: DateTime(2026, 5, 14, 9, 5),
    unread: 1,
  ),
  ChatThreadSummary(
    id: 't2',
    partnerName: 'Support — Ate Lourdes',
    lastMessage: 'Walang problema po, pwede pa-refund.',
    lastAt: DateTime(2026, 5, 13, 16, 20),
    unread: 0,
  ),
  ChatThreadSummary(
    id: 't3',
    partnerName: "Tonette's Minimart",
    lastMessage: 'Thank you po for your order!',
    lastAt: DateTime(2026, 5, 12, 11, 0),
    unread: 0,
  ),
];
