import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from './db';
import { INITIAL_PRODUCTS } from '../data/storeData';
import type { Product as SeedProduct } from '../utils/commerce';
import {
  mapDbProductToClientProduct,
  type SerializedCatalogProduct,
} from './serialization';
import { updateVariantPriceStockSchema, deleteProductSchema } from './validation';
import { authorizeAdminOperation, AuthorizationError } from './auth';
import { recordAuditLog } from './audit';

export const DEFAULT_CATEGORIES = [
  {
    slug: 'mobiles',
    nameFa: 'گوشی موبایل',
    nameEn: 'Smartphones',
    descriptionFa: 'گوشی‌های هوشمند اپل و سامسونگ',
    descriptionEn: 'Apple iPhone & Samsung Galaxy Smartphones',
    sortOrder: 1,
  },
  {
    slug: 'laptops',
    nameFa: 'لپ‌تاپ تخصصی',
    nameEn: 'Pro Laptops',
    descriptionFa: 'مک‌بوک پرو و لپ‌تاپ‌های مهندسی و رندرینگ',
    descriptionEn: 'MacBook Pro & Workstation Laptops',
    sortOrder: 2,
  },
  {
    slug: 'consoles',
    nameFa: 'کنسول بازی',
    nameEn: 'Game Consoles',
    descriptionFa: 'کنسول‌های نسل نهم پلی‌استیشن و ایکس‌باکس',
    descriptionEn: 'PlayStation 5 Pro & Xbox Series X Consoles',
    sortOrder: 3,
  },
  {
    slug: 'accessories',
    nameFa: 'لوازم جانبی',
    nameEn: 'Accessories',
    descriptionFa: 'ساعت هوشمند، هدفون و شارژرهای استاندارد',
    descriptionEn: 'Smartwatches, Audio & GaN Fast Chargers',
    sortOrder: 4,
  },
] as const;

export function buildSlugFromProduct(prod: SeedProduct): string {
  const base = prod.id.replace(/^prod-/, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  return base || prod.sku.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
}

export function extractStorageLabel(prod: SeedProduct): string {
  const match = prod.nameEn.match(/\b(64GB|128GB|256GB|512GB|1TB|2TB)\b/i);
  return match ? match[1].toUpperCase() : 'Standard';
}

export function buildVariantSku(productSku: string, colorNameEn: string, index: number): string {
  const colorCode = colorNameEn
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 4) || `C${index + 1}`;
  return `${productSku}-${colorCode}-${index + 1}`;
}

export interface CatalogImportResult {
  categoriesCount: number;
  productsCount: number;
  variantsCount: number;
  isDemo: boolean;
}

/**
 * Repeatable, idempotent catalog import into PostgreSQL.
 * Uses `upsert` keyed on unique `slug` and `sku` so running it multiple times never creates duplicates.
 * Explicitly marks records with `isDemo` when importing demo/seed data.
 * NEVER seeds default administrator credentials.
 */
