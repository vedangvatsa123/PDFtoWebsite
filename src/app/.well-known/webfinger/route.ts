import { NextResponse } from 'next/server';

/**
 * /.well-known/webfinger — RFC 7033
 * Used for decentralized identity discovery across the web.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get('resource');

  // Fallback broad webfinger response
  return NextResponse.json({
    subject: resource || 'acct:hello@cvin.bio',
    aliases: ['https://cvin.bio'],
    links: [
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: 'https://cvin.bio'
      }
    ]
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400',
      'Content-Type': 'application/jrd+json'
    }
  });
}
