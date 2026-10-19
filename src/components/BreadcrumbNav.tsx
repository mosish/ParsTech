import React from 'react';
import Link from 'next/link';
import {
  buildBreadcrumbJsonLd,
  safeSerializeJsonLd,
  type BreadcrumbItem,
} from '../lib/seo';

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  ariaLabel?: string;
}

export const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  items,
  ariaLabel = 'مسیر راهنما / Breadcrumb',
}) => {
  if (items.length === 0) return null;

  const jsonLd = buildBreadcrumbJsonLd(items);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeSerializeJsonLd(jsonLd) }}
      />
      <nav
        aria-label={ariaLabel}
        className="max-w-[1200px] mx-auto px-6 pt-4 text-xs text-[#6E6E73]"
      >
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {idx > 0 && <span aria-hidden="true">/</span>}
                {isLast ? (
                  <span aria-current="page" className="font-semibold text-[#1D1D1F]">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.path}
                    className="hover:text-[#0066CC] transition-colors underline-offset-4 hover:underline"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};
