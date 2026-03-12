import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProfileBySlug, type ServerProfileData } from '@/lib/firebase-rest';
import ProfilePageClient from './profile-page-client';

export type ProfileData = ServerProfileData;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProfileBySlug(slug);
  if (!data) return { title: 'Profile Not Found' };

  const { profile } = data;
  const name = profile.fullName;
  const title = `${name} — Professional Profile`;
  const latestRole = data.workExperience[0];
  const roleText = latestRole ? ` | ${latestRole.title} at ${latestRole.company}` : '';
  const description = profile.summary
    ? profile.summary.slice(0, 160)
    : `View ${name}'s professional profile${roleText}.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://your-domain.com';
  const canonicalUrl = `${siteUrl}/${slug}`;
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
      ...(avatarUrl ? { images: [{ url: avatarUrl, width: 400, height: 400, alt: name }] } : {}),
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ') || undefined,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      ...(avatarUrl ? { images: [avatarUrl] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

function buildPersonSchema(data: ServerProfileData) {
  const { profile, workExperience, education, skills } = data;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://your-domain.com';

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.fullName,
    url: `${siteUrl}/${profile.slug}`,
    ...(profile.email ? { email: profile.email } : {}),
    ...(profile.phone ? { telephone: profile.phone } : {}),
    ...(profile.location ? { address: { '@type': 'PostalAddress', addressLocality: profile.location } } : {}),
    ...(profile.website ? { sameAs: [profile.website.startsWith('http') ? profile.website : `https://${profile.website}`] } : {}),
    ...(profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos') ? { image: profile.avatarUrl } : {}),
    ...(profile.summary ? { description: profile.summary } : {}),
    ...(skills.length > 0 ? { knowsAbout: skills.map(s => s.name) } : {}),
    ...(workExperience.length > 0 ? {
      jobTitle: workExperience[0].title,
      worksFor: { '@type': 'Organization', name: workExperience[0].company },
      hasOccupation: workExperience.map(job => ({
        '@type': 'Occupation',
        name: job.title,
        ...(job.description ? { description: job.description.slice(0, 200) } : {}),
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
