import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProfileBySlug, type ServerProfileData } from '@/lib/supabase-server';
import ProfilePageClient from './profile-page-client';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import BlogCTA from '@/components/blog-cta';
import Link from 'next/link';
import { ArrowLeft, Briefcase, MapPin, Monitor, Clock, ExternalLink, Github, Linkedin, Twitter, Globe } from 'lucide-react';
import { blogPosts } from '@/lib/blog-data';
import { createClient } from '@supabase/supabase-js';

const supabaseForCompany = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 300; // ISR: rebuild every 5 minutes
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
    const ogImageUrl = `${siteUrl}/${slug}/opengraph-image`;
    return {
      title: post.title,
      description: post.excerpt,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        type: 'article',
        url: canonicalUrl,
        title: post.title,
        description: post.excerpt,
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: post.title }],
      },
      twitter: { card: 'summary_large_image', title: post.title, description: post.excerpt, images: [ogImageUrl] },
      robots: { index: true, follow: true },
    };
  }

  const data = await getProfileBySlug(slug);
  if (!data) {
    const decodedSearch = slug.replace(/-/g, ' ').toLowerCase();
    const { data: jobs } = await supabaseForCompany.from('jobs').select('company').ilike('company', `${decodedSearch}%`).limit(1);
    if (jobs && jobs.length > 0) {
      const { getCompanyMeta } = await import('@/lib/company-data');
      const meta = getCompanyMeta(slug);
      const companyDisplay = jobs[0].company || slug.replace(/-/g, ' ');

      // Count total jobs for richer description
      const { count } = await supabaseForCompany.from('jobs').select('id', { count: 'exact', head: true }).ilike('company', `${decodedSearch}%`);
      const jobCount = count || 0;

      const title = `${companyDisplay} Careers — ${jobCount} Open Roles (${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}) | CVin.Bio`;
      const desc = meta
        ? `${meta.description.slice(0, 100)} ${companyDisplay} has ${jobCount} open positions. Browse roles and apply.`
        : `${companyDisplay} is hiring — ${jobCount} open positions. Browse active job openings with live hiring data, remote availability, and technical requirements.`;
      return {
        title,
        description: desc.slice(0, 160),
        alternates: { canonical: canonicalUrl },
        openGraph: {
          type: 'website',
          url: canonicalUrl,
          title,
          description: desc.slice(0, 160),
          siteName: 'CVin.Bio',
        },
        twitter: { card: 'summary_large_image', title, description: desc.slice(0, 160) },
        robots: { index: true, follow: true },
      };
    }
    return { title: 'Profile Not Found' };
  }

  const { profile } = data;
  const name = profile.fullName;
  const title = `${name} | Professional Profile`;
  const latestRole = data.workExperience[0];
  const roleText = latestRole ? ` | ${latestRole.title} at ${latestRole.company}` : '';
  const description = profile.summary
    ? profile.summary.slice(0, 160)
    : `View ${name}'s professional profile${roleText}.`;

  // Detect empty/default profiles — don't let search engines index them
  const isEmptyProfile = (!name || name === 'Professional Profile' || name === 'Your Name')
    || (!profile.summary && data.workExperience.length === 0 && data.education.length === 0 && (!profile.skills || profile.skills.length === 0));

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
      images: [{ url: `${siteUrl}/${slug}/opengraph-image`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/${slug}/opengraph-image`],
    },
    robots: isEmptyProfile ? { index: false, follow: false } : { index: true, follow: true },
  };
}

function buildPersonSchema(data: ServerProfileData) {
  const { profile, workExperience, education, customSections } = data;
  const skills = profile.skills || [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

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

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
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
            
            <div className="w-full aspect-[1200/630] rounded-2xl border border-zinc-200 dark:border-zinc-800/50 overflow-hidden mb-12 shadow-sm dark:shadow-none bg-zinc-50 dark:bg-zinc-900/50 relative transition-colors">
              <img src={`/${slug}/opengraph-image?v=10`} alt={post.title} className="w-full h-full object-cover" />
            </div>

            <div className="prose prose-zinc dark:prose-invert prose-lg min-w-full transition-colors mb-16">
              {post.content}
            </div>

            <BlogCTA />

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

            <div className="mt-16 pt-12 border-t border-zinc-200 dark:border-zinc-800 transition-colors">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-8 tracking-tight">Further Reading</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {blogPosts
                  .filter(p => p.slug !== slug)
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
  if (!data) {
    const decodedSearch = slug.replace(/-/g, ' ').toLowerCase();
    const { data: jobs } = await supabaseForCompany
      .from('jobs')
      .select('*')
      .ilike('company', `${decodedSearch}%`)
      .limit(100);

    if (!jobs || jobs.length === 0) {
      notFound();
    }

    const companyName = jobs[0].company;
    
    let logo = jobs.find(j => j.company_logo)?.company_logo;
    if (!logo) {
      const domainFallback = companyName.toLowerCase().replace(/\s+/g, '') + '.com';
      logo = `https://www.google.com/s2/favicons?domain=${domainFallback}&sz=128`;
    }
    
    const totalJobs = jobs.length;
    const remoteJobs = jobs.filter(j => j.location?.toLowerCase().includes('remote')).length;
    const remotePercent = totalJobs > 0 ? Math.round((remoteJobs / totalJobs) * 100) : 0;
    
    const skillCount: Record<string, number> = {};
    jobs.forEach((j: any) => {
      if (Array.isArray(j.tags)) {
        j.tags.forEach((t: string) => {
          skillCount[t] = (skillCount[t] || 0) + 1;
        });
      }
    });
    
    const topSkills = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(e => e[0]);

    const { getCompanyMeta } = await import('@/lib/company-data');
    const meta = getCompanyMeta(slug);

    const orgSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": companyName,
      "logo": logo,
      ...(meta ? {
        "url": meta.website,
        "foundingDate": String(meta.founded),
        "description": meta.description,
      } : {}),
    };

    // Build FAQ data from job metadata
    const locCount: Record<string, number> = {};
    const catCount: Record<string, number> = {};
    jobs.forEach((j: any) => {
      const loc = (j.location || 'Unspecified').split(',')[0].trim();
      locCount[loc] = (locCount[loc] || 0) + 1;
      const cat = j.category || 'General';
      catCount[cat] = (catCount[cat] || 0) + 1;
    });
    const topLocs = Object.entries(locCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const now = Date.now();
    const last30d = jobs.filter((j: any) => { const d = j.published_at || j.created_at; return d && (now - new Date(d).getTime()) < 30 * 86400000; }).length;

    const faqs = [
      {
        q: `How many open positions does ${companyName} have right now?`,
        a: `${companyName} currently has ${totalJobs} open positions listed on CVin.Bio. ${last30d} of these were posted in the last 30 days. ${remotePercent}% of all roles are listed as remote-friendly.`,
      },
      {
        q: `Where are ${companyName} jobs located?`,
        a: `The top hiring locations for ${companyName} are ${topLocs.map(([l, c]) => `${l} (${c} roles)`).join(', ')}.`,
      },
      {
        q: `What departments is ${companyName} hiring for?`,
        a: `${companyName} is actively hiring across ${Object.keys(catCount).length} departments. The most active are ${topCats.map(([c, n]) => `${c} (${n} roles)`).join(', ')}.`,
      },
      ...(topSkills.length > 0 ? [{
        q: `What skills does ${companyName} look for in candidates?`,
        a: `Based on current job listings, the most frequently requested skills at ${companyName} are ${topSkills.join(', ')}. These appear across multiple open roles and departments.`,
      }] : []),
      ...(meta ? [{
        q: `What is ${companyName}?`,
        a: meta.description,
      }] : []),
    ];

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a },
      })),
    };

    // JobPosting structured data for top 10 jobs (Google Jobs rich results)
    const jobPostingSchema = jobs.slice(0, 10).map((job: any) => ({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": job.title,
      "description": job.title,
      "datePosted": job.published_at || job.created_at,
      "hiringOrganization": {
        "@type": "Organization",
        "name": companyName,
        "logo": logo,
        ...(meta ? { "sameAs": meta.website } : {}),
      },
      ...(job.location ? { "jobLocation": { "@type": "Place", "address": job.location } } : {}),
      ...(job.job_type ? { "employmentType": job.job_type.toUpperCase().replace(/[- ]/g, '_') } : {}),
      "url": job.apply_url,
    }));

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }} />
        <Header />
        
        <main className="flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8 py-10">
          
          {/* Company Header */}
          <div className="flex items-start gap-4 sm:gap-6 mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={companyName} className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white shadow-sm shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">{companyName} Careers</h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {totalJobs} Active Roles</span>
                <span className="flex items-center gap-1.5"><Monitor className="w-4 h-4" /> {remotePercent}% Remote</span>
              </div>
              {/* Social links — show for all companies */}
              <div className="flex items-center gap-1.5 mt-3">
                <a href={meta?.website || `https://${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`} target="_blank" rel="noopener noreferrer" title="Website" className="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  <Globe className="w-3.5 h-3.5" />
                </a>
                {meta?.socials?.x && (
                  <a href={meta.socials.x} target="_blank" rel="noopener noreferrer" title="X" className="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    <Twitter className="w-3.5 h-3.5" />
                  </a>
                )}
                {meta?.socials?.linkedin && (
                  <a href={meta.socials.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                )}
                {meta?.socials?.github && (
                  <a href={meta.socials.github} target="_blank" rel="noopener noreferrer" title="GitHub" className="w-7 h-7 flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    <Github className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Company About — verified data or auto-generated from jobs */}
          {(() => {
            const topLocations = [...new Set(jobs.map((j: any) => j.location?.split(',')[0]?.trim()).filter(Boolean))].slice(0, 5);
            const description = meta?.description
              || `${companyName} is actively hiring with ${totalJobs} open ${totalJobs === 1 ? 'position' : 'positions'}. ${remotePercent > 0 ? `${remotePercent}% of roles are remote. ` : ''}${topLocations.length > 0 ? `Key hiring locations include ${topLocations.join(', ')}.` : ''} ${topSkills.length > 0 ? `In-demand skills include ${topSkills.slice(0, 5).join(', ')}.` : ''}`;
            return (
              <div className="mb-8 p-5 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50">
                <p className="text-[14px] leading-relaxed text-zinc-700 dark:text-zinc-300 mb-5">{description}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Active Roles</p>
                    <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{totalJobs}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Remote</p>
                    <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{remotePercent}%</p>
                  </div>
                  {meta ? (
                    <>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Size</p>
                        <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{meta.size}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">HQ</p>
                        <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">{meta.hq}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Founded</p>
                        <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50">{meta.founded}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Locations</p>
                        <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">{topLocations.slice(0, 2).join(', ') || '—'}</p>
                      </div>
                      {topSkills.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">Top Skills</p>
                          <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 leading-tight">{topSkills.slice(0, 4).join(', ')}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Open Roles */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Open Roles</h2>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{totalJobs} {totalJobs === 1 ? 'job' : 'jobs'} found</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-12">
            {jobs.map((job: any) => (
              <a
                key={job.id}
                href={job.apply_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm dark:hover:shadow-white/5 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt={`${companyName} logo`} className="h-5 w-5 rounded shrink-0 bg-white" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors truncate">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 min-w-0">
                    <span className="font-medium truncate shrink-0 max-w-[40%]">{companyName}</span>
                    {job.location && (
                      <>
                        <span className="shrink-0 text-zinc-300 dark:text-zinc-600">·</span>
                        <span className="truncate max-w-[40%]">{job.location}</span>
                      </>
                    )}
                    <span className="shrink-0 text-zinc-300 dark:text-zinc-600">·</span>
                    <span className="truncate">{timeAgo(job.published_at || job.created_at)}</span>
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-500 transition-colors shrink-0" />
              </a>
            ))}
          </div>

          {/* FAQ Section - SEO content at the bottom */}
          <section className="border-t border-zinc-200 dark:border-zinc-800 pt-10">
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">Frequently Asked Questions</h2>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              {faqs.map((faq, i) => (
                <details key={i} className="group bg-white dark:bg-zinc-900/50" {...(i === 0 ? { open: true } : {})}>
                  <summary className="flex items-center justify-between cursor-pointer px-5 py-4 text-[14px] font-semibold text-zinc-900 dark:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors select-none list-none [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <svg className="w-4 h-4 text-zinc-400 shrink-0 ml-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </summary>
                  <div className="px-5 pb-4 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">{faq.a}</div>
                </details>
              ))}
            </div>
          </section>

        </main>
        
        <MicroFooter />
      </div>
    );
  }

  const avatarUrl = data.profile.avatarUrl;
  const isValidAvatarForPreload = avatarUrl
    && !avatarUrl.startsWith('data:')
    && !avatarUrl.includes('picsum.photos');

  const supabaseStorageHost = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
    : null;

  return (
    <>
      {supabaseStorageHost && (
        <link rel="preconnect" href={`https://${supabaseStorageHost}`} crossOrigin="anonymous" />
      )}
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
