import 'package:flutter_test/flutter_test.dart';
import 'package:minigrocery/core/auth/auth_models.dart';

void main() {
  test('parses a tenant-bound mobile authentication session', () {
    final session = AuthSession.fromJson({
      'accessToken': 'access-token',
      'accessExpiresAt': '2026-09-08T00:15:00Z',
      'refreshToken': 'refresh-token',
      'refreshExpiresAt': '2026-10-08T00:00:00Z',
      'user': {
        'id': '42',
        'email': 'customer@example.com',
        'fullName': 'Customer Example',
        'role': 'CUSTOMER',
        'business': {
          'id': '7',
          'name': 'Example Store',
          'slug': 'example-store',
        },
      },
    });

    expect(session.user.role, AuthRole.customer);
    expect(session.user.businessId, '7');
    expect(session.user.businessSlug, 'example-store');
    expect(session.accessToken, 'access-token');
    expect(session.refreshToken, 'refresh-token');
  });

  test('rejects an unknown server role', () {
    expect(() => AuthRole.fromJson('ADMIN'), throwsFormatException);
  });
}
