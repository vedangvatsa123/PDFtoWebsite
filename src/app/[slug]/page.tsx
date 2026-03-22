import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProfileBySlug, type ServerProfileData } from '@/lib/supabase-server';
import ProfilePageClient from './profile-page-client';
import Header from '@/components/header';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
      title: `${post.title} | CVin.Bio`,
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

  const avatarUrl = profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos')
    ? profile.avatarUrl
    : undefined;

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
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

function buildPersonSchema(data: ServerProfileData) {
  const { profile, workExperience, education } = data;
  const skills = profile.skills || [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.fullName,
    url: `${siteUrl}/${profile.slug}`,
    ...(profile.phone ? { telephone: profile.phone } : {}),
    ...(profile.location ? { address: { '@type': 'PostalAddress', addressLocality: profile.location } } : {}),
    ...(profile.website ? { sameAs: [profile.website.startsWith('http') ? profile.website : `https://${profile.website}`] } : {}),
    ...(profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos') ? { image: profile.avatarUrl } : {}),
    ...(profile.summary ? { description: profile.summary } : {}),
    ...(skills.length > 0 ? { knowsAbout: skills } : {}),
    ...(profile.links && Array.isArray(profile.links) && profile.links.length > 0 ? {
      sameAs: [
        ...(profile.website ? [profile.website.startsWith('http') ? profile.website : `https://${profile.website}`] : []),
        ...profile.links.map((link: any) => link.url || link)
      ]
    } : (profile.website ? { sameAs: [profile.website.startsWith('http') ? profile.website : `https://${profile.website}`] } : {})),
    ...(workExperience.length > 0 ? {
      jobTitle: workExperience[0].title,
      worksFor: { '@type': 'Organization', name: workExperience[0].company },
      hasOccupation: workExperience.map(job => ({
        '@type': 'Occupation',
        name: job.title,
        ...(job.description ? { description: job.description.slice(0, 500) } : {}),
        estimatedSalary: [],
      })),
    } : {}),
    ...(education.length > 0 ? {
      alumniOf: education.map(edu => ({
        '@type': 'EducationalOrganization',
        name: edu.institution,
      })),
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
              <img src={`/${slug}/opengraph-image?v=9`} alt={post.title} className="w-full h-full object-cover" />
            </div>

            <div className="prose prose-zinc dark:prose-invert prose-lg min-w-full transition-colors">
              {post.content}
            </div>
          </article>
        </main>
      </div>
    );
  }

  const data = await getProfileBySlug(slug);
  if (!data) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildPersonSchema(data)) }}
      />
      <ProfilePageClient data={data} slug={slug} />
    </>
  );
}
