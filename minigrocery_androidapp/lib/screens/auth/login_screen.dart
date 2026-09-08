// Design.md §5.3 — Login screen
import 'package:flutter/material.dart';

import '../../core/auth/auth_api.dart';
import '../../core/auth/auth_models.dart';
import '../../core/auth/auth_session_store.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/primary_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _obscure = true;
  bool _loading = false;
  String? _error;
  List<BusinessMembership> _businesses = const [];
  String? _businessId;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_emailController.text.trim().isEmpty ||
        _passwordController.text.isEmpty) {
      setState(() => _error = 'Enter your email and password.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final store = AuthScope.of(context);
      final session = await store.login(
        email: _emailController.text,
        password: _passwordController.text,
        businessId: _businessId,
      );
      if (!mounted) return;

      if (session.user.role != AuthRole.customer) {
        store.clear();
        setState(
          () => _error = 'Use a customer account to sign in to this app.',
        );
        return;
      }

      Navigator.of(context).pushReplacementNamed(AppRoutes.home);
    } on AuthApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        if (error.code == 'BUSINESS_SELECTION_REQUIRED') {
          _businesses = error.businesses;
          _businessId = error.businesses.firstOrNull?.businessId;
        }
      });
    } catch (_) {
      if (mounted) {
        setState(
          () => _error =
              'Unable to reach OrderSync. Check your connection and try again.',
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 32, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                width: 88,
                height: 88,
                decoration: const BoxDecoration(
                  color: AppColors.brandPrimarySurface,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.storefront_rounded,
                  size: 44,
                  color: AppColors.brandPrimary,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Welcome back',
                textAlign: TextAlign.center,
                style: AppTypography.textTheme.headlineMedium,
              ),
              const SizedBox(height: 6),
              Text(
                'Sign in to continue shopping',
                textAlign: TextAlign.center,
                style: AppTypography.textTheme.bodyMedium?.copyWith(
                  color: AppColors.neutralInkSecondary,
                ),
              ),
              const SizedBox(height: 32),
              AppTextField(
                label: 'Email',
                hint: 'you@example.com',
                prefixIcon: Icons.alternate_email_rounded,
                keyboardType: TextInputType.emailAddress,
                controller: _emailController,
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: 'Password',
                hint: '••••••••',
                prefixIcon: Icons.lock_outline_rounded,
                obscureText: _obscure,
                controller: _passwordController,
                suffix: IconButton(
                  icon: Icon(
                    _obscure
                        ? Icons.visibility_off_rounded
                        : Icons.visibility_rounded,
                  ),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),
              if (_businesses.isNotEmpty) ...[
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  value: _businessId,
                  decoration: const InputDecoration(labelText: 'Business'),
                  items: _businesses
                      .map(
                        (membership) => DropdownMenuItem(
                          value: membership.businessId,
                          child: Text(membership.businessName),
                        ),
                      )
                      .toList(growable: false),
                  onChanged: (value) => setState(() => _businessId = value),
                ),
              ],
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(
                  _error!,
                  style: AppTypography.textTheme.bodySmall?.copyWith(
                    color: AppColors.statusRejected,
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () =>
                      Navigator.of(context).pushNamed(AppRoutes.forgotPassword),
                  child: const Text('Forgot password?'),
                ),
              ),
              const SizedBox(height: 8),
              PrimaryButton(
                label: 'Sign in',
                loading: _loading,
                onPressed: _submit,
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'New here?',
                    style: AppTypography.textTheme.bodyMedium?.copyWith(
                      color: AppColors.neutralInkSecondary,
                    ),
                  ),
                  TextButton(
                    onPressed: () =>
                        Navigator.of(context).pushNamed(AppRoutes.register),
                    child: const Text('Create account'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
