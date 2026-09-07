// Design.md §5.23 — Edit profile screen
import 'package:flutter/material.dart';

import '../../mock/mock_user.dart';
import '../../theme/app_colors.dart';
import '../../widgets/app_primary_app_bar.dart';
import '../../widgets/app_snack_bar.dart';
import '../../widgets/app_text_field.dart';
import '../../widgets/primary_button.dart';

class EditProfileScreen extends StatelessWidget {
  const EditProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: const AppPrimaryAppBar(title: 'Edit profile', showBack: true),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          children: [
            Center(
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 44,
                    backgroundColor: AppColors.brandPrimarySurface,
                    backgroundImage: NetworkImage(mockUser.avatarUrl),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: AppColors.brandPrimary,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.camera_alt_rounded,
                        color: AppColors.onBrand,
                        size: 16,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            AppTextField(
              label: 'Full name',
              controller: TextEditingController(text: mockUser.name),
            ),
            const SizedBox(height: 14),
            AppTextField(
              label: 'Email',
              controller: TextEditingController(text: mockUser.email),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 14),
            AppTextField(
              label: 'Mobile number',
              controller: TextEditingController(text: mockUser.phone),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 14),
            AppTextField(
              label: 'Address',
              controller: TextEditingController(text: mockUser.address.full),
              maxLines: 2,
            ),
            const SizedBox(height: 24),
            PrimaryButton(
              label: 'Save changes',
              onPressed: () {
                AppSnackBar.showSuccess(context, 'Profile updated');
                Navigator.of(context).pop();
              },
            ),
          ],
        ),
      ),
    );
  }
}
