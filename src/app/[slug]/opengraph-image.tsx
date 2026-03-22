import { ImageResponse } from 'next/og';
import { getProfileBySlug } from '@/lib/supabase-server';
import { blogMetadata } from '@/lib/blog-metadata';

export const runtime = 'edge';

export const alt = 'CVin.Bio SEO Preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  const siteDomain = (process.env.NEXT_PUBLIC_SITE_URL || 'cvin.bio').replace(/^https?:\/\//, '');

  const post = blogMetadata.find((p: any) => p.slug === slug);
  if (post) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: '#ffffff', fontFamily: 'sans-serif' }}>
          
          {/* Left Text Side (60%) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', width: '55%', height: '100%', padding: '80px', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#09090b', letterSpacing: '-2px', lineHeight: 1.1, marginTop: 20 }}>
              {post.imageText || post.title}
            </div>
            
            <div style={{ display: 'flex', width: '100%' }}>
              <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, color: '#09090b', letterSpacing: '-2px', lineHeight: 1.1 }}>
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
  const avatarUrl = profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos') && profile.avatarUrl.startsWith('http') ? profile.avatarUrl : null;

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', backgroundColor: '#ffffff', padding: '70px 90px', justifyContent: 'space-between', fontFamily: 'sans-serif' }}>
        
        {/* Profile Output Generator mapping strictly to candidate user model */}
        
        {/* Candidate Profile Payload */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 24 }}>
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={name} 
              style={{ width: 180, height: 180, borderRadius: 180, objectFit: 'cover', border: '1px solid #e4e4e7', background: '#fafafa' }} 
            />
          ) : (
            <div style={{ width: 180, height: 180, borderRadius: 180, background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 70, fontWeight: 600, color: '#a1a1aa', border: '1px solid #e4e4e7' }}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 84, fontWeight: 800, color: '#09090b', letterSpacing: '-0.03em', lineHeight: 1, textAlign: 'center' }}>
              {name}
            </div>
            <div style={{ fontSize: 44, fontWeight: 500, color: '#52525b', lineHeight: 1.3, maxWidth: 1000, textAlign: 'center' }}>
              {role}
            </div>
          </div>
        </div>

        {/* Bottom Centered Link */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <div style={{ fontSize: 32, fontWeight: 500, color: '#71717a' }}>
            {siteDomain}/{slug}
          </div>
        </div>

      </div>
    ),
    { ...size }
  );
}
