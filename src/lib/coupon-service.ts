import { DiscountCoupon } from '../types';

const INITIAL_COUPONS: DiscountCoupon[] = [
  {
    id: 'coupon-1',
    code: 'KALAM50',
    discountPercent: 50,
    description: 'Special 50% Off Flash Promo for VIP Members',
    isActive: true,
    maxUses: 500,
    usedCount: 42,
  },
  {
    id: 'coupon-2',
    code: 'VIP20',
    discountPercent: 20,
    description: '20% Off on All Digital Mod & Bypass Keys',
    isActive: true,
    maxUses: 1000,
    usedCount: 118,
  },
  {
    id: 'coupon-3',
    code: 'WELCOME10',
    discountPercent: 10,
    description: '10% Welcome Discount for New Users',
    isActive: true,
    maxUses: 2000,
    usedCount: 245,
  },
  {
    id: 'coupon-4',
    code: 'FREEFIRE',
    discountPercent: 15,
    description: '15% Off All Free Fire MAX VIP Panels',
    isActive: true,
    maxUses: 800,
    usedCount: 76,
  },
  {
    id: 'coupon-5',
    code: 'FLAT50',
    discountPercent: 0,
    discountFlat: 50,
    minAmount: 150,
    description: 'Flat ₹50 Off on Orders above ₹150',
    isActive: true,
    maxUses: 300,
    usedCount: 19,
  },
];

export function getStoredCoupons(): DiscountCoupon[] {
  try {
    const raw = localStorage.getItem('kalam_store_coupons');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading stored coupons:', err);
  }
  return INITIAL_COUPONS;
}

export function saveStoredCoupons(coupons: DiscountCoupon[]): void {
  try {
    localStorage.setItem('kalam_store_coupons', JSON.stringify(coupons));
  } catch (err) {
    console.warn('Error saving coupons:', err);
  }
}

export function validateCoupon(
  code: string,
  amount: number
): {
  valid: boolean;
  coupon?: DiscountCoupon;
  discountAmount: number;
  finalAmount: number;
  message: string;
} {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: amount,
      message: 'Please enter a coupon code.',
    };
  }

  const coupons = getStoredCoupons();
  const found = coupons.find((c) => c.code.toUpperCase() === cleanCode);

  if (!found) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: amount,
      message: `Coupon '${cleanCode}' is invalid or expired.`,
    };
  }

  if (!found.isActive) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: amount,
      message: `Coupon '${cleanCode}' is currently disabled.`,
    };
  }

  if (found.minAmount && amount < found.minAmount) {
    return {
      valid: false,
      discountAmount: 0,
      finalAmount: amount,
      message: `Coupon requires a minimum order amount of ₹${found.minAmount}.`,
    };
  }

  let discount = 0;
  if (found.discountPercent && found.discountPercent > 0) {
    discount = (amount * found.discountPercent) / 100;
  } else if (found.discountFlat && found.discountFlat > 0) {
    discount = found.discountFlat;
  }

  // Ensure discount does not exceed total amount
  discount = Math.min(amount, Math.round(discount * 100) / 100);
  const finalAmount = Math.max(0, Math.round((amount - discount) * 100) / 100);

  return {
    valid: true,
    coupon: found,
    discountAmount: discount,
    finalAmount,
    message: `🎉 '${cleanCode}' applied! You saved ₹${discount.toFixed(2)} (${found.discountPercent ? `${found.discountPercent}% OFF` : `₹${found.discountFlat} OFF`}).`,
  };
}

export function recordCouponUsage(code: string): void {
  try {
    const coupons = getStoredCoupons();
    const updated = coupons.map((c) => {
      if (c.code.toUpperCase() === code.trim().toUpperCase()) {
        return {
          ...c,
          usedCount: (c.usedCount || 0) + 1,
        };
      }
      return c;
    });
    saveStoredCoupons(updated);
  } catch (err) {
    console.warn('Error recording coupon usage:', err);
  }
}
