import { NextRequest, NextResponse } from 'next/server';
import { getProfileBySlug } from '@/lib/supabase-server';

export async function GET(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  const data = await getProfileBySlug(slug);
  if (!data || !data.profile.avatarUrl) {
    return new NextResponse('Not found', { status: 404 });
  }

  const avatar = data.profile.avatarUrl;
  
  // If it's a standard HTTP link, simply redirect to it so the crawler fetches it directly
  if (avatar.startsWith('http')) {
    return NextResponse.redirect(avatar);
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
          'Cache-Control': 'public, max-age=86400, immutable'
        }
      });
    }
  }

  return new NextResponse('Invalid avatar format', { status: 400 });
}
