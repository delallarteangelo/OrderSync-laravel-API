<?php

namespace App\Policies;

use App\Enums\Role;
use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function view(User $user, Product $product): bool
    {
        return $this->hasMembership($user, $product->business_id, [Role::BusinessOwner, Role::Staff, Role::Cashier]);
    }

    public function update(User $user, Product $product): bool
    {
        return $this->hasMembership($user, $product->business_id, [Role::BusinessOwner, Role::Staff]);
    }

    public function delete(User $user, Product $product): bool
    {
        return $this->update($user, $product);
    }

    /** @param array<int, Role> $roles */
    private function hasMembership(User $user, int $businessId, array $roles): bool
    {
        return $user->memberships()->where('business_id', $businessId)
            ->where('is_active', true)->whereIn('role', array_map(fn (Role $role) => $role->value, $roles))->exists();
    }
}
