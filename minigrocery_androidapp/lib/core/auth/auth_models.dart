enum AuthRole {
  superAdmin('SUPER_ADMIN'),
  businessOwner('BUSINESS_OWNER'),
  staff('STAFF'),
  cashier('CASHIER'),
  customer('CUSTOMER');

  const AuthRole(this.value);

  final String value;

  static AuthRole fromJson(String value) => AuthRole.values.firstWhere(
    (role) => role.value == value,
    orElse: () => throw const FormatException('Unsupported account role.'),
  );
}

class BusinessMembership {
  const BusinessMembership({
    required this.businessId,
    required this.businessName,
    required this.businessSlug,
    required this.role,
  });

  final String businessId;
  final String businessName;
  final String businessSlug;
  final AuthRole role;

  factory BusinessMembership.fromJson(Map<String, dynamic> json) {
    return BusinessMembership(
      businessId: json['businessId'].toString(),
      businessName: json['businessName'] as String,
      businessSlug: json['businessSlug'] as String,
      role: AuthRole.fromJson(json['role'] as String),
    );
  }
}

class AuthUser {
  const AuthUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.businessId,
    required this.businessName,
    required this.businessSlug,
  });

  final String id;
  final String email;
  final String fullName;
  final AuthRole role;
  final String? businessId;
  final String? businessName;
  final String? businessSlug;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    final business = json['business'] as Map<String, dynamic>?;
    return AuthUser(
      id: json['id'].toString(),
      email: json['email'] as String,
      fullName: json['fullName'] as String,
      role: AuthRole.fromJson(json['role'] as String),
      businessId: business?['id']?.toString(),
      businessName: business?['name'] as String?,
      businessSlug: business?['slug'] as String?,
    );
  }
}

class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.accessExpiresAt,
    required this.refreshToken,
    required this.refreshExpiresAt,
    required this.user,
  });

  final String accessToken;
  final DateTime accessExpiresAt;
  final String refreshToken;
  final DateTime refreshExpiresAt;
  final AuthUser user;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    return AuthSession(
      accessToken: json['accessToken'] as String,
      accessExpiresAt: DateTime.parse(json['accessExpiresAt'] as String),
      refreshToken: json['refreshToken'] as String,
      refreshExpiresAt: DateTime.parse(json['refreshExpiresAt'] as String),
      user: AuthUser.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}