export async function importCatalogToDatabase(
  options: {
    products?: SeedProduct[];
    isDemo?: boolean;
  } = {},
  db: PrismaClient = defaultPrisma
): Promise<CatalogImportResult> {
  const productsToImport = options.products ?? INITIAL_PRODUCTS;
  const isDemo = options.isDemo ?? false;

  const categoryIdBySlug = new Map<string, string>();
  for (const cat of DEFAULT_CATEGORIES) {
    const savedCat = await db.category.upsert({
      where: { slug: cat.slug },
      create: {
        slug: cat.slug,
        nameFa: cat.nameFa,
        nameEn: cat.nameEn,
        descriptionFa: cat.descriptionFa,
        descriptionEn: cat.descriptionEn,
        sortOrder: cat.sortOrder,
      },
      update: {
        nameFa: cat.nameFa,
        nameEn: cat.nameEn,
        descriptionFa: cat.descriptionFa,
        descriptionEn: cat.descriptionEn,
        sortOrder: cat.sortOrder,
      },
    });
    categoryIdBySlug.set(cat.slug, savedCat.id);
  }

  let variantsCount = 0;

  for (const prod of productsToImport) {
    const categoryId =
      categoryIdBySlug.get(prod.category) ?? categoryIdBySlug.get('mobiles')!;
    const slug = buildSlugFromProduct(prod);
    const basePriceToman = BigInt(Math.max(0, Math.round(prod.priceToman)));
    const originalPriceToman =
      prod.originalPriceToman !== undefined
        ? BigInt(Math.max(0, Math.round(prod.originalPriceToman)))
        : null;

    const savedProd = await db.product.upsert({
      where: { sku: prod.sku },
      create: {
        id: prod.id,
        sku: prod.sku,
        slug,
        categoryId,
        brand: prod.brand,
        nameFa: prod.nameFa,
        nameEn: prod.nameEn,
        subtitleFa: prod.subtitleFa,
        subtitleEn: prod.subtitleEn,
        warrantyFa: prod.warrantyFa,
        warrantyEn: prod.warrantyEn,
        artworkKey: prod.artworkKey,
        seriesTag: prod.seriesTag ?? null,
        featured: Boolean(prod.featured),
        isHeavyItem: Boolean(prod.isHeavyItem),
        basePriceToman,
        originalPriceToman,
        specsJson: prod.specs as unknown as Prisma.InputJsonValue,
        isDemo,
      },
      update: {
        slug,
        categoryId,
        brand: prod.brand,
        nameFa: prod.nameFa,
        nameEn: prod.nameEn,
        subtitleFa: prod.subtitleFa,
        subtitleEn: prod.subtitleEn,
        warrantyFa: prod.warrantyFa,
        warrantyEn: prod.warrantyEn,
        artworkKey: prod.artworkKey,
        seriesTag: prod.seriesTag ?? null,
        featured: Boolean(prod.featured),
        isHeavyItem: Boolean(prod.isHeavyItem),
        basePriceToman,
        originalPriceToman,
        specsJson: prod.specs as unknown as Prisma.InputJsonValue,
        isDemo,
      },
    });

    const storageLabel = extractStorageLabel(prod);
    const colors =
      prod.colors.length > 0
        ? prod.colors
        : [{ nameFa: 'مشکی استاندارد', nameEn: 'Standard Black', hex: '#27272A' }];

    // Distribute initial stock across color variants deterministically
    const totalStock = Math.max(0, Math.round(prod.stockCount));
    const baseStockPerVariant = Math.floor(totalStock / colors.length);
    const remainderStock = totalStock % colors.length;

    for (let idx = 0; idx < colors.length; idx++) {
      const color = colors[idx];
      const variantSku = buildVariantSku(prod.sku, color.nameEn, idx);
      const variantStock = baseStockPerVariant + (idx < remainderStock ? 1 : 0);

      await db.productVariant.upsert({
        where: {
          productId_colorHex_storageLabel: {
            productId: savedProd.id,
            colorHex: color.hex,
            storageLabel,
          },
        },
        create: {
          productId: savedProd.id,
          sku: variantSku,
          colorNameFa: color.nameFa,
          colorNameEn: color.nameEn,
          colorHex: color.hex,
          storageLabel,
          priceToman: basePriceToman,
          stockCount: variantStock,
          angleUrlsJson: color.angleUrls ?? [],
          isDefault: idx === 0,
        },
        update: {
          sku: variantSku,
          colorNameFa: color.nameFa,
          colorNameEn: color.nameEn,
          angleUrlsJson: color.angleUrls ?? [],
          isDefault: idx === 0,
        },
      });
      variantsCount++;
    }
  }

  return {
    categoriesCount: categoryIdBySlug.size,
    productsCount: productsToImport.length,
    variantsCount,
    isDemo,
  };
}

/**
 * Reads products and their color/storage variants from PostgreSQL.
 * By default in production (`APP_ENV=production` and `INCLUDE_DEMO_CATALOG !== 'true'`),
 * filters out rows marked `isDemo: true` unless requested.
 */
export async function getCatalogProductsFromDb(
  options: {
    includeDemo?: boolean;
  } = {},
  db: PrismaClient = defaultPrisma
): Promise<SerializedCatalogProduct[]> {
  const includeDemo =
    options.includeDemo ??
    (process.env.APP_ENV !== 'production' || process.env.INCLUDE_DEMO_CATALOG === 'true');

  const rows = await db.product.findMany({
    where: includeDemo ? {} : { isDemo: false },
    include: {
      category: true,
      variants: {
        orderBy: [{ isDefault: 'desc' }, { sku: 'asc' }],
      },
    },
    orderBy: [{ featured: 'desc' }, { createdAt: 'asc' }],
  });

  return rows.map(mapDbProductToClientProduct);
}

/**
 * Authenticated Admin Operation: Update price (in Toman) and stock count for a ProductVariant in PostgreSQL.
 * Allowed Roles: OWNER, STAFF.
 * Enforces authentication, RBAC, CSRF, and strict Zod validation inside the server operation.
 */
