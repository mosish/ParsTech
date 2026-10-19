import { z } from 'zod';

/**
 * Strict server-side input validation schemas.
 * Every schema uses `.strict()` to reject unexpected properties and prevent mass assignment.
 */

export const loginInputSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('ایمیل معتبر وارد کنید / Valid email is required')
      .max(160),
    password: z.string().min(1, 'رمز عبور الزامی است / Password is required').max(256),
  })
  .strict();

export const updateVariantPriceStockSchema = z
  .object({
    variantId: z.string().trim().min(1).max(100),
    /** Whole Iranian Tomans (1 Toman = 10 IRR), nonnegative safe integer (optional when updating stock only) */
    priceToman: z
      .number()
      .int('Price must be a whole integer in Iranian Toman')
      .min(0, 'Price cannot be negative')
      .max(5_000_000_000, 'Price exceeds maximum allowed threshold')
      .optional(),
    /** Physical stock count, nonnegative integer */
    stockCount: z
      .number()
      .int('Stock count must be a whole integer')
      .min(0, 'Stock count cannot be negative')
      .max(100_000, 'Stock count exceeds maximum allowed threshold'),
  })
  .strict();

export const deleteProductSchema = z
  .object({
    productId: z.string().trim().min(1).max(100),
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(256),
    newPassword: z
      .string()
      .min(10, 'New password must be at least 10 characters long')
      .max(256),
  })
  .strict();
