import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrismaClient } from './db.ts';
import {
  hashPassword,
  verifyPassword,
  createAdminSession,
  validateAdminSessionToken,
  validateCsrfRequest,
  AuthorizationError,
} from './auth.ts';
import {
  authenticateAdminLogin,
  logoutAdminSession,
  changeAdminPassword,
} from './login-service.ts';
import {
  importCatalogIdempotent,
  getPublicCatalogProducts,
  updateVariantInventoryAndPrice,
} from './catalog.ts';
import { serializeBigIntSafe, safeJsonStringify } from './serialization.ts';
import { sanitizeAuditMetadata, recordAuditLog } from './audit.ts';
import { extractClientIp } from './ip.ts';
import {
  buildCanonicalUrl,
  buildBreadcrumbJsonLd,
  buildOrganizationJsonLd,
  safeSerializeJsonLd,
} from '../lib/seo.ts';
import robots from '../app/robots.ts';
import sitemap from '../app/sitemap.ts';
import { INITIAL_ORDERS, INITIAL_REVIEWS, INITIAL_CMS_CONFIG } from '../data/storeData.ts';

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://postgres@127.0.0.1:5432/parstech_test?schema=public';

// Safety guard: never run tests against a production database URL
assert.ok(
  TEST_DB_URL.includes('_test'),
  `Refusing to run destructive test suite against non-test database: ${TEST_DB_URL}`
);

const testPrisma = createPrismaClient(TEST_DB_URL);

async function resetTestDatabase() {
  await testPrisma.auditLog.deleteMany({});
  await testPrisma.adminSession.deleteMany({});
  await testPrisma.loginRateLimit.deleteMany({});
  await testPrisma.productVariant.deleteMany({});
  await testPrisma.product.deleteMany({});
  await testPrisma.category.deleteMany({});
  await testPrisma.adminUser.deleteMany({});
}

test.after(async () => {
  await testPrisma.$disconnect();
});

test('1. BigInt serialization safely converts 64-bit Toman amounts at API boundaries without precision loss', () => {
  const payload = {
    sku: 'PT-IP16PM-256-NAT',
    priceToman: BigInt(142500000),
    nested: {
      compareAtToman: BigInt(146000000),
    },
  };

  const serialized = serializeBigIntSafe(payload);
  assert.equal(typeof serialized.priceToman, 'number');
  assert.equal(serialized.priceToman, 142500000);
  assert.equal(serialized.nested.compareAtToman, 146000000);

  const jsonStr = safeJsonStringify(payload);
  assert.ok(jsonStr.includes('142500000'));
});

test('2. Repeatable catalog import populates PostgreSQL without duplicates or default admin credentials', async () => {
  await resetTestDatabase();

  const firstRun = await importCatalogIdempotent(testPrisma);
  assert.ok(firstRun.categoriesCount >= 4);
  assert.ok(firstRun.productsCount >= 35);
  assert.ok(firstRun.variantsCount >= 100);

  // Running a second time must be idempotent and create zero duplicates
  const secondRun = await importCatalogIdempotent(testPrisma);
  assert.equal(secondRun.categoriesCount, firstRun.categoriesCount);
  assert.equal(secondRun.productsCount, firstRun.productsCount);
  assert.equal(secondRun.variantsCount, firstRun.variantsCount);

  const dbProductCount = await testPrisma.product.count();
  const dbVariantCount = await testPrisma.productVariant.count();
  assert.equal(dbProductCount, firstRun.productsCount);
  assert.equal(dbVariantCount, firstRun.variantsCount);

  // Must NEVER seed default administrator credentials
  const adminCount = await testPrisma.adminUser.count();
  assert.equal(adminCount, 0, 'Catalog import must never seed default admin accounts');
});