export async function updateVariantPriceStockOperation(
  params: {
    rawToken: string | undefined | null;
    headers: Headers;
    ipAddress?: string;
    body: unknown;
    now?: Date;
  },
  db: PrismaClient = defaultPrisma
): Promise<
  | { ok: true; product: SerializedCatalogProduct }
  | { ok: false; status: 400 | 401 | 403 | 404; error: string }
> {
  const authResult = await authorizeAdminOperation(
    {
      rawToken: params.rawToken,
      headers: params.headers,
      allowedRoles: ['OWNER', 'STAFF'],
      requireCsrf: true,
      ipAddress: params.ipAddress,
      operationName: 'updateVariantPriceStock',
      now: params.now,
    },
    db
  );

  if (!authResult.ok) {
    return authResult;
  }

  const parsed = updateVariantPriceStockSchema.safeParse(params.body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  const { variantId, priceToman, stockCount } = parsed.data;
  const existingVariant = await db.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!existingVariant) {
    return { ok: false, status: 404, error: 'Product variant not found.' };
  }

  const nextPriceBigInt =
    priceToman !== undefined ? BigInt(priceToman) : existingVariant.priceToman;

  await db.$transaction(async (tx) => {
    await tx.productVariant.update({
      where: { id: variantId },
      data: {
        priceToman: nextPriceBigInt,
        stockCount,
      },
    });

    // If default variant was updated, synchronize Product.basePriceToman
    if (existingVariant.isDefault) {
      await tx.product.update({
        where: { id: existingVariant.productId },
        data: {
          basePriceToman: nextPriceBigInt,
        },
      });
    }
  });

  await recordAuditLog(
    {
      actorId: authResult.context.user.id,
      actorEmail: authResult.context.user.email,
      actorRole: authResult.context.user.role,
      action: 'VARIANT_PRICE_STOCK_UPDATED',
      targetType: 'ProductVariant',
      targetId: variantId,
      ipAddress: params.ipAddress ?? null,
      metadata: {
        sku: existingVariant.sku,
        previousPriceToman: existingVariant.priceToman.toString(),
        newPriceToman: nextPriceBigInt.toString(),
        previousStockCount: existingVariant.stockCount,
        newStockCount: stockCount,
      },
    },
    db
  );

  const updatedProduct = await db.product.findUniqueOrThrow({
    where: { id: existingVariant.productId },
    include: {
      category: true,
      variants: {
        orderBy: [{ isDefault: 'desc' }, { sku: 'asc' }],
      },
    },
  });

  return {
    ok: true,
    product: mapDbProductToClientProduct(updatedProduct),
  };
}

/**
 * Authenticated Admin Operation: Delete a product from PostgreSQL.
 * Allowed Roles: OWNER only (STAFF is rejected with 403).
 */
export async function deleteProductOperation(
  params: {
    rawToken: string | undefined | null;
    headers: Headers;
    ipAddress?: string;
    body: unknown;
    now?: Date;
  },
  db: PrismaClient = defaultPrisma
): Promise<{ ok: true; deletedId: string } | { ok: false; status: 400 | 401 | 403 | 404; error: string }> {
  const authResult = await authorizeAdminOperation(
    {
      rawToken: params.rawToken,
      headers: params.headers,
      allowedRoles: ['OWNER'],
      requireCsrf: true,
      ipAddress: params.ipAddress,
      operationName: 'deleteProduct',
      now: params.now,
    },
    db
  );

  if (!authResult.ok) {
    return authResult;
  }

  const parsed = deleteProductSchema.safeParse(params.body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: parsed.error.issues.map((i) => i.message).join('; '),
    };
  }

  const existing = await db.product.findUnique({
    where: { id: parsed.data.productId },
  });
  if (!existing) {
    return { ok: false, status: 404, error: 'Product not found.' };
  }

  await db.product.delete({
    where: { id: parsed.data.productId },
  });

  await recordAuditLog(
    {
      actorId: authResult.context.user.id,
      actorEmail: authResult.context.user.email,
      actorRole: authResult.context.user.role,
      action: 'PRODUCT_DELETED',
      targetType: 'Product',
      targetId: existing.id,
      ipAddress: params.ipAddress ?? null,
      metadata: {
        sku: existing.sku,
        nameEn: existing.nameEn,
      },
    },
    db
  );

  return { ok: true, deletedId: existing.id };
}

export async function importCatalogIdempotent(
  db: PrismaClient = defaultPrisma
): Promise<CatalogImportResult> {
  return importCatalogToDatabase({}, db);
}

