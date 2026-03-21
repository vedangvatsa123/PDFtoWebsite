
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';

import { useRouter } from 'next/navigation';
import type { UserProfile, WorkExperience, Education, CustomSection, CustomSectionItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Trash2, PlusCircle, Loader2, UploadCloud, FileUp, CheckCircle, XCircle, Share2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Header from '@/components/header';
import { useUser } from '@/auth';
import { createClient } from '@/utils/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { LoginDialog } from '@/components/login-dialog';
import TemplateModern from '@/app/[slug]/templates/modern-creative';

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

function generateSlug(name: string) {
  const randomString = Math.random().toString(36).substring(2, 7);
  const firstName = name.split(' ')[0] || 'user';
  return firstName.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + randomString;
}

const ResumeUploadPrompt = ({ onFileChange, isGenerating }: { onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void, isGenerating: boolean }) => (
    <Card className="w-full border-dashed border-2 hover:border-primary transition-colors mb-6">
        <CardContent className="pt-4 pb-4">
            <label htmlFor="resume-upload" className={`flex w-full items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isGenerating ? 'pointer-events-none opacity-60' : 'cursor-pointer hover:bg-accent/50'}`}>
                {isGenerating ? (
                    <><Loader2 className="mr-3 h-5 w-5 animate-spin text-muted-foreground" /><span className="text-sm text-muted-foreground">Generating your profile...</span></>
                ) : (
                    <><UploadCloud className="mr-3 h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload your CV</span></>
                )}
                <Input id="resume-upload" type="file" className="hidden" accept=".pdf" onChange={onFileChange} disabled={isGenerating} />
            </label>
        </CardContent>
    </Card>
);

const ProfileCompleteness = ({ profile, work, education, skills, onNavigate }: { profile: Partial<UserProfile>, work: WorkExperience[], education: Education[], skills: string[], onNavigate: (tab: string) => void }) => {
    const completeness = useMemo(() => {
        const checks = [
            { name: "Add a Profile Photo", complete: !!(profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos')), section: 'content' },
            { name: "Write a Summary", complete: !!profile.summary, section: 'content' },
            { name: "Add at least one Work Experience", complete: work.length > 0, section: 'content' },
            { name: "Add your Education", complete: education.length > 0, section: 'content' },
            { name: "Add at least one Skill", complete: skills.length > 0, section: 'content' },
        ];
        const completeCount = checks.filter(c => c.complete).length;
        const totalCount = checks.length;
        const score = Math.round((completeCount / totalCount) * 100);

        return { score, checks, isComplete: completeCount === totalCount };
    }, [profile, work, education, skills]);

    const { score, checks, isComplete } = completeness;

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">Profile Completeness</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-2">
                <div className="flex items-center gap-3">
                    <Progress value={score} className="flex-1 h-1.5" />
                    <span className="text-sm font-bold">{score}%</span>
                </div>
                {isComplete ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Complete
                    </p>
                ) : (
                    <ul className="text-[11px] text-muted-foreground space-y-0.5">
                        {checks.filter(c => !c.complete).map(c => (
                            <li key={c.name} className="flex items-center gap-1.5">
                                <XCircle className="h-3 w-3 text-destructive/60" />
                                {c.name}
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
};

const VIEW_MILESTONES = [10, 50, 100, 500, 1000, 5000];

const DashboardStats = ({ viewCount, completenessScore, slug }: { viewCount: number; completenessScore: number; slug?: string }) => {
    const { toast } = useToast();
    const nextMilestone = VIEW_MILESTONES.find(m => viewCount < m) || VIEW_MILESTONES[VIEW_MILESTONES.length - 1];
    const progress = Math.min(100, (viewCount / nextMilestone) * 100);
    const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cvinbio.com'}/${slug || ''}`;

    const copyLink = () => {
        navigator.clipboard.writeText(profileUrl);
        toast({ title: 'Link copied!' });
    };

    return (
        <div className="grid grid-cols-3 gap-4">
            <Card className="shadow-sm">
                <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">Total Views</p>
                    <p className="text-2xl font-bold">{viewCount}</p>
                    <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                            <span>Next: {nextMilestone}</span>
                        </div>
                        <Progress value={progress} className="h-1" />
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-sm">
                <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">Profile Score</p>
                    <p className="text-2xl font-bold">{completenessScore}%</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                        {completenessScore === 100 ? 'Complete' : 'Fill in more details to improve'}
                    </p>
                </CardContent>
            </Card>
            <Card className="shadow-sm">
                <CardContent className="pt-4 pb-3">
                    <p className="text-xs text-muted-foreground mb-1">Share</p>
                    <div className="flex gap-1.5 mt-1">
                        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={copyLink}>
                            <Share2 className="h-3 w-3 mr-1" /> Copy Link
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Get more views by sharing</p>
                </CardContent>
            </Card>
        </div>
    );
};

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




    const processedPendingResume = useRef(false);
    const guestInitDone = useRef(false);
    const guestSavedToFirestore = useRef(false);

    // Guest mode: load parsed resume from sessionStorage without needing auth
    useEffect(() => {
        if (!isUserLoading && !user && !guestInitDone.current) {
            guestInitDone.current = true;
            const parsed = sessionStorage.getItem('parsedResume');
            if (parsed) {
                try {
                    const data = JSON.parse(parsed);
                    const slug = generateSlug(data.personalInfo?.fullName || 'user');
                    setProfile({
                        fullName: data.personalInfo?.fullName || '',
                        email: data.personalInfo?.email || '',
                        phone: data.personalInfo?.phone || '',
                        location: data.personalInfo?.location || '',
                        website: data.personalInfo?.website || '',
                        summary: data.summary || '',
                        slug,
                        themeId: 'modern-creative',
                        skills: (data.skills || []).map((s: any) => s.name || s),
                    });
                    setActiveThemeId('modern-creative');
                    setWorkItems((data.workExperience || []).map((w: any, i: number) => ({ ...w, id: `guest-work-${i}`, userProfileId: '' })));
                    setEducationItems((data.education || []).map((e: any, i: number) => ({ ...e, id: `guest-edu-${i}`, userProfileId: '' })));
                    setSkillItems((data.skills || []).map((s: any) => s.name || s));
                } catch {}
            }
            setPageIsLoading(false);
        }
    }, [isUserLoading, user]);

    // When guest signs up/logs in, save their sessionStorage snapshot to DB
    useEffect(() => {
        if (!user || guestSavedToFirestore.current || processedPendingResume.current) return;
        const rawSnapshot = sessionStorage.getItem('parsedResume');
        if (!rawSnapshot) return;
        guestSavedToFirestore.current = true;
        processedPendingResume.current = true;
        (async () => {
            try {
                const snapshot = JSON.parse(rawSnapshot);
                const pi = snapshot.personalInfo || {};
                const fullName = pi.fullName || user.user_metadata?.full_name || 'user';
                const slug = pi.slug || generateSlug(fullName);
                const profileToSave = {
                    id: user.id,
                    full_name: fullName,
                    username: slug,
                    about: snapshot.summary || '',
                    target_role: snapshot.themeId || 'modern-creative',
                    profile_picture_url: user.user_metadata?.avatar_url || `https://picsum.photos/seed/${user.id}/200/200`,
                    experience: snapshot.workExperience || [],
                    education: snapshot.education || [],
                    skills: (snapshot.skills || []).map((s: any) => s.name || s),
                    views: 0,
                    links: []
                };
                await supabase.from('profiles').upsert(profileToSave);
                sessionStorage.removeItem('parsedResume');
                toast({ title: 'Profile saved!', description: 'Your profile is now live.' });
            } catch (e) {
                console.error('Failed to save guest data:', e);
            } finally {
                fetchProfileData();
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, supabase]);

    const fetchProfileData = useCallback(async () => {
        if (!user) return;
        setPageIsLoading(true);
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        let profileData: UserProfile;
        if (p) {
            profileData = {
                userId: p.id,
                fullName: p.full_name || '',
                email: user.email || '',
                summary: p.about || '',
                slug: p.username || '',
                avatarUrl: p.profile_picture_url || `https://picsum.photos/seed/${user.id}/200/200`,
                avatarHint: 'person portrait',
                themeId: p.target_role || 'modern-creative',
                viewCount: p.views || 0,
                skills: p.skills || [],
            };
            setProfile(profileData);
            setInitialSlug(profileData.slug);
            setActiveThemeId(profileData.themeId);
            setWorkItems(p.experience || []);
            setEducationItems(p.education || []);
            setSkillItems(profileData.skills || []);
            setCustomSections([]);
        } else {
            const newSlug = generateSlug(user.user_metadata?.full_name || 'user');
            const newProfile = { id: user.id, username: newSlug, full_name: user.user_metadata?.full_name || 'Your Name', experience: [], education: [], skills: [], links: [] };
            await supabase.from('profiles').insert(newProfile);
            profileData = { userId: user.id, fullName: newProfile.full_name, email: user.email || '', summary: '', slug: newSlug, avatarUrl: '', avatarHint: '', themeId: 'modern-creative', viewCount: 0, skills: [] };
            setProfile(profileData);
            setInitialSlug(newSlug);
        }
        setPageIsLoading(false);
        return { profile: profileData };
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
                if ('slug' in data) map.username = data.slug;
                if ('skills' in data) map.skills = data.skills;
                if (Object.keys(map).length > 0) await supabase.from('profiles').update(map).eq('id', user.id);
            }
        } finally {
            setTimeout(() => setIsSaving(false), 700);
        }
    }, [user, supabase]);

    const syncArray = useCallback(async (column: string, array: any[]) => {
        if (!user) return;
        setIsSaving(true);
        await supabase.from('profiles').update({ [column]: array }).eq('id', user.id);
        setTimeout(() => setIsSaving(false), 700);
    }, [user, supabase]);

    const handleResumeUpload = useCallback(async (resumeFile: File) => {
        if (!resumeFile || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'No file selected or user not logged in.' });
            return;
        }
        setIsGenerating(true);
        toast({ title: 'Processing Resume...', description: `We're analyzing ${resumeFile.name}. Your profile will update shortly.` });
        try {
            const formData = new FormData();
            formData.append('resume', resumeFile);
            const response = await fetch('/api/parse-resume', { method: 'POST', body: formData });
            if (!response.ok) throw new Error((await response.json()).error || 'Failed to parse resume');
            const extractedData = await response.json();
            
            const { data: currentProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            const currentSlug = currentProfile?.username || generateSlug(extractedData.personalInfo.fullName || user.user_metadata?.full_name || 'user');
            const skillsArr = (extractedData.skills || []).map((s: any) => s.name || s);
            
            const updatedProfile = {
                id: user.id,
                full_name: extractedData.personalInfo.fullName || currentProfile?.full_name || '',
                username: currentSlug,
                about: extractedData.summary || currentProfile?.about || '',
                skills: skillsArr,
                experience: extractedData.workExperience || [],
                education: extractedData.education || [],
            };
            await supabase.from('profiles').upsert(updatedProfile);
            toast({ title: 'Success!', description: 'Your profile has been updated.' });
            await fetchProfileData();
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
        } finally {
            setIsGenerating(false);
            setFile(null); setFileName(null);
            sessionStorage.removeItem('pendingResume');
            sessionStorage.removeItem('pendingResumeName');
        }
    }, [user, supabase, fetchProfileData, toast, setFile, setFileName]);

    useEffect(() => {
        if (user && !processedPendingResume.current) {
            processedPendingResume.current = true; // Mark immediately to prevent double-firing
            fetchProfileData().then(async data => {
                const parsedData = sessionStorage.getItem('parsedResume');
                const pendingResumeDataUrl = sessionStorage.getItem('pendingResume');
                const pendingResumeName = sessionStorage.getItem('pendingResumeName');
                
                if (parsedData) {
                    // Safe manual update mimicking handleResumeUpload using parsed JSON
                    try {
                        const extractedData = JSON.parse(parsedData);
                        const skillsArr = (extractedData.skills || []).map((s: any) => s.name || s);
                        const { data: currentProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                        
                        const updatedProfile = {
                            id: user.id,
                            full_name: extractedData.personalInfo?.fullName || currentProfile?.full_name || '',
                            username: currentProfile?.username || generateSlug(extractedData.personalInfo?.fullName || user.user_metadata?.full_name || 'user'),
                            about: extractedData.summary || currentProfile?.about || '',
                            skills: skillsArr,
                            experience: extractedData.workExperience || [],
                            education: extractedData.education || [],
                        };
                        await supabase.from('profiles').upsert(updatedProfile);
                        toast({ title: 'Success!', description: 'Your profile has been updated from your CV.' });
                        sessionStorage.removeItem('parsedResume');
                        await fetchProfileData(); // Reload the UI with updated DB data
                    } catch (e) { console.error("Parse failed", e); }
                } else if (pendingResumeDataUrl && pendingResumeName && data?.profile) {
                    const resumeFile = dataURLtoFile(pendingResumeDataUrl, pendingResumeName);
                    if (resumeFile) handleResumeUpload(resumeFile); // Triggers real generation
                }
            });
        }
    }, [user, fetchProfileData, handleResumeUpload, supabase, toast]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({...prev, [name]: value}));
    };
    
    const handleProfileBlur = async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!user) return;
        const { name, value } = e.target;
        if ((profile as any)[name] === value) return; // No change
        
        if (name === 'slug' && value !== initialSlug) {
            const { data } = await supabase.from('profiles').select('id').eq('username', value).single();
            if (data && data.id !== user.id) {
                toast({ variant: 'destructive', title: 'URL Unavailable', description: `The URL "${value}" is already taken.` });
                setProfile(prev => ({ ...prev, slug: initialSlug })); 
                return;
            }
            await autoSave('profile', user.id, { slug: value });
            setInitialSlug(value);
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
        newItem.id = `item-${Date.now()}`;
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
            if (f.type !== 'application/pdf' || f.size > 10 * 1024 * 1024) {
                toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select a PDF file under 10MB.' });
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
            summary: profile.summary || '',
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
                <div className="border-b bg-background">
                    <div className="container mx-auto max-w-4xl px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Preview is ready!</span>{' '}
                            Sign up to publish your profile and get a shareable link.
                        </p>
                        <div className="flex items-center gap-2">
                            <LoginDialog trigger={
                                <Button size="sm" onClick={() => {
                                    const snapshot = {
                                        personalInfo: { fullName: profile.fullName, email: profile.email, phone: profile.phone, location: profile.location, website: profile.website, slug: profile.slug },
                                        summary: profile.summary,
                                        themeId: activeThemeId,
                                        workExperience: workItems,
                                        education: educationItems,
                                        skills: skillItems,
                                    };
                                    sessionStorage.setItem('parsedResume', JSON.stringify(snapshot));
                                }}>Publish</Button>
                            } />
                        </div>
                    </div>
                </div>
            )}

            {/* Local Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
                    <TemplateModern {...previewData} />
                </DialogContent>
            </Dialog>

            <main className="flex-1 bg-secondary/30">
                <div className="container mx-auto max-w-4xl p-4 md:p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold">{user ? `Welcome back, ${profile.fullName}!` : 'Build Your Profile'}</h1>
                            {!user && <p className="text-muted-foreground">Fill in your details below. Preview anytime, sign up to publish.</p>}
                        </div>
                        <div className="flex items-center gap-2">
                           {isSaving && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin h-4 w-4" /><span>Saving...</span></div>}
                            {user && profile.slug ? (
                                <Button variant="outline" asChild>
                                    <Link href={`/${profile.slug}`} prefetch={false} target="_blank">
                                        <Eye className="mr-2 h-4 w-4" />
                                        Preview
                                    </Link>
                                </Button>
                            ) : !user ? (
                                <Button variant="outline" onClick={() => setShowPreview(true)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {(workItems.length === 0 && educationItems.length === 0) ? (
                            <ResumeUploadPrompt onFileChange={handleFileChange} isGenerating={isGenerating} />
                        ) : (
                            <div className="flex justify-end">
                                <label className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {isGenerating ? 'Processing...' : 'Upload New CV (Overwrites Profile)'}
                                    <Input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} disabled={isGenerating} />
                                </label>
                            </div>
                        )}
                        
                        {user && (
                            <div className="grid gap-4">
                                <Card className="shadow-sm">
                                    <CardContent className="pt-4 pb-3">
                                        <p className="text-xs text-muted-foreground mb-2">Your Public Link</p>
                                        <div className="flex space-x-2">
                                            <Input id="slug" name="slug" value={profile.slug || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} className="h-9" />
                                            <Button asChild variant="secondary" size="sm"><Link href={`/${profile.slug}`} target="_blank" prefetch={false}><Eye className="mr-1 h-3 w-3" />Visit</Link></Button>
                                        </div>
                                        {profile.slug && <p className="text-xs text-muted-foreground mt-1">{`${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}/${profile.slug}`}</p>}
                                    </CardContent>
                                </Card>
                                <DashboardStats
                                    viewCount={profile.viewCount || 0}
                                    completenessScore={(() => {
                                        const checks = [
                                            !!(profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos')),
                                            !!profile.summary,
                                            workItems.length > 0,
                                            educationItems.length > 0,
                                            skillItems.length > 0,
                                        ];
                                        return Math.round((checks.filter(Boolean).length / checks.length) * 100);
                                    })()}
                                    slug={profile.slug}
                                />
                                <div className="grid md:grid-cols-2 gap-4">
                                    <ViewsLast7DaysChart userId={user.id} />
                                    <ProfileCompleteness profile={profile} work={workItems} education={educationItems} skills={skillItems} onNavigate={() => {}} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <Card className="shadow-sm">
                                <CardContent className="pt-5 pb-4 space-y-3">
                                    {/* Avatar Upload */}
                                    <div className="flex items-center gap-4 pb-2">
                                        <label htmlFor="avatar-upload" className="relative group cursor-pointer flex-shrink-0">
                                            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                                                {profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos') ? (
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
                                                onChange={async (e) => {
                                                    const f = e.target.files?.[0];
                                                    if (!f) return;
                                                    if (f.size > 5 * 1024 * 1024) {
                                                        toast({ variant: 'destructive', title: 'File too large', description: 'Please select an image under 5MB.' });
                                                        return;
                                                    }
                                                    // Compress and resize to 200x200
                                                    const canvas = document.createElement('canvas');
                                                    const ctx = canvas.getContext('2d');
                                                    const img = new window.Image();
                                                    img.onload = () => {
                                                        canvas.width = 200;
                                                        canvas.height = 200;
                                                        const size = Math.min(img.width, img.height);
                                                        const sx = (img.width - size) / 2;
                                                        const sy = (img.height - size) / 2;
                                                        ctx?.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
                                                        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                                                        setProfile(prev => ({ ...prev, avatarUrl: dataUrl }));
                                                        if (user) {
                                                            autoSave('profile', user.id, { avatarUrl: dataUrl });
                                                        }
                                                        toast({ title: 'Photo updated!' });
                                                    };
                                                    img.src = URL.createObjectURL(f);
                                                    e.target.value = '';
                                                }}
                                            />
                                        </label>
                                        <div className="text-xs text-muted-foreground">
                                            <p className="font-medium text-foreground text-sm">Profile Photo</p>
                                            <p>Click to upload. JPG, PNG under 5MB.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        <div className="space-y-1"><Label htmlFor="fullName" className="text-xs">Full Name</Label><Input id="fullName" name="fullName" value={profile.fullName || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} className="h-9" /></div>
                                        <div className="space-y-1"><Label htmlFor="email" className="text-xs">Email</Label><Input id="email" name="email" type="email" value={profile.email || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} className="h-9" /></div>
                                        <div className="space-y-1"><Label htmlFor="phone" className="text-xs">Phone</Label><Input id="phone" name="phone" value={profile.phone || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} className="h-9" /></div>
                                        <div className="space-y-1"><Label htmlFor="location" className="text-xs">Location</Label><Input id="location" name="location" placeholder="City, State" value={profile.location || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} className="h-9" /></div>
                                        <div className="space-y-1 col-span-2"><Label htmlFor="website" className="text-xs">Website/Portfolio</Label><Input id="website" name="website" placeholder="your-website.com" value={profile.website || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} className="h-9" /></div>
                                    </div>
                                    <div className="space-y-1"><Label htmlFor="summary" className="text-xs">Summary</Label><Textarea id="summary" name="summary" placeholder="A brief professional summary..." value={profile.summary || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} rows={2} className="resize-none" /></div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardContent className="pt-4 pb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-semibold">Work Experience</h3>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleAddItem('workExperience')}><PlusCircle className="mr-1 h-3 w-3" /> Add</Button>
                                    </div>
                                    <div className="space-y-3">
                                    {workItems.map(item => (
                                        <div key={item.id} className="border rounded-lg p-3 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">{item.title || 'New Role'}{item.company ? ` at ${item.company}` : ''}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteItem('workExperience', item.id)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                <Input name="title" placeholder="Title" value={item.title} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="h-8 text-sm" />
                                                <Input name="company" placeholder="Company" value={item.company} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="h-8 text-sm" />
                                                <Input name="startDate" placeholder="Start (Jan 2020)" value={item.startDate} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="h-8 text-sm" />
                                                <Input name="endDate" placeholder="End (Present)" value={item.endDate || ''} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} className="h-8 text-sm" />
                                            </div>
                                            <Textarea name="description" placeholder="Key achievements..." value={item.description} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} rows={2} className="text-sm resize-none" />
                                        </div>
                                    ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardContent className="pt-4 pb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-semibold">Education</h3>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleAddItem('education')}><PlusCircle className="mr-1 h-3 w-3" /> Add</Button>
                                    </div>
                                    <div className="space-y-3">
                                    {educationItems.map(item => (
                                        <div key={item.id} className="border rounded-lg p-3 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">{item.institution || 'New Education'}{item.degree ? ` — ${item.degree}` : ''}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteItem('education', item.id)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                <Input name="institution" placeholder="Institution" value={item.institution} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="h-8 text-sm" />
                                                <Input name="degree" placeholder="Degree" value={item.degree} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="h-8 text-sm" />
                                                <Input name="startDate" placeholder="Start" value={item.startDate} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="h-8 text-sm" />
                                                <Input name="endDate" placeholder="End" value={item.endDate || ''} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} className="h-8 text-sm" />
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm">
                                <CardContent className="pt-4 pb-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-semibold">Skills</h3>
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
                                                            autoSave('profile', user.id, { skills: skillItems });
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
                                    if(user) {
                                        await supabase.from('profiles').delete().eq('id', user.id);
                                        await supabase.auth.signOut();
                                    }
                                    toast({ title: 'Account deleted', description: 'All your data has been removed.' });
                                    window.location.href = '/';
                                } catch (err: any) {
                                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete account.' });
                                }
                            }}
                        >
                            Delete Account
                        </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
					</div>
				</div>
			</main>
		</div>
	);
}
