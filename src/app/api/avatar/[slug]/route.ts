import { NextRequest, NextResponse } from 'next/server';
import { getProfileBySlug } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  const data = await getProfileBySlug(slug);
  if (!data || !data.profile.avatarUrl) {
    return new NextResponse('Not found', { status: 404 });
  }

  const avatar = data.profile.avatarUrl;
  
  // If it's a standard HTTP link, optimize and redirect
  if (avatar.startsWith('http')) {
    // Normalize Google avatar URLs to 400px for a compact, fast preview size
    let optimizedUrl = avatar;
    if (avatar.includes('googleusercontent.com')) {
      optimizedUrl = avatar.replace(/=s\d+-c/, '=s200-c').replace(/=s\d+$/, '=s200');
      if (!optimizedUrl.includes('=s200')) optimizedUrl = avatar + '=s200-c';
    }
    return NextResponse.redirect(optimizedUrl, {
      headers: { 'Cache-Control': 'public, max-age=900, stale-while-revalidate=3600' }
    });
  }

  // If it's a Base64 string, parse and serve the binary image natively!
  if (avatar.startsWith('data:image/')) {
    const matches = avatar.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const type = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': `image/${type}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }
  }

  return new NextResponse('Invalid avatar format', { status: 400 });
}
