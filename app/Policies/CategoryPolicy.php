<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    public function view(User $user, Category $category): bool
    {
        return $this->hasMembership($user, $category->business_id, [Role::BusinessOwner, Role::Staff, Role::Cashier]);
    }

    public function update(User $user, Category $category): bool
    {
        return $this->hasMembership($user, $category->business_id, [Role::BusinessOwner, Role::Staff]);
    }

    public function delete(User $user, Category $category): bool
    {
        return $this->update($user, $category);
    }

    /** @param array<int, Role> $roles */
    private function hasMembership(User $user, int $businessId, array $roles): bool
    {
        return $user->memberships()->where('business_id', $businessId)
            ->where('is_active', true)->whereIn('role', array_map(fn (Role $role) => $role->value, $roles))->exists();
    }
}
