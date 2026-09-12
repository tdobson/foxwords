import { assertSameOrigin, type RequestLike } from '../request';

function makeMockRequest(url: string, init: { method?: string; headers?: Record<string, string> } = {}): RequestLike {
  const method = init.method ?? 'GET';
  const headerMap = new Map(Object.entries(init.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    url,
    method,
    headers: {
      get: (name: string) => headerMap.get(name.toLowerCase()) ?? null,
    },
  };
}

describe('Security Request Validation', () => {
  it('allows matching origin', () => {
    const req = makeMockRequest('http://localhost:8787/api/auth/request', {
      method: 'POST',
      headers: {
        Origin: 'http://localhost:8787',
      },
    });
    expect(() => assertSameOrigin(req, 'http://localhost:8787')).not.toThrow();
  });

  it('allows request with matching Referer when Origin is absent', () => {
    const req = makeMockRequest('http://localhost:8787/api/auth/request', {
      method: 'POST',
      headers: {
        Referer: 'http://localhost:8787/parent/login',
      },
    });
    expect(() => assertSameOrigin(req, 'http://localhost:8787')).not.toThrow();
  });

  it('rejects cross-origin request', () => {
    const req = makeMockRequest('http://localhost:8787/api/auth/request', {
      method: 'POST',
      headers: {
        Origin: 'https://evil.com',
      },
    });
    expect(() => assertSameOrigin(req, 'http://localhost:8787')).toThrow(/Cross-origin/);
  });

  it('allows safe read methods without origin header', () => {
    const req = makeMockRequest('http://localhost:8787/api/audio', {
      method: 'GET',
    });
    expect(() => assertSameOrigin(req, 'http://localhost:8787')).not.toThrow();
  });

  it('rejects malformed origin or referer with OriginRejectedError without throwing unhandled TypeError', () => {
    const badOriginReq = makeMockRequest('http://localhost:8787/api/auth/request', {
      method: 'POST',
      headers: {
        Origin: '%',
      },
    });
    expect(() => assertSameOrigin(badOriginReq, 'http://localhost:8787')).toThrow(/Malformed Origin header/);

    const badRefererReq = makeMockRequest('http://localhost:8787/api/auth/request', {
      method: 'POST',
      headers: {
        Referer: '%',
      },
    });
    expect(() => assertSameOrigin(badRefererReq, 'http://localhost:8787')).toThrow(/Malformed Referer header/);
  });
});
