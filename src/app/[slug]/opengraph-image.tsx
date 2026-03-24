import { ImageResponse } from 'next/og';
import { getProfileBySlug } from '@/lib/supabase-server';
import { blogMetadata } from '@/lib/blog-metadata';

export const runtime = 'nodejs';
export const revalidate = 0; // Caching is handled conditionally per-response below

export const alt = 'CVin.Bio SEO Preview';
export const size = { width: 800, height: 420 };
export const contentType = 'image/jpeg';

export default async function Image(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  const siteDomain = (process.env.NEXT_PUBLIC_SITE_URL || 'cvin.bio').replace(/^https?:\/\//, '');

  const post = blogMetadata.find((p: any) => p.slug === slug);
  if (post) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', backgroundColor: '#ffffff', fontFamily: 'sans-serif' }}>
          
          {/* Left Text Side (60%) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', width: '55%', height: '100%', padding: '52px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', overflow: 'hidden', width: '100%', fontSize: 48, fontWeight: 800, color: '#09090b', letterSpacing: '-1.5px', lineHeight: 1.1, marginTop: 12 }}>
              {post.imageText || post.title}
            </div>
            
            <div style={{ display: 'flex', width: '100%' }}>
              <div style={{ display: 'flex', fontSize: 48, fontWeight: 800, color: '#09090b', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                CVin.Bio
              </div>
            </div>
          </div>

          {/* Right Visual Side (45%) */}
          <div style={{ display: 'flex', width: '45%', height: '100%', backgroundColor: '#f4f4f5' }}>
            <img src={post.featuredImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

        </div>
      ), { ...size }
    );
  }

  const data = await getProfileBySlug(slug);

  if (!data) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#09090b', color: '#ffffff' }}>
          <div style={{ fontSize: 90, fontWeight: 800, letterSpacing: '-0.05em', marginBottom: 20 }}>CVin.Bio</div>
          <div style={{ fontSize: 44, color: '#a1a1aa' }}>Turn Your CV into a Website</div>
        </div>
      ), { ...size }
    );
  }

  const { profile, workExperience } = data;
  const name = profile.fullName;
  const role = workExperience.length > 0 ? `${workExperience[0].title} at ${workExperience[0].company}` : profile.summary?.slice(0, 70) || 'Professional CV Profile';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cvin.bio';
  const avatarUrl = profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos')
    ? (profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${siteUrl}/api/avatar/${slug}`)
    : null;

  // Cache strategy:
  // - Has avatar → stable, cache 15 min to reduce DB hits
  // - No avatar  → cache 60s (short but not zero): limits cost while still picking up new uploads quickly
  const cacheHeader = avatarUrl
    ? 'public, max-age=900, stale-while-revalidate=3600'
    : 'public, max-age=60, stale-while-revalidate=120';

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', backgroundColor: '#ffffff', padding: '46px 60px', justifyContent: 'space-between', fontFamily: 'sans-serif' }}>
        
        {/* Candidate Profile Payload */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16 }}>
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name} 
              style={{ width: 120, height: 120, borderRadius: 120, objectFit: 'cover', border: '1px solid #e4e4e7', background: '#fafafa' }} 
            />
          ) : (
            <div style={{ width: 120, height: 120, borderRadius: 120, background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, fontWeight: 600, color: '#a1a1aa', border: '1px solid #e4e4e7' }}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 56, fontWeight: 800, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1, textAlign: 'center' }}>
              {name}
            </div>
            <div style={{ fontSize: 28, fontWeight: 500, color: '#52525b', lineHeight: 1.3, maxWidth: 680, textAlign: 'center' }}>
              {role}
            </div>
          </div>
        </div>

        {/* Bottom Centered Link */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <div style={{ display: 'flex', fontSize: 22, fontWeight: 500, color: '#71717a' }}>
            {`${siteDomain}/${slug}`}
          </div>
        </div>

      </div>
    ),
    { ...size, headers: { 'Cache-Control': cacheHeader } }
  );
}
