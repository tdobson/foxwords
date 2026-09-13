/**
 * Request validation helpers: same-origin protection for mutations
 */

export interface RequestLike {
  url: string;
  method: string;
  headers: {
    get(name: string): string | null;
  };
}

export class OriginRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OriginRejectedError';
  }
}

export function assertSameOrigin(request: RequestLike, expectedOrigin: string): void {
  const method = request.method.toUpperCase();
  // Safe idempotent methods do not require CSRF origin validation
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return;
  }

  // Derive allowed origins: configured APP_ORIGIN plus request's own host/URL origin
  const allowedOrigins = new Set<string>();
  try {
    allowedOrigins.add(new URL(expectedOrigin).origin);
  } catch {
    // Ignore invalid expectedOrigin format
  }

  try {
    if (request.url) {
      allowedOrigins.add(new URL(request.url).origin);
    }
  } catch {
    // Ignore invalid request.url format
  }

  const hostHeader = request.headers.get('host') || request.headers.get('x-forwarded-host');
  if (hostHeader) {
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    try {
      allowedOrigins.add(new URL(`${proto}://${hostHeader}`).origin);
    } catch {
      // Ignore
    }
  }

  const originHeader = request.headers.get('origin');
  if (originHeader) {
    let originVal: string;
    try {
      originVal = new URL(originHeader).origin;
    } catch {
      throw new OriginRejectedError(`Malformed Origin header rejected: ${originHeader}`);
    }
    if (!allowedOrigins.has(originVal)) {
      throw new OriginRejectedError(
        `Cross-origin request rejected. Allowed: ${[...allowedOrigins].join(', ')}, Received: ${originHeader}`
      );
    }
    return;
  }

  const refererHeader = request.headers.get('referer');
  if (refererHeader) {
    let refererVal: string;
    try {
      refererVal = new URL(refererHeader).origin;
    } catch {
      throw new OriginRejectedError(`Malformed Referer header rejected: ${refererHeader}`);
    }
    if (!allowedOrigins.has(refererVal)) {
      throw new OriginRejectedError(
        `Cross-origin request rejected. Allowed: ${[...allowedOrigins].join(', ')}, Referer: ${refererHeader}`
      );
    }
    return;
  }

  // If both origin and referer are missing on state-changing requests, reject
  throw new OriginRejectedError('Missing Origin or Referer header on state-changing request');
}
