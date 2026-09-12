import { sha256Hex } from '../security/crypto';

export interface SignAwsRequestInput {
  method: string;
  service: 'ses';
  region: string;
  host: string;
  path: string;
  query: URLSearchParams;
  body: string;
  accessKeyId: string;
  secretAccessKey: string;
  now: Date;
}

function formatDate(d: Date): { amzDate: string; dateStamp: string } {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  const dateStamp = `${yyyy}${mm}${dd}`;
  const amzDate = `${dateStamp}T${hh}${min}${ss}Z`;
  return { amzDate, dateStamp };
}

async function hmacSha256(key: any, data: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
}

export async function calculateSigningKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const kSecret = enc.encode(`AWS4${secretAccessKey}`);
  const kDate = await hmacSha256(kSecret, dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

export async function buildCanonicalRequest(input: {
  method: string;
  path: string;
  query: URLSearchParams;
  headers: Record<string, string>;
  body: string;
}): Promise<string> {
  const canonicalMethod = input.method.toUpperCase();
  const canonicalUri = input.path || '/';

  // Canonical query string
  const sortedParams = Array.from(input.query.entries())
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .sort()
    .join('&');

  // Headers (sorted by lowercase name)
  const sortedHeaderKeys = Object.keys(input.headers)
    .map((k) => k.toLowerCase())
    .sort();

  const canonicalHeaders = sortedHeaderKeys
    .map(
      (k) => `${k}:${input.headers[k].trim()}
`
    )
    .join('');

  const signedHeaders = sortedHeaderKeys.join(';');
  const payloadHash = await sha256Hex(input.body);

  return `${canonicalMethod}
${canonicalUri}
${sortedParams}
${canonicalHeaders}
${signedHeaders}
${payloadHash}`;
}

export async function buildStringToSign(input: {
  date: Date;
  region: string;
  service: string;
  canonicalRequest: string;
}): Promise<string> {
  const { amzDate, dateStamp } = formatDate(input.date);
  const credentialScope = `${dateStamp}/${input.region}/${input.service}/aws4_request`;
  const canonicalRequestHash = await sha256Hex(input.canonicalRequest);

  return `AWS4-HMAC-SHA256
${amzDate}
${credentialScope}
${canonicalRequestHash}`;
}

export async function signAwsRequest(input: SignAwsRequestInput): Promise<Headers> {
  const { amzDate, dateStamp } = formatDate(input.now);
  const headers: Record<string, string> = {
    host: input.host,
    'x-amz-date': amzDate,
  };

  const canonicalReq = await buildCanonicalRequest({
    method: input.method,
    path: input.path,
    query: input.query,
    headers,
    body: input.body,
  });

  const stringToSign = await buildStringToSign({
    date: input.now,
    region: input.region,
    service: input.service,
    canonicalRequest: canonicalReq,
  });

  const signingKey = await calculateSigningKey(
    input.secretAccessKey,
    dateStamp,
    input.region,
    input.service
  );

  const signatureBuffer = await hmacSha256(signingKey, stringToSign);
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const signedHeaders = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort()
    .join(';');

  const authHeader = `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${dateStamp}/${input.region}/${input.service}/aws4_request, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const reqHeaders = new Headers();
  reqHeaders.set('host', input.host);
  reqHeaders.set('x-amz-date', amzDate);
  reqHeaders.set('Authorization', authHeader);
  reqHeaders.set('Content-Type', 'application/x-www-form-urlencoded; charset=utf-8');

  return reqHeaders;
}
