import type { Metadata } from 'next';
import '../index.css';
import { getPrimaryOrigin, buildCanonicalUrl } from '../lib/seo';

export function generateMetadata(): Metadata {
  const origin = getPrimaryOrigin();
  const title = 'ParsTech — East Mobile Center E-Commerce & Architecture Suite';
  const description =
    'Bilingual (Persian RTL / English LTR) Apple-inspired e-commerce storefront, admin panel, and technical specification blueprint for ParsTech (East Mobile Center, Tehran).';

  return {
    metadataBase: new URL(origin),
    title: {
      default: title,
      template: '%s | ParsTech',
    },
    description,
    alternates: {
      canonical: buildCanonicalUrl('/'),
    },
    icons: {
      icon: '/favicon.svg',
      shortcut: '/favicon.svg',
    },
    openGraph: {
      title,
      description,
      url: buildCanonicalUrl('/'),
      siteName: 'ParsTech',
      locale: 'fa_IR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          rel="preload"
          href="/fonts/vazirmatn/Vazirmatn-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] antialiased">
        {children}
      </body>
    </html>
  );
}
