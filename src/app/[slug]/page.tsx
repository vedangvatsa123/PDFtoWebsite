import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProfileBySlug, type ServerProfileData } from '@/lib/supabase-server';
import ProfilePageClient from './profile-page-client';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import BlogCTA from '@/components/blog-cta';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, CheckCircle2, Copy, FileText, Share2, Upload, PenLine } from 'lucide-react';
import { blogPosts } from '@/lib/blog-data';

export const dynamic = 'force-dynamic';
export type ProfileData = ServerProfileData;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find(p => p.slug === slug);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';
  const canonicalUrl = `${siteUrl}/${slug}`;

  if (post) {
    return {
      title: post.title,
      description: post.excerpt,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        type: 'article',
        url: canonicalUrl,
        title: post.title,
        description: post.excerpt,
        images: [{ url: `${siteUrl}/${slug}/opengraph-image` }],
      },
      twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt },
      robots: { index: true, follow: true },
    };
  }

  const data = await getProfileBySlug(slug);
  if (!data) return { title: 'Profile Not Found' };

  const { profile } = data;
  const name = profile.fullName;
  const title = `${name} | Professional Profile`;
  const latestRole = data.workExperience[0];
  const roleText = latestRole ? ` | ${latestRole.title} at ${latestRole.company}` : '';
  const description = profile.summary
    ? profile.summary.slice(0, 160)
    : `View ${name}'s professional profile${roleText}.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'profile',
      url: canonicalUrl,
      title,
      description,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ') || undefined,
      // og:image is auto-set by Next.js from opengraph-image.tsx (the branded Satori card)
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      // twitter:image auto-set from opengraph-image.tsx
    },
    robots: { index: true, follow: true },
  };
}

function buildPersonSchema(data: ServerProfileData) {
  const { profile, workExperience, education, customSections } = data;
  const skills = profile.skills || [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

  // Collect all sameAs links
  const sameAsLinks: string[] = [];
  if (profile.website) sameAsLinks.push(profile.website.startsWith('http') ? profile.website : `https://${profile.website}`);
  if (profile.linkedin) sameAsLinks.push(profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`);
  if (profile.github) sameAsLinks.push(profile.github.startsWith('http') ? profile.github : `https://${profile.github}`);
  if (profile.links && Array.isArray(profile.links)) {
    profile.links.forEach((link: any) => {
      const val = link.value || link.url || (typeof link === 'string' ? link : '');
      if (val && !sameAsLinks.includes(val)) sameAsLinks.push(val);
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.fullName,
    url: `${siteUrl}/${profile.slug}`,
    ...(profile.phone ? { telephone: profile.phone } : {}),
    ...(profile.location ? { address: { '@type': 'PostalAddress', addressLocality: profile.location } } : {}),
    ...(profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos') ? { image: profile.avatarUrl } : {}),
    ...(profile.summary ? { description: profile.summary } : {}),
    ...(skills.length > 0 ? { knowsAbout: skills } : {}),
    ...(sameAsLinks.length > 0 ? { sameAs: sameAsLinks } : {}),

    // Rich work experience with employer details and date ranges
    ...(workExperience.length > 0 ? {
      jobTitle: workExperience[0].title,
      worksFor: { '@type': 'Organization', name: workExperience[0].company },
      hasOccupation: workExperience.map(job => ({
        '@type': 'Occupation',
        name: job.title,
        ...(job.description ? { description: job.description.slice(0, 500) } : {}),
        ...(job.location ? { occupationLocation: { '@type': 'City', name: job.location } } : {}),
        employerOverview: { '@type': 'Organization', name: job.company },
        ...(job.startDate ? { startDate: job.startDate } : {}),
        ...(job.endDate ? { endDate: job.endDate } : {}),
      })),
    } : {}),

    // Education with degree credentials
    ...(education.length > 0 ? {
      alumniOf: education.map(edu => ({
        '@type': 'EducationalOrganization',
        name: edu.institution,
      })),
      hasCredential: education
        .filter(edu => edu.degree)
        .map(edu => ({
          '@type': 'EducationalOccupationalCredential',
          credentialCategory: 'degree',
          name: edu.degree,
          recognizedBy: { '@type': 'EducationalOrganization', name: edu.institution },
          ...(edu.endDate ? { dateCreated: edu.endDate } : {}),
        })),
    } : {}),

    // Custom sections as additional structured data
    ...(customSections && customSections.length > 0 ? {
      additionalProperty: customSections.flatMap(section =>
        section.items.map(item => ({
          '@type': 'PropertyValue',
          propertyID: section.sectionTitle,
          name: item.title,
          ...(item.subtitle ? { description: item.subtitle } : {}),
          ...(item.date ? { value: item.date } : {}),
        }))
      ),
    } : {}),
  };
}

export default async function ProfileSlugPage({ params }: PageProps) {
  const { slug } = await params;
  
  const post = blogPosts.find(p => p.slug === slug);
  if (post) {
    return (
      <div className="h-screen overflow-y-auto bg-white dark:bg-black selection:bg-primary/10 transition-colors duration-200">
        <Header />
        <main className="w-full max-w-3xl mx-auto px-6 py-12 md:py-20 lg:py-24 pb-32">
          <Link href="/blog" className="inline-flex items-center text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Articles
          </Link>
          <article className="pb-24">
            <div className="mb-12">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight mb-6 transition-colors">{post.title}</h1>
              <div className="flex items-center text-zinc-500 dark:text-zinc-400 font-medium text-sm transition-colors">
                <span>{post.date}</span>
                <span className="mx-3">•</span>
                <div className="flex items-center gap-2">
                  <img src={post.author.avatarUrl} alt={post.author.name} className="w-5 h-5 rounded-full object-cover border border-zinc-200 dark:border-zinc-800 transition-colors" />
                  <span>{post.author.name}</span>
                </div>
              </div>
            </div>
            
            {/* Direct OpenGraph Mock Preview Mapping for Featured Image strictly obeying UI constraint */}
            <div className="w-full aspect-[1200/630] rounded-2xl border border-zinc-200 dark:border-zinc-800/50 overflow-hidden mb-12 shadow-sm dark:shadow-none bg-zinc-50 dark:bg-zinc-900/50 relative transition-colors">
              <img src={`/${slug}/opengraph-image?v=10`} alt={post.title} className="w-full h-full object-cover" />
            </div>

            <div className="prose prose-zinc dark:prose-invert prose-lg min-w-full transition-colors mb-16">
              {post.content}
            </div>

            {/* Global Article CTA */}
            <BlogCTA />

            {/* Local Contextual FAQs */}
            {post.faqs && post.faqs.length > 0 && (
              <div className="mt-16 pt-12 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8 tracking-tight">Frequently Asked Questions</h3>
                <div className="space-y-8">
                  {post.faqs.map((faq, i) => (
                    <div key={i}>
                      <h4 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 mb-2">{faq.question}</h4>
                      <p className="text-zinc-600 dark:text-zinc-400">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Global Further Reading */}
            <div className="mt-16 pt-12 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8 tracking-tight">Further Reading</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blogPosts
                  .filter(p => p.slug !== slug)
                  // Deterministic SEO link cycling: Start pulling articles positioned statically after the current index to guarantee stable Googlebot crawl paths.
                  .slice(
                     blogPosts.findIndex(p => p.slug === slug) % Math.max(1, blogPosts.length - 4), 
                     (blogPosts.findIndex(p => p.slug === slug) % Math.max(1, blogPosts.length - 4)) + 4
                  )
                  .map(related => (
                  <Link key={related.slug} href={`/${related.slug}`} className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50 transition-colors group flex flex-col h-full">
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors text-sm mb-2 leading-snug">{related.title}</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{related.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          </article>
        </main>
        <MicroFooter />
      </div>
    );
  }

  const data = await getProfileBySlug(slug);
  if (!data) notFound();

  const avatarUrl = data.profile.avatarUrl;
  const isValidAvatarForPreload = avatarUrl
    && !avatarUrl.startsWith('data:')
    && !avatarUrl.includes('picsum.photos');

  const supabaseStorageHost = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
    : null;

  return (
    <>
      {/* Preconnect to Supabase storage to shave DNS/TCP time off image fetch */}
      {supabaseStorageHost && (
        <link rel="preconnect" href={`https://${supabaseStorageHost}`} crossOrigin="anonymous" />
      )}
      {/* Preload the avatar so the browser fetches it before React hydrates (LCP) */}
      {isValidAvatarForPreload && (
        <link rel="preload" as="image" href={avatarUrl} fetchPriority="high" />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildPersonSchema(data)).replace(/</g, '\\u003c') }}
      />
      <ProfilePageClient data={data} slug={slug} />
    </>
  );
}
