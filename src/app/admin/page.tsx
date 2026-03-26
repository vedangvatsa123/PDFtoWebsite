'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/auth';
import { createClient } from '@/utils/supabase/client';
import Header from '@/components/header';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Area, AreaChart } from 'recharts';
import { Loader2 } from 'lucide-react';

const ADMIN_EMAILS = ['vatsvedang@gmail.com'];

type Analytics = {
  kpis: {
    totalUsers: number; totalViews: number; totalParses: number;
    avgViews: number; medianViews: number;
    usersWithPhoto: number; usersWithExperience: number;
    usersWithEducation: number; usersWithSkills: number;
    usersUpdatedLast7d: number; zeroViewProfiles: number;
    avgSkillsPerUser: number; totalLinksCount: number;
    totalWorkEntries: number; totalEduEntries: number;
  };
  signupTrend: { date: string; count: number }[];
  topProfiles: { name: string; slug: string; views: number }[];
  parseTrend: { date: string; count: number }[];
  completeness: {
    hasPhoto: number; noPhoto: number;
    hasExperience: number; noExperience: number;
    hasEducation: number; noEducation: number;
    hasSkills: number; noSkills: number;
    hasCustomSections: number; hasLinks: number;
  };
  authProviders: { provider: string; count: number }[];
  recentUsers: {
    email: string; name: string; slug: string; views: number;
    provider: string; createdAt: string; hasPhoto: boolean; hasResume: boolean;
  }[];
  productTimeline: { date: string; tag: string; title: string; desc: string }[];
  contactSubmissions: { id: string; email: string; purpose: string; message: string; is_read: boolean; created_at: string }[];
};

const chartConfig = { count: { label: 'Count', color: 'hsl(var(--foreground))' } } satisfies ChartConfig;

function Stat({ v, label, sub }: { v: number | string; label: string; sub?: string }) {
  return (
    <div className="py-2">
      <p className="text-3xl font-bold tracking-tight">{typeof v === 'number' ? v.toLocaleString() : v}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  );
}

