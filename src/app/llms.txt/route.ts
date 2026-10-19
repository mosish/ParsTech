import { NextResponse } from 'next/server';
import { buildCanonicalUrl } from '../../lib/seo';

export function GET() {
  const homeUrl = buildCanonicalUrl('/');
  const blueprintUrl = buildCanonicalUrl('/blueprint');

  const content = [
    '# ParsTech Hardware & Mobile Catalog',
    '',
    '> Bilingual (Persian RTL / English LTR) hardware specification and multi-angle product catalog for smartphones, laptops, gaming consoles, and accessories.',
    '',
    '## Public Indexable Routes',
    `- [ParsTech Hardware Catalog](${homeUrl}): Browse smartphone, laptop, console, and accessory technical specifications, multi-angle studio views, and side-by-side comparison.`,
    `- [System Architecture & Technical Blueprint](${blueprintUrl}): Engineering deliverables, PostgreSQL data model, and security specification.`,
    '',
    '## Scope & Operational Notes',
    '- Online payment and customer OTP sign-in are disabled in Phase 1.',
    '- Administrative and customer account routes are private and excluded from public indexing.',
    '',
  ].join('\n');

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
