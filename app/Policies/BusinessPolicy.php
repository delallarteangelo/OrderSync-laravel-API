<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Business;
use App\Models\User;

class BusinessPolicy
{
    public function view(User $user, Business $business): bool
    {
        return $user->platform_role === Role::SuperAdmin
            || $user->memberships()
                ->where('business_id', $business->getKey())
                ->where('is_active', true)
                ->exists();
    }

    public function update(User $user, Business $business): bool
    {
        return $user->platform_role === Role::SuperAdmin
            || $user->memberships()
                ->where('business_id', $business->getKey())
                ->where('role', Role::BusinessOwner->value)
                ->where('is_active', true)
                ->exists();
    }

    public function delete(User $user, Business $business): bool
    {
        return false;
    }
}
