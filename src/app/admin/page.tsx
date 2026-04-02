'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/auth';
import { createClient } from '@/utils/supabase/client';
import Header from '@/components/header';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Area, AreaChart } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Minus, Globe, Monitor, Smartphone, Tablet } from 'lucide-react';

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
    totalJobs: number;
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
    provider: string; createdAt: string; lastSignIn: string | null; hasPhoto: boolean; hasResume: boolean;
  }[];
  productTimeline: { date: string; tag: string; title: string; desc: string }[];
  contactSubmissions: { id: string; email: string; purpose: string; message: string; is_read: boolean; created_at: string }[];
  posthog: {
    available: boolean;
    pageviewsByDay: { day: string; views: number }[] | null;
    uniqueVisitors: { this_week: number; last_week: number } | null;
    topPages: { page: string; views: number; uniques: number }[] | null;
    topReferrers: { referrer: string; visits: number }[] | null;
    deviceTypes: { device: string; cnt: number }[] | null;
    osTypes: { os: string; cnt: number }[] | null;
    topCountries: { country: string; visits: number }[] | null;
    topBrowsers: { browser: string; cnt: number }[] | null;
    profileViewsTrend: { day: string; views: number; unique_viewers: number }[] | null;
    avgTimeOnProfile: { avg_seconds: number; max_seconds: number; sample_size: number } | null;
    funnelEvents: { event: string; cnt: number; unique_users: number }[] | null;
    shareEvents: { event: string; cnt: number }[] | null;
    pageviewsWoW: { this_week: number; last_week: number } | null;
    activeToday: number;
    jobClicksTotal: number;
  };
};

const chartConfig = { count: { label: 'Count', color: 'hsl(var(--foreground))' } } satisfies ChartConfig;
const viewsConfig = { views: { label: 'Views', color: 'hsl(var(--foreground))' } } satisfies ChartConfig;

function Stat({ v, label, sub }: { v: number | string; label: string; sub?: string }) {
  return (
    <div className="py-2">
      <p className="text-3xl font-bold tracking-tight">{typeof v === 'number' ? v.toLocaleString() : v}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-0.5">{sub}</p>}
    </div>
  );
}

