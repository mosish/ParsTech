import type { MetadataRoute } from 'next';
import { buildCanonicalUrl } from '../lib/seo';
import { getLatestCatalogTimestamp } from '../server/catalog';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const latestCatalogUpdate = await getLatestCatalogTimestamp();
  const lastModified = latestCatalogUpdate ?? undefined;

  // Contains ONLY canonical, public, indexable URLs.
  // Excludes /admin, /admin/login, /account, /cart, /checkout, and API routes.
  return [
    {
      url: buildCanonicalUrl('/'),
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: buildCanonicalUrl('/blueprint'),
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];
}
