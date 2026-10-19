/**
 * Foundational SEO Utilities (Phase 1)
 * - Trusted PRIMARY_ORIGIN resolution
 * - Self-referencing canonical URL builder that strips tracking parameters
 *   and preserves distinct routes without collapsing them to '/'
 * - Safe JSON-LD serialization (prevents </script> injection)
 * - BreadcrumbList & conditional verified Organization structured data
 */

const TRACKING_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'fbclid',
  'gclid',
  'dclid',
  'msclkid',
  'twclid',
  'yclid',
  'mc_cid',
  'mc_eid',
  'ref',
  'referrer',
  '_ga',
  '_gl',
  'igshid',
]);

export const PRIVATE_NOINDEX_ROUTES = [
  '/admin',
  '/admin/login',
  '/account',
  '/cart',
  '/checkout',
] as const;

export function getPrimaryOrigin(envOrigin = process.env.PRIMARY_ORIGIN): string {
  const raw = (envOrigin || 'http://localhost:3000').trim();
  try {
    const parsed = new URL(raw);
    return parsed.origin;
  } catch {
    return 'http://localhost:3000';
  }
}

export function isStagingEnvironment(appEnv = process.env.APP_ENV): boolean {
  const normalized = (appEnv || '').trim().toLowerCase();
  return normalized === 'staging' || normalized === 'preview';
}

/**
 * Generates a self-referencing canonical URL from PRIMARY_ORIGIN.
 * - Preserves distinct paths (never collapses product or category paths to '/')
 * - Strips tracking query parameters (`utm_*`, `fbclid`, `gclid`, `ref`, etc.)
 * - Keeps only explicitly whitelisted semantic query parameters if provided
 */
export function buildCanonicalUrl(
  pathname: string,
  searchParams?: URLSearchParams | Record<string, string | string[] | undefined>,
  allowedQueryKeys: string[] = [],
  originOverride?: string
): string {
  const origin = getPrimaryOrigin(originOverride);
  const cleanPath =
    !pathname || pathname === '/'
      ? '/'
      : `/${pathname.replace(/^\/+/, '').replace(/\/+$/, '')}`;

  const url = new URL(cleanPath, origin);

  if (searchParams) {
    const allowedSet = new Set(allowedQueryKeys);
    const entries: [string, string][] = [];

    if (searchParams instanceof URLSearchParams) {
      for (const [k, v] of searchParams.entries()) {
        entries.push([k, v]);
      }
    } else {
      for (const [k, v] of Object.entries(searchParams)) {
        if (typeof v === 'string') {
          entries.push([k, v]);
        } else if (Array.isArray(v) && v.length > 0) {
          entries.push([k, v[0]]);
        }
      }
    }

    // Sort keys deterministically
    entries.sort(([a], [b]) => a.localeCompare(b));

    for (const [key, value] of entries) {
      const lowerKey = key.toLowerCase();
      if (TRACKING_QUERY_PARAMS.has(lowerKey) || lowerKey.startsWith('utm_')) {
        continue;
      }
      if (allowedSet.has(key) && value.trim() !== '') {
        url.searchParams.set(key, value.trim());
      }
    }
  }

  return url.toString();
}

/**
 * Safely serializes an object into a JSON-LD string for `<script type="application/ld+json">`.
 * Escapes `<`, `>`, `&`, U+2028, and U+2029 to prevent script tag breakout / XSS.
 */
export function safeSerializeJsonLd(schemaObject: Record<string, unknown>): string {
  return JSON.stringify(schemaObject)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/**
 * Builds Schema.org BreadcrumbList structured data matching the visible breadcrumbs on the page.
 */
export function buildBreadcrumbJsonLd(
  items: BreadcrumbItem[],
  originOverride?: string
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path, undefined, [], originOverride),
    })),
  };
}

export interface VerifiedBusinessEnv {
  name?: string;
  phone?: string;
  address?: string;
}

/**
 * Generates Organization structured data ONLY when verified business details are configured.
 * Never invents address, opening hours, ratings, coordinates, social links, or licensing claims.
 */
export function buildVerifiedOrganizationJsonLd(
  verifiedEnv: VerifiedBusinessEnv = {
    name: process.env.VERIFIED_BUSINESS_NAME,
    phone: process.env.VERIFIED_BUSINESS_PHONE,
    address: process.env.VERIFIED_BUSINESS_ADDRESS,
  },
  originOverride?: string
): Record<string, unknown> | null {
  const name = verifiedEnv.name?.trim();
  if (!name) {
    return null;
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: getPrimaryOrigin(originOverride),
  };

  if (verifiedEnv.phone?.trim()) {
    schema.telephone = verifiedEnv.phone.trim();
  }

  if (verifiedEnv.address?.trim()) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: verifiedEnv.address.trim(),
    };
  }

  return schema;
}

export const buildOrganizationJsonLd = buildVerifiedOrganizationJsonLd;

