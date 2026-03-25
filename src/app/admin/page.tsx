'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/auth';
import { createClient } from '@/utils/supabase/client';
import Header from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Area, AreaChart, Cell, Pie, PieChart } from 'recharts';
import { Loader2, Users, Eye, FileUp, TrendingUp, Shield, Activity, Hash, Link2, Briefcase, GraduationCap, RefreshCw } from 'lucide-react';

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
};

const signupConfig = { count: { label: 'Signups', color: 'hsl(250, 85%, 65%)' } } satisfies ChartConfig;
const viewsConfig = { views: { label: 'Views', color: 'hsl(172, 66%, 50%)' } } satisfies ChartConfig;
const parseConfig = { count: { label: 'Parses', color: 'hsl(38, 92%, 55%)' } } satisfies ChartConfig;
const pieConfig = { has: { label: 'Has', color: 'hsl(142, 71%, 45%)' }, missing: { label: 'Missing', color: 'hsl(0, 0%, 30%)' } } satisfies ChartConfig;
const providerConfig = { count: { label: 'Users', color: 'hsl(250, 85%, 65%)' } } satisfies ChartConfig;

const PIE_COLORS = ['hsl(142, 71%, 45%)', 'hsl(0, 0%, 25%)'];
const PROVIDER_COLORS = ['hsl(250, 85%, 65%)', 'hsl(172, 66%, 50%)', 'hsl(38, 92%, 55%)', 'hsl(350, 80%, 55%)', 'hsl(200, 70%, 50%)'];

