import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import { Briefcase, MapPin, Monitor, Clock, ExternalLink } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug.replace(/-/g, ' ');
  // Avoid colons and emdashes in metadata
  return {
    title: `${slug.toUpperCase()} Careers | CVin.Bio`,
    description: `Real time hiring data and active roles at ${slug.toUpperCase()} including remote options and key technical requirements`,
  };
}

export default async function CompanyPage({ params }: { params: { slug: string } }) {
  const decodedSearch = params.slug.replace(/-/g, ' ').toLowerCase();
  
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .ilike('company', `${decodedSearch}%`)
    .limit(100);

  if (!jobs || jobs.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <h1 className="text-2xl font-bold text-muted-foreground">No active jobs found for {decodedSearch}</h1>
        </main>
        <MicroFooter />
      </div>
    );
  }

  // Exact company name from DB
  const companyName = jobs[0].company;
  
  // Try to find an existing logo or generate a fallback favicon
  let logo = jobs.find(j => j.company_logo)?.company_logo;
  if (!logo) {
    // Attempt graceful domain inference if none exists
    const domainFallback = companyName.toLowerCase().replace(/\s+/g, '') + '.com';
    logo = `https://www.google.com/s2/favicons?domain=${domainFallback}&sz=128`;
  }
  
  // Compute Stats
  const totalJobs = jobs.length;
  const remoteJobs = jobs.filter(j => j.location?.toLowerCase().includes('remote')).length;
  const remotePercent = totalJobs > 0 ? Math.round((remoteJobs / totalJobs) * 100) : 0;
  
  // Aggregate top skills
  const skillCount: Record<string, number> = {};
  jobs.forEach(j => {
    if (Array.isArray(j.tags)) {
      j.tags.forEach(t => {
        skillCount[t] = (skillCount[t] || 0) + 1;
      });
    }
  });
  
  const topSkills = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(e => e[0]);

  // JSON-LD
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": companyName,
    "logo": logo
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <Header />
      
      <main className="flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8 py-10">
        
        {/* Header Section */}
        <div className="flex items-center gap-6 mb-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt={companyName} className="w-20 h-20 rounded-xl border border-border bg-white p-2 shadow-sm" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">{companyName} Careers</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground mt-3">
              <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {totalJobs} Active Roles</span>
              <span className="flex items-center gap-1.5"><Monitor className="w-4 h-4" /> {remotePercent}% Remote</span>
            </div>
          </div>
        </div>

        {/* Intelligence Data Grid */}
        {topSkills.length > 0 && (
          <div className="mb-10 p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 text-indigo-700 dark:text-indigo-400">Target Tech Stack</h2>
            <div className="flex flex-wrap gap-2">
              {topSkills.map(s => (
                <span key={s} className="px-3 py-1 bg-white dark:bg-zinc-900 border border-border rounded-lg text-sm font-medium text-foreground/80 shadow-sm">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Jobs List Grid */}
        <h2 className="text-2xl font-semibold tracking-tight mb-6">Open Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map(job => (
            <a key={job.id} href={job.apply_url} target="_blank" rel="noopener noreferrer" className="group rounded-2xl border border-border p-5 hover:border-foreground/30 transition-all bg-card shadow-sm hover:shadow-md flex flex-col justify-between h-full">
              <div>
                <h3 className="font-semibold text-lg line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-3">{job.title}</h3>
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground flex items-center gap-2 line-clamp-1">
                    <MapPin className="w-4 h-4 flex-shrink-0 opacity-70" /> {job.location || 'Unspecified'}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 line-clamp-1">
                    <Clock className="w-4 h-4 flex-shrink-0 opacity-70" /> {new Date(job.published_at || job.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>
      
      <MicroFooter />
    </div>
  );
}
