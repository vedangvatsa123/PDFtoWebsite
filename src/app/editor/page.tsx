
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { UserProfile, WorkExperience, Education, Skill, Theme } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Trash2, PlusCircle, Loader2, UploadCloud, FileUp, Trophy, CheckCircle, XCircle, Palette } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Header from '@/components/header';
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, getDoc, setDoc, collection, addDoc, deleteDoc, writeBatch, getDocs, query, orderBy } from 'firebase/firestore';
import { getRedirectResult } from 'firebase/auth';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Progress } from '@/components/ui/progress';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

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

const ResumeUploadPrompt = ({ onFileChange, onUpload, fileName, isGenerating }: { onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void, onUpload: () => void, fileName: string | null, isGenerating: boolean }) => (
    <Card className="w-full border-dashed border-2 hover:border-primary transition-colors mb-8">
        <CardContent className="space-y-4 pt-6">
            <label htmlFor="resume-upload" className="flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors hover:bg-accent/50">
                <UploadCloud className="mr-4 h-8 w-8 text-muted-foreground" />
                <span className="text-muted-foreground">
                    {fileName ? `Selected: ${fileName}` : 'Drag & drop or click to upload PDF'}
                </span>
                <Input id="resume-upload" type="file" className="hidden" accept=".pdf" onChange={onFileChange} />
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button size="lg" className="w-full" onClick={onUpload} disabled={!fileName || isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                    {isGenerating ? 'Generating...' : 'Generate from PDF'}
                </Button>
            </div>
        </CardContent>
    </Card>
);

const ProfileCompleteness = ({ profile, work, education, skills, onNavigate }: { profile: Partial<UserProfile>, work: WorkExperience[], education: Education[], skills: Skill[], onNavigate: (tab: string) => void }) => {
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy /> Profile Completeness
                </CardTitle>
                 <CardDescription>A complete profile is more likely to be seen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Progress value={score} className="w-full" />
                    <span className="text-lg font-bold">{score}%</span>
                </div>
                {isComplete ? (
                    <div className="text-sm text-green-500 flex items-center gap-2 font-semibold">
                       <CheckCircle className="h-5 w-5" /> You did it! Your profile is complete.
                    </div>
                ) : (
                     <div className="space-y-2">
                        <p className="text-sm font-medium">Things to do:</p>
                        <ul className="text-sm text-muted-foreground list-inside space-y-1">
                            {checks.filter(c => !c.complete).map(c => (
                                 <li key={c.name} className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-destructive" /> 
                                    <button onClick={() => onNavigate(c.section)} className="hover:underline text-left">
                                        {c.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const VisitorMetrics = ({ viewCount }: { viewCount: number }) => (
    <Card>
        <CardHeader>
            <CardTitle>Profile Views</CardTitle>
            <CardDescription>Total number of times your public profile has been viewed.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-4xl font-bold">{viewCount}</p>
        </CardContent>
    </Card>
);

const chartData = [
  { country: "USA", views: 186, fill: "var(--color-usa)" },
  { country: "India", views: 120, fill: "var(--color-india)" },
  { country: "Germany", views: 98, fill: "var(--color-germany)" },
  { country: "UK", views: 87, fill: "var(--color-uk)" },
  { country: "Canada", views: 76, fill: "var(--color-canada)" },
  { country: "Other", views: 110, fill: "var(--color-other)" },
];

const chartConfig = {
  views: { label: "Views" },
  usa: { label: "USA", color: "hsl(var(--chart-1))" },
  india: { label: "India", color: "hsl(var(--chart-2))" },
  germany: { label: "Germany", color: "hsl(var(--chart-3))" },
  uk: { label: "UK", color: "hsl(var(--chart-4))" },
  canada: { label: "Canada", color: "hsl(var(--chart-5))" },
  other: { label: "Other", color: "hsl(var(--muted))" }
} satisfies ChartConfig;

function ViewsByCountryChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Views by Country</CardTitle>
        <CardDescription>Top countries where your profile is viewed.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ right: 20 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" dataKey="views" hide />
            <YAxis dataKey="country" type="category" tickLine={false} axisLine={false} tickMargin={8} />
            <Bar dataKey="views" radius={5}>
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.country}`} fill={entry.fill} />
              ))}
            </Bar>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const last7DaysConfig = { views: { label: "Views", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;

function ViewsLast7DaysChart() {
    const [last7DaysData, setLast7DaysData] = useState<any[] | null>(null);
    useEffect(() => {
        const data = Array.from({length: 7}, (_, i) => ({ date: `Day ${i+1}`, views: Math.floor(Math.random() * 10) }));
        setLast7DaysData(data);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Views (Last 7 Days)</CardTitle>
                <CardDescription>Your profile views over the past week.</CardDescription>
            </CardHeader>
            <CardContent>
                {last7DaysData ? (
                    <ChartContainer config={last7DaysConfig} className="min-h-[200px] w-full">
                        <BarChart accessibilityLayer data={last7DaysData}>
                             <CartesianGrid vertical={false} />
                             <XAxis dataKey="date" tickLine={false} tickMargin={10} axisLine={false} />
                            <Bar dataKey="views" fill="var(--color-views)" radius={4} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="min-h-[200px] w-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function EditorPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [initialSlug, setInitialSlug] = useState<string | undefined>(undefined);
    
    // Structured data states
    const [workItems, setWorkItems] = useState<WorkExperience[]>([]);
    const [educationItems, setEducationItems] = useState<Education[]>([]);
    const [skillItems, setSkillItems] = useState<Skill[]>([]);
    
    const [pageIsLoading, setPageIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [activeThemeId, setActiveThemeId] = useState<string | undefined>('modern-creative');

    const themes: Theme[] = [
        { id: 'modern-creative', name: 'Modern Creative', thumbnailUrl: '/images/themes/modern-creative.svg' },
        { id: 'monochrome-professional', name: 'Monochrome Professional', thumbnailUrl: '/images/themes/monochrome-professional.svg' },
        { id: 'classic-minimalist', name: 'Classic Minimalist', thumbnailUrl: '/images/themes/classic-minimalist.svg' },
    ];


    const processedPendingResume = useRef(false);

    useEffect(() => {
        if (auth && !isUserLoading) {
            getRedirectResult(auth)
                .then((result) => {
                    if (result) {
                        toast({
                            title: 'Login Successful',
                            description: `Welcome, ${result.user.displayName || result.user.email}!`,
                        });
                        // onAuthStateChanged will fire and trigger fetchProfileData + pending resume
                    }
                })
                .catch((error) => {
                    console.error("Error processing redirect result:", error);
                    toast({
                        variant: 'destructive',
                        title: 'Login Failed',
                        description: error.message,
                    });
                });
        }
    }, [auth, isUserLoading, toast]);

    const fetchProfileData = useCallback(async () => {
        if (!user || !firestore) return;
        setPageIsLoading(true);

        const profileRef = doc(firestore, 'users', user.uid, 'userProfile', user.uid);
        const workQuery = query(collection(firestore, 'users', user.uid, 'workExperience'));
        const eduQuery = query(collection(firestore, 'users', user.uid, 'education'));
        const skillsQuery = query(collection(firestore, 'users', user.uid, 'skills'));
        
        const [profileSnap, workSnap, eduSnap, skillsSnap] = await Promise.all([
            getDoc(profileRef), getDocs(workQuery), getDocs(eduQuery), getDocs(skillsQuery)
        ]);
        
        let profileData: UserProfile;
        if (profileSnap.exists()) {
            profileData = profileSnap.data() as UserProfile;
        } else {
            profileData = {
                userId: user.uid,
                fullName: user.displayName || 'Your Name',
                email: user.email || '',
                summary: '',
                slug: generateSlug(user.displayName || 'user'),
                avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
                avatarHint: 'person portrait',
                themeId: 'modern-creative',
                viewCount: 0,
            };
            const userProfileDocRef = doc(firestore, 'users', user.uid, 'userProfile', user.uid);
            const slugDocRef = doc(firestore, 'userProfilesBySlug', profileData.slug!);
            const batch = writeBatch(firestore);
            batch.set(userProfileDocRef, profileData, { merge: true });
            batch.set(slugDocRef, profileData, { merge: true });
            await batch.commit();
        }

        setProfile(profileData);
        setInitialSlug(profileData.slug);
        setActiveThemeId(profileData.themeId);
        setWorkItems(workSnap.docs.map(d => ({ ...d.data(), id: d.id } as WorkExperience)));
        setEducationItems(eduSnap.docs.map(d => ({ ...d.data(), id: d.id } as Education)));
        setSkillItems(skillsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Skill)));
        
        setPageIsLoading(false);
        return { profile: profileData }; // Return data for chaining
    }, [user, firestore, setPageIsLoading, setProfile, setInitialSlug, setActiveThemeId, setWorkItems, setEducationItems, setSkillItems]);

    const autoSave = useCallback((collectionName: string, id: string, data: any) => {
        if (!user || !firestore) return;
        setIsSaving(true);
        const ref = doc(firestore, 'users', user.uid, collectionName, id);
        setDocumentNonBlocking(ref, data, { merge: true });
        setTimeout(() => setIsSaving(false), 700);
    }, [user, firestore, setIsSaving]);

    const handleResumeUpload = useCallback(async (resumeFile: File) => {
        if (!resumeFile || !user || !firestore) {
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

            const batch = writeBatch(firestore);
            const profileRef = doc(firestore, 'users', user.uid, 'userProfile', user.uid);
            
            const currentProfileSnap = await getDoc(profileRef);
            const currentProfile = currentProfileSnap.data() || {};
            const currentSlug = currentProfile.slug || generateSlug(extractedData.personalInfo.fullName || user.displayName || 'user');
            
            const updatedProfile: UserProfile = {
                ...currentProfile,
                userId: user.uid,
                fullName: extractedData.personalInfo.fullName || currentProfile.fullName || '',
                email: currentProfile.email || user.email,
                summary: extractedData.summary || currentProfile.summary || '',
                phone: extractedData.personalInfo.phone || currentProfile.phone || '',
                website: extractedData.personalInfo.website || currentProfile.website || '',
                location: extractedData.personalInfo.location || currentProfile.location || '',
                slug: currentSlug,
            };
            batch.set(profileRef, updatedProfile, { merge: true });

            const slugRef = doc(firestore, 'userProfilesBySlug', updatedProfile.slug!);
            batch.set(slugRef, updatedProfile, { merge: true });

            // Clear old structured data
            const collectionsToClear = ['workExperience', 'education', 'skills'];
            for (const col of collectionsToClear) {
                const snap = await getDocs(collection(firestore, 'users', user.uid, col));
                snap.forEach(doc => batch.delete(doc.ref));
            }

            // Add new structured data
            extractedData.workExperience?.forEach((item: Omit<WorkExperience, 'id'>) => {
                const newRef = doc(collection(firestore, 'users', user.uid, 'workExperience'));
                batch.set(newRef, { ...item, userProfileId: user.uid });
            });
            extractedData.education?.forEach((item: Omit<Education, 'id'>) => {
                const newRef = doc(collection(firestore, 'users', user.uid, 'education'));
                batch.set(newRef, { ...item, userProfileId: user.uid });
            });
            extractedData.skills?.forEach((item: Omit<Skill, 'id'>) => {
                const newRef = doc(collection(firestore, 'users', user.uid, 'skills'));
                batch.set(newRef, { ...item, userProfileId: user.uid });
            });
            
            await batch.commit();
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
    }, [user, firestore, fetchProfileData, toast, setFile, setFileName]);

    useEffect(() => {
        if (user && firestore && !processedPendingResume.current) {
            fetchProfileData().then(data => {
                const pendingResumeDataUrl = sessionStorage.getItem('pendingResume');
                const pendingResumeName = sessionStorage.getItem('pendingResumeName');
                if (pendingResumeDataUrl && pendingResumeName && data?.profile) {
                    processedPendingResume.current = true;
                    const resumeFile = dataURLtoFile(pendingResumeDataUrl, pendingResumeName);
                    if (resumeFile) handleResumeUpload(resumeFile);
                }
            });
        }
    }, [user, firestore, fetchProfileData, handleResumeUpload]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({...prev, [name]: value}));
    };
    
    const handleProfileBlur = async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!user || !firestore) return;
        const { name, value } = e.target;
        if ((profile as any)[name] === value) return; // No change
        
        if (name === 'slug' && value !== initialSlug) {
            const slugRef = doc(firestore, 'userProfilesBySlug', value);
            const slugSnap = await getDoc(slugRef);
            if (slugSnap.exists() && slugSnap.data().userId !== user.uid) {
                toast({ variant: 'destructive', title: 'URL Unavailable', description: `The URL "${value}" is already taken.` });
                setProfile(prev => ({ ...prev, slug: initialSlug })); 
                return;
            }
             if (initialSlug) {
                const oldSlugRef = doc(firestore, 'userProfilesBySlug', initialSlug);
                deleteDocumentNonBlocking(oldSlugRef);
            }
            const newSlugRef = doc(firestore, 'userProfilesBySlug', value);
            setDocumentNonBlocking(newSlugRef, { userId: user.uid, ...profile, slug: value }, { merge: true });
            setInitialSlug(value);
        }
        autoSave('userProfile', user.uid, { [name]: value });
    };

    const handleItemChange = (collection: string, id: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const setter = {
            workExperience: setWorkItems,
            education: setEducationItems,
            skills: setSkillItems,
        }[collection as 'workExperience' | 'education' | 'skills'];
        (setter as any)?.((prev: any[]) => prev.map((item: any) => item.id === id ? {...item, [name]: value} : item));
    }

    const handleItemBlur = (collection: string, id: string, e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        autoSave(collection, id, { [name]: value });
    };

    const handleAddItem = async (collectionName: 'workExperience' | 'education' | 'skills') => {
        if (!user || !firestore) return;
        const colRef = collection(firestore, 'users', user.uid, collectionName);
        let newItem: any;
        if (collectionName === 'workExperience') {
            newItem = { title: 'New Role', company: 'Company Name', startDate: 'Jan 2024', description: 'My responsibilities...' };
        } else if (collectionName === 'education') {
            newItem = { institution: 'University Name', degree: 'Degree', startDate: 'Sep 2020' };
        } else { // Skills
            newItem = { name: 'New Skill' };
        }
        const docRef = await addDoc(colRef, { ...newItem, userProfileId: user.uid });
        newItem.id = docRef.id;
        
        const setter = { workExperience: setWorkItems, education: setEducationItems, skills: setSkillItems }[collectionName];
        (setter as any)((prev: any[]) => [...prev, newItem]);
    };

    const handleDeleteItem = (collectionName: string, id: string) => {
        if (!user || !firestore) return;
        const docRef = doc(firestore, 'users', user.uid, collectionName, id);
        deleteDocumentNonBlocking(docRef);
        const setter = { workExperience: setWorkItems, education: setEducationItems, skills: setSkillItems }[collectionName as 'workExperience' | 'education' | 'skills'];
        (setter as any)?.((prev: any[]) => prev.filter((item: any) => item.id !== id));
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            if (f.type !== 'application/pdf' || f.size > 10 * 1024 * 1024) {
                toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select a PDF file under 10MB.' });
                setFile(null); setFileName(null);
            } else {
                setFile(f); setFileName(f.name);
            }
        }
    };
    
    const handleThemeChange = (themeId: string) => {
        if (!user) return;
        setActiveThemeId(themeId);
        autoSave('userProfile', user.uid, { themeId });
    };

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
            <main className="flex-1 bg-secondary/30">
                <div className="container mx-auto max-w-4xl p-4 md:p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-bold">Welcome back, {profile.fullName}!</h1>
                            <p className="text-muted-foreground">Edit your profile, manage settings, and see your stats.</p>
                        </div>
                        <div className="flex items-center gap-2">
                           {isSaving && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin h-4 w-4" /><span>Saving...</span></div>}
                            {profile.slug && (
                                <Button variant="outline" asChild>
                                    <Link href={`/${profile.slug}`} prefetch={false} target="_blank">
                                        <Eye className="mr-2 h-4 w-4" />
                                        Preview
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <ResumeUploadPrompt onFileChange={handleFileChange} onUpload={() => file && handleResumeUpload(file)} fileName={fileName} isGenerating={isGenerating} />
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="flex justify-center"><TabsList><TabsTrigger value="dashboard">Dashboard</TabsTrigger><TabsTrigger value="content">Content</TabsTrigger><TabsTrigger value="appearance">Appearance</TabsTrigger></TabsList></div>
                             <TabsContent value="dashboard">
                                <div className="grid gap-6 pt-6">
                                     <Card>
                                        <CardHeader><CardTitle>Your Public Link</CardTitle><CardDescription>Share this link to your public profile page.</CardDescription></CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex space-x-2">
                                                <Input id="slug" name="slug" value={profile.slug || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} />
                                                <Button asChild variant="secondary"><Link href={`/${profile.slug}`} target="_blank" prefetch={false}><Eye className="mr-2 h-4 w-4" />Visit</Link></Button>
                                            </div>
                                             {profile.slug && <p className="text-sm text-muted-foreground">Your profile is available at: <Link href={`/${profile.slug}`} target="_blank" className="text-primary hover:underline" rel="noopener noreferrer">{`https://your-domain.com/${profile.slug}`}</Link></p>}
                                        </CardContent>
                                    </Card>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <VisitorMetrics viewCount={profile.viewCount || 0} />
                                        <ProfileCompleteness profile={profile} work={workItems} education={educationItems} skills={skillItems} onNavigate={setActiveTab} />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6"><ViewsByCountryChart /><ViewsLast7DaysChart /></div>
                                </div>
                            </TabsContent>
                            <TabsContent value="content">
                                <div className="space-y-6 pt-6">
                                    <Card><CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="space-y-2"><Label htmlFor="fullName">Full Name</Label><Input id="fullName" name="fullName" value={profile.fullName || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} /></div>
                                                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={profile.email || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} /></div>
                                                <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" value={profile.phone || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} /></div>
                                                <div className="space-y-2"><Label htmlFor="location">Location</Label><Input id="location" name="location" value={profile.location || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} /></div>
                                            </div>
                                            <div className="space-y-2"><Label htmlFor="website">Website/Portfolio</Label><Input id="website" name="website" placeholder="your-website.com" value={profile.website || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} /></div>
                                            <div className="space-y-2"><Label htmlFor="summary">Summary</Label><Textarea id="summary" name="summary" value={profile.summary || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} rows={5} /></div>
                                        </CardContent>
                                    </Card>

                                    <Card><CardHeader><CardTitle>Work Experience</CardTitle></CardHeader>
                                        <CardContent className="space-y-6">
                                            {workItems.map(item => (
                                                <Card key={item.id} className="p-4"><div className="space-y-4">
                                                    <div className="flex justify-between items-center"><div className="font-semibold">{item.title}</div><Button variant="ghost" size="icon" onClick={() => handleDeleteItem('workExperience', item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2"><Label>Title</Label><Input name="title" value={item.title} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} /></div>
                                                        <div className="space-y-2"><Label>Company</Label><Input name="company" value={item.company} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} /></div>
                                                        <div className="space-y-2"><Label>Start Date</Label><Input name="startDate" value={item.startDate} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} /></div>
                                                        <div className="space-y-2"><Label>End Date</Label><Input name="endDate" value={item.endDate || ''} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} /></div>
                                                    </div>
                                                    <div className="space-y-2"><Label>Description</Label><Textarea name="description" value={item.description} onChange={(e) => handleItemChange('workExperience', item.id, e)} onBlur={(e) => handleItemBlur('workExperience', item.id, e)} rows={4} /></div>
                                                </div></Card>
                                            ))}
                                            <Button variant="outline" className="w-full" onClick={() => handleAddItem('workExperience')}><PlusCircle className="mr-2 h-4 w-4" /> Add Work Experience</Button>
                                        </CardContent>
                                    </Card>
                                    
                                    <Card><CardHeader><CardTitle>Education</CardTitle></CardHeader>
                                        <CardContent className="space-y-6">
                                            {educationItems.map(item => (
                                                <Card key={item.id} className="p-4"><div className="space-y-4">
                                                    <div className="flex justify-between items-center"><div className="font-semibold">{item.institution}</div><Button variant="ghost" size="icon" onClick={() => handleDeleteItem('education', item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div>
                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2"><Label>Institution</Label><Input name="institution" value={item.institution} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} /></div>
                                                        <div className="space-y-2"><Label>Degree</Label><Input name="degree" value={item.degree} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} /></div>
                                                        <div className="space-y-2"><Label>Start Date</Label><Input name="startDate" value={item.startDate} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} /></div>
                                                        <div className="space-y-2"><Label>End Date</Label><Input name="endDate" value={item.endDate || ''} onChange={(e) => handleItemChange('education', item.id, e)} onBlur={(e) => handleItemBlur('education', item.id, e)} /></div>
                                                    </div>
                                                </div></Card>
                                            ))}
                                            <Button variant="outline" className="w-full" onClick={() => handleAddItem('education')}><PlusCircle className="mr-2 h-4 w-4" /> Add Education</Button>
                                        </CardContent>
                                    </Card>

                                    <Card><CardHeader><CardTitle>Skills</CardTitle></CardHeader>
                                        <CardContent className="space-y-6">
                                             <div className="flex flex-wrap gap-2">
                                                {skillItems.map(item => (
                                                    <div key={item.id} className="flex items-center gap-1 bg-secondary p-2 rounded-md">
                                                        <Input name="name" value={item.name} onChange={(e) => handleItemChange('skills', item.id, e)} onBlur={(e) => handleItemBlur('skills', item.id, e)} className="h-8 border-none bg-transparent"/>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteItem('skills', item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button variant="outline" className="w-full" onClick={() => handleAddItem('skills')}><PlusCircle className="mr-2 h-4 w-4" /> Add Skill</Button>
                                        </CardContent>
                                    </Card>

								</div>
							</TabsContent>
                            <TabsContent value="appearance">
                                <div className="space-y-6 pt-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2"><Palette /> Select a Theme</CardTitle>
                                            <CardDescription>Choose a visual theme for your public profile page.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {themes?.map(theme => (
                                                <div key={theme.id} className="relative cursor-pointer group" onClick={() => handleThemeChange(theme.id)}>
                                                    <div className={`aspect-video w-full rounded-md border-2 ${activeThemeId === theme.id ? 'border-primary' : 'border-border'}`}>
                                                        <Image src={theme.thumbnailUrl || '/placeholder.svg'} alt={theme.name} width={300} height={169} className="w-full h-full object-cover rounded-sm" />
                                                    </div>
                                                    <p className="text-sm font-medium mt-2 text-center">{theme.name}</p>
                                                    {activeThemeId === theme.id && (
                                                        <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
						</Tabs>
					</div>
				</div>
			</main>
		</div>
	);
}
