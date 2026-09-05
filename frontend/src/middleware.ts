import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const configuredApi = process.env.NEXT_PUBLIC_API_URL;
  const apiOrigin = configuredApi?.startsWith('https://') ? new URL(configuredApi).origin : '';
  const imageSources = (process.env.IMAGE_SOURCE_ORIGINS ?? 'https:').split(',').map(source => source.trim()).filter(source => source === 'https:' || /^https:\/\/[a-zA-Z0-9.-]+(?::\d+)?$/.test(source)).join(' ');
  const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com${isDevelopment ? " 'unsafe-inline'" : ''}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    `img-src 'self' data: blob: ${imageSources}`,
    `connect-src 'self' ${apiOrigin}${isDevelopment ? ' http://localhost:4000 http://127.0.0.1:4000 http://localhost:4001 http://127.0.0.1:4001' : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  return response;
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};
