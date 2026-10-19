import type { Category, Product as DbProduct, ProductVariant as DbVariant } from '@prisma/client';
import type { Product as ClientProduct, ProductColorOption, CategoryId } from '../utils/commerce';

/**
 * MONETARY UNIT DOCUMENTATION:
 * All monetary columns in PostgreSQL (`basePriceToman`, `originalPriceToman`, `priceToman`)
 * are stored as 64-bit signed integers (`BIGINT`) representing whole Iranian Tomans (IRT),
 * where 1 Iranian Toman (IRT) = 10 Iranian Rials (IRR).
 *
 * At API and Server-to-Client component boundaries, BigInt values are validated against
 * Number.MAX_SAFE_INTEGER (9,007,199,254,740,991 Toman) and serialized safely.
 */
export const MONETARY_UNIT = 'IRT_TOMAN' as const;
export const RIAL_PER_TOMAN = 10 as const;

export function bigIntTomanToSafeNumber(value: bigint | number | string): number {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`Invalid Toman amount: ${value}`);
    }
    return value;
  }
  const big = typeof value === 'bigint' ? value : BigInt(value);
  if (big < 0n) {
    throw new RangeError(`Monetary amount in Toman cannot be negative: ${big.toString()}`);
  }
  if (big > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`Monetary amount exceeds MAX_SAFE_INTEGER: ${big.toString()}`);
  }
  return Number(big);
}

/**
 * Safely serializes any payload containing BigInt fields for JSON API responses.
 * Converts BigInt values to safe integers if within IEEE-754 safe range, or decimal strings otherwise.
 */
export function safeJsonStringify(payload: unknown): string {
  return JSON.stringify(payload, (_key, val) => {
    if (typeof val === 'bigint') {
      if (val <= BigInt(Number.MAX_SAFE_INTEGER) && val >= BigInt(Number.MIN_SAFE_INTEGER)) {
        return Number(val);
      }
      return val.toString();
    }
    return val;
  });
}

export function serializeBigIntJson<T>(payload: T): T {
  return JSON.parse(safeJsonStringify(payload));
}

export const serializeBigIntSafe = serializeBigIntJson;

export interface SerializedProductVariant {
  id: string;
  sku: string;
  colorNameFa: string;
  colorNameEn: string;
  colorHex: string;
  storageLabel: string;
  priceToman: number;
  priceRial: number;
  stockCount: number;
  isDefault: boolean;
  angleUrls?: string[];
}

export interface SerializedCatalogProduct extends ClientProduct {
  slug: string;
  isDemo: boolean;
  updatedAtIso: string;
  variants: SerializedProductVariant[];
}

export type DbProductWithRelations = DbProduct & {
  category: Category;
  variants: DbVariant[];
};

const VALID_CATEGORIES = new Set<Exclude<CategoryId, 'all'>>([
  'mobiles',
  'laptops',
  'consoles',
  'accessories',
]);

export function mapDbProductToClientProduct(
  row: DbProductWithRelations
): SerializedCatalogProduct {
  const sortedVariants = [...row.variants].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return a.sku.localeCompare(b.sku);
  });

  const serializedVariants: SerializedProductVariant[] = sortedVariants.map((v) => {
    const priceToman = bigIntTomanToSafeNumber(v.priceToman);
    const rawAngles = Array.isArray(v.angleUrlsJson)
      ? (v.angleUrlsJson as unknown[]).filter((u): u is string => typeof u === 'string')
      : undefined;
    return {
      id: v.id,
      sku: v.sku,
      colorNameFa: v.colorNameFa,
      colorNameEn: v.colorNameEn,
      colorHex: v.colorHex,
      storageLabel: v.storageLabel,
      priceToman,
      priceRial: priceToman * RIAL_PER_TOMAN,
      stockCount: Math.max(0, v.stockCount),
      isDefault: v.isDefault,
      angleUrls: rawAngles && rawAngles.length > 0 ? rawAngles : undefined,
    };
  });

  const defaultVariant = serializedVariants[0];
  const effectivePriceToman = defaultVariant
    ? defaultVariant.priceToman
    : bigIntTomanToSafeNumber(row.basePriceToman);

  const totalStockCount = serializedVariants.reduce((sum, v) => sum + v.stockCount, 0);

  // Deduplicate colors by hex for color swatches while preserving variant lookup
  const colorMap = new Map<string, ProductColorOption>();
  for (const v of serializedVariants) {
    if (!colorMap.has(v.colorHex)) {
      colorMap.set(v.colorHex, {
        nameFa: v.colorNameFa,
        nameEn: v.colorNameEn,
        hex: v.colorHex,
        angleUrls: v.angleUrls,
      });
    }
  }

  const colors: ProductColorOption[] =
    colorMap.size > 0
      ? Array.from(colorMap.values())
      : [{ nameFa: 'مشکی استاندارد', nameEn: 'Standard Black', hex: '#27272A' }];

  const specs = Array.isArray(row.specsJson)
    ? ((row.specsJson as unknown) as ClientProduct['specs'])
    : [];

  const catSlug = row.category.slug as Exclude<CategoryId, 'all'>;
  const category: Exclude<CategoryId, 'all'> = VALID_CATEGORIES.has(catSlug)
    ? catSlug
    : 'mobiles';

  return {
    id: row.id,
    sku: row.sku,
    slug: row.slug,
    category,
    brand: row.brand as ClientProduct['brand'],
    nameFa: row.nameFa,
    nameEn: row.nameEn,
    subtitleFa: row.subtitleFa,
    subtitleEn: row.subtitleEn,
    priceToman: effectivePriceToman,
    originalPriceToman:
      row.originalPriceToman !== null
        ? bigIntTomanToSafeNumber(row.originalPriceToman)
        : undefined,
    stockCount: totalStockCount,
    warrantyFa: row.warrantyFa,
    warrantyEn: row.warrantyEn,
    colors,
    artworkKey: row.artworkKey as ClientProduct['artworkKey'],
    seriesTag: (row.seriesTag as ClientProduct['seriesTag']) ?? undefined,
    featured: row.featured,
    isHeavyItem: row.isHeavyItem,
    specs,
    isDemo: row.isDemo,
    updatedAtIso: row.updatedAt.toISOString(),
    variants: serializedVariants,
  };
}