function Pct({ has, total, label }: { has: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((has / total) * 100) : 0;
  return (
    <div className="py-2">
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold">{pct}%</span>
        <span className="text-xs text-muted-foreground">{has}/{total}</span>
      </div>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pt-2">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isUserLoading) return;
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) { router.replace('/'); return; }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      const token = session?.access_token;
      if (!token) { setError('No session'); setLoading(false); return; }
      fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
        .then(async r => { if (!r.ok) { const d = await r.json(); throw new Error(JSON.stringify(d)); } return r.json(); })
        .then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
    });
  }, [user, isUserLoading, router]);

  if (isUserLoading || loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (error || !data) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-sm text-muted-foreground font-mono max-w-md text-center px-4">{error || 'Failed to load'}</p></div>;

  const { kpis, signupTrend, topProfiles, parseTrend, completeness, authProviders, recentUsers, productTimeline, contactSubmissions } = data;
  const maxViews = topProfiles.length > 0 ? topProfiles[0].views : 1;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-5 sm:px-8 py-10 space-y-16">

        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">CVin.Bio platform metrics</p>
        </div>

        {/* KPIs */}
        <Section title="Overview">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6">
            <Stat v={kpis.totalUsers} label="Users" />
            <Stat v={kpis.totalViews} label="Total views" sub={`avg ${kpis.avgViews} · median ${kpis.medianViews}`} />
            <Stat v={kpis.totalParses} label="CV parses" />
            <Stat v={kpis.usersUpdatedLast7d} label="Active (7d)" sub={`${kpis.totalUsers > 0 ? Math.round((kpis.usersUpdatedLast7d / kpis.totalUsers) * 100) : 0}% of total`} />
            <Stat v={kpis.zeroViewProfiles} label="Zero-view profiles" sub={`${kpis.totalUsers > 0 ? Math.round((kpis.zeroViewProfiles / kpis.totalUsers) * 100) : 0}% of total`} />
            <Stat v={kpis.avgSkillsPerUser} label="Skills / user" />
          </div>
        </Section>

        {/* Completeness */}
        <Section title="Profile completeness">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6">
            <Pct has={completeness.hasPhoto} total={kpis.totalUsers} label="Photo" />
            <Pct has={completeness.hasExperience} total={kpis.totalUsers} label="Experience" />
            <Pct has={completeness.hasEducation} total={kpis.totalUsers} label="Education" />
            <Pct has={completeness.hasSkills} total={kpis.totalUsers} label="Skills" />
            <Pct has={completeness.hasCustomSections} total={kpis.totalUsers} label="Custom sections" />
            <Pct has={completeness.hasLinks} total={kpis.totalUsers} label="Links" />
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-1 mt-6 text-xs text-muted-foreground">
            <span>{kpis.totalWorkEntries} work entries</span>
            <span>{kpis.totalEduEntries} edu entries</span>
            <span>{kpis.avgSkillsPerUser} skills/user</span>
            <span>{kpis.totalLinksCount} total links</span>
          </div>
        </Section>

        {/* Signups Chart */}
        <Section title="Signups">
          <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <AreaChart data={signupTrend}>
              <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.1}/><stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v: string) => `${new Date(v).getDate()}/${new Date(v).getMonth()+1}`} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} width={24} />
              <Area type="monotone" dataKey="count" stroke="hsl(var(--foreground))" fill="url(#sg)" strokeWidth={1.5} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </AreaChart>
          </ChartContainer>
        </Section>

        {/* Top Profiles — simple list with bar */}
        <Section title="Top profiles by views">
          <div className="space-y-3">
            {topProfiles.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-5 shrink-0 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <a href={`https://cvin.bio/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium truncate hover:underline underline-offset-2">{p.name}</a>
                    <span className="text-xs text-muted-foreground shrink-0 font-mono">{p.views}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-foreground/30" style={{ width: `${(p.views / maxViews) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* CV Parses Chart */}
        <Section title="CV Parses">
          <ChartContainer config={chartConfig} className="h-[160px] w-full">
            <BarChart data={parseTrend}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v: string) => `${new Date(v).getDate()}/${new Date(v).getMonth()+1}`} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} width={24} />
              <Bar dataKey="count" fill="hsl(var(--foreground))" radius={[2,2,0,0]} opacity={0.6} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </BarChart>
          </ChartContainer>
        </Section>

        {/* Auth Providers */}
        {authProviders.length > 0 && (
          <Section title="Auth providers">
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              {authProviders.map(p => (
                <div key={p.provider}>
                  <span className="text-xl font-bold">{p.count}</span>
                  <span className="text-sm text-muted-foreground ml-2">{p.provider}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Recent Signups */}
        <Section title="Recent signups">
          <div className="space-y-4">
            {recentUsers.map((u, i) => (
              <div key={i} className="flex items-start justify-between gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{u.name || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-[11px] text-muted-foreground/70">
                    {u.slug && <a href={`https://cvin.bio/${u.slug}`} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2">/{u.slug}</a>}
                    <span>{u.views} views</span>
                    <span>{u.hasPhoto ? 'Photo ✓' : 'No photo'}</span>
                    <span>{u.hasResume ? 'CV ✓' : 'No CV'}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Timeline */}
        <Section title="Changelog">
          <div className="space-y-5">
            {productTimeline.map((e, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-xs text-muted-foreground w-12 shrink-0 pt-0.5 text-right">{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <div className="pb-5 border-l border-border/60 pl-4 -mt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{e.title}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground leading-none">{e.tag}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Contact Submissions */}
        {contactSubmissions.length > 0 && (
          <Section title={`Contact submissions (${contactSubmissions.length})`}>
            <div className="space-y-4">
              {contactSubmissions.map((s) => (
                <div key={s.id} className="pb-4 border-b border-border/50 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{s.email}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground leading-none">
                          {s.purpose.replace('-', ' ')}
                        </span>
                        {!s.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" title="Unread" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed whitespace-pre-wrap">
                        {s.message}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <p className="text-[10px] text-muted-foreground/30 pt-6 pb-8 text-center">admin-only · not indexed</p>
      </main>
    </div>
  );
}