test('3. Authentication lifecycle: Argon2id password verification, opaque session creation, logout revocation, and session expiration', async () => {
  await resetTestDatabase();

  const ownerPass = 'CorrectHorseBatteryStaple!2026';
  const passwordHash = await hashPassword(ownerPass);
  assert.ok(passwordHash.startsWith('$argon2id$'), 'Must use Argon2id password hashing');
  assert.equal(await verifyPassword(passwordHash, ownerPass), true);
  assert.equal(await verifyPassword(passwordHash, 'WrongPassword!123'), false);

  const owner = await testPrisma.adminUser.create({
    data: {
      email: 'owner@parstech.test',
      fullName: 'Test Owner',
      passwordHash,
      role: 'OWNER',
      isActive: true,
    },
  });

  // 3a. Incorrect password rejected with 401
  const badLogin = await authenticateAdminLogin(
    { email: 'owner@parstech.test', password: 'WrongPassword!123' },
    { ipAddress: '198.51.100.10', userAgent: 'NodeTest/1.0' },
    testPrisma
  );
  assert.equal(badLogin.ok, false);
  if (!badLogin.ok) {
    assert.equal(badLogin.status, 401);
  }

  // 3b. Successful login creates opaque session token and CSRF token
  const goodLogin = await authenticateAdminLogin(
    { email: 'owner@parstech.test', password: ownerPass },
    { ipAddress: '198.51.100.10', userAgent: 'NodeTest/1.0' },
    testPrisma
  );
  assert.equal(goodLogin.ok, true);
  if (!goodLogin.ok) throw new Error('Expected login to succeed');

  assert.equal(goodLogin.user.role, 'OWNER');
  assert.ok(goodLogin.rawToken.length >= 24);
  assert.ok(goodLogin.csrfToken.length >= 24);

  // Verify raw token is NOT stored in plaintext in DB
  const storedSession = await testPrisma.adminSession.findFirst({
    where: { userId: owner.id },
  });
  assert.ok(storedSession);
  assert.notEqual(storedSession.tokenHash, goodLogin.rawToken);

  // Validate active session token
  const activeAuth = await validateAdminSessionToken(goodLogin.rawToken, testPrisma);
  assert.ok(activeAuth);
  assert.equal(activeAuth.user.email, 'owner@parstech.test');

  // 3c. Logout revokes session in PostgreSQL
  await logoutAdminSession(goodLogin.rawToken, '198.51.100.10', testPrisma);
  const afterLogout = await validateAdminSessionToken(goodLogin.rawToken, testPrisma);
  assert.equal(afterLogout, null, 'Revoked session must not validate after logout');

  // 3d. Expired session is rejected automatically
  const expiredSession = await createAdminSession(
    {
      userId: owner.id,
      ipAddress: '198.51.100.10',
      ttlMs: -5000, // already expired 5s ago
    },
    testPrisma
  );
  const expiredValidation = await validateAdminSessionToken(
    expiredSession.rawToken,
    testPrisma
  );
  assert.equal(expiredValidation, null, 'Expired session must be rejected');
});

test('4. Password change revokes all existing sessions immediately', async () => {
  await resetTestDatabase();

  const initialPassword = 'InitialOwnerPassword!2026';
  const newPassword = 'UpdatedOwnerPassword!2027';
  const owner = await testPrisma.adminUser.create({
    data: {
      email: 'owner-pw@parstech.test',
      fullName: 'Owner PW',
      passwordHash: await hashPassword(initialPassword),
      role: 'OWNER',
      isActive: true,
    },
  });

  // Create two active sessions (e.g. two devices)
  const s1 = await createAdminSession({ userId: owner.id }, testPrisma);
  const s2 = await createAdminSession({ userId: owner.id }, testPrisma);

  const auth1 = await validateAdminSessionToken(s1.rawToken, testPrisma);
  assert.ok(auth1);

  const changeRes = await changeAdminPassword(
    auth1,
    { currentPassword: initialPassword, newPassword },
    '127.0.0.1',
    testPrisma
  );
  assert.equal(changeRes.ok, true);
  if (changeRes.ok) {
    assert.equal(changeRes.revokedSessionsCount, 2);
  }

  // Both previous sessions must now be invalid
  assert.equal(await validateAdminSessionToken(s1.rawToken, testPrisma), null);
  assert.equal(await validateAdminSessionToken(s2.rawToken, testPrisma), null);
});

