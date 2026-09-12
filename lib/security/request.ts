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

  let expected: string;
  try {
    expected = new URL(expectedOrigin).origin;
  } catch {
    throw new OriginRejectedError(`Invalid expected origin configuration: ${expectedOrigin}`);
  }

  const originHeader = request.headers.get('origin');
  if (originHeader) {
    let originVal: string;
    try {
      originVal = new URL(originHeader).origin;
    } catch {
      throw new OriginRejectedError(`Malformed Origin header rejected: ${originHeader}`);
    }
    if (originVal !== expected) {
      throw new OriginRejectedError(`Cross-origin request rejected. Expected: ${expected}, Received: ${originHeader}`);
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
    if (refererVal !== expected) {
      throw new OriginRejectedError(`Cross-origin request rejected. Expected: ${expected}, Referer: ${refererHeader}`);
    }
    return;
  }

  // If both origin and referer are missing on state-changing requests, reject
  throw new OriginRejectedError('Missing Origin or Referer header on state-changing request');
}
