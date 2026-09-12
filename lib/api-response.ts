import { NextResponse } from 'next/server';

export interface ApiErrorDetail {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  headers?: Record<string, string>
): NextResponse<ApiErrorResponse> {
  const responseHeaders = new Headers(headers);
  if (!responseHeaders.has('Cache-Control')) {
    responseHeaders.set('Cache-Control', 'no-store');
  }

  return NextResponse.json(
    {
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: responseHeaders,
    }
  );
}

export function jsonSuccess<T>(
  status: number,
  data: T,
  headers?: Record<string, string>
): NextResponse<T> {
  const responseHeaders = new Headers(headers);
  if (!responseHeaders.has('Cache-Control')) {
    responseHeaders.set('Cache-Control', 'no-store');
  }

  return NextResponse.json(data, {
    status,
    headers: responseHeaders,
  });
}
