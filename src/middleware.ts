import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware — Markdown Content Negotiation
 *
 * When an AI agent sends `Accept: text/markdown`, redirect key pages to their
 * markdown equivalents (llms.txt / llms-full.txt). This follows the Agentic Web
 * "Markdown negotiation" standard so bots get structured content automatically.
 */
export function middleware(request: NextRequest) {
  const accept = request.headers.get('accept') || '';
  const pathname = request.nextUrl.pathname;

  // Only intercept if the client explicitly wants markdown
  if (!accept.includes('text/markdown')) {
    return NextResponse.next();
  }

  // Skip if already requesting a raw file or API
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/.well-known/') ||
    pathname.endsWith('.txt') ||
    pathname.endsWith('.xml') ||
    pathname.endsWith('.json') ||
    pathname.startsWith('/ingest/')
  ) {
    return NextResponse.next();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

  // Homepage → llms.txt (summary)
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/llms.txt', siteUrl), 303);
  }

  // Any other page → llms-full.txt (or could be per-page in future)
  // For now, redirect to the full context file
  return NextResponse.redirect(new URL('/llms-full.txt', siteUrl), 303);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon, icons, images
     * - ingest (PostHog proxy)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|ingest).*)',
  ],
};
