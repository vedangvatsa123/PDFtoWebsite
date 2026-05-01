import { NextRequest, NextResponse } from 'next/server';
import { getProfileBySlug } from '@/lib/supabase-server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const result = await getProfileBySlug(username);

  if (!result) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const { profile, workExperience } = result;

  // Flatten into the shape the extension expects
  const response = {
    full_name: profile.fullName,
    email: profile.email || '',
    phone: profile.phone || '',
    location: profile.location || '',
    website: profile.website || '',
    github: profile.github || '',
    linkedin: profile.linkedin || '',
    summary: profile.summary || '',
    skills: profile.skills || [],
    experience: workExperience || [],
    profile_picture_url: profile.avatarUrl || '',
    links: profile.links || [],
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
