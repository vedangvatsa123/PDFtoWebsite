import { ImageResponse } from 'next/og';
import { getProfileBySlug } from '@/lib/supabase-server';
import { blogMetadata } from '@/lib/blog-metadata';

export const runtime = 'nodejs';
export const revalidate = 0; // Caching is handled conditionally per-response below

export const alt = 'CVin.Bio SEO Preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/jpeg';

export default async function Image(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  const siteDomain = (process.env.NEXT_PUBLIC_SITE_URL || 'cvin.bio').replace(/^https?:\/\//, '');

  const post = blogMetadata.find((p: any) => p.slug === slug);
  if (post) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: '100%', backgroundColor: '#ffffff', fontFamily: 'sans-serif' }}>
          
          {/* Left Text Side */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', width: '55%', height: '100%', padding: '80px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', overflow: 'hidden', width: '100%', fontSize: 68, fontWeight: 800, color: '#09090b', letterSpacing: '-2px', lineHeight: 1.1, marginTop: 20 }}>
              {post.imageText || post.title}
            </div>
            
            <div style={{ display: 'flex', width: '100%' }}>
              <div style={{ display: 'flex', fontSize: 68, fontWeight: 800, color: '#09090b', letterSpacing: '-2px', lineHeight: 1.1 }}>
                CVin.Bio
              </div>
            </div>
          </div>

          {/* Right Visual Side */}
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
  const jobTitle = workExperience.length > 0 ? workExperience[0].title : null;
  const company = workExperience.length > 0 ? workExperience[0].company : null;
  const fallbackRole = profile.summary?.slice(0, 70) || 'Professional Profile';
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#ffffff', padding: '0 90px', gap: 18, fontFamily: 'sans-serif' }}>
        
        {/* Avatar */}
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
        
        {/* Name — largest, boldest */}
        <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1, whiteSpace: 'nowrap', textAlign: 'center' }}>
          {name}
        </div>

        {/* Job Title — bold, dark, clearly readable */}
        <div style={{ display: 'flex', fontSize: 34, fontWeight: 600, color: '#18181b', lineHeight: 1, whiteSpace: 'nowrap', textAlign: 'center' }}>
          {jobTitle ? (jobTitle.length > 52 ? jobTitle.slice(0, 52) + '…' : jobTitle) : fallbackRole}
        </div>

        {/* Company — secondary, readable, bigger than URL */}
        {company && (
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 400, color: '#52525b', lineHeight: 1, whiteSpace: 'nowrap', textAlign: 'center' }}>
            {company.length > 52 ? company.slice(0, 52) + '…' : company}
          </div>
        )}

        {/* URL — footer branding, indigo */}
        <div style={{ display: 'flex', fontSize: 24, fontWeight: 500, color: '#6366f1', marginTop: 10, textAlign: 'center' }}>
          {`${siteDomain}/${slug}`}
        </div>

      </div>
    ),
    { ...size, headers: { 'Cache-Control': cacheHeader } }
  );
}