function WoWStat({ v, label, thisWeek, lastWeek }: { v: number | string; label: string; thisWeek: number; lastWeek: number }) {
  const diff = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;
  const isUp = diff > 0;
  const isDown = diff < 0;
  return (
    <div className="py-2">
      <p className="text-3xl font-bold tracking-tight">{typeof v === 'number' ? v.toLocaleString() : v}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      <div className="flex items-center gap-1 mt-0.5">
        {isUp ? <TrendingUp className="h-3 w-3 text-green-500" /> : isDown ? <TrendingDown className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3 text-muted-foreground" />}
        <span className={`text-xs font-medium ${isUp ? 'text-green-500' : isDown ? 'text-red-500' : 'text-muted-foreground'}`}>
          {isUp ? '+' : ''}{diff}% vs last week
        </span>
      </div>
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

function Section({ title, children, badge }: { title: string; children: React.ReactNode; badge?: string }) {
  return (
    <section className="pt-2">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {badge && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-semibold uppercase tracking-wider">{badge}</span>}
      </div>
      {children}
    </section>
  );
}

// Pretty event name: editor_cv_parse_started → CV Parse Started
function prettyEvent(event: string): string {
  return event
    .replace(/^(landing_|auth_|editor_|profile_|user_)/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

// Device icon
function DeviceIcon({ type }: { type: string }) {
  const t = (type || '').toLowerCase();
  if (t === 'mobile') return <Smartphone className="h-3.5 w-3.5" />;
  if (t === 'tablet') return <Tablet className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
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

  const { kpis, signupTrend, topProfiles, parseTrend, completeness, authProviders, recentUsers, productTimeline, contactSubmissions, posthog: ph } = data;
  const maxViews = topProfiles.length > 0 ? topProfiles[0].views : 1;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-[1400px] mx-auto px-5 sm:px-8 py-10 space-y-16">

        <div>
          <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            CVin.Bio platform metrics
            {ph.available && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-semibold">PostHog Live</span>}
          </p>
        </div>

        {/* ═══ REAL-TIME KPIs (PostHog + Supabase) ═══ */}
        <Section title="Overview">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-x-8 gap-y-6">
            <Stat v={kpis.totalUsers} label="Users" />
            {ph.available && ph.pageviewsWoW ? (
              <WoWStat v={ph.pageviewsWoW.this_week} label="Pageviews (7d)" thisWeek={ph.pageviewsWoW.this_week} lastWeek={ph.pageviewsWoW.last_week} />
            ) : (
              <Stat v={kpis.totalViews} label="Total views" sub={`avg ${kpis.avgViews} · median ${kpis.medianViews}`} />
            )}
            {ph.available && ph.uniqueVisitors ? (
              <WoWStat v={ph.uniqueVisitors.this_week} label="Unique visitors (7d)" thisWeek={ph.uniqueVisitors.this_week} lastWeek={ph.uniqueVisitors.last_week} />
            ) : (
              <Stat v={kpis.totalParses} label="CV parses" />
            )}
            <Stat v={ph.available ? ph.activeToday : kpis.usersUpdatedLast7d} label={ph.available ? 'Active today' : 'Active (7d)'} />
            <Stat v={kpis.totalParses} label="CV parses" />
            <Stat v={kpis.totalJobs} label="Active jobs" sub="Supabase" />
            <Stat v={ph.available && ph.jobClicksTotal !== undefined ? ph.jobClicksTotal : 0} label="Job apply clicks" sub="Last 30 days" />
            <Stat v={kpis.zeroViewProfiles} label="Zero-view profiles" sub={`${kpis.totalUsers > 0 ? Math.round((kpis.zeroViewProfiles / kpis.totalUsers) * 100) : 0}% of total`} />
          </div>
        </Section>

        {/* ═══ PAGEVIEWS CHART (PostHog) ═══ */}
        {ph.available && ph.pageviewsByDay && ph.pageviewsByDay.length > 0 && (
          <Section title="Pageviews (30 days)" badge="PostHog">
            <ChartContainer config={viewsConfig} className="h-[180px] w-full">
              <AreaChart data={ph.pageviewsByDay}>
                <defs><linearGradient id="pvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.12}/><stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v: string) => `${new Date(v).getDate()}/${new Date(v).getMonth()+1}`} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} width={30} />
                <Area type="monotone" dataKey="views" stroke="hsl(var(--foreground))" fill="url(#pvg)" strokeWidth={1.5} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </AreaChart>
            </ChartContainer>
          </Section>
        )}

        {/* ═══ PROFILE ENGAGEMENT (PostHog) ═══ */}
        {ph.available && ph.profileViewsTrend && ph.profileViewsTrend.length > 0 && (
          <Section title="Profile engagement (30 days)" badge="PostHog">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-4 mb-6">
              <Stat
                v={ph.profileViewsTrend.reduce((s, d) => s + d.views, 0)}
                label="Profile views"
                sub={`${ph.profileViewsTrend.reduce((s, d) => s + d.unique_viewers, 0)} unique`}
              />
              {ph.avgTimeOnProfile && (
                <Stat
                  v={`${Math.round(ph.avgTimeOnProfile.avg_seconds || 0)}s`}
                  label="Avg. time on profile"
                  sub={`max ${Math.round(ph.avgTimeOnProfile.max_seconds || 0)}s · ${ph.avgTimeOnProfile.sample_size} samples`}
                />
              )}
              <Stat v={kpis.totalViews} label="Supabase views (all-time)" sub={`avg ${kpis.avgViews} · median ${kpis.medianViews}`} />
            </div>
            <ChartContainer config={viewsConfig} className="h-[160px] w-full">
              <BarChart data={ph.profileViewsTrend}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v: string) => `${new Date(v).getDate()}/${new Date(v).getMonth()+1}`} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} width={24} />
                <Bar dataKey="views" fill="hsl(var(--foreground))" radius={[2,2,0,0]} opacity={0.5} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ChartContainer>
          </Section>
        )}

        {/* ═══ TRAFFIC SOURCES (PostHog) ═══ */}
        {ph.available && ph.topReferrers && ph.topReferrers.length > 0 && (
          <Section title="Traffic sources (7 days)" badge="PostHog">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
              {ph.topReferrers.map((r, i) => {
                const maxR = ph.topReferrers![0].visits;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <span className="text-sm truncate">{r.referrer || 'Direct'}</span>
                        <span className="text-xs text-muted-foreground font-mono shrink-0">{r.visits}</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500/40" style={{ width: `${(r.visits / maxR) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ═══ TOP PAGES (PostHog) ═══ */}
        {ph.available && ph.topPages && ph.topPages.length > 0 && (
          <Section title="Top pages (7 days)" badge="PostHog">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
              {ph.topPages.slice(0, 15).map((p, i) => {
                const maxP = ph.topPages![0].views;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <span className="text-sm font-mono truncate">{p.page}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{p.views} <span className="text-muted-foreground/50">({p.uniques}u)</span></span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-foreground/20" style={{ width: `${(p.views / maxP) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ═══ GEOGRAPHY & DEVICES (PostHog) ═══ */}
        {ph.available && (ph.topCountries || ph.deviceTypes || ph.osTypes || ph.topBrowsers) && (
          <Section title="Audience (7 days)" badge="PostHog">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Countries */}
              {ph.topCountries && ph.topCountries.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Countries</p>
                  <div className="space-y-2">
                    {ph.topCountries.slice(0, 8).map((c, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <span className="text-sm truncate">{c.country}</span>
                        <span className="text-xs text-muted-foreground font-mono shrink-0">{c.visits}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Devices */}
              {ph.deviceTypes && ph.deviceTypes.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Devices</p>
                  <div className="space-y-2">
                    {ph.deviceTypes.map((d, i) => {
                      const total = ph.deviceTypes!.reduce((s, x) => s + x.cnt, 0);
                      const pct = total > 0 ? Math.round((d.cnt / total) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <DeviceIcon type={d.device} />
                          <span className="text-sm flex-1">{d.device || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground font-mono">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* OSes */}
              {ph.osTypes && ph.osTypes.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">OS</p>
                  <div className="space-y-2">
                    {ph.osTypes.map((o, i) => {
                      const total = ph.osTypes!.reduce((s, x) => s + x.cnt, 0);
                      const pct = total > 0 ? Math.round((o.cnt / total) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm flex-1">{o.os || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground font-mono">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {/* Browsers */}
              {ph.topBrowsers && ph.topBrowsers.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Browsers</p>
                  <div className="space-y-2">
                    {ph.topBrowsers.slice(0, 6).map((b, i) => (
                      <div key={i} className="flex items-center justify-between gap-2">
                        <span className="text-sm truncate">{b.browser}</span>
                        <span className="text-xs text-muted-foreground font-mono shrink-0">{b.cnt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ═══ CONVERSION FUNNEL (PostHog) ═══ */}
        {ph.available && ph.funnelEvents && ph.funnelEvents.length > 0 && (
          <Section title="Event funnel (30 days)" badge="PostHog">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {ph.funnelEvents.map((e, i) => {
                const maxE = ph.funnelEvents![0].cnt;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <span className="text-sm truncate">{prettyEvent(e.event)}</span>
                        <span className="text-xs text-muted-foreground shrink-0 font-mono">{e.cnt} <span className="text-muted-foreground/50">({e.unique_users}u)</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500/50" style={{ width: `${(e.cnt / maxE) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ═══ SHARE ANALYTICS (PostHog) ═══ */}
        {ph.available && ph.shareEvents && ph.shareEvents.length > 0 && (
          <Section title="Sharing (30 days)" badge="PostHog">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-8 gap-y-4">
              {ph.shareEvents.map((e, i) => (
                <div key={i} className="py-1">
                  <p className="text-xl font-bold">{e.cnt}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{prettyEvent(e.event)}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ═══ PROFILE COMPLETENESS (Supabase) ═══ */}
        <Section title="Profile completeness">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-8 gap-y-6">
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

        {/* ═══ SIGNUPS CHART (Supabase) ═══ */}
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

        {/* ═══ TOP PROFILES (Supabase) ═══ */}
        <Section title="Top profiles by views">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
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

        {/* ═══ CV PARSES CHART (Supabase) ═══ */}
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

        {/* ═══ AUTH PROVIDERS (Supabase) ═══ */}
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

        {/* ═══ RECENT SIGNUPS (Supabase) ═══ */}
        <Section title="Recent signups">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            {recentUsers.map((u, i) => (
              <div key={i} className="flex items-start justify-between gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{u.name || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{u.email}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-[11px] text-muted-foreground/70">
                    {u.slug && <a href={`https://cvin.bio/${u.slug}`} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2">/{u.slug}</a>}
                    <span>{u.views} views</span>
                    {u.lastSignIn && <span>Last active: {new Date(u.lastSignIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                    <span>{u.hasPhoto ? 'Photo ✓' : 'No photo'}</span>
                    <span>{u.hasResume ? 'CV ✓' : 'No CV'}</span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ═══ TIMELINE (static) ═══ */}
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

        {/* ═══ CONTACT SUBMISSIONS (Supabase) ═══ */}
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

        {/* ═══ DATA SCIENCE INSIGHTS ═══ */}
        <Section title="Data Science Insights" badge="Auto-generated">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-5 rounded-xl border border-border/50 bg-green-500/5">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-green-700 dark:text-green-400 mb-4">
                <TrendingUp className="h-4 w-4" /> What's Working
              </h3>
              <ul className="space-y-3">
                {(() => {
                  const items = [];
                  const cvRatio = kpis.totalParses > 0 ? (kpis.totalUsers / kpis.totalParses) : 0;
                  if (cvRatio > 0.4) items.push(<li key="cv" className="text-sm text-muted-foreground"><strong>Strong CV Conversion:</strong> {(cvRatio * 100).toFixed(0)}% of people who parse a CV map it to a saved account. This implies the parse quality and editor experience retain high trust.</li>);
                  if (ph.pageviewsWoW && ph.pageviewsWoW.this_week > ph.pageviewsWoW.last_week) items.push(<li key="wow" className="text-sm text-muted-foreground"><strong>Traffic Growth:</strong> Pageviews grew week-over-week. Social media scripts and SEO indexing are driving net new eyes to the platform.</li>);
                  const topRef = ph.topReferrers?.[0];
                  if (topRef) items.push(<li key="ref" className="text-sm text-muted-foreground"><strong>Primary Funnel:</strong> <em>{topRef.referrer}</em> is providing the most consistent incoming traffic, making it the most strategic channel.</li>);
                  const viewsRatio = kpis.totalUsers > 0 ? kpis.totalViews / kpis.totalUsers : 0;
                  if (viewsRatio > 2) items.push(<li key="views" className="text-sm text-muted-foreground"><strong>Profile Engagement:</strong> Accounts get an average of {Math.round(viewsRatio)} views, demonstrating value creation for job seekers once they publish.</li>);
                  const completionRate = kpis.totalUsers > 0 ? (completeness.hasSkills / kpis.totalUsers) : 0;
                  if (completionRate > 0.6) items.push(<li key="comp" className="text-sm text-muted-foreground"><strong>Data Richness:</strong> {(completionRate * 100).toFixed(0)}% of user profiles have skill embeddings, providing a solid foundation for robust AI job matching models.</li>);
                  if (items.length === 0) items.push(<li key="none" className="text-sm text-muted-foreground">Gathering more data to find strong positive signals.</li>);
                  return items;
                })()}
              </ul>
            </div>
            
            <div className="p-5 rounded-xl border border-border/50 bg-red-500/5">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-red-700 dark:text-red-400 mb-4">
                <TrendingDown className="h-4 w-4" /> Potential Drop-offs
              </h3>
              <ul className="space-y-3">
                {(() => {
                  const items = [];
                  const zeroViewsRate = kpis.totalUsers > 0 ? (kpis.zeroViewProfiles / kpis.totalUsers) : 0;
                  if (zeroViewsRate > 0.4) items.push(<li key="zero" className="text-sm text-muted-foreground"><strong>Ghost Profiles:</strong> {(zeroViewsRate * 100).toFixed(0)}% of profiles have 0 views. Users might be signing up but struggling to distribute their link or not utilizing the social share buttons.</li>);
                  const jobInterest = (ph.jobClicksTotal && kpis.totalJobs) ? true : false;
                  if (jobInterest && ph.jobClicksTotal < 20) items.push(<li key="jobs" className="text-sm text-muted-foreground"><strong>Job Interactions:</strong> Very low outbound clicks on Jobs ({ph.jobClicksTotal}). Ensure the jobs matching algorithm is surfacing relevant roles, or test adding the job feed directly inside the editor dashboard.</li>);
                  const desktopVol = ph.deviceTypes?.find(d => d.device.toLowerCase() === 'desktop')?.cnt || 0;
                  const mobileVol = ph.deviceTypes?.find(d => d.device.toLowerCase() === 'mobile')?.cnt || 0;
                  if (mobileVol > desktopVol * 1.5) items.push(<li key="mobile" className="text-sm text-muted-foreground"><strong>Mobile Imbalance:</strong> Mobile traffic vastly outpaces desktop, but CV uploads are typically a desktop-heavy action. Ensure your cloud-drive integrations (Google Drive/Dropbox) on mobile are frictionless.</li>);
                  const directRef = ph.topReferrers?.find(r => r.referrer === 'Direct')?.visits || 0;
                  const refTotal = ph.topReferrers?.reduce((a,b) => a+b.visits, 0) || 1;
                  if (directRef / refTotal > 0.8) items.push(<li key="direct" className="text-sm text-muted-foreground"><strong>Referral Risk:</strong> Highly reliant on direct/dark-social traffic. Backlinks from technical job boards or SEO articles might be underperforming.</li>);
                  
                  if (items.length === 0) items.push(<li key="none" className="text-sm text-muted-foreground">No major negative signals detected currently.</li>);
                  return items;
                })()}
              </ul>
            </div>
          </div>
        </Section>

        {/* ═══ PostHog config notice ═══ */}
        {!ph.available && (
          <div className="text-xs text-muted-foreground/40 text-center py-4 border border-dashed border-border rounded-lg">
            Add <code className="bg-muted px-1 rounded text-[10px]">POSTHOG_PERSONAL_API_KEY</code> and <code className="bg-muted px-1 rounded text-[10px]">POSTHOG_PROJECT_ID</code> to .env.local for live analytics
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/30 pt-6 pb-8 text-center">admin-only · not indexed</p>
      </main>
    </div>
  );
}
