import type { MetadataRoute } from 'next';
import { getPrimaryOrigin, isStagingEnvironment } from '../lib/seo';

export default function robots(): MetadataRoute.Robots {
  const origin = getPrimaryOrigin();
  const isStaging = isStagingEnvironment();

  if (isStaging) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/blueprint'],
      disallow: [
        '/admin',
        '/admin/',
        '/admin/login',
        '/account',
        '/cart',
        '/checkout',
        '/api/',
      ],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