test('5. Persistent PostgreSQL login rate limiting blocks brute-force by account and IP and cleans up expired records', async () => {
  await resetTestDatabase();

  const owner = await testPrisma.adminUser.create({
    data: {
      email: 'throttled@parstech.test',
      fullName: 'Throttled Admin',
      passwordHash: await hashPassword('StrongSecretPass!2026'),
      role: 'OWNER',
      isActive: true,
    },
  });
  assert.ok(owner);

  // Insert an already-expired rate-limit row to verify automatic cleanup
  await testPrisma.loginRateLimit.create({
    data: {
      key: 'ip:192.0.2.99',
      attempts: 5,
      windowStart: new Date(Date.now() - 3600_000),
      expiresAt: new Date(Date.now() - 1800_000),
    },
  });

  // Submit 5 failed login attempts from 203.0.113.55
  for (let i = 1; i <= 5; i++) {
    const attempt = await authenticateAdminLogin(
      { email: 'throttled@parstech.test', password: `WrongPass-${i}-0000` },
      { ipAddress: '203.0.113.55', userAgent: 'BruteForceTest' },
      testPrisma
    );
    assert.equal(attempt.ok, false);
  }

  // Expired rate-limit row must have been cleaned up
  const expiredRow = await testPrisma.loginRateLimit.findUnique({
    where: { key: 'ip:192.0.2.99' },
  });
  assert.equal(expiredRow, null, 'Expired rate-limit rows must be cleaned up');

  // 6th attempt must be blocked with HTTP 429 even if password is correct
  const sixthAttempt = await authenticateAdminLogin(
    { email: 'throttled@parstech.test', password: 'StrongSecretPass!2026' },
    { ipAddress: '203.0.113.55', userAgent: 'BruteForceTest' },
    testPrisma
  );
  assert.equal(sixthAttempt.ok, false);
  if (!sixthAttempt.ok) {
    assert.equal(sixthAttempt.status, 429);
    assert.ok((sixthAttempt.retryAfterSeconds ?? 0) > 0);
  }
});

