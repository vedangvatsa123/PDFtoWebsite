
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import posthog from 'posthog-js';
import { EDITOR_EVENTS } from '@/lib/posthog-events';

import Link from 'next/link';

import { useRouter } from 'next/navigation';
import type { UserProfile, WorkExperience, Education, CustomSection, CustomSectionItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Trash2, PlusCircle, Loader2, UploadCloud, FileUp, CheckCircle, XCircle, Share2, Copy, Link2, Download } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Header from '@/components/header';
import { useUser } from '@/auth';
import { createClient } from '@/utils/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LoginDialog } from '@/components/login-dialog';
import TemplateModern from '@/app/[slug]/templates/modern-creative';
import CustomSectionsEditor from './custom-sections-editor';
import { AvatarCropper } from '@/components/avatar-cropper';

function dataURLtoFile(dataurl: string, filename: string): File | null {
    const arr = dataurl.split(',');
    if (arr.length < 2) { return null; }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) { return null; }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

function generateBaseSlug(name: string) {
  const firstName = name.trim().split(/\s+/)[0] || 'user';
  const base = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return base || 'user';
}

// Convert ALL CAPS names to Title Case (leaves mixed-case names untouched)
function smartTitleCase(name: string): string {
  if (!name) return name;
  // Only convert if the name is ALL CAPS (or all lowercase)
  const isAllCaps = name === name.toUpperCase() && /[A-Z]/.test(name);
  const isAllLower = name === name.toLowerCase();
  if (isAllCaps || isAllLower) {
    return name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
  return name;
}

const ResumeUploadPrompt = ({ onFileChange, isGenerating }: { onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void, isGenerating: boolean }) => (
    <label htmlFor="resume-upload" className={`flex w-full items-center justify-center rounded-lg border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 py-4 px-6 text-center transition-colors mb-4 ${isGenerating ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}>
        {isGenerating ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /><span className="text-sm font-medium text-primary">Generating your profile...</span></>
        ) : (
            <><UploadCloud className="mr-2 h-4 w-4 text-primary" /><span className="text-sm font-medium text-primary">Upload your CV to automatically fill details</span></>
        )}
        <Input id="resume-upload" type="file" className="hidden" accept=".pdf,.doc,.docx,.rtf,.txt,.jpg,.jpeg,.png,.webp,.heic" onChange={onFileChange} disabled={isGenerating} />
    </label>
);

const ProfileCompleteness = ({ profile, work, education, skills, onNavigate }: { profile: Partial<UserProfile>, work: WorkExperience[], education: Education[], skills: string[], onNavigate: (tab: string) => void }) => {
    const completeness = useMemo(() => {
        const checks = [
            { name: "Add a Profile Photo", complete: !!profile.avatarUrl, targetId: 'avatar-upload' },
            { name: "Write a Summary", complete: !!profile.summary, targetId: 'summary' },
            { name: "Add your Location", complete: !!profile.location, targetId: 'location' },
            { name: "Add Work Experience", complete: work.some(w => (w.title && w.title.trim() !== '') || (w.company && w.company.trim() !== '') || (w.description && w.description.trim() !== '')), targetId: 'work-experience-section' },
            { name: "Add your Education", complete: education.some(e => (e.institution && e.institution.trim() !== '') || (e.degree && e.degree.trim() !== '')), targetId: 'education-section' },
            { name: "Add at least one Skill", complete: skills.some(s => typeof s === 'string' ? s.trim() !== '' : !!s), targetId: 'skills-section' }
        ];
        const completeCount = checks.filter(c => c.complete).length;
        const totalCount = checks.length;
        const score = Math.round((completeCount / totalCount) * 100);

        return { score, checks, isComplete: completeCount === totalCount };
    }, [profile, work, education, skills]);

    const { score, checks, isComplete } = completeness;

    return (
        <Card className="h-full shadow-sm flex flex-col justify-center">
            <CardContent className="pt-4 pb-3">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Job Readiness Score</p>
                    <div className="flex items-center gap-2">
                        <Progress value={score} className="h-1.5 w-16 sm:w-24 bg-secondary" />
                        <span className="text-xs font-bold text-foreground">{score}%</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {checks.map(c => (
                        <div 
                            key={c.name} 
                            onClick={() => {
                                const el = document.getElementById(c.targetId);
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    el.focus({ preventScroll: true });
                                }
                            }}
                            className={`cursor-pointer flex items-center gap-2 p-2 rounded-md border text-[10px] transition-all ${c.complete ? 'bg-secondary/40 border-transparent text-muted-foreground/60 line-through grayscale' : 'bg-background shadow-none border-border/60 hover:border-primary/40 font-medium text-foreground hover:shadow-sm'}`}
                        >
                            {c.complete ? <CheckCircle className="h-3 w-3 text-green-500 shrink-0" /> : <div className="h-2.5 w-2.5 rounded-full border border-gray-400 shrink-0" />}
                            <span className="truncate" title={c.name}>{c.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const VIEW_MILESTONES = [10, 50, 100, 500, 1000, 5000];

const last7DaysConfig = { views: { label: "Views", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;

function ViewsLast7DaysChart({ userId }: { userId: string }) {
    // Supabase has no daily views tracking yet, stubbing to 0
    const [chartData, setChartData] = useState<{ date: string; views: number }[] | null>(null);

    useEffect(() => {
        const days = [0,1,2,3,4,5,6].map(i => {
            const d = new Date(); d.setDate(d.getDate() - i);
            return { date: d.toLocaleDateString('en-US', { weekday: 'short' }), views: 0 };
        }).reverse();
        setChartData(days);
    }, []);

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
                {chartData ? (
                    <ChartContainer config={last7DaysConfig} className="h-[120px] w-full">
                        <BarChart accessibilityLayer data={chartData}>
                             <CartesianGrid vertical={false} />
                             <XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false} tick={{ fontSize: 10 }} />
                            <Bar dataKey="views" fill="var(--color-views)" radius={3} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="h-[120px] w-full flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ── Rotating share copy pools (randomly picked per user) ──────────────────────
const LINKEDIN_CAPTIONS = [
  (s: string) => `Stopped sending PDFs.\n\nHere's my profile instead → https://cvin.bio/${s}`,
  (s: string) => `Killed my resume.pdf. Here's the link.\nhttps://cvin.bio/${s}`,
  (s: string) => `My resume has a URL now.\nhttps://cvin.bio/${s}`,
  (s: string) => `No more "see attached".\nhttps://cvin.bio/${s}`,
  (s: string) => `Recruiters spend 6 seconds on a PDF. Give them something worth clicking.\nhttps://cvin.bio/${s}`,
  (s: string) => `Updated my resume. Didn't attach it.\nhttps://cvin.bio/${s}`,
  (s: string) => `Resume? I've got a link.\nhttps://cvin.bio/${s}`,
  (s: string) => `Just retired resume_final_v3.pdf\nhttps://cvin.bio/${s}`,
  (s: string) => `The attachment era is over.\nhttps://cvin.bio/${s}`,
  (s: string) => `Sharing a link, not a file.\nhttps://cvin.bio/${s}`,
  (s: string) => `My CV is now a website. Wild.\nhttps://cvin.bio/${s}`,
  (s: string) => `No download required.\nhttps://cvin.bio/${s}`,
  (s: string) => `Open to opportunities. Here's my profile → https://cvin.bio/${s}`,
  (s: string) => `Sent my last PDF resume today. Everything else is a link.\nhttps://cvin.bio/${s}`,
  (s: string) => `If you're still emailing PDFs, there's a better way.\nhttps://cvin.bio/${s}`,
];

const X_COPIES = [
  (s: string) => `stopped attaching resumes\n\ndropped a link instead\nhttps://cvin.bio/${s}`,
  (s: string) => `my resume is a url now\nhttps://cvin.bio/${s}`,
  (s: string) => `pdf resume? nah\n\nhttps://cvin.bio/${s}`,
  (s: string) => `killed my resume.pdf\n\nhttps://cvin.bio/${s} feel free to stalk`,
  (s: string) => `no more "see attached"\n\nhttps://cvin.bio/${s}`,
  (s: string) => `my cv is a link now\nhttps://cvin.bio/${s}`,
  (s: string) => `resume evolution: doc → pdf → link\n\nhttps://cvin.bio/${s}`,
  (s: string) => `finally retired resume.pdf\nhttps://cvin.bio/${s}`,
  (s: string) => `open to work. also open to sharing better than a pdf → https://cvin.bio/${s}`,
  (s: string) => `sharing my profile not a 2mb pdf\nhttps://cvin.bio/${s}`,
  (s: string) => `recruiters: here's the link https://cvin.bio/${s}`,
  (s: string) => `turns out a resume can just be a url\nhttps://cvin.bio/${s}`,
  (s: string) => `your resume can have dark mode\nhttps://cvin.bio/${s}`,
  (s: string) => `dropped the pdf habit\nhttps://cvin.bio/${s}`,
  (s: string) => `no version numbers. no attachments. just a link.\nhttps://cvin.bio/${s}`,
];

const WHATSAPP_COPIES = [
  (s: string) => `pdf resume? nah\nhere's mine: https://cvin.bio/${s}`,
  (s: string) => `my resume has a url lol\nhttps://cvin.bio/${s}`,
  (s: string) => `bro just share the link\nhttps://cvin.bio/${s}`,
  (s: string) => `no more resume.pdf\nhttps://cvin.bio/${s}`,
  (s: string) => `check my profile: https://cvin.bio/${s}`,
  (s: string) => `my cv is now a website lmao\nhttps://cvin.bio/${s}`,
  (s: string) => `dropped the pdf habit → https://cvin.bio/${s}`,
  (s: string) => `sharing my profile, not a pdf\nhttps://cvin.bio/${s}`,
  (s: string) => `https://cvin.bio/${s} – feel free to share with whoever`,
  (s: string) => `stopped sending pdfs. here's my profile: https://cvin.bio/${s}`,
  (s: string) => `my resume has dark mode now\nhttps://cvin.bio/${s}`,
  (s: string) => `no download needed\nhttps://cvin.bio/${s}`,
  (s: string) => `here's the link instead of a file\nhttps://cvin.bio/${s}`,
  (s: string) => `retired the pdf. got a url.\nhttps://cvin.bio/${s}`,
  (s: string) => `sharing cvin.bio/${s} – way better than a pdf`,
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export default function EditorPage() {
    const { user, isUserLoading } = useUser();
    const supabase = createClient();
    const router = useRouter();
    const { toast } = useToast();
    
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [initialSlug, setInitialSlug] = useState<string | undefined>(undefined);
    
    // Structured data states
    const [workItems, setWorkItems] = useState<WorkExperience[]>([]);
    const [educationItems, setEducationItems] = useState<Education[]>([]);
    const [skillItems, setSkillItems] = useState<string[]>([]);
    const [customSections, setCustomSections] = useState<CustomSection[]>([]);
    
    const [pageIsLoading, setPageIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const [activeThemeId, setActiveThemeId] = useState<string | undefined>('modern-creative');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationSlug, setCelebrationSlug] = useState('');
    const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
    const [copiedLinkedIn, setCopiedLinkedIn] = useState('');
    const [copiedX, setCopiedX] = useState('');
    const [copiedWhatsApp, setCopiedWhatsApp] = useState('');
    const [newLinkType, setNewLinkType] = useState('');
    const [newLinkValue, setNewLinkValue] = useState('');


    const fireCelebration = useCallback((slug: string) => {
        if (typeof window === 'undefined') return;
        if (localStorage.getItem('cvibio_celebrated')) return;
        localStorage.setItem('cvibio_celebrated', '1');
        setCelebrationSlug(slug);
        setCopiedLinkedIn(pick(LINKEDIN_CAPTIONS)(slug));
        setCopiedX(pick(X_COPIES)(slug));
        setCopiedWhatsApp(pick(WHATSAPP_COPIES)(slug));
        setShowCelebration(true);
    }, []);

    // Generate 9:16 story card whenever celebration modal opens
    useEffect(() => {
        if (!showCelebration || !celebrationSlug) return;
        setCardDataUrl(null);
        const name = profile.fullName || '';
        const timer = setTimeout(() => {
            try {
                const W = 1080, H = 1920;
                const canvas = document.createElement('canvas');
                canvas.width = W; canvas.height = H;
                const ctx = canvas.getContext('2d')!;
                // Background gradient
                const grad = ctx.createLinearGradient(0, 0, W, H);
                grad.addColorStop(0, '#1e1b4b');
                grad.addColorStop(0.5, '#3730a3');
                grad.addColorStop(1, '#4c1d95');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, W, H);
                // Dot grid
                ctx.fillStyle = 'rgba(255,255,255,0.045)';
                for (let x = 72; x < W; x += 90) for (let y = 72; y < H; y += 90) {
                    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
                }
                // Top label
                ctx.fillStyle = 'rgba(199,210,254,0.75)';
                ctx.font = '500 44px -apple-system,BlinkMacSystemFont,sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('CVin.Bio', W / 2, 210);
                // Divider
                ctx.strokeStyle = 'rgba(165,180,252,0.3)'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(220, 255); ctx.lineTo(860, 255); ctx.stroke();
                // Name — auto-size
                ctx.fillStyle = 'rgba(255,255,255,0.97)';
                let fs = 108;
                ctx.font = `bold ${fs}px -apple-system,BlinkMacSystemFont,sans-serif`;
                while (ctx.measureText(name).width > 900 && fs > 52) { fs -= 4; ctx.font = `bold ${fs}px -apple-system,BlinkMacSystemFont,sans-serif`; }
                ctx.fillText(name, W / 2, 890);
                // Tagline
                ctx.fillStyle = 'rgba(199,210,254,0.88)';
                ctx.font = '54px -apple-system,BlinkMacSystemFont,sans-serif';
                ctx.fillText('pdf is dead.', W / 2, 1010);
                ctx.fillText("here's my link \u2193", W / 2, 1082);
                // URL pill
                const urlText = `cvin.bio/${celebrationSlug}`;
                let ufs = 72;
                ctx.font = `bold ${ufs}px -apple-system,BlinkMacSystemFont,sans-serif`;
                while (ctx.measureText(urlText).width > 780 && ufs > 44) { ufs -= 4; ctx.font = `bold ${ufs}px -apple-system,BlinkMacSystemFont,sans-serif`; }
                ctx.fillStyle = 'rgba(255,255,255,0.13)';
                ctx.beginPath(); ctx.roundRect(130, 1210, 820, 130, 22); ctx.fill();
                ctx.fillStyle = 'white';
                ctx.fillText(urlText, W / 2, 1290);
                // Bottom
                ctx.fillStyle = 'rgba(165,180,252,0.5)';
                ctx.font = '40px -apple-system,BlinkMacSystemFont,sans-serif';
                ctx.fillText('Scan · Click · Connect', W / 2, 1770);
                setCardDataUrl(canvas.toDataURL('image/png'));
            } catch (e) { console.error('Story card error', e); }
        }, 150);
        return () => clearTimeout(timer);
    }, [showCelebration, celebrationSlug, profile.fullName]);

    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);




    const processedPendingResume = useRef(false);
    const guestInitDone = useRef(false);
    
    // Unique ID binding this specific editor tab tightly to any previews it opens preventing multi-tab broadcast storms
    const channelId = useRef(`preview_${Math.random().toString(36).substring(2, 10)}`);

    // Guest mode: load parsed resume from sessionStorage without needing auth
    useEffect(() => {
        if (!isUserLoading && !user && !guestInitDone.current) {
            guestInitDone.current = true;
            const parsed = sessionStorage.getItem('parsedResume') || localStorage.getItem('parsedResume');
            if (parsed) {
                try {
                    const data = JSON.parse(parsed);
                    const slug = generateBaseSlug(data.personalInfo?.fullName || 'user');
                    const links = data.links || [];
                    const getLink = (t: string) => links.find((l: any) => l.type === t)?.value || '';

                    setProfile({
                        fullName: data.personalInfo?.fullName || '',
                        email: data.personalInfo?.email || getLink('email') || '',
                        phone: data.personalInfo?.phone || getLink('phone') || '',
                        location: data.personalInfo?.location || getLink('location') || '',
                        website: data.personalInfo?.website || getLink('website') || '',
                        github: data.personalInfo?.github || getLink('github') || '',
                        linkedin: data.personalInfo?.linkedin || getLink('linkedin') || '',
                        summary: data.summary || '',
                        slug,
                        avatarUrl: data.personalInfo?.avatarUrl,
                        themeId: 'modern-creative',
                        skills: (data.skills || []).map((s: any) => s.name || s),
                    });
                    setActiveThemeId('modern-creative');
                    setWorkItems((data.workExperience || []).map((w: any, i: number) => ({ ...w, id: `guest-work-${i}`, userProfileId: '' })));
                    setEducationItems((data.education || []).map((e: any, i: number) => ({ ...e, id: `guest-edu-${i}`, userProfileId: '' })));
                    setSkillItems((data.skills || []).map((s: any) => s.name || s));
                    setCustomSections((data.customSections || []).map((cs: any, i: number) => ({ ...cs, id: cs.id || `guest-cs-${i}`, userProfileId: '' })));
                } catch (e) {
                    console.error('Failed to restore guest session:', e);
                    toast({ variant: 'destructive', title: 'Restore Error', description: e instanceof Error ? e.message : 'Could not restore your previous session.' });
                }
            }
            setPageIsLoading(false);
        }
    }, [isUserLoading, user]);


    const fetchProfileData = useCallback(async () => {
        if (!user) return;
        setPageIsLoading(true);
        let profileData: UserProfile;
        try {
            const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (p) {
                const links = p.links || [];
                const getLink = (t: string) => links.find((l: any) => l.type === t)?.value || '';

                let finalSlug = p.username || '';
                
                // If the database trigger defaulted their slug to their long UUID, generate a prettier one.
                if (finalSlug === user.id) {
                    let baseSlug = generateBaseSlug(user.user_metadata?.full_name || p.full_name || 'user');
                    let newSlug = baseSlug;
                    let isUnique = false;
                    let attempt = 0;
                    while (!isUnique && attempt < 100) {
                        const { data: existing } = await supabase.from('profiles').select('id').eq('username', newSlug).maybeSingle();
                        if (!existing || existing.id === user.id) {
                            isUnique = true;
                        } else {
                            attempt++;
                            newSlug = `${baseSlug}${attempt}`;
                        }
                    }
                    finalSlug = newSlug;
                    await supabase.from('profiles').update({ username: finalSlug }).eq('id', user.id);
                }

                profileData = {
                    userId: p.id,
                    fullName: p.full_name || '',
                    email: getLink('email') || user.email || '',
                    phone: getLink('phone'),
                    location: getLink('location'),
                    website: getLink('website'),
                    github: getLink('github'),
                    linkedin: getLink('linkedin'),
                    summary: p.about || '',
                    slug: finalSlug,
                    avatarUrl: p.profile_picture_url || '',
                    avatarHint: 'person portrait',
                    themeId: p.theme_id || 'modern-creative',
                    viewCount: p.views || 0,
                    skills: p.skills || [],
                };
                setProfile(profileData);
                setInitialSlug(profileData.slug);
                setActiveThemeId(profileData.themeId);
                setWorkItems(p.experience || []);
                setEducationItems(p.education || []);
                setSkillItems(profileData.skills || []);
                setCustomSections(p.custom_sections || []);
            } else {
                // New user — create a blank profile with a unique slug
                let baseSlug = generateBaseSlug(user.user_metadata?.full_name || 'user');
                let newSlug = baseSlug;
                // Ensure slug uniqueness before insert
                let isUnique = false;
                let attempt = 0;
                while (!isUnique && attempt < 100) {
                    const { data: existing } = await supabase.from('profiles').select('id').eq('username', newSlug).maybeSingle();
                    if (!existing || existing.id === user.id) {
                        isUnique = true;
                    } else {
                        attempt++;
                        newSlug = `${baseSlug}${attempt}`;
                    }
                }
                const initialLinks = user.email ? [{ type: 'email', value: user.email }] : [];
                const newProfile = { id: user.id, username: newSlug, full_name: user.user_metadata?.full_name || 'Your Name', profile_picture_url: user.user_metadata?.avatar_url || '', experience: [], education: [], custom_sections: [], skills: [], links: initialLinks };
                const { error: insertError } = await supabase.from('profiles').upsert(newProfile);
                if (insertError) console.error('Profile creation error:', insertError);
                profileData = { userId: user.id, fullName: newProfile.full_name, email: user.email || '', summary: '', slug: newSlug, avatarUrl: newProfile.profile_picture_url, avatarHint: '', themeId: 'modern-creative', viewCount: 0, skills: [] };
                setProfile(profileData);
                setInitialSlug(newSlug);
            }
            return { profile: profileData };
        } catch (e) {
            console.error('fetchProfileData error:', e);
            // Set minimal profile so the page doesn't stay blank
            profileData = { userId: user.id, fullName: user.user_metadata?.full_name || '', email: user.email || '', summary: '', slug: '', avatarUrl: user.user_metadata?.avatar_url || '', avatarHint: '', themeId: 'modern-creative', viewCount: 0, skills: [] };
            setProfile(profileData);
            return { profile: profileData };
        } finally {
            setPageIsLoading(false);
        }
    }, [user, supabase]);

    const autoSave = useCallback(async (collectionName: string, id: string, data: any) => {
        if (!user) return;
        setIsSaving(true);
        try {
            if (collectionName === 'profile') {
                const map: any = {};
                if ('fullName' in data) map.full_name = data.fullName;
                if ('summary' in data) map.about = data.summary;
                if ('avatarUrl' in data) map.profile_picture_url = data.avatarUrl;
                if ('slug' in data) map.username = data.slug?.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
                if ('skills' in data) map.skills = data.skills;
                if ('links' in data) map.links = data.links;
                if (Object.keys(map).length > 0) {
                    const { error } = await supabase.from('profiles').update(map).eq('id', user.id);
                    if (error) {
                        console.error('Autosave DB error:', error);
                        toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
                    }
                }
            }
        } catch (e) {
            console.error('Autosave error:', e);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save changes. Check your connection.' });
        } finally {
            setTimeout(() => setIsSaving(false), 700);
        }
    }, [user, supabase, toast]);

    // ── Extra (non-core) links helpers ──
    const CORE_LINK_TYPES_SET = new Set(['email', 'phone', 'location', 'website', 'github', 'linkedin']);

    const saveExtraLinks = useCallback(async (extraLinks: Array<{type: string; value: string}>) => {
        if (!user) return;
        const coreLinks = [
            { type: 'email',    value: profile.email },
            { type: 'phone',    value: profile.phone },
            { type: 'location', value: profile.location },
            { type: 'website',  value: profile.website },
            { type: 'github',   value: profile.github },
            { type: 'linkedin', value: profile.linkedin },
        ].filter(l => !!l.value) as Array<{type: string; value: string}>;
        const merged = [...coreLinks, ...extraLinks];
        setProfile(prev => ({ ...prev, links: merged }));
        autoSave('profile', user.id, { links: merged });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, profile.email, profile.phone, profile.location, profile.website, profile.github, profile.linkedin, autoSave]);

    const addExtraLink = useCallback(() => {
        const t = newLinkType.trim().toLowerCase().replace(/\s+/g, '-');
        const v = newLinkValue.trim();
        if (!t || !v) return;
        const current = (profile.links || []).filter((l: any) => !CORE_LINK_TYPES_SET.has(l.type));
        saveExtraLinks([...current, { type: t, value: v }]);
        setNewLinkType('');
        setNewLinkValue('');
    }, [newLinkType, newLinkValue, profile.links, saveExtraLinks]);

    const removeExtraLink = useCallback((idx: number) => {
        const current = (profile.links || []).filter((l: any) => !CORE_LINK_TYPES_SET.has(l.type));
        saveExtraLinks(current.filter((_: any, i: number) => i !== idx));
    }, [profile.links, saveExtraLinks]);


    const syncArray = useCallback(async (column: string, array: any[]) => {
        if (!user) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.from('profiles').update({ [column]: array }).eq('id', user.id);
            if (error) {
                console.error('SyncArray DB error:', error);
                toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
            }
        } catch (e) {
            console.error('SyncArray error:', e);
        } finally {
            setTimeout(() => setIsSaving(false), 700);
        }
    }, [user, supabase, toast]);

    const handleResumeUpload = useCallback(async (resumeFile: File) => {
        if (!resumeFile) {
            toast({ variant: 'destructive', title: 'Error', description: 'No file selected.' });
            return;
        }
        
        setIsGenerating(true);
        posthog.capture(EDITOR_EVENTS.CV_PARSE_STARTED, { file_type: resumeFile.type, file_size: resumeFile.size });
        toast({ title: 'Processing CV...', description: `Analyzing ${resumeFile.name}...` });
        
        try {
            const formData = new FormData();
            formData.append('resume', resumeFile);
            const response = await fetch('/api/parse-resume', { method: 'POST', body: formData });
            
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to parse resume');
            const extractedData = await response.json();
            console.log('CV Parsed Successfully:', extractedData);

            const skillsArr = (extractedData.skills || []).map((s: any) => s.name || s);
            const slug = extractedData.personalInfo?.slug || generateBaseSlug(extractedData.personalInfo?.fullName || 'user');

            // --- SHARED UI UPDATE (Instant) ---
            setProfile(prev => ({
                ...prev,
                fullName: smartTitleCase(extractedData.personalInfo?.fullName || '') || prev.fullName || '',
                email: extractedData.personalInfo?.email || prev.email || '',
                phone: extractedData.personalInfo?.phone || prev.phone || '',
                location: extractedData.personalInfo?.location || prev.location || '',
                website: extractedData.personalInfo?.website || prev.website || '',
                summary: extractedData.summary || prev.summary || '',
                slug: prev.slug || slug,
                skills: skillsArr,
            }));
            
            const workItemsWithIds = (extractedData.workExperience || []).map((w: any, i: number) => ({ ...w, id: w.id || `work-${Date.now()}-${i}`, userProfileId: user?.id || '' }));
            const eduItemsWithIds = (extractedData.education || []).map((e: any, i: number) => ({ ...e, id: e.id || `edu-${Date.now()}-${i}`, userProfileId: user?.id || '' }));
            const customSectionsWithIds = (extractedData.customSections || []).map((cs: any, i: number) => {
                const csId = cs.id || `section-${Date.now()}-${i}`;
                const items = (cs.items || []).map((item: any, j: number) => ({ ...item, id: item.id || `csitem-${Date.now()}-${i}-${j}` }));
                return { ...cs, id: csId, items, userProfileId: user?.id || '' };
            });

            setWorkItems(workItemsWithIds);
            setEducationItems(eduItemsWithIds);
            setSkillItems(skillsArr);
            setCustomSections(customSectionsWithIds);

            // Configure links for the DB
            const existingLinks = user ? ((await supabase.from('profiles').select('links').eq('id', user.id).single()).data?.links || []) : [];
            const newLinksMap = new Map(existingLinks.map((l: any) => [l.type, l.value]));
            
            if (extractedData.personalInfo?.email) newLinksMap.set('email', extractedData.personalInfo.email);
            if (extractedData.personalInfo?.phone) newLinksMap.set('phone', extractedData.personalInfo.phone);
            if (extractedData.personalInfo?.location) newLinksMap.set('location', extractedData.personalInfo.location);
            if (extractedData.personalInfo?.website) newLinksMap.set('website', extractedData.personalInfo.website);
            if (extractedData.personalInfo?.github) newLinksMap.set('github', extractedData.personalInfo.github);
            if (extractedData.personalInfo?.linkedin) newLinksMap.set('linkedin', extractedData.personalInfo.linkedin);
            
            // Merge additional links (ResearchGate, Google Scholar, Twitter, etc.)
            const additionalLinks = extractedData.personalInfo?.additionalLinks || [];
            for (const link of additionalLinks) {
              if (link.url && link.label) {
                newLinksMap.set(link.label.toLowerCase().replace(/\s+/g, '-'), link.url);
              }
            }
            
            const combinedLinks = Array.from(newLinksMap.entries()).map(([type, value]) => ({ type, value })).filter(l => !!l.value);

            // --- DATABASE SYNC (If Auth) ---
            if (user) {
                const { data: currentProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                const updatedProfile = {
                    id: user.id,
                    full_name: smartTitleCase(extractedData.personalInfo?.fullName || '') || currentProfile?.full_name || '',
                    username: currentProfile?.username || slug,
                    about: extractedData.summary || currentProfile?.about || '',
                    profile_picture_url: currentProfile?.profile_picture_url || user.user_metadata?.avatar_url || '',
                    skills: skillsArr,
                    experience: workItemsWithIds,
                    education: eduItemsWithIds,
                    custom_sections: customSectionsWithIds,
                    links: combinedLinks
                };
                
                const { error: upsertError } = await supabase.from('profiles').upsert(updatedProfile);
                if (upsertError) throw upsertError;
                
                toast({ title: 'Success!', description: 'Your profile has been saved.' });
                posthog.capture(EDITOR_EVENTS.CV_PARSE_SAVED, { slug: updatedProfile.username, source: 'cv_parse' });
                await fetchProfileData();
            } else {
                // Keep session storage AND localStorage in sync for later login transition
                sessionStorage.setItem('parsedResume', JSON.stringify(extractedData));
                try { localStorage.setItem('parsedResume', JSON.stringify(extractedData)); localStorage.setItem('parsedResumeTimestamp', Date.now().toString()); } catch (e) { /* quota exceeded */ }
                posthog.capture(EDITOR_EVENTS.CV_PARSE_ANONYMOUS);
                toast({ title: 'CV Parsed!', description: 'Sign up to publish this profile.' });
            }
        } catch (error) {
            console.error('Upload Process Error:', error);
            const msg = error instanceof Error ? error.message : 'Could not update fields.';
            posthog.capture(EDITOR_EVENTS.CV_PARSE_FAILED, { error: msg });
            toast({ variant: 'destructive', title: 'Update Failed', description: msg });
        } finally {
            setIsGenerating(false);
            setFile(null); setFileName(null);
        }
    }, [user, supabase, fetchProfileData, toast, setFile, setFileName]);

    useEffect(() => {
        if (user && !processedPendingResume.current) {
            processedPendingResume.current = true; // Mark immediately to prevent double-firing
            fetchProfileData().then(async data => {
                const parsedData = sessionStorage.getItem('parsedResume') || localStorage.getItem('parsedResume');
                const pendingResumeDataUrl = sessionStorage.getItem('pendingResume');
                const pendingResumeName = sessionStorage.getItem('pendingResumeName');
                
                if (parsedData) {
                    // Check if this is a returning user with existing data — if so, DON'T overwrite with stale localStorage
                    const { data: existingProfile } = await supabase.from('profiles').select('experience, education').eq('id', user.id).single();
                    const hasExistingData = existingProfile && (
                        (Array.isArray(existingProfile.experience) && existingProfile.experience.length > 0) ||
                        (Array.isArray(existingProfile.education) && existingProfile.education.length > 0)
                    );
                    
                    if (hasExistingData && !sessionStorage.getItem('parsedResume')) {
                        // Check timestamp — if data was saved <5 min ago, it's from a recent auth flow (magic link / mobile OAuth)
                        const savedAt = parseInt(localStorage.getItem('parsedResumeTimestamp') || '0', 10);
                        const isFresh = (Date.now() - savedAt) < 5 * 60 * 1000; // 5 minutes
                        if (!isFresh) {
                            // Stale localStorage from a previous session — discard it, don't overwrite real DB data
                            localStorage.removeItem('parsedResume');
                            localStorage.removeItem('parsedResumeTimestamp');
                            return;
                        }
                    }

                    // Safe manual update mimicking handleResumeUpload using parsed JSON
                    try {
                        const extractedData = JSON.parse(parsedData);
                        const skillsArr = (extractedData.skills || []).map((s: any) => s.name || s);
                        const { data: currentProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                        
                        const workItemsWithIds = (extractedData.workExperience || []).map((w: any, i: number) => ({ ...w, id: w.id || `work-${Date.now()}-${i}`, userProfileId: user?.id || '' }));
                        const eduItemsWithIds = (extractedData.education || []).map((e: any, i: number) => ({ ...e, id: e.id || `edu-${Date.now()}-${i}`, userProfileId: user?.id || '' }));
                        const customSectionsWithIds = (extractedData.customSections || []).map((cs: any, i: number) => {
                            const csId = cs.id || `section-${Date.now()}-${i}`;
                            const items = (cs.items || []).map((item: any, j: number) => ({ ...item, id: item.id || `csitem-${Date.now()}-${i}-${j}` }));
                            return { ...cs, id: csId, items, userProfileId: user?.id || '' };
                        });

                        const existingLinks = currentProfile?.links || [];
                        const newLinksMap = new Map(existingLinks.map((l: any) => [l.type, l.value]));
                        
                        if (extractedData.personalInfo?.email) newLinksMap.set('email', extractedData.personalInfo.email);
                        if (extractedData.personalInfo?.phone) newLinksMap.set('phone', extractedData.personalInfo.phone);
                        if (extractedData.personalInfo?.location) newLinksMap.set('location', extractedData.personalInfo.location);
                        if (extractedData.personalInfo?.website) newLinksMap.set('website', extractedData.personalInfo.website);
                        if (extractedData.personalInfo?.github) newLinksMap.set('github', extractedData.personalInfo.github);
                        if (extractedData.personalInfo?.linkedin) newLinksMap.set('linkedin', extractedData.personalInfo.linkedin);
                        
                        // Merge additional links (ResearchGate, Google Scholar, Twitter, etc.)
                        const additionalLinks = extractedData.personalInfo?.additionalLinks || [];
                        for (const link of additionalLinks) {
                          if (link.url && link.label) {
                            newLinksMap.set(link.label.toLowerCase().replace(/\s+/g, '-'), link.url);
                          }
                        }
                        
                        const combinedLinks = Array.from(newLinksMap.entries()).map(([type, value]) => ({ type, value })).filter(l => !!l.value);

                        let baseSlug = generateBaseSlug(extractedData.personalInfo?.fullName || user.user_metadata?.full_name || 'user');
                        let finalSlug = currentProfile?.username || extractedData.personalInfo?.slug || baseSlug;
                        let isUnique = false;
                        let attempt = 0;
                        while (!isUnique && attempt < 100) {
                            const { data: existing } = await supabase.from('profiles').select('id').eq('username', finalSlug).maybeSingle();
                            if (!existing || existing.id === user.id) {
                                isUnique = true;
                            } else {
                                attempt++;
                                finalSlug = `${baseSlug}${attempt}`;
                            }
                        }

                        const updatedProfile = {
                            id: user.id,
                            full_name: smartTitleCase(extractedData.personalInfo?.fullName || '') || currentProfile?.full_name || user.user_metadata?.full_name || '',
                            username: finalSlug,
                            about: extractedData.summary || currentProfile?.about || '',
                            profile_picture_url: extractedData.personalInfo?.avatarUrl || currentProfile?.profile_picture_url || user.user_metadata?.avatar_url || '',
                            theme_id: extractedData.themeId || currentProfile?.theme_id || 'modern-creative',
                            skills: skillsArr,
                            experience: extractedData.workExperience ? workItemsWithIds : (currentProfile?.experience || []),
                            education: extractedData.education ? eduItemsWithIds : (currentProfile?.education || []),
                            custom_sections: extractedData.customSections ? customSectionsWithIds : (currentProfile?.custom_sections || []),
                            links: combinedLinks
                        };
                        await supabase.from('profiles').upsert(updatedProfile);
                        toast({ title: 'Success!', description: 'Your profile has been updated from your CV.' });
                        sessionStorage.removeItem('parsedResume');
                        localStorage.removeItem('parsedResume');
                        localStorage.removeItem('parsedResumeTimestamp');
                        await fetchProfileData(); // Reload the UI with updated DB data
                    } catch (e) {
                        console.error('Parse failed', e);
                        toast({ variant: 'destructive', title: 'Import Failed', description: e instanceof Error ? e.message : 'Could not import your resume data. Please try uploading again.' });
                    }
                } else if (pendingResumeDataUrl && pendingResumeName && data?.profile) {
                    const resumeFile = dataURLtoFile(pendingResumeDataUrl, pendingResumeName);
                    if (resumeFile) handleResumeUpload(resumeFile); // Triggers real generation
                }
            });
        }
    }, [user, fetchProfileData, handleResumeUpload, supabase, toast]);

    const [slugError, setSlugError] = useState<string | null>(null);
    const [slugSuccess, setSlugSuccess] = useState<boolean>(false);
    const [isCheckingSlug, setIsCheckingSlug] = useState<boolean>(false);

    useEffect(() => {
        if (!user || profile.slug === undefined || profile.slug === initialSlug) {
            setSlugError(null);
            setSlugSuccess(false);
            return;
        }
        
        const cleanSlug = profile.slug.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
        if (cleanSlug.length < 3) {
            setSlugError('Must be at least 3 characters.');
            setSlugSuccess(false);
            return;
        }
        
        const RESERVED_SLUGS = ['admin', 'blog', 'editor', 'signup', 'login', 'preview', 'privacy', 'terms', 'auth', 'api', 'settings', 'dashboard', 'sitemap', 'robots', 'media'];
        if (RESERVED_SLUGS.includes(cleanSlug)) {
            setSlugError('This URL is reserved. Please choose a different one.');
            setSlugSuccess(false);
            return;
        }

        setIsCheckingSlug(true);
        setSlugError(null);
        setSlugSuccess(false);

        const timer = setTimeout(async () => {
            const { data } = await supabase.from('profiles').select('id').eq('username', profile.slug).maybeSingle();
            if (data && data.id !== user.id) {
                setSlugError('This URL is already taken.');
                setSlugSuccess(false);
            } else {
                setSlugError(null);
                setSlugSuccess(true);
            }
            setIsCheckingSlug(false);
        }, 400);

        return () => clearTimeout(timer);
    }, [profile.slug, initialSlug, user, supabase]);

    // =========================================================================
    // BROADCAST CHANNEL: Ephemeral Sync to Preview Tab (Zero-Disk PII Leaks)
    // =========================================================================
    useEffect(() => {
        const bc = new BroadcastChannel(channelId.current);
        const broadcastState = () => {
            const snapshot = {
                personalInfo: { 
                    fullName: profile.fullName, 
                    email: profile.email, 
                    phone: profile.phone, 
                    location: profile.location, 
                    website: profile.website, 
                    github: profile.github, 
                    linkedin: profile.linkedin, 
                    slug: profile.slug,
                    avatarUrl: profile.avatarUrl,
                    links: profile.links || []
                },
                summary: profile.summary,
                themeId: activeThemeId,
                workExperience: workItems,
                education: educationItems,
                skills: skillItems,
                customSections: customSections
            };
            bc.postMessage({ type: 'UPDATE', payload: snapshot });
        };

        // Broadcast automatically whenever any of these state variables change natively
        broadcastState();

        // If the Preview tab is freshly opened, it shouts "REQUEST_STATE". We instantly beam it over.
        bc.onmessage = (event) => {
            if (event.data === 'REQUEST_STATE') {
                broadcastState();
            }
        };

        return () => bc.close();
    }, [profile, activeThemeId, workItems, educationItems, skillItems, customSections]);

    // Auto-save to sessionStorage for guests so they don't lose changes on refresh
    useEffect(() => {
        if (user || isUserLoading) return; // Only for guests
        if (!profile.fullName && workItems.length === 0 && educationItems.length === 0) return; // Nothing to save
        const timer = setTimeout(() => {
            try {
                const snapshot = {
                    personalInfo: { fullName: profile.fullName, email: profile.email, phone: profile.phone, location: profile.location, website: profile.website, github: profile.github, linkedin: profile.linkedin, slug: profile.slug, avatarUrl: profile.avatarUrl },
                    summary: profile.summary,
                    themeId: activeThemeId,
                    workExperience: workItems,
                    education: educationItems,
                    skills: skillItems,
                    customSections: customSections
                };
                sessionStorage.setItem('parsedResume', JSON.stringify(snapshot));
            } catch (e) { /* quota exceeded */ }
        }, 1000); // 1s debounce
        return () => clearTimeout(timer);
    }, [user, isUserLoading, profile, activeThemeId, workItems, educationItems, skillItems, customSections]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({...prev, [name]: (name === 'slug' ? value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-') : value) }));
    };
    
    const handleProfileBlur = async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!user) return;
        let { name, value } = e.target;
        
        if (name === 'website') {
            const stripped = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
            if (stripped !== value) {
                value = stripped;
                setProfile(prev => ({ ...prev, website: value }));
            }
        }
        
        if (['email', 'phone', 'location', 'website', 'github', 'linkedin'].includes(name)) {
            const nextProfile = { ...profile, [name]: value };
            setProfile(nextProfile);
            // Build links from current React state (not DB) to avoid race conditions
            // Only fetch additional links (non-core) from DB — these don't change during editing
            (async () => {
                try {
                    const { data: existing } = await supabase.from('profiles').select('links').eq('id', user.id).single();
                    const existingLinks: Array<{type: string; value: string}> = existing?.links || [];
                    const coreTypes = new Set(['email', 'phone', 'location', 'website', 'github', 'linkedin']);
                    const additionalLinks = existingLinks.filter(l => !coreTypes.has(l.type));
                    const coreLinks = [
                        { type: 'email', value: nextProfile.email },
                        { type: 'phone', value: nextProfile.phone },
                        { type: 'location', value: nextProfile.location },
                        { type: 'website', value: nextProfile.website },
                        { type: 'github', value: nextProfile.github },
                        { type: 'linkedin', value: nextProfile.linkedin },
                    ].filter(l => !!l.value) as Array<{type: string; value: string}>;
                    const mergedLinks = [...coreLinks, ...additionalLinks];
                    autoSave('profile', user.id, { links: mergedLinks });
                } catch (e) {
                    console.error('Links save error:', e);
                }
            })();
        } else if (name === 'slug' && value !== initialSlug) {
            if (slugError) return; // Wait until they fix the error before saving
            setSlugSuccess(false);
            await autoSave('profile', user.id, { slug: value });
            setInitialSlug(value);
            posthog.capture(EDITOR_EVENTS.SLUG_CHANGED, { new_slug: value });
            toast({ title: 'URL Updated!', description: `Your new link is ready.` });
        } else {
            autoSave('profile', user.id, { [name]: value });
        }
    };

    const handleItemChange = (collectionName: string, id: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const setter = {
            workExperience: setWorkItems,
            education: setEducationItems,
        }[collectionName as 'workExperience' | 'education'];
        (setter as any)?.((prev: any[]) => prev.map((item: any) => item.id === id ? {...item, [name]: value} : item));
    }

    const handleItemBlur = (collectionName: string, id: string, e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if(collectionName === 'workExperience') syncArray('experience', workItems);
        if(collectionName === 'education') syncArray('education', educationItems);
    };

    const handleAddItem = async (collectionName: 'workExperience' | 'education') => {
        let newItem: any = (collectionName === 'workExperience') ? { title: '', company: '', startDate: '', endDate: '', description: '' } : { institution: '', degree: '', startDate: '', endDate: '' };
        newItem.id = `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const setter = { workExperience: setWorkItems, education: setEducationItems }[collectionName];
        (setter as any)((prev: any[]) => { const next = [...prev, newItem]; syncArray(collectionName === 'workExperience' ? 'experience' : 'education', next); return next; });
    };

    const handleDeleteItem = (collectionName: string, id: string) => {
        const setter = { workExperience: setWorkItems, education: setEducationItems }[collectionName as 'workExperience' | 'education'];
        (setter as any)?.((prev: any[]) => { const next = prev.filter((item: any) => item.id !== id); syncArray(collectionName === 'workExperience' ? 'experience' : 'education', next); return next; });
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/rtf',
                'text/rtf',
                'text/plain',
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/heic',
                'image/heif'
            ];
            
            if ((!allowedTypes.includes(f.type) && !f.name.match(/\.(pdf|doc|docx|rtf|txt|jpg|jpeg|png|webp|heic|heif)$/i)) || f.size > 10 * 1024 * 1024) {
                toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select a PDF, Word, text, or image file under 10MB.' });
                setFile(null); setFileName(null);
            } else {
                setFile(f); setFileName(f.name);
                // Auto-trigger generation immediately
                handleResumeUpload(f);
            }
        }
    };
    


    // Build preview data for local preview dialog (must be before early returns — Rules of Hooks)
    const previewData = useMemo(() => ({
        profile: {
            userId: user?.id || 'guest',
            slug: profile.slug || 'preview',
            fullName: profile.fullName || 'Your Name',
            email: profile.email || '',
            phone: profile.phone || '',
            location: profile.location || '',
            website: profile.website || '',
            github: profile.github || '',
            linkedin: profile.linkedin || '',
            summary: profile.summary || '',
            skills: skillItems,
            links: [
                profile.email && { type: 'email', value: profile.email },
                profile.phone && { type: 'phone', value: profile.phone },
                profile.location && { type: 'location', value: profile.location },
                profile.website && { type: 'website', value: profile.website },
                profile.github && { type: 'github', value: profile.github },
                profile.linkedin && { type: 'linkedin', value: profile.linkedin },
            ].filter(Boolean) as Array<{type: string; value: string}>,
            avatarUrl: profile.avatarUrl || '',
            avatarHint: profile.avatarHint || 'person portrait',
        },
        workExperience: workItems.map(w => ({ id: w.id, title: w.title || '', company: w.company || '', startDate: w.startDate || '', endDate: w.endDate || '', description: w.description || '' })),
        education: educationItems.map(e => ({ id: e.id, institution: e.institution || '', degree: e.degree || '', startDate: e.startDate || '', endDate: e.endDate || '' })),
        skills: skillItems,
        customSections: customSections.map(cs => ({
            id: cs.id,
            sectionTitle: cs.sectionTitle || '',
            items: (cs.items || []).map(item => ({ id: item.id, title: item.title || '', subtitle: item.subtitle || '', description: item.description || '', date: item.date || '' })),
            order: cs.order || 0,
        })),
    }), [profile, workItems, educationItems, skillItems, customSections]);

    if (isUserLoading || pageIsLoading) {
      return (
          <div className="flex h-screen flex-col">
              <Header />
              <div className="flex flex-1 items-center justify-center">
                  <Loader2 className="h-16 w-16 animate-spin" />
              </div>
          </div>
      )
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            {!user && (
                <div className="border-b bg-background shadow-sm">
                    <div className="container mx-auto max-w-4xl px-4 md:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-4">
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-md sm:max-w-none">
                            <span className="font-semibold text-foreground block sm:inline mb-1 sm:mb-0">Preview is ready!</span>{' '}
                            <span className="block sm:inline">Sign up to publish your profile and get a shareable link.</span>
                        </p>
                        <div className="flex items-center justify-center shrink-0">
                            <LoginDialog trigger={
                                <Button size="sm" className="px-6 font-semibold" onClick={() => {
                                    const snapshot = {
                                        personalInfo: { fullName: profile.fullName, email: profile.email, phone: profile.phone, location: profile.location, website: profile.website, github: profile.github, linkedin: profile.linkedin, slug: profile.slug, avatarUrl: profile.avatarUrl },
                                        summary: profile.summary,
                                        themeId: activeThemeId,
                                        workExperience: workItems,
                                        education: educationItems,
                                        skills: skillItems,
                                        customSections: customSections
                                    };
                                    sessionStorage.setItem('parsedResume', JSON.stringify(snapshot));
                                    try { localStorage.setItem('parsedResume', JSON.stringify(snapshot)); localStorage.setItem('parsedResumeTimestamp', Date.now().toString()); } catch (e) { /* quota exceeded */ }
                                }}>Publish</Button>
                            } />
                        </div>
                    </div>
                </div>
            )}

            {/* Local Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                    <DialogTitle className="sr-only">Profile Preview</DialogTitle>
                    <TemplateModern {...previewData} />
                </DialogContent>
            </Dialog>

            {/* 🎉 First-publish Celebration Dialog */}
            <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
                <DialogContent className="max-w-md text-center max-h-[90vh] overflow-y-auto">
                    <DialogTitle className="sr-only">Your profile is live!</DialogTitle>
                    <div className="flex flex-col items-center gap-4 py-2">
                        <div className="text-5xl">🎉</div>
                        <div>
                            <h2 className="text-xl font-bold">PDF is dead. You've got a link.</h2>
                            <p className="text-sm text-muted-foreground mt-1">Drop it anywhere. No attachment, no version confusion.</p>
                        </div>
                        {/* URL pill */}
                        <div className="w-full bg-secondary rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
                            <span className="text-sm font-mono truncate text-foreground">cvin.bio/{celebrationSlug}</span>
                            <button
                                onClick={() => { navigator.clipboard.writeText(`https://cvin.bio/${celebrationSlug}`); toast({ title: 'Copied!' }); }}
                                className="shrink-0 text-xs text-primary font-semibold hover:text-primary/80 transition-colors"
                            >
                                Copy
                            </button>
                        </div>
                        {/* 2×2 social grid */}
                        <div className="grid grid-cols-2 gap-2 w-full">
                            {/* LinkedIn — copies caption then opens feed */}
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(copiedLinkedIn);
                                    toast({ title: 'Caption copied!', description: 'Paste it into your LinkedIn post.' });
                                    setTimeout(() => window.open('https://www.linkedin.com/feed/', '_blank'), 300);
                                }}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#0A66C2] text-[#0A66C2] text-sm font-semibold py-2.5 hover:bg-[#0A66C2]/10 transition-colors"
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                LinkedIn
                            </button>
                            {/* X / Twitter — pre-filled tweet */}
                            <button
                                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(copiedX)}`, '_blank')}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-foreground/30 text-foreground text-sm font-semibold py-2.5 hover:bg-foreground/5 transition-colors"
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                X
                            </button>
                            {/* Facebook — URL share */}
                            <button
                                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://cvin.bio/${celebrationSlug}`)}`, '_blank')}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1877F2] text-[#1877F2] text-sm font-semibold py-2.5 hover:bg-[#1877F2]/10 transition-colors"
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                Facebook
                            </button>
                            {/* WhatsApp — pre-filled message */}
                            <button
                                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(copiedWhatsApp)}`, '_blank')}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#25D366] text-[#25D366] text-sm font-semibold py-2.5 hover:bg-[#25D366]/10 transition-colors"
                            >
                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                WhatsApp
                            </button>
                        </div>
                        {/* Story card section */}
                        <div className="w-full flex items-center gap-2">
                            <div className="h-px flex-1 bg-border" />
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Story Card</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                        {cardDataUrl ? (
                            <div className="flex flex-col items-center gap-2 w-full">
                                <img src={cardDataUrl} alt="Story card preview" className="w-24 rounded-xl shadow-lg border border-border" />
                                <a
                                    href={cardDataUrl}
                                    download={`cvin-${celebrationSlug}.png`}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                                >
                                    ↓ Download story card
                                </a>
                                <p className="text-[11px] text-muted-foreground">Drop it on <span className="font-medium">Instagram</span> · <span className="font-medium">WhatsApp</span> · <span className="font-medium">TikTok</span> stories</p>
                            </div>
                        ) : (
                            <div className="w-16 aspect-[9/16] rounded-xl bg-muted animate-pulse" />
                        )}
                        <Link href={`/${celebrationSlug}`} target="_blank" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                            View my profile →
                        </Link>
                    </div>
                </DialogContent>
            </Dialog>

            <main className="flex-1 bg-secondary/30">
                <div className="container mx-auto max-w-4xl p-4 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold truncate max-w-[65vw] md:max-w-none">{user ? <><span className="sm:hidden">Welcome!</span><span className="hidden sm:inline">Welcome, {profile.fullName?.split(' ')[0] || ''}!</span></> : 'Your Profile'}</h1>
                            {!user && <p className="text-muted-foreground text-xs md:text-sm hidden sm:block">Preview anytime, sign up to publish.</p>}
                        </div>
                        <div className="flex items-center gap-2 justify-end shrink-0">
                           <div className="w-5 flex justify-center items-center">
                               {isSaving && <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />}
                           </div>
                           {(workItems.length > 0 || educationItems.length > 0) && (
                                <label title="Upload New CV (Overwrites Profile)" className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <UploadCloud className="h-4 w-4 mr-1.5" />}
                                    <span className="text-xs md:text-sm">{isGenerating ? 'Processing...' : 'Update CV'}</span>
                                    <Input type="file" className="hidden" accept=".pdf,.doc,.docx,.rtf,.txt,.jpg,.jpeg,.png,.webp,.heic" onChange={handleFileChange} disabled={isGenerating} />
                                </label>
                           )}
                            {user && profile.slug ? (
                                slugError || isCheckingSlug ? (
                                    <Button variant="outline" disabled>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Preview
                                    </Button>
                                ) : (
                                    <Button variant="outline" asChild>
                                        <Link href={`/${profile.slug}`} prefetch={false} target="_blank">
                                            <Eye className="mr-2 h-4 w-4" />
                                            Preview
                                        </Link>
                                    </Button>
                                )
                            ) : !user ? (
                                <Button variant="outline" onClick={() => {
                                    const snapshot = {
                                        personalInfo: { 
                                            fullName: profile.fullName, 
                                            email: profile.email, 
                                            phone: profile.phone, 
                                            location: profile.location, 
                                            website: profile.website, 
                                            github: profile.github, 
                                            linkedin: profile.linkedin, 
                                            slug: profile.slug,
                                            avatarUrl: profile.avatarUrl 
                                        },
                                        summary: profile.summary,
                                        themeId: activeThemeId,
                                        workExperience: workItems,
                                        education: educationItems,
                                        skills: skillItems,
                                        customSections: customSections
                                    };
                                    sessionStorage.setItem('parsedResume', JSON.stringify(snapshot));
                                    window.open(`/preview?channel=${channelId.current}`, '_blank');
                                }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {(workItems.length === 0 && educationItems.length === 0 && skillItems.length === 0 && customSections.length === 0) && (
                            <ResumeUploadPrompt onFileChange={handleFileChange} isGenerating={isGenerating} />
                        )}
                        
                        {user && (
                            <div className="grid gap-4">
                                <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 lg:gap-6 mb-6">
                                    <Card className="shadow-sm h-full flex flex-col justify-center">
                                        <CardContent className="pt-4 pb-3">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Your Public Link</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold" title="Total profile views">
                                                    <Eye className="h-3.5 w-3.5" /> {profile.viewCount || 0} views
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Input 
                                                    id="slug" 
                                                    name="slug" 
                                                    value={profile.slug || ''} 
                                                    onChange={handleProfileChange} 
                                                    onBlur={handleProfileBlur} 
                                                    className={`h-9 font-medium ${slugError ? 'border-red-500 focus-visible:ring-red-500 text-red-600' : slugSuccess ? 'border-green-500 focus-visible:ring-green-500 text-green-700' : ''}`} 
                                                />
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button 
                                                            variant="secondary" 
                                                            size="icon" 
                                                            className="h-9 w-9 shrink-0 bg-primary/10 text-primary hover:bg-primary/20" 
                                                            title="Share Profile"
                                                            disabled={!!slugError || isCheckingSlug}
                                                        >
                                                            <Share2 className="h-4 w-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-56 p-2" align="end" sideOffset={8}>
                                                        {(() => {
                                                            const url = `https://cvin.bio/${profile.slug}`;
                                                            const chatMsg = `My CV is a link now.\nhttps://cvin.bio/${profile.slug}`;
                                                            const socialMsg = `Stopped attaching my CV. Here's the link.\nhttps://cvin.bio/${profile.slug}`;
                                                            const downloadStoryCard = async () => {
                                                                const W = 1080, H = 1920;
                                                                const canvas = document.createElement('canvas');
                                                                canvas.width = W; canvas.height = H;
                                                                const ctx = canvas.getContext('2d');
                                                                if (!ctx) return;
                                                                // roundRect polyfill
                                                                const rr = (x: number, y: number, w: number, h: number, r: number) => { ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath(); };
                                                                // Solid background first
                                                                ctx.fillStyle = '#0f0d2e'; ctx.fillRect(0, 0, W, H);
                                                                const grad = ctx.createLinearGradient(0, 0, W, H);
                                                                grad.addColorStop(0, '#0f0d2e'); grad.addColorStop(0.45, '#2d2b7a'); grad.addColorStop(1, '#3b1f6e');
                                                                ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
                                                                ctx.fillStyle = 'rgba(255,255,255,0.04)';
                                                                for (let x = 80; x < W; x += 90) for (let y = 80; y < H; y += 90) { ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
                                                                try { await document.fonts.load('bold 96px Inter'); } catch (_) {}
                                                                const font = document.fonts.check('bold 96px Inter') ? 'Inter' : '-apple-system,BlinkMacSystemFont,sans-serif';
                                                                ctx.fillStyle = 'rgba(165,180,252,0.8)'; ctx.font = `500 46px ${font}`; ctx.textAlign = 'center';
                                                                ctx.fillText('CVin.Bio', W / 2, 180);
                                                                ctx.strokeStyle = 'rgba(129,140,248,0.3)'; ctx.lineWidth = 1.5;
                                                                ctx.beginPath(); ctx.moveTo(240, 220); ctx.lineTo(840, 220); ctx.stroke();
                                                                // Load photo via same-origin proxy
                                                                const hasPhoto = !!profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos');
                                                                const photoRadius = 170; const photoCY = 620;
                                                                const nameCY = hasPhoto ? 880 : 760;
                                                                if (hasPhoto) {
                                                                    await new Promise<void>(resolve => {
                                                                        const img = new window.Image();
                                                                        img.onload = () => { const cx = W/2; ctx.save(); ctx.shadowColor='rgba(129,140,248,0.7)'; ctx.shadowBlur=50; ctx.beginPath(); ctx.arc(cx,photoCY,photoRadius+8,0,Math.PI*2); ctx.fillStyle='rgba(99,102,241,0.25)'; ctx.fill(); ctx.restore(); ctx.beginPath(); ctx.arc(cx,photoCY,photoRadius+5,0,Math.PI*2); ctx.strokeStyle='rgba(165,180,252,0.7)'; ctx.lineWidth=4; ctx.stroke(); ctx.save(); ctx.beginPath(); ctx.arc(cx,photoCY,photoRadius,0,Math.PI*2); ctx.clip(); ctx.drawImage(img,cx-photoRadius,photoCY-photoRadius,photoRadius*2,photoRadius*2); ctx.restore(); resolve(); };
                                                                        img.onerror = () => resolve();
                                                                        img.src = `/api/avatar/${profile.slug}`;
                                                                    });
                                                                }
                                                                const name = profile.fullName || '';
                                                                ctx.fillStyle = 'rgba(255,255,255,0.97)'; let fs = 108; ctx.font = `bold ${fs}px ${font}`;
                                                                while (ctx.measureText(name).width > 920 && fs > 56) { fs -= 4; ctx.font = `bold ${fs}px ${font}`; }
                                                                ctx.fillText(name, W / 2, nameCY);
                                                                const urlText = `cvin.bio/${profile.slug}`;
                                                                const pillY = nameCY + 110;
                                                                ctx.fillStyle = 'rgba(99,102,241,0.2)'; ctx.strokeStyle = 'rgba(165,180,252,0.4)'; ctx.lineWidth = 2;
                                                                rr(120, pillY, 840, 130, 28); ctx.fill(); ctx.stroke();
                                                                let ufs = 76; ctx.font = `bold ${ufs}px ${font}`;
                                                                while (ctx.measureText(urlText).width > 780 && ufs > 44) { ufs -= 4; ctx.font = `bold ${ufs}px ${font}`; }
                                                                ctx.fillStyle = 'white'; ctx.fillText(urlText, W / 2, pillY + 82);
                                                                try { const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = `cvin-${profile.slug}.png`; a.click(); } catch(e) { console.error('Story card export', e); }
                                                            };
                                                            return (
                                                                <div className="flex flex-col gap-0.5">
                                                                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(chatMsg)}`, '_blank')} className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent transition-colors text-left text-sm">
                                                                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#25D366] shrink-0" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                                                        WhatsApp
                                                                    </button>
                                                                    <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(socialMsg)}`, '_blank')} className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent transition-colors text-left text-sm">
                                                                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-foreground shrink-0" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                                                        X / Twitter
                                                                    </button>
                                                                    <button onClick={() => { posthog.capture(EDITOR_EVENTS.SHARE_LINKEDIN, { slug: profile.slug }); window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank'); }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent transition-colors text-left text-sm">
                                                                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#0A66C2] shrink-0" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                                                        LinkedIn
                                                                    </button>
                                                                    <button onClick={() => { posthog.capture(EDITOR_EVENTS.SHARE_FACEBOOK, { slug: profile.slug }); window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank'); }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent transition-colors text-left text-sm">
                                                                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#1877F2] shrink-0" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                                                        Facebook
                                                                    </button>
                                                                    <div className="h-px bg-border my-1" />
                                                                    <button onClick={() => { posthog.capture(EDITOR_EVENTS.SHARE_LINK_COPIED, { slug: profile.slug }); navigator.clipboard.writeText(url); toast({ title: 'Link copied!' }); }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent transition-colors text-left text-sm">
                                                                        <Link2 className="h-4 w-4 shrink-0" />
                                                                        Copy link
                                                                    </button>
                                                                    <button onClick={() => { posthog.capture(EDITOR_EVENTS.SHARE_MESSAGE_COPIED, { slug: profile.slug }); navigator.clipboard.writeText(chatMsg); toast({ title: 'Message copied!', description: 'Paste it anywhere to share.' }); }} className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent transition-colors text-left text-sm">
                                                                        <Copy className="h-4 w-4 shrink-0" />
                                                                        Copy with message
                                                                    </button>
                                                                    <div className="h-px bg-border my-1" />
                                                                    <button onClick={downloadStoryCard} className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-accent transition-colors text-left text-sm">
                                                                        <Download className="h-4 w-4 shrink-0 text-indigo-500" />
                                                                        Story card <span className="text-[10px] text-muted-foreground ml-1">IG · TikTok</span>
                                                                    </button>
                                                                </div>
                                                            );
                                                        })()}
                                                    </PopoverContent>
                                                </Popover>
                                                {slugError || isCheckingSlug ? (
                                                    <Button variant="default" size="sm" className="h-9 shrink-0 shadow-sm" disabled>Visit</Button>
                                                ) : (
                                                    <Button asChild variant="default" size="sm" className="h-9 shrink-0 shadow-sm">
                                                        <Link href={`/${profile.slug}`} target="_blank" prefetch={false}>Visit</Link>
                                                    </Button>
                                                )}
                                            </div>
                                            {isCheckingSlug ? (
                                                <p className="text-[10px] text-muted-foreground mt-2 font-medium animate-pulse">Checking availability...</p>
                                            ) : slugError ? (
                                                <p className="text-[10px] text-red-500 mt-2 font-medium">❌ {slugError}</p>
                                            ) : slugSuccess ? (
                                                <p className="text-[10px] text-green-600 mt-2 font-medium">✅ This URL is available!</p>
                                            ) : profile.slug ? (
                                                <div className="mt-2.5 space-y-2">
                                                    <p className="text-[10px] text-green-600 flex items-center gap-1">
                                                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        Live at{' '}
                                                        <a href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://cvin.bio'}/${profile.slug}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-700 truncate max-w-[200px]">
                                                            {`${(process.env.NEXT_PUBLIC_SITE_URL || 'https://cvin.bio').replace(/^https?:\/\//, '')}/${profile.slug}`}
                                                        </a>
                                                    </p>

                                                </div>
                                            ) : null}
                                        </CardContent>
                                    </Card>
                                    <ProfileCompleteness profile={profile} work={workItems} education={educationItems} skills={skillItems} onNavigate={() => {}} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Card className="shadow-sm">
                                <CardContent className="pt-4 pb-3">
                                    <div className="flex flex-col md:flex-row gap-6 md:items-center">
                                        <div className="flex flex-col items-center gap-2 md:w-32 shrink-0">
                                            <label htmlFor="avatar-upload" className="relative group cursor-pointer flex-shrink-0">
                                                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                                                    {profile.avatarUrl ? (
                                                        <img src={profile.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <UploadCloud className="h-6 w-6 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <UploadCloud className="h-5 w-5 text-white" />
                                                </div>
                                                <input
                                                    id="avatar-upload"
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        if (!f) return;
                                                        if (f.size > 5 * 1024 * 1024) {
                                                            toast({ variant: 'destructive', title: 'File too large', description: 'Please select an image under 5MB.' });
                                                            return;
                                                        }
                                                        const url = URL.createObjectURL(f);
                                                        setCropImageSrc(url);
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </label>
                                            <div className="text-[10px] text-muted-foreground text-center">
                                                <p className="font-semibold text-foreground text-xs mb-0.5">Profile Photo</p>
                                                <p>JPG/PNG &lt; 5MB</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 w-full space-y-2">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-x-3 gap-y-2.5">
                                                <div className="space-y-1 sm:col-span-1 xl:col-span-2"><Label htmlFor="fullName" className="text-xs">Full Name</Label><Input id="fullName" name="fullName" value={profile.fullName || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} className="h-9" /></div>
                                                <div className="space-y-1 sm:col-span-1 xl:col-span-4"><Label htmlFor="email" className="text-xs">Email</Label><Input id="email" name="email" type="email" value={profile.email || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} className="h-9" /></div>
                                                <div className="space-y-1 sm:col-span-1 xl:col-span-2"><Label htmlFor="phone" className="text-xs">Phone</Label><Input id="phone" name="phone" placeholder="+1 (555) 123-4567" value={profile.phone || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} className="h-9" /></div>
                                                <div className="space-y-1 sm:col-span-1 xl:col-span-2"><Label htmlFor="location" className="text-xs">Location</Label><Input id="location" name="location" placeholder="San Francisco, CA" value={profile.location || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} className="h-9" /></div>
                                                <div className="space-y-1 sm:col-span-2 xl:col-span-2"><Label htmlFor="website" className="text-xs">Website/Portfolio</Label><Input id="website" name="website" placeholder="cvin.bio/johndoe" value={profile.website || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} className="h-9" /></div>
                                                <div className="space-y-1 sm:col-span-1 xl:col-span-3"><Label htmlFor="github" className="text-xs">GitHub</Label><Input id="github" name="github" placeholder="github.com/..." value={profile.github || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} className="h-9" /></div>
                                                <div className="space-y-1 sm:col-span-1 xl:col-span-3"><Label htmlFor="linkedin" className="text-xs">LinkedIn</Label><Input id="linkedin" name="linkedin" placeholder="linkedin.com/in/..." value={profile.linkedin || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} className="h-9" /></div>
                                            </div>
                                            {/* ── More Links ── */}
                                            <div className="space-y-2">
                                                <Label className="text-xs text-muted-foreground">More Links <span className="font-normal">(Twitter, Instagram, Dribbble, Behance, Medium…)</span></Label>
                                                {/* Existing extra links as deletable chips */}
                                                {((profile.links || []).filter((l: any) => !CORE_LINK_TYPES_SET.has(l.type))).length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {(profile.links || []).filter((l: any) => !CORE_LINK_TYPES_SET.has(l.type)).map((link: any, i: number) => (
                                                            <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-secondary border border-border rounded-md px-2 py-1">
                                                                <span className="font-medium capitalize">{link.type}</span>
                                                                <span className="text-muted-foreground truncate max-w-[140px]">{link.value.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                                                                <button onClick={() => removeExtraLink(i)} className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors leading-none" aria-label="Remove">
                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {/* Add link row */}
                                                <div className="flex gap-1.5">
                                                    <Input
                                                        placeholder="Choose"
                                                        value={newLinkType}
                                                        onChange={e => setNewLinkType(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && addExtraLink()}
                                                        className="h-9 text-sm w-36 shrink-0"
                                                        list="platform-suggestions"
                                                    />
                                                    <datalist id="platform-suggestions">
                                                        {['twitter','instagram','tiktok','youtube','facebook','threads','snapchat','telegram','discord','dribbble','behance','figma','medium','substack','stackoverflow','gitlab','codepen','leetcode','hackerrank','bluesky','mastodon','notion','spotify','soundcloud'].map(p => (
                                                            <option key={p} value={p} />
                                                        ))}
                                                    </datalist>
                                                    <Input
                                                        placeholder="URL or username"
                                                        value={newLinkValue}
                                                        onChange={e => setNewLinkValue(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && addExtraLink()}
                                                        className="h-9 text-sm flex-1"
                                                    />
                                                    <Button size="sm" onClick={addExtraLink} disabled={!newLinkType.trim() || !newLinkValue.trim()} className="h-9 shrink-0">
                                                        <PlusCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="space-y-1"><Label htmlFor="summary" className="text-xs">Summary</Label><Textarea id="summary" name="summary" placeholder="A brief professional summary..." value={profile.summary || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} rows={3} className="resize-none" /></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardContent className="pt-4 pb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 id="work-experience-section" className="text-sm font-semibold scroll-mt-24">Work Experience</h3>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleAddItem('workExperience')}><PlusCircle className="mr-1 h-3 w-3" /> Add</Button>
                                    </div>
                                    <div className="space-y-3">
                                    {workItems.map(item => (
                                        <div key={item.id} className="border rounded-lg p-3 transition-all hover:border-primary/40 hover:bg-secondary/10 hover:shadow-sm">
                                            <div className="flex gap-2 items-start">
                                                <div className="flex-1 space-y-2">
                                                    <div className="grid grid-cols-2 md:grid-cols-12 gap-2">
                                                        <Input name="title" placeholder="Title" value={item.title} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="col-span-2 sm:col-span-1 md:col-span-4 h-8 text-sm" />
                                                        <Input name="company" placeholder="Company" value={item.company} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="col-span-2 sm:col-span-1 md:col-span-4 h-8 text-sm" />
                                                        <Input name="startDate" placeholder="Start" value={item.startDate} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="col-span-1 sm:col-span-1 md:col-span-2 h-8 text-sm" />
                                                        <Input name="endDate" placeholder="End" value={item.endDate || ''} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="col-span-1 sm:col-span-1 md:col-span-2 h-8 text-sm" />
                                                    </div>
                                                    <Textarea name="description" placeholder="Describe your responsibilities and achievements..." value={item.description} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} rows={2} className="text-sm resize-none" />
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-destructive/10 group" onClick={() => handleDeleteItem('workExperience', item.id)}>
                                                    <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors"/>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardContent className="pt-4 pb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 id="education-section" className="text-sm font-semibold scroll-mt-24">Education</h3>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleAddItem('education')}><PlusCircle className="mr-1 h-3 w-3" /> Add</Button>
                                    </div>
                                    <div className="space-y-3">
                                    {educationItems.map(item => (
                                        <div key={item.id} className="border rounded-lg p-3 transition-all hover:border-primary/40 hover:bg-secondary/10 hover:shadow-sm">
                                            <div className="flex gap-2 items-start">
                                                <div className="flex-1 space-y-2">
                                                    <div className="grid grid-cols-2 md:grid-cols-12 gap-2">
                                                        <Input name="institution" placeholder="Institution" value={item.institution} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="col-span-2 sm:col-span-1 md:col-span-4 h-8 text-sm" />
                                                        <Input name="degree" placeholder="Degree" value={item.degree} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="col-span-2 sm:col-span-1 md:col-span-4 h-8 text-sm" />
                                                        <Input name="startDate" placeholder="Start" value={item.startDate} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="col-span-1 sm:col-span-1 md:col-span-2 h-8 text-sm" />
                                                        <Input name="endDate" placeholder="End" value={item.endDate || ''} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="col-span-1 sm:col-span-1 md:col-span-2 h-8 text-sm" />
                                                    </div>
                                                    <Textarea name="description" placeholder="Describe your studies, honors, or extracurricular achievements..." value={item.description || ''} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} rows={2} className="text-sm resize-none" />
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-destructive/10 group" onClick={() => handleDeleteItem('education', item.id)}>
                                                    <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors"/>
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardContent className="pt-4 pb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 id="skills-section" className="text-sm font-semibold scroll-mt-24">Skills</h3>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                                            setSkillItems(prev => [...prev, '']);
                                            if (user) {
                                                autoSave('profile', user.id, { skills: [...skillItems, ''] });
                                            }
                                        }}><PlusCircle className="mr-1 h-3 w-3" /> Add</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {skillItems.map((skill, idx) => (
                                            <div key={idx} className="flex items-center gap-0.5 bg-secondary px-2 py-1 rounded-md">
                                                <Input
                                                    placeholder="Skill"
                                                    value={skill}
                                                    className="h-6 text-xs w-20 border-none bg-transparent p-0"
                                                    onChange={(e) => {
                                                        const newSkills = [...skillItems];
                                                        newSkills[idx] = e.target.value;
                                                        setSkillItems(newSkills);
                                                    }}
                                                    onBlur={() => {
                                                        if (user) {
                                                            setSkillItems(prev => {
                                                                autoSave('profile', user.id, { skills: prev });
                                                                return prev;
                                                            });
                                                        }
                                                    }}
                                                />
                                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                                                    const newSkills = skillItems.filter((_, i) => i !== idx);
                                                    setSkillItems(newSkills);
                                                    if (user) {
                                                        autoSave('profile', user.id, { skills: newSkills });
                                                    }
                                                }}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <CustomSectionsEditor 
                                customSections={customSections} 
                                setCustomSections={setCustomSections} 
                                syncArray={syncArray} 
                                user={user} 
                            />

                            {user && (
                                <Card className="shadow-sm border-destructive/20">
                                    <CardContent className="pt-4 pb-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-semibold text-destructive">Delete Account</h3>
                                                <p className="text-[11px] text-muted-foreground">Permanently remove your profile and all data.</p>
                                            </div>
                                            <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={async () => {
                                if (!confirm('Are you sure? This will permanently delete your account and all data. This cannot be undone.')) return;
                                try {
                                    const res = await fetch('/api/account', { method: 'DELETE' });
                                    if (!res.ok) {
                                        const data = await res.json();
                                        throw new Error(data.error || 'Deletion failed');
                                    }
                                    await supabase.auth.signOut();
                                    posthog.capture(EDITOR_EVENTS.ACCOUNT_DELETED);
                                    posthog.reset();
                                    toast({ title: 'Account deleted', description: 'All your data has been removed.' });
                                    window.location.href = '/';
                                } catch (err: any) {
                                    toast({ variant: 'destructive', title: 'Delete Failed', description: err?.message || 'Failed to delete account. Please try again.' });
                                }
                            }}
                        >
                            Delete Account
                        </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            
                            {cropImageSrc && (
                                <AvatarCropper
                                    imageSrc={cropImageSrc}
                                    onCropComplete={(croppedImage) => {
                                        setProfile(prev => ({ ...prev, avatarUrl: croppedImage }));
                                        if (user) {
                                            autoSave('profile', user.id, { avatarUrl: croppedImage });
                                        }
                                        setCropImageSrc(null);
                                        posthog.capture(EDITOR_EVENTS.PHOTO_UPDATED);
                                        toast({ title: 'Photo updated!' });
                                    }}
                                    onCancel={() => setCropImageSrc(null)}
                                />
                            )}
                        </div>
					</div>
				</div>
			</main>
		</div>
	);
}
