import 'package:flutter/widgets.dart';

import 'auth_api.dart';
import 'auth_models.dart';

class AuthSessionStore extends ChangeNotifier {
  AuthSessionStore(this._api);

  final AuthApi _api;
  AuthSession? _session;
  bool _busy = false;

  AuthSession? get session => _session;
  bool get busy => _busy;
  bool get isAuthenticated => _session != null;

  Future<AuthSession> login({
    required String email,
    required String password,
    String? businessId,
  }) async {
    _setBusy(true);
    try {
      final session = await _api.login(
        email: email,
        password: password,
        businessId: businessId,
      );
      _session = session;
      notifyListeners();
      return session;
    } finally {
      _setBusy(false);
    }
  }

  Future<void> refresh() async {
    final current = _session;
    if (current == null) return;
    _session = await _api.refresh(current.refreshToken);
    notifyListeners();
  }

  Future<void> logout() async {
    final current = _session;
    _session = null;
    notifyListeners();
    if (current != null) await _api.logout(current);
  }

  void clear() {
    _session = null;
    notifyListeners();
  }

  void _setBusy(bool value) {
    _busy = value;
    notifyListeners();
  }

  @override
  void dispose() {
    _api.close();
    super.dispose();
  }
}

class AuthScope extends InheritedNotifier<AuthSessionStore> {
  const AuthScope({
    super.key,
    required AuthSessionStore store,
    required super.child,
  }) : super(notifier: store);

  static AuthSessionStore of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AuthScope>();
    assert(scope != null, 'AuthScope is missing above this context.');
    return scope!.notifier!;
  }
}
