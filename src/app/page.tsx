import React from 'react';
import type { Metadata } from 'next';
import { StorefrontShell } from '../components/StorefrontShell';
import { getPublicCatalogProducts, importCatalogIdempotent } from '../server/catalog';
import {
  buildCanonicalUrl,
  buildOrganizationJsonLd,
  safeSerializeJsonLd,
} from '../lib/seo';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const canonical = buildCanonicalUrl('/');
  const title = 'ParsTech — East Mobile Center E-Commerce & Architecture Suite';
  const description =
    'Bilingual (Persian RTL / English LTR) Apple-inspired e-commerce storefront, admin panel, and technical specification blueprint for ParsTech (East Mobile Center, Tehran).';

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'ParsTech',
      locale: 'fa_IR',
      type: 'website',
    },
  };
}

export default async function StorefrontPage() {
  let products = await getPublicCatalogProducts();

  // In non-production development environments, ensure the catalog is populated if empty
  if (products.length === 0 && process.env.APP_ENV !== 'production') {
    await importCatalogIdempotent();
    products = await getPublicCatalogProducts();
  }

  const orgJsonLd = buildOrganizationJsonLd();
  const verifiedBusiness = {
    name: process.env.VERIFIED_BUSINESS_NAME?.trim() || undefined,
    phone: process.env.VERIFIED_BUSINESS_PHONE?.trim() || undefined,
    address: process.env.VERIFIED_BUSINESS_ADDRESS?.trim() || undefined,
  };

  return (
    <>
      {orgJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeSerializeJsonLd(orgJsonLd) }}
        />
      )}
      <StorefrontShell
        initialProducts={products}
        verifiedBusiness={verifiedBusiness}
      />
    </>
  );
}
