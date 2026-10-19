/**
 * Trusted Reverse Proxy Client IP Extraction
 * Trusts `X-Forwarded-For` / `X-Real-IP` headers ONLY when the request comes through
 * the configured reverse proxy (`TRUSTED_PROXY_IPS` and `X-Nginx-Proxy: true` or trusted local loopback).
 */

export function parseTrustedProxyIps(rawEnv = process.env.TRUSTED_PROXY_IPS): Set<string> {
  const defaults = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  if (!rawEnv || !rawEnv.trim()) {
    return new Set(defaults);
  }
  const items = rawEnv
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);
  return new Set([...defaults, ...items]);
}

export function sanitizeIp(candidate: string | null | undefined): string {
  if (!candidate) return '127.0.0.1';
  const trimmed = candidate.trim().slice(0, 64);
  if (!/^[0-9a-fA-F:.]+$/.test(trimmed)) {
    return '127.0.0.1';
  }
  return trimmed;
}

/**
 * Extracts the client IP address safely.
 * Forwarded headers (`x-real-ip`, `x-forwarded-for`) are ONLY trusted if `proxyIp`
 * (or the `x-trusted-proxy-ip` / local loopback peer) is in `TRUSTED_PROXY_IPS`.
 */
export function getTrustedClientIp(
  headers: Headers,
  peerIp = '127.0.0.1',
  trustedProxyEnv = process.env.TRUSTED_PROXY_IPS
): string {
  const trustedProxies = parseTrustedProxyIps(trustedProxyEnv);
  const normalizedPeer = sanitizeIp(peerIp);

  if (!trustedProxies.has(normalizedPeer)) {
    // Untrusted peer: ignore X-Forwarded-For / X-Real-IP completely to prevent IP spoofing
    return normalizedPeer;
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return sanitizeIp(realIp);
  }

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Walk right-to-left through X-Forwarded-For chain, picking first non-trusted-proxy hop
    const hops = forwardedFor
      .split(',')
      .map((h) => sanitizeIp(h))
      .filter(Boolean);
    for (let i = hops.length - 1; i >= 0; i--) {
      if (!trustedProxies.has(hops[i]) || i === 0) {
        return hops[i];
      }
    }
  }

  return normalizedPeer;
}

/**
 * Extracts client IP from Next.js request headers, trusting X-Forwarded-For / X-Real-IP
 * ONLY when the configured reverse proxy header (`x-nginx-proxy: true`) is present
 * and the proxy peer is trusted.
 */
export function extractClientIp(
  headers: Headers,
  peerIp = '127.0.0.1',
  trustedProxyEnv = process.env.TRUSTED_PROXY_IPS
): string {
  const isFromConfiguredProxy = headers.get('x-nginx-proxy') === 'true';
  if (!isFromConfiguredProxy) {
    return sanitizeIp(peerIp);
  }
  return getTrustedClientIp(headers, peerIp, trustedProxyEnv);
}

