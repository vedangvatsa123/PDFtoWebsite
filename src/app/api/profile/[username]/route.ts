import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, email, phone, location, website, github, linkedin, summary, skills, experience, profile_picture_url, links')
    .eq('username', username)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Flatten link values into top-level fields
  if (data.links && Array.isArray(data.links)) {
    for (const link of data.links) {
      if (link.type === 'email' && link.value && !data.email) data.email = link.value;
      if (link.type === 'location' && link.value && !data.location) data.location = link.value;
      if (link.type === 'website' && link.value && !data.website) data.website = link.value;
    }
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
