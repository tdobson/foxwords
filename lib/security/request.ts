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

export function assertSameOrigin(request: RequestLike, expectedOrigin: string): void {
  const method = request.method.toUpperCase();
  // Safe idempotent methods do not require CSRF origin validation
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return;
  }

  const expected = new URL(expectedOrigin).origin;
  const originHeader = request.headers.get('origin');
  if (originHeader) {
    if (new URL(originHeader).origin !== expected) {
      throw new Error(`Cross-origin request rejected. Expected: ${expected}, Received: ${originHeader}`);
    }
    return;
  }

  const refererHeader = request.headers.get('referer');
  if (refererHeader) {
    if (new URL(refererHeader).origin !== expected) {
      throw new Error(`Cross-origin request rejected. Expected: ${expected}, Referer: ${refererHeader}`);
    }
    return;
  }

  // If both origin and referer are missing on state-changing requests, reject
  throw new Error('Missing Origin or Referer header on state-changing request');
}
