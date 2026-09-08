<?php

namespace App\Enums;

enum InventoryReason: string
{
    case Adjustment = 'ADJUSTMENT';
    case Restock = 'RESTOCK';
    case PosSale = 'POS_SALE';
    case OrderConfirmed = 'ORDER_CONFIRMED';
}