const TAG_STYLES: Record<string, string> = {
  feature: 'bg-indigo-500/15 text-indigo-400',
  fix: 'bg-amber-500/15 text-amber-400',
  security: 'bg-red-500/15 text-red-400',
  design: 'bg-pink-500/15 text-pink-400',
  content: 'bg-emerald-500/15 text-emerald-400',
  seo: 'bg-cyan-500/15 text-cyan-400',
  legal: 'bg-gray-500/15 text-gray-400',
};

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="px-4 py-3 rounded-lg bg-secondary/30 border border-border/30">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-xl font-bold mt-0.5 tracking-tight text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function CompletePie({ has, total, label }: { has: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((has / total) * 100) : 0;
  const data = [{ name: 'Has', value: has }, { name: 'Missing', value: total - has }];
  return (
    <div className="flex flex-col items-center gap-0.5">
      <ChartContainer config={pieConfig} className="h-[80px] w-[80px]">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={24} outerRadius={34} paddingAngle={2} dataKey="value" strokeWidth={0}>
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
          </Pie>
        </PieChart>
      </ChartContainer>
      <p className="text-lg font-bold text-foreground">{pct}%</p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
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

  if (isUserLoading || loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error || !data) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-destructive font-medium">{error || 'Failed to load'}</p></div>;

  const { kpis, signupTrend, topProfiles, parseTrend, completeness, authProviders, recentUsers, productTimeline } = data;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-5 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-2"><Shield className="h-4 w-4 text-white" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">CVin.Bio platform analytics</p>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <Stat label="Users" value={kpis.totalUsers} />
          <Stat label="Total Views" value={kpis.totalViews} sub={`avg ${kpis.avgViews} · median ${kpis.medianViews}`} />
          <Stat label="CV Parses" value={kpis.totalParses} />
          <Stat label="Active (7d)" value={kpis.usersUpdatedLast7d} sub={`${kpis.totalUsers > 0 ? Math.round((kpis.usersUpdatedLast7d / kpis.totalUsers) * 100) : 0}% of users`} />
          <Stat label="Zero Views" value={kpis.zeroViewProfiles} sub={`${kpis.totalUsers > 0 ? Math.round((kpis.zeroViewProfiles / kpis.totalUsers) * 100) : 0}% of users`} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <Stat label="W/ Photo" value={kpis.usersWithPhoto} sub={`${kpis.totalUsers > 0 ? Math.round((kpis.usersWithPhoto / kpis.totalUsers) * 100) : 0}%`} />
          <Stat label="W/ Experience" value={kpis.usersWithExperience} sub={`${kpis.totalWorkEntries} total entries`} />
          <Stat label="W/ Education" value={kpis.usersWithEducation} sub={`${kpis.totalEduEntries} total entries`} />
          <Stat label="W/ Skills" value={kpis.usersWithSkills} sub={`${kpis.avgSkillsPerUser} avg/user`} />
          <Stat label="Total Links" value={kpis.totalLinksCount} />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-semibold">Signups — 30 Days</CardTitle></CardHeader>
            <CardContent className="px-3 pb-2">
              <ChartContainer config={signupConfig} className="h-[180px] w-full">
                <AreaChart data={signupTrend}>
                  <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(250,85%,65%)" stopOpacity={0.4}/><stop offset="95%" stopColor="hsl(250,85%,65%)" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(0,0%,20%)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 8 }} tickFormatter={(v: string) => `${new Date(v).getDate()}/${new Date(v).getMonth()+1}`} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 8 }} allowDecimals={false} />
                  <Area type="monotone" dataKey="count" stroke="hsl(250,85%,65%)" fill="url(#sg)" strokeWidth={2} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-semibold">Top Profiles</CardTitle></CardHeader>
            <CardContent className="px-3 pb-2">
              <ChartContainer config={viewsConfig} className="h-[180px] w-full">
                <BarChart data={topProfiles} layout="vertical">
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="hsl(0,0%,20%)" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 8 }} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 8 }} width={80} tickFormatter={(v: string) => v.length > 10 ? v.slice(0,10)+'…' : v} />
                  <Bar dataKey="views" fill="hsl(172,66%,50%)" radius={[0,3,3,0]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-semibold">CV Parses — 14 Days</CardTitle></CardHeader>
            <CardContent className="px-3 pb-2">
              <ChartContainer config={parseConfig} className="h-[160px] w-full">
                <BarChart data={parseTrend}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(0,0%,20%)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 8 }} tickFormatter={(v: string) => `${new Date(v).getDate()}/${new Date(v).getMonth()+1}`} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 8 }} allowDecimals={false} />
                  <Bar dataKey="count" fill="hsl(38,92%,55%)" radius={[3,3,0,0]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-semibold">Auth Providers</CardTitle></CardHeader>
            <CardContent className="px-3 pb-2">
              <ChartContainer config={providerConfig} className="h-[160px] w-full">
                <BarChart data={authProviders}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(0,0%,20%)" />
                  <XAxis dataKey="provider" tickLine={false} axisLine={false} tick={{ fontSize: 9 }} tickFormatter={(v: string) => v.charAt(0).toUpperCase()+v.slice(1)} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 8 }} allowDecimals={false} />
                  <Bar dataKey="count" radius={[3,3,0,0]}>{authProviders.map((_,i) => <Cell key={i} fill={PROVIDER_COLORS[i%PROVIDER_COLORS.length]} />)}</Bar>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Profile Completeness */}
        <Card className="shadow-sm">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-semibold">Profile Completeness</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              <CompletePie has={completeness.hasPhoto} total={kpis.totalUsers} label="Photo" />
              <CompletePie has={completeness.hasExperience} total={kpis.totalUsers} label="Experience" />
              <CompletePie has={completeness.hasEducation} total={kpis.totalUsers} label="Education" />
              <CompletePie has={completeness.hasSkills} total={kpis.totalUsers} label="Skills" />
              <CompletePie has={completeness.hasCustomSections} total={kpis.totalUsers} label="Extras" />
              <CompletePie has={completeness.hasLinks} total={kpis.totalUsers} label="Links" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card className="shadow-sm">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-semibold">Recent Signups</CardTitle></CardHeader>
          <CardContent className="px-0 pb-1">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border/40">
                    {['User','Slug','Views','Provider','Photo','CV','Joined'].map(h => (
                      <th key={h} className={`${h==='User'?'text-left px-4':'text-center px-2'} ${h==='Joined'?'text-right px-4':''} py-1.5 text-muted-foreground font-medium uppercase tracking-wider text-[9px]`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u, i) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-2"><p className="font-medium text-foreground text-xs">{u.name||'—'}</p><p className="text-muted-foreground text-[9px]">{u.email}</p></td>
                      <td className="text-center px-2 py-2">{u.slug ? <a href={`https://cvin.bio/${u.slug}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline text-[10px]">/{u.slug}</a> : '—'}</td>
                      <td className="text-center px-2 py-2 font-mono">{u.views}</td>
                      <td className="text-center px-2 py-2"><span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${u.provider==='google'?'bg-blue-500/10 text-blue-400':'bg-purple-500/10 text-purple-400'}`}>{u.provider}</span></td>
                      <td className="text-center px-2 py-2">{u.hasPhoto ? <span className="text-green-400">✓</span> : <span className="text-muted-foreground/30">✗</span>}</td>
                      <td className="text-center px-2 py-2">{u.hasResume ? <span className="text-green-400">✓</span> : <span className="text-muted-foreground/30">✗</span>}</td>
                      <td className="text-right px-4 py-2 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Product Timeline */}
        <Card className="shadow-sm">
          <CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs font-semibold">Product Timeline</CardTitle></CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border/40" />
              <div className="space-y-3">
                {productTimeline.map((e, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-[15px] h-[15px] rounded-full bg-secondary border-2 border-border/60 mt-0.5 shrink-0 z-10" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${TAG_STYLES[e.tag] || 'bg-gray-500/15 text-gray-400'}`}>{e.tag}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <p className="text-xs font-medium text-foreground mt-0.5">{e.title}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{e.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[9px] text-muted-foreground/30 pb-3">admin-only · not indexed</p>
      </main>
    </div>
  );
}