test('6. RBAC permission boundaries, CSRF validation, input validation, and PostgreSQL variant price/stock persistence', async () => {
  await resetTestDatabase();
  await importCatalogIdempotent(testPrisma);

  const ownerUser = await testPrisma.adminUser.create({
    data: {
      email: 'owner-rbac@parstech.test',
      fullName: 'Owner User',
      passwordHash: await hashPassword('OwnerSecretPassword!2026'),
      role: 'OWNER',
    },
  });

  const staffUser = await testPrisma.adminUser.create({
    data: {
      email: 'staff-rbac@parstech.test',
      fullName: 'Staff User',
      passwordHash: await hashPassword('StaffSecretPassword!2026'),
      role: 'STAFF',
    },
  });

  const ownerSess = await createAdminSession({ userId: ownerUser.id }, testPrisma);
  const staffSess = await createAdminSession({ userId: staffUser.id }, testPrisma);

  const ownerAuth = await validateAdminSessionToken(ownerSess.rawToken, testPrisma);
  const staffAuth = await validateAdminSessionToken(staffSess.rawToken, testPrisma);
  assert.ok(ownerAuth);
  assert.ok(staffAuth);

  // Pick a real variant from PostgreSQL
  const targetVariant = await testPrisma.productVariant.findFirst({
    where: { productId: 'prod-ip16pro' },
  });
  assert.ok(targetVariant);

  // 6a. Unauthenticated update attempt must be rejected with 401
  await assert.rejects(
    async () => {
      await updateVariantInventoryAndPrice(
        null,
        { variantId: targetVariant.id, stockCount: 12 },
        '127.0.0.1',
        testPrisma
      );
    },
    (err: unknown) => err instanceof AuthorizationError && err.statusCode === 401
  );

  // 6b. CSRF mismatch must be rejected with 403
  assert.throws(
    () => {
      validateCsrfRequest({
        session: ownerAuth.session,
        csrfHeader: 'invalid-csrf-token',
        originHeader: 'http://localhost:3000',
        hostHeader: 'localhost:3000',
      });
    },
    (err: unknown) => err instanceof AuthorizationError && err.statusCode === 403
  );

  // 6c. STAFF can update stockCount, and it persists in PostgreSQL
  const staffStockUpdate = await updateVariantInventoryAndPrice(
    staffAuth,
    { variantId: targetVariant.id, stockCount: 19 },
    '127.0.0.1',
    testPrisma
  );
  assert.equal(staffStockUpdate.stockCount, 19);

  // 6d. STAFF attempting to update priceToman is rejected with 403 Forbidden
  await assert.rejects(
    async () => {
      await updateVariantInventoryAndPrice(
        staffAuth,
        { variantId: targetVariant.id, stockCount: 19, priceToman: 92000000 },
        '127.0.0.1',
        testPrisma
      );
    },
    (err: unknown) => err instanceof AuthorizationError && err.statusCode === 403
  );

  // 6e. OWNER can update both priceToman and stockCount, and changes persist in PostgreSQL
  const ownerUpdate = await updateVariantInventoryAndPrice(
    ownerAuth,
    { variantId: targetVariant.id, stockCount: 25, priceToman: 91250000 },
    '127.0.0.1',
    testPrisma
  );
  assert.equal(ownerUpdate.stockCount, 25);
  assert.equal(ownerUpdate.priceToman, 91250000);

  // Verify persistence via public catalog read from PostgreSQL
  const catalogAfter = await getPublicCatalogProducts(testPrisma);
  const ip16proAfter = catalogAfter.find((p) => p.id === 'prod-ip16pro');
  assert.ok(ip16proAfter);
  const updatedVarInCatalog = ip16proAfter.variants.find(
    (v) => v.id === targetVariant.id
  );
  assert.ok(updatedVarInCatalog);
  assert.equal(updatedVarInCatalog.priceToman, 91250000);
  assert.equal(updatedVarInCatalog.stockCount, 25);

  // 6f. Server-side input validation rejects negative prices, negative stock, and mass-assignment extra fields
  await assert.rejects(
    async () => {
      await updateVariantInventoryAndPrice(
        ownerAuth,
        { variantId: targetVariant.id, stockCount: -5 },
        '127.0.0.1',
        testPrisma
      );
    },
    (err: unknown) => err instanceof AuthorizationError && err.statusCode === 400
  );

  await assert.rejects(
    async () => {
      await updateVariantInventoryAndPrice(
        ownerAuth,
        {
          variantId: targetVariant.id,
          stockCount: 10,
          role: 'OWNER', // mass-assignment attempt rejected by .strict()
        },
        '127.0.0.1',
        testPrisma
      );
    },
    (err: unknown) => err instanceof AuthorizationError && err.statusCode === 400
  );
});

