import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We recommend using the service role key for admin privileges in an API route.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  // Basic deduplication: check for a view cookie to prevent repeated counting
  const viewCookieName = `viewed_${slug}`;
  const alreadyViewed = request.cookies.get(viewCookieName);

  if (alreadyViewed) {
    return NextResponse.json({ success: true, deduplicated: true }, { status: 200 });
  }

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, views')
      .eq('username', slug)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Since we don't have an RPC for incrementing yet, we just update the views directly.
    // In production, an RPC is recommended for true atomic increments.
    const newViews = (profile.views || 0) + 1;
    await supabase.from('profiles').update({ views: newViews }).eq('id', profile.id);

    // Set a cookie to prevent duplicate counting (expires in 24 hours)
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.cookies.set(viewCookieName, '1', {
      httpOnly: true,
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'lax',
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Error incrementing view count:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to increment view count.', details: errorMessage }, { status: 500 });
  }
}