export async function getPublicCatalogProducts(
  db: PrismaClient = defaultPrisma
): Promise<SerializedCatalogProduct[]> {
  return getCatalogProductsFromDb({}, db);
}

export async function getLatestCatalogTimestamp(
  db: PrismaClient = defaultPrisma
): Promise<Date | null> {
  const latestProduct = await db.product.findFirst({
    orderBy: { updatedAt: 'desc' },
    select: { updatedAt: true },
  });
  return latestProduct?.updatedAt ?? null;
}

export async function getRecentAuditLogs(
  limit = 40,
  db: PrismaClient = defaultPrisma
) {
  const rows = await db.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      actor: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    ...row,
    entityType: row.targetType,
    entityId: row.targetId,
    metadata: row.metadataJson,
  }));
}

/**
 * Enforces server-side authentication, RBAC role boundaries (`OWNER` vs `STAFF`),
 * and strict input validation inside the variant update operation:
 * - Unauthenticated requests throw AuthorizationError(401)
 * - Invalid inputs or mass-assignment fields throw AuthorizationError(400)
 * - STAFF can update `stockCount`, but attempting to change `priceToman` throws AuthorizationError(403)
 * - OWNER can update both `priceToman` and `stockCount`
 */
export async function updateVariantInventoryAndPrice(
  auth: {
    user: { id: string; email: string; role: 'OWNER' | 'STAFF' };
  } | null,
  body: unknown,
  ipAddress: string | null = null,
  db: PrismaClient = defaultPrisma
) {
  if (!auth) {
    await recordAuditLog(
      {
        action: 'AUTH_UNAUTHORIZED_ACCESS',
        targetType: 'ProductVariant',
        ipAddress,
        metadata: { operation: 'updateVariantInventoryAndPrice' },
      },
      db
    );
    throw new AuthorizationError('Authentication required.', 401);
  }

  const parsed = updateVariantPriceStockSchema.safeParse(body);
  if (!parsed.success) {
    throw new AuthorizationError(
      parsed.error.issues.map((i) => i.message).join('; '),
      400
    );
  }

  const { variantId, priceToman, stockCount } = parsed.data;
  const existingVariant = await db.productVariant.findUnique({
    where: { id: variantId },
  });

  if (!existingVariant) {
    throw new AuthorizationError('Product variant not found.', 404);
  }

  const nextPriceBigInt =
    priceToman !== undefined ? BigInt(priceToman) : existingVariant.priceToman;

  const isPriceModified = nextPriceBigInt !== existingVariant.priceToman;

  // Enforce STAFF permission boundary on the server: STAFF cannot change prices
  if (isPriceModified && auth.user.role !== 'OWNER') {
    await recordAuditLog(
      {
        actorId: auth.user.id,
        actorEmail: auth.user.email,
        actorRole: auth.user.role,
        action: 'AUTH_FORBIDDEN_PRICE_UPDATE',
        targetType: 'ProductVariant',
        targetId: variantId,
        ipAddress,
        metadata: {
          sku: existingVariant.sku,
          attemptedPriceToman: nextPriceBigInt.toString(),
        },
      },
      db
    );
    throw new AuthorizationError(
      'دسترسی غیرمجاز: نقش کارشناس انبار (STAFF) مجاز به تغییر قیمت محصولات نیست (فقط مالک OWNER).',
      403
    );
  }

  const updated = await db.$transaction(async (tx) => {
    const v = await tx.productVariant.update({
      where: { id: variantId },
      data: {
        priceToman: nextPriceBigInt,
        stockCount,
      },
    });

    if (existingVariant.isDefault && isPriceModified) {
      await tx.product.update({
        where: { id: existingVariant.productId },
        data: {
          basePriceToman: nextPriceBigInt,
        },
      });
    }

    return v;
  });

  await recordAuditLog(
    {
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: 'VARIANT_PRICE_STOCK_UPDATED',
      targetType: 'ProductVariant',
      targetId: variantId,
      ipAddress,
      metadata: {
        sku: existingVariant.sku,
        previousPriceToman: existingVariant.priceToman.toString(),
        newPriceToman: nextPriceBigInt.toString(),
        previousStockCount: existingVariant.stockCount,
        newStockCount: stockCount,
      },
    },
    db
  );

  return {
    id: updated.id,
    sku: updated.sku,
    priceToman: Number(updated.priceToman),
    stockCount: updated.stockCount,
  };
}

