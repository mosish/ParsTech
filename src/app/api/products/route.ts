import { NextResponse } from 'next/server';
import { getPublicCatalogProducts } from '../../../server/catalog';
import { serializeBigIntSafe } from '../../../server/serialization';

export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await getPublicCatalogProducts();
  return NextResponse.json(
    serializeBigIntSafe({
      monetaryUnit: 'IRT_TOMAN_INT64',
      products,
    }),
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    }
  );
}