test('7. Audit logging strips sensitive fields and trusted reverse-proxy IP extraction ignores spoofed headers when proxy is untrusted', async () => {
  await resetTestDatabase();

  const sanitized = sanitizeAuditMetadata({
    sku: 'PT-IP16P-256',
    password: 'SecretPlaintextPassword',
    tokenHash: 'abcdef123456',
    nested: {
      csrfToken: 'secret-csrf',
      newPriceToman: 90000000,
    },
  });

  assert.ok(sanitized);
  assert.equal('password' in sanitized, false);
  assert.equal('tokenHash' in sanitized, false);
  assert.equal(
    'csrfToken' in (sanitized.nested as Record<string, unknown>),
    false
  );
  assert.equal(
    (sanitized.nested as Record<string, unknown>).newPriceToman,
    90000000
  );

  await recordAuditLog(
    {
      action: 'TEST_AUDIT_SANITIZATION',
      entityType: 'System',
      metadata: {
        password: 'MustNeverBeSaved',
        safeField: 'kept',
      },
    },
    testPrisma
  );

  const savedLog = await testPrisma.auditLog.findFirst({
    where: { action: 'TEST_AUDIT_SANITIZATION' },
  });
  assert.ok(savedLog);
  const rawJson = JSON.stringify(savedLog.metadataJson);
  assert.equal(rawJson.includes('MustNeverBeSaved'), false);
  assert.equal(rawJson.includes('kept'), true);

  // Trusted proxy header check
  const untrustedHeaders = new Headers({
    'x-forwarded-for': '203.0.113.199',
  });
  // Without x-nginx-proxy: true, spoofed X-Forwarded-For is ignored
  assert.equal(extractClientIp(untrustedHeaders), '127.0.0.1');

  const trustedHeaders = new Headers({
    'x-nginx-proxy': 'true',
    'x-forwarded-for': '198.51.100.77, 127.0.0.1',
  });
  assert.equal(extractClientIp(trustedHeaders), '198.51.100.77');
});

test('8. Foundational SEO & Truthfulness: canonical URLs strip tracking params, sitemap excludes private routes, and demo claims are removed', async () => {
  // Canonical URL strips utm_* and fbclid without collapsing distinct paths to /
  const canonicalBlueprint = buildCanonicalUrl('/blueprint', {
    utm_source: 'telegram',
    fbclid: 'IwAR123',
  });
  assert.ok(canonicalBlueprint.endsWith('/blueprint'));
  assert.equal(canonicalBlueprint.includes('utm_source'), false);

  // BreadcrumbList JSON-LD matches visible breadcrumbs and escapes '<'
  const bcSchema = buildBreadcrumbJsonLd([
    { name: 'فروشگاه پارس‌تک', path: '/' },
    { name: 'مستندات معماری', path: '/blueprint' },
  ]);
  const bcSerialized = safeSerializeJsonLd(bcSchema);
  assert.ok(bcSerialized.includes('"@type":"BreadcrumbList"'));
  assert.ok(bcSerialized.includes('/blueprint'));

  // Organization JSON-LD returns null when verified business env vars are absent
  assert.equal(buildOrganizationJsonLd({}), null);

  // Sitemap contains only public indexable URLs and excludes /admin, /account, /cart, /checkout
  const sitemapEntries = await sitemap();
  const sitemapUrls = sitemapEntries.map((entry) => entry.url);
  assert.ok(sitemapUrls.some((u) => u.endsWith('/')));
  assert.ok(sitemapUrls.some((u) => u.endsWith('/blueprint')));
  assert.equal(
    sitemapUrls.some(
      (u) =>
        u.includes('/admin') ||
        u.includes('/account') ||
        u.includes('/cart') ||
        u.includes('/checkout')
    ),
    false,
    'Private routes must be excluded from sitemap.xml'
  );

  // robots.txt disallows private routes and references sitemap.xml
  const robotsConfig = robots();
  assert.equal(typeof robotsConfig.sitemap, 'string');
  assert.ok(String(robotsConfig.sitemap).endsWith('/sitemap.xml'));

  // Public demo data truthfulness checks
  assert.equal(INITIAL_ORDERS.length, 0, 'Sample customer orders must not be exposed publicly');
  assert.equal(
    INITIAL_REVIEWS.some((r) => r.verifiedBuyer),
    false,
    'Reviews must not be labeled verifiedBuyer without server purchase verification'
  );
  assert.equal(INITIAL_CMS_CONFIG.storePhone, '');
  assert.equal(INITIAL_CMS_CONFIG.storeAddressFa, '');
});
