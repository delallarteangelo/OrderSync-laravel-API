// Placeholder widget test for the design-only prototype.
import 'package:flutter_test/flutter_test.dart';
import 'package:minigrocery/app.dart';

void main() {
  testWidgets('App boots', (tester) async {
    await tester.pumpWidget(const TonettesMinimartApp());
    expect(find.byType(TonettesMinimartApp), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 2500));
    await tester.pumpAndSettle();
  });
}
