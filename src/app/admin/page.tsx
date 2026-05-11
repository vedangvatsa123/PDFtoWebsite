'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/auth';
import { createClient } from '@/utils/supabase/client';
import Header from '@/components/header';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Area, AreaChart } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Minus, Globe, Monitor, Smartphone, Tablet, Share2, MessageCircle, Heart, Eye, Repeat2, Bookmark, Send } from 'lucide-react';

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
  dataScience?: any;
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
  const [socialData, setSocialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isUserLoading) return;
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) { router.replace('/'); return; }
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      const token = session?.access_token;
      if (!token) { setError('No session'); setLoading(false); return; }
      Promise.all([
        fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
          .then(async r => { if (!r.ok) { const d = await r.json(); throw new Error(JSON.stringify(d)); } return r.json(); }),
        fetch('/api/admin/social', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
          .then(async r => r.ok ? r.json() : null).catch(() => null),
      ]).then(([analytics, social]) => {
        setData(analytics);
        setSocialData(social);
      }).catch(e => setError(e.message)).finally(() => setLoading(false));
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
            {ph.available && ph.uniqueVisitors && (
              <WoWStat v={ph.uniqueVisitors.this_week} label="Unique visitors (7d)" thisWeek={ph.uniqueVisitors.this_week} lastWeek={ph.uniqueVisitors.last_week} />
            )}
            <Stat v={ph.available ? ph.activeToday : kpis.usersUpdatedLast7d} label={ph.available ? 'Active today' : 'Active (7d)'} />
            <Stat v={kpis.totalParses} label="CV parses" />
            <Stat v={kpis.totalJobs} label="Active jobs" sub="Supabase" />
            <Stat v={ph.available && ph.jobClicksTotal !== undefined ? ph.jobClicksTotal : 0} label="Job apply clicks" sub="Last 30 days" />
            <Stat v={kpis.zeroViewProfiles} label="Zero-view profiles" sub={`${kpis.totalUsers > 0 ? Math.round((kpis.zeroViewProfiles / kpis.totalUsers) * 100) : 0}% of total`} />
          </div>
        </Section>

        {/* ═══ SOCIAL MEDIA STATS ═══ */}
        {socialData && (
          <Section title="Social Media" badge="Live">
            {/* Platform KPIs Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-8 gap-y-6 mb-8">
              {/* X (Twitter) */}
              {socialData.x?.live?.user?.public_metrics && (
                <>
                  <Stat v={socialData.x.live.user.public_metrics.followers_count || 0} label="X Followers" />
                  <Stat v={socialData.x.live.tweetMetrics?.totalImpressions || 0} label="Impressions" sub="Last 100 tweets" />
                  <Stat v={socialData.x.live.tweetMetrics?.totalLikes || 0} label="Likes" sub="Last 100 tweets" />
                </>
              )}
              {/* Bluesky */}
              {socialData.bluesky?.live && (
                <>
                  <Stat v={socialData.bluesky.live.followersCount || 0} label="BSky Followers" />
                  <Stat v={socialData.bluesky.live.postsCount || 0} label="BSky Posts" />
                </>
              )}
              {/* Totals */}
              <Stat v={socialData.summary?.totalPostsAcrossPlatforms || 0} label="Total posts" sub="All platforms" />
              <Stat v={socialData.summary?.activePlatforms || 0} label="Active platforms" />
            </div>

            {/* Platform Queue Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* X Queue */}
              <div className="p-4 rounded-xl border border-border/50 bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <span className="text-sm font-semibold">X (Twitter)</span>
                  {socialData.x?.queue?.lastPostedAt?.engagement && (
                    <span className="text-[10px] text-muted-foreground/50 ml-auto">
                      Last: {new Date(socialData.x.queue.lastPostedAt.engagement).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Threads</span><span className="font-mono">{socialData.x?.queue?.threads?.posted || 0}/{socialData.x?.queue?.threads?.total || 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Insights</span><span className="font-mono">{socialData.x?.queue?.insights?.posted || 0}/{socialData.x?.queue?.insights?.total || 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Engagement</span><span className="font-mono">{socialData.x?.queue?.engagement?.posted || 0}/{socialData.x?.queue?.engagement?.total || 0}</span></div>
                  {socialData.summary?.totalTweetsInThreads > 0 && (
                    <div className="flex justify-between text-muted-foreground/60 text-xs pt-1 border-t border-border/30">
                      <span>Total thread tweets</span><span className="font-mono">{socialData.summary.totalTweetsInThreads}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bluesky Queue */}
              <div className="p-4 rounded-xl border border-border/50 bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 600 530"><path d="M135.72 44.03C202.216 93.951 273.74 195.86 300 249.49c26.262-53.63 97.782-155.54 164.28-205.46C512.26 8.009 590-19.862 590 68.825c0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.38-3.69-10.832-3.708-7.896-.017-2.936-1.193.516-3.707 7.896-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.256 82.697-152.22-67.108 11.421-142.549-7.449-163.25-81.433C20.15 217.613 10 86.536 10 68.824c0-88.687 77.742-60.816 125.72-24.795z"/></svg>
                  <span className="text-sm font-semibold">Bluesky</span>
                  {socialData.bluesky?.queue?.lastPostedAt && (
                    <span className="text-[10px] text-muted-foreground/50 ml-auto">
                      Last: {new Date(socialData.bluesky.queue.lastPostedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Posts published</span><span className="font-mono">{socialData.bluesky?.queue?.posted || 0}</span></div>
                  {socialData.bluesky?.live && (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">Following</span><span className="font-mono">{socialData.bluesky.live.followsCount || 0}</span></div>
                    </>
                  )}
                </div>
              </div>

              {/* Meta + Buffer Queue */}
              <div className="p-4 rounded-xl border border-border/50 bg-card">
                <div className="flex items-center gap-2 mb-3">
                  <Share2 className="h-4 w-4" />
                  <span className="text-sm font-semibold">Meta + Buffer</span>
                  {socialData.meta?.queue?.lastPostedAt && (
                    <span className="text-[10px] text-muted-foreground/50 ml-auto">
                      Last: {new Date(socialData.meta.queue.lastPostedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Facebook (Meta)</span><span className="font-mono">{socialData.meta?.queue?.facebook?.posted || 0} posts</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Instagram (Meta)</span><span className="font-mono">{socialData.meta?.queue?.instagram?.posted || 0} posts</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Threads (Meta)</span><span className="font-mono">{socialData.meta?.queue?.threads?.posted || 0} posts</span></div>
                  <div className="flex justify-between text-muted-foreground/60 text-xs pt-1 border-t border-border/30">
                    <span>Buffer — LinkedIn</span><span className="font-mono">{socialData.buffer?.queue?.linkedin || 0}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground/60 text-xs">
                    <span>Buffer — Instagram</span><span className="font-mono">{socialData.buffer?.queue?.instagram || 0}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground/60 text-xs">
                    <span>Buffer — Facebook</span><span className="font-mono">{socialData.buffer?.queue?.facebook || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Tweets */}
            {socialData.x?.live?.tweetMetrics?.topTweets && socialData.x.live.tweetMetrics.topTweets.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">Top Performing Tweets</p>
                <div className="space-y-3">
                  {socialData.x.live.tweetMetrics.topTweets.map((tweet: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 pb-3 border-b border-border/30 last:border-0 last:pb-0">
                      <span className="text-xs text-muted-foreground w-4 shrink-0 text-right pt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <a href={`https://x.com/cvinbio/status/${tweet.id}`} target="_blank" rel="noopener noreferrer" className="text-sm leading-snug hover:underline underline-offset-2 line-clamp-2">
                          {tweet.text}
                        </a>
                        <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{(tweet.impressions || 0).toLocaleString()}</span>
                          <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{tweet.likes}</span>
                          <span className="flex items-center gap-1"><Repeat2 className="h-3 w-3" />{tweet.retweets}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{tweet.replies}</span>
                          <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" />{tweet.bookmarks}</span>
                          {tweet.createdAt && <span className="ml-auto text-muted-foreground/50">{new Date(tweet.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* X Engagement Summary Row */}
            {socialData.x?.live?.tweetMetrics && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-8 gap-y-4 mt-6 pt-4 border-t border-border/30">
                <div><p className="text-lg font-bold">{(socialData.x.live.tweetMetrics.totalImpressions || 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Total impressions</p></div>
                <div><p className="text-lg font-bold">{socialData.x.live.tweetMetrics.totalLikes || 0}</p><p className="text-xs text-muted-foreground">Total likes</p></div>
                <div><p className="text-lg font-bold">{socialData.x.live.tweetMetrics.totalRetweets || 0}</p><p className="text-xs text-muted-foreground">Total retweets</p></div>
                <div><p className="text-lg font-bold">{socialData.x.live.tweetMetrics.totalReplies || 0}</p><p className="text-xs text-muted-foreground">Total replies</p></div>
                <div><p className="text-lg font-bold">{socialData.x.live.tweetMetrics.totalBookmarks || 0}</p><p className="text-xs text-muted-foreground">Total bookmarks</p></div>
              </div>
            )}
          </Section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        </div>

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
        <Section title="Data Science Insights" badge="Mathematical Analysis">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-5 rounded-xl border border-border/50 bg-indigo-500/5">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-indigo-700 dark:text-indigo-400 mb-4">
                <TrendingUp className="h-4 w-4" /> Statistical Signals
              </h3>
              <ul className="space-y-3">
                {(() => {
                  const items = [];
                  const ds = data.dataScience;
                  if (ds) {
                    if (Math.abs(ds.correlation_views_signups) > 0) {
                      const r = ds.correlation_views_signups;
                      const strength = Math.abs(r) > 0.7 ? 'Strong' : Math.abs(r) > 0.4 ? 'Moderate' : 'Weak';
                      const direction = r > 0 ? 'positive' : 'negative';
                      items.push(
                        <li key="corr" className="text-sm text-muted-foreground">
                          <strong>Conversion Causality (Pearson r):</strong> {r.toFixed(2)}.<br/>
                          Demonstrates a <em>{strength.toLowerCase()} {direction} linear correlation</em> between daily pageviews and account signups. {r > 0.5 ? 'This implies highly targeted traffic acquisition where views reliably predict account creation.' : 'This suggests traffic is generating brand awareness but not acting as a direct causal vector for signups.'}
                        </li>
                      );
                    }
                    if (ds.traffic_velocity_slope !== 0) {
                      const vel = ds.traffic_velocity_slope;
                      items.push(
                        <li key="vel" className="text-sm text-muted-foreground">
                          <strong>Growth Velocity (Regression Slope):</strong> {vel > 0 ? '+' : ''}{vel.toFixed(1)} views/day.<br/>
                          The linear regression modeling across a 30-day index shows a {vel > 0 ? 'compounding' : 'decaying'} trajectory. {vel > 0 ? 'Your top-of-funnel retention curve is upward trending.' : 'You are observing baseline decay; marketing injection is required to break the plateau.'}
                        </li>
                      );
                    }
                  }
                  
                  const cvRatio = kpis.totalParses > 0 ? (kpis.totalUsers / kpis.totalParses) : 0;
                  if (cvRatio > 0) {
                     items.push(<li key="cv" className="text-sm text-muted-foreground"><strong>Drop-off Coefficient:</strong> {(cvRatio * 100).toFixed(0)}% retention from parser initialization to database persistence, indicating UI friction delta.</li>);
                  }

                  // Engagement Concentration (top profiles vs total)
                  if (topProfiles.length > 0 && kpis.totalViews > 0) {
                    const topViewsSum = topProfiles.reduce((s: number, p: any) => s + p.views, 0);
                    const concentration = topViewsSum / kpis.totalViews;
                    items.push(<li key="gini" className="text-sm text-muted-foreground"><strong>Engagement Concentration:</strong> Top {topProfiles.length} profiles capture {(concentration * 100).toFixed(0)}% of all views ({topViewsSum.toLocaleString()} of {kpis.totalViews.toLocaleString()}). {concentration > 0.8 ? 'Extreme concentration: a handful of profiles absorb nearly all traffic. Distribution follows a power-law pattern typical of early-stage platforms.' : concentration > 0.5 ? 'Moderate concentration. Views are spreading across profiles but top performers still dominate.' : 'Healthy distribution: views are relatively spread across the user base.'}</li>);
                  }

                  // Skill Density Distribution
                  if (kpis.avgSkillsPerUser > 0) {
                    const skillDensity = kpis.avgSkillsPerUser;
                    items.push(<li key="skill" className="text-sm text-muted-foreground"><strong>Skill Density Index:</strong> {skillDensity} skills/user average. {skillDensity > 8 ? 'High signal density indicates users are investing effort in structured profiles, improving matching accuracy.' : skillDensity > 4 ? 'Moderate skill density. Profiles contain enough data points for meaningful skill-based filtering.' : 'Low skill density. Consider prompting users to add more skills during onboarding to improve match quality.'}</li>);
                  }

                  // Profile Freshness Index
                  const freshnessRate = kpis.totalUsers > 0 ? (kpis.usersUpdatedLast7d / kpis.totalUsers) : 0;
                  items.push(<li key="fresh" className="text-sm text-muted-foreground"><strong>Profile Freshness Index:</strong> {(freshnessRate * 100).toFixed(0)}% of profiles updated in the last 7 days. {freshnessRate > 0.3 ? 'Healthy recency signal. Active user base is maintaining profile freshness, which directly improves data quality for employer queries.' : freshnessRate > 0.1 ? 'Moderate freshness. Consider re-engagement prompts for dormant profiles to maintain data currency.' : 'Low freshness rate signals a retention gap. Users are creating profiles but not returning to update them.'}</li>);

                  // Signup acceleration (7d vs previous 7d)
                  if (signupTrend.length >= 14) {
                    const last7 = signupTrend.slice(-7).reduce((s, d) => s + d.count, 0);
                    const prev7 = signupTrend.slice(-14, -7).reduce((s, d) => s + d.count, 0);
                    const accel = prev7 > 0 ? ((last7 - prev7) / prev7 * 100) : (last7 > 0 ? 100 : 0);
                    items.push(<li key="accel" className="text-sm text-muted-foreground"><strong>Signup Acceleration:</strong> {accel > 0 ? '+' : ''}{accel.toFixed(0)}% week-over-week. {last7} signups this week vs {prev7} prior week. {accel > 20 ? 'Growth is accelerating, indicating effective acquisition channels.' : accel > -10 ? 'Growth is holding steady at the current baseline.' : 'Deceleration detected. Review acquisition channels and referral sources for drop-off.'}</li>);
                  }
                  
                  if (items.length === 0) items.push(<li key="none" className="text-sm text-muted-foreground">Gathering sufficient timeline arrays to compute regression matrices.</li>);
                  return items;
                })()}
              </ul>
            </div>
            
            <div className="p-5 rounded-xl border border-border/50 bg-amber-500/5">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-4">
                <Globe className="h-4 w-4" /> Anomaly &amp; Variance Detection
              </h3>
              <ul className="space-y-3">
                {(() => {
                  const items = [];
                  const ds = data.dataScience;
                  
                  if (ds && ds.anomaly_days && ds.anomaly_days.length > 0) {
                    items.push(
                      <li key="anom" className="text-sm text-muted-foreground">
                        <strong>Z-Score Anomalies (σ &gt; 2.0):</strong> Detected {ds.anomaly_days.length} statistically significant deviances from the moving average.
                        <ul className="mt-2 space-y-1 ml-4 list-disc text-xs opacity-80">
                          {ds.anomaly_days.map((an: any, i: number) => (
                            <li key={i}>{new Date(an.date).toLocaleDateString()} - {an.type === 'surge' ? '+' : ''}{an.dev}σ {an.type}</li>
                          ))}
                        </ul>
                      </li>
                    );
                  }

                  const zeroViewsRate = kpis.totalUsers > 0 ? (kpis.zeroViewProfiles / kpis.totalUsers) : 0;
                  if (zeroViewsRate > 0.3) items.push(<li key="zero" className="text-sm text-muted-foreground"><strong>Network Centrality Deficit:</strong> {(zeroViewsRate * 100).toFixed(0)}% of nodes (profiles) have 0 inbound edges (views). High distribution variance indicates a power-law curve where top profiles absorb the majority of traffic.</li>);
                  
                  const desktopVol = ph.deviceTypes?.find(d => d.device.toLowerCase() === 'desktop')?.cnt || 0;
                  const mobileVol = ph.deviceTypes?.find(d => d.device.toLowerCase() === 'mobile')?.cnt || 0;
                  if (mobileVol > 0 && desktopVol > 0) {
                    const ratio = mobileVol / desktopVol;
                    items.push(<li key="mobile" className="text-sm text-muted-foreground"><strong>Device Vector Imbalance:</strong> Mobile-to-desktop ratio is {ratio.toFixed(1)}x. {ratio > 1.5 ? 'Mobile traffic significantly outpaces desktop, misaligning with the desktop-biased CV parser utilization curve. Consider mobile-first parsing UX.' : ratio < 0.7 ? 'Desktop-heavy traffic aligns well with CV editing workflows but indicates limited mobile discovery channels.' : 'Balanced device distribution suggests healthy multi-channel acquisition.'}</li>);
                  }

                  // Content Completeness Skew
                  const photoRate = kpis.totalUsers > 0 ? (kpis.usersWithPhoto / kpis.totalUsers) : 0;
                  const expRate = kpis.totalUsers > 0 ? (kpis.usersWithExperience / kpis.totalUsers) : 0;
                  const eduRate = kpis.totalUsers > 0 ? (kpis.usersWithEducation / kpis.totalUsers) : 0;
                  const skillRate = kpis.totalUsers > 0 ? (kpis.usersWithSkills / kpis.totalUsers) : 0;
                  const rates = [photoRate, expRate, eduRate, skillRate];
                  const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
                  const completenessVariance = Math.sqrt(rates.reduce((a, b) => a + Math.pow(b - avgRate, 2), 0) / rates.length);
                  items.push(<li key="complete" className="text-sm text-muted-foreground"><strong>Completeness Skew (σ):</strong> {completenessVariance.toFixed(2)} across 4 profile dimensions (photo {(photoRate*100).toFixed(0)}%, experience {(expRate*100).toFixed(0)}%, education {(eduRate*100).toFixed(0)}%, skills {(skillRate*100).toFixed(0)}%). {completenessVariance > 0.2 ? 'High variance suggests users complete some fields but abandon others. Target the lowest-completion field in onboarding prompts.' : 'Low variance indicates consistent profile completion behavior.'}</li>);

                  // Referrer Concentration (HHI)
                  if (ph.topReferrers && ph.topReferrers.length > 1) {
                    const totalRefs = ph.topReferrers.reduce((s: number, r: any) => s + r.visits, 0);
                    if (totalRefs > 0) {
                      const hhi = ph.topReferrers.reduce((s: number, r: any) => {
                        const share = r.visits / totalRefs;
                        return s + share * share;
                      }, 0);
                      items.push(<li key="hhi" className="text-sm text-muted-foreground"><strong>Referrer Concentration (HHI):</strong> {(hhi * 10000).toFixed(0)} / 10,000. {hhi > 0.25 ? 'High concentration: traffic depends on 1-2 dominant sources. Diversify acquisition to reduce single-channel risk.' : hhi > 0.15 ? 'Moderate concentration. Primary channels are effective but expansion would reduce dependency risk.' : 'Healthy distribution across multiple referral sources.'}</li>);
                    }
                  }

                  // Geographic Concentration
                  if (ph.topCountries && ph.topCountries.length > 1) {
                    const totalGeo = ph.topCountries.reduce((s: number, c: any) => s + c.visits, 0);
                    const topCountryShare = totalGeo > 0 ? (ph.topCountries[0].visits / totalGeo) : 0;
                    items.push(<li key="geo" className="text-sm text-muted-foreground"><strong>Geographic Concentration:</strong> {ph.topCountries[0].country} accounts for {(topCountryShare * 100).toFixed(0)}% of traffic across {ph.topCountries.length} detected countries. {topCountryShare > 0.6 ? 'Single-market dominance. International expansion would diversify the user base and reduce geographic risk.' : 'Distributed across multiple regions, indicating global appeal.'}</li>);
                  }

                  // Work-to-Education Ratio
                  if (kpis.totalWorkEntries > 0 || kpis.totalEduEntries > 0) {
                    const weRatio = kpis.totalEduEntries > 0 ? (kpis.totalWorkEntries / kpis.totalEduEntries) : kpis.totalWorkEntries;
                    items.push(<li key="weratio" className="text-sm text-muted-foreground"><strong>Work-to-Education Ratio:</strong> {weRatio.toFixed(1)}x ({kpis.totalWorkEntries} work entries vs {kpis.totalEduEntries} education entries). {weRatio > 3 ? 'Experienced professional user base. Users prioritize work history over credentials, typical of mid-career and senior profiles.' : weRatio > 1.5 ? 'Balanced mix of professional experience and educational background. Healthy distribution for a talent platform.' : 'Education-heavy profiles suggest early-career users or recent graduates dominate the user base.'}</li>);
                  }
                  
                  if (items.length === 0) items.push(<li key="none" className="text-sm text-muted-foreground">Variance across cohorts remains within standard deviation thresholds (σ &lt; 1.0).</li>);
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
