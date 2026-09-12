import {
  buildCanonicalRequest,
  buildStringToSign,
  calculateSigningKey,
  signAwsRequest,
} from '../aws-sigv4';

describe('AWS Signature V4 (Web Crypto)', () => {
  const date = new Date('2026-09-12T12:00:00Z');
  const credentials = {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  };

  it('builds a standard canonical request with sorted query params and sorted headers', async () => {
    const query = new URLSearchParams();
    query.set('Action', 'SendEmail');
    query.set('Version', '2010-12-01');

    const canonical = await buildCanonicalRequest({
      method: 'POST',
      path: '/',
      query,
      headers: {
        host: 'email.eu-west-2.amazonaws.com',
        'x-amz-date': '20260912T120000Z',
      },
      body: 'Action=SendEmail',
    });

    expect(canonical).toContain('POST');
    expect(canonical).toContain('Action=SendEmail&Version=2010-12-01');
    expect(canonical).toContain('host:email.eu-west-2.amazonaws.com');
    expect(canonical).toContain('x-amz-date:20260912T120000Z');
    expect(canonical).toContain('host;x-amz-date');
  });

  it('computes string to sign with expected format', async () => {
    const stringToSign = await buildStringToSign({
      date,
      region: 'eu-west-2',
      service: 'ses',
      canonicalRequest: 'CANONICAL_REQ',
    });

    expect(stringToSign).toContain('AWS4-HMAC-SHA256');
    expect(stringToSign).toContain('20260912T120000Z');
    expect(stringToSign).toContain('20260912/eu-west-2/ses/aws4_request');
  });

  it('signs AWS request and returns Authorization header', async () => {
    const query = new URLSearchParams();
    query.set('Action', 'SendEmail');

    const headers = await signAwsRequest({
      method: 'POST',
      service: 'ses',
      region: 'eu-west-2',
      host: 'email.eu-west-2.amazonaws.com',
      path: '/',
      query,
      body: 'Action=SendEmail',
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      now: date,
    });

    const authHeader = headers.get('Authorization');
    expect(authHeader).toBeDefined();
    expect(authHeader).toMatch(
      /^AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE\/20260912\/eu-west-2\/ses\/aws4_request, SignedHeaders=.*, Signature=[0-9a-f]{64}$/
    );
    expect(headers.get('x-amz-date')).toBe('20260912T120000Z');
  });

  it('changing body alters the signature', async () => {
    const query = new URLSearchParams();
    const headers1 = await signAwsRequest({
      method: 'POST',
      service: 'ses',
      region: 'eu-west-2',
      host: 'email.eu-west-2.amazonaws.com',
      path: '/',
      query,
      body: 'Body1',
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      now: date,
    });

    const headers2 = await signAwsRequest({
      method: 'POST',
      service: 'ses',
      region: 'eu-west-2',
      host: 'email.eu-west-2.amazonaws.com',
      path: '/',
      query,
      body: 'Body2',
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      now: date,
    });

    expect(headers1.get('Authorization')).not.toBe(headers2.get('Authorization'));
  });
});
