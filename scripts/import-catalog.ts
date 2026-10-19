#!/usr/bin/env tsx
/**
 * Repeatable Idempotent Catalog Import CLI
 * Usage:
 *   npm run catalog:import            # Imports hardware catalog into PostgreSQL
 *   npm run catalog:import -- --demo  # Explicitly tagged demo import (non-production only)
 *
 * Rules:
 * - Repeatable without creating duplicate categories, products, or SKU variants.
 * - Never seeds default administrator credentials.
 * - Rejects --demo flag if APP_ENV === 'production'.
 */

import 'dotenv/config';
import { prisma } from '../src/server/db';
import { importCatalogIdempotent } from '../src/server/catalog';

async function main() {
  const isDemoMode = process.argv.includes('--demo');

  if (isDemoMode && process.env.APP_ENV === 'production') {
    console.error(
      'Error: Demo data import (--demo) is strictly forbidden when APP_ENV=production.'
    );
    process.exit(1);
  }

  console.log(
    `Starting repeatable catalog import (mode: ${isDemoMode ? 'DEMO' : 'STANDARD'})...`
  );

  const summary = await importCatalogIdempotent(prisma);
  console.log(
    `Catalog import complete: ${summary.categoriesCount} categories, ${summary.productsCount} products, ${summary.variantsCount} SKU variants synchronized.`
  );
}

main()
  .catch((err) => {
    console.error('Catalog import failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
