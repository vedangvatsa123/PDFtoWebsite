import { ImageResponse } from 'next/og';
import { getProfileBySlug } from '@/lib/supabase-server';

export const runtime = 'edge';

export const alt = 'Professional CV Profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const data = await getProfileBySlug(slug);

  const siteDomain = (process.env.NEXT_PUBLIC_SITE_URL || 'cvinbio.com').replace(/^https?:\/\//, '');

  if (!data) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#09090b', color: '#ffffff' }}>
          <div style={{ fontSize: 90, fontWeight: 800, letterSpacing: '-0.05em', marginBottom: 20 }}>CVinBio</div>
          <div style={{ fontSize: 44, color: '#a1a1aa' }}>Turn Your CV into a Website</div>
        </div>
      ), { ...size }
    );
  }

  const { profile, workExperience } = data;
  const name = profile.fullName;
  const role = workExperience.length > 0 ? `${workExperience[0].title} at ${workExperience[0].company}` : profile.summary?.slice(0, 70) || 'Professional CV Profile';
  const avatarUrl = profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos') && profile.avatarUrl.startsWith('http') ? profile.avatarUrl : null;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', backgroundColor: '#ffffff', padding: '70px 90px', justifyContent: 'space-between', fontFamily: 'sans-serif' }}>
        
        {/* Header Ribbon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             <div style={{ fontSize: 36, fontWeight: 800, color: '#000000', letterSpacing: '-0.05em' }}>📄 CVinBio</div>
          </div>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 500, color: '#71717a' }}>
            {siteDomain}/{slug}
          </div>
        </div>
        
        {/* Candidate Profile Payload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30, marginBottom: 20 }}>
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name} 
              style={{ width: 160, height: 160, borderRadius: 160, objectFit: 'cover', border: '1px solid #e4e4e7', background: '#fafafa' }} 
            />
          ) : (
            <div style={{ width: 160, height: 160, borderRadius: 160, background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, fontWeight: 600, color: '#a1a1aa', border: '1px solid #e4e4e7' }}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 84, fontWeight: 800, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {name}
            </div>
            <div style={{ fontSize: 44, fontWeight: 500, color: '#52525b', lineHeight: 1.3, maxWidth: '95%' }}>
              {role}
            </div>
          </div>
        </div>

      </div>
    ),
    { ...size }
  );
}
