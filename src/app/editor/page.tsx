
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
import { useUser, useFirestore, useAuth } from '@/firebase';
import { doc, getDoc, setDoc, collection, addDoc, deleteDoc, writeBatch, getDocs, query, orderBy } from 'firebase/firestore';
import { getRedirectResult } from 'firebase/auth';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
    const firestore = useFirestore();
    const [chartData, setChartData] = useState<{ date: string; views: number }[] | null>(null);

    useEffect(() => {
        if (!firestore || !userId) return;
        (async () => {
            const days: { date: string; views: number }[] = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toISOString().slice(0, 10);
                const label = d.toLocaleDateString('en-US', { weekday: 'short' });
                try {
                    const snap = await getDoc(doc(firestore, 'users', userId, 'dailyViews', key));
                    days.push({ date: label, views: snap.exists() ? (snap.data().views || 0) : 0 });
                } catch {
                    days.push({ date: label, views: 0 });
                }
            }
            setChartData(days);
        })();
    }, [firestore, userId]);

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
    const firestore = useFirestore();
    const auth = useAuth();
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

    // When guest signs up/logs in, save their sessionStorage snapshot to Firestore
    useEffect(() => {
        if (!user || !firestore || guestSavedToFirestore.current || processedPendingResume.current) return;
        const rawSnapshot = sessionStorage.getItem('parsedResume');
        if (!rawSnapshot) return;
        guestSavedToFirestore.current = true;
        processedPendingResume.current = true;
        (async () => {
            try {
                const snapshot = JSON.parse(rawSnapshot);
                const pi = snapshot.personalInfo || {};
                const fullName = pi.fullName || user.displayName || 'user';
                const slug = pi.slug || generateSlug(fullName);
                const profileToSave: UserProfile = {
                    userId: user.uid,
                    fullName,
                    email: pi.email || user.email || '',
                    phone: pi.phone || '',
                    location: pi.location || '',
                    website: pi.website || '',
                    summary: snapshot.summary || '',
                    slug,
                    themeId: snapshot.themeId || 'modern-creative',
                    avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
                    avatarHint: 'person portrait',
                    viewCount: 0,
                };
                const skillsArr = (snapshot.skills || []).map((s: any) => s.name || s);
                profileToSave.skills = skillsArr;
                const batch = writeBatch(firestore);
                batch.set(doc(firestore, 'users', user.uid), profileToSave, { merge: true });
                batch.set(doc(firestore, 'slugs', slug), { userId: user.uid });
                (snapshot.workExperience || []).forEach((item: any) => {
                    const { id, ...rest } = item;
                    batch.set(doc(collection(firestore, 'users', user.uid, 'workExperience')), { ...rest, userProfileId: user.uid });
                });
                (snapshot.education || []).forEach((item: any) => {
                    const { id, ...rest } = item;
                    batch.set(doc(collection(firestore, 'users', user.uid, 'education')), { ...rest, userProfileId: user.uid });
                });
                await batch.commit();
                sessionStorage.removeItem('parsedResume');
                toast({ title: 'Profile saved!', description: 'Your profile is now live.' });
            } catch (e) {
                console.error('Failed to save guest data:', e);
            } finally {
                fetchProfileData();
            }
        })();
    // intentionally only depends on user/firestore — runs once on auth state change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, firestore]);

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

        const profileRef = doc(firestore, 'users', user.uid);
        const workQuery = query(collection(firestore, 'users', user.uid, 'workExperience'));
        const eduQuery = query(collection(firestore, 'users', user.uid, 'education'));
        const customQuery = query(collection(firestore, 'users', user.uid, 'customSections'));
        
        const [profileSnap, workSnap, eduSnap, customSnap] = await Promise.all([
            getDoc(profileRef), getDocs(workQuery), getDocs(eduQuery), getDocs(customQuery)
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
                skills: [],
            };
            const batch = writeBatch(firestore);
            batch.set(profileRef, profileData, { merge: true });
            batch.set(doc(firestore, 'slugs', profileData.slug!), { userId: user.uid });
            await batch.commit();
        }

        setProfile(profileData);
        setInitialSlug(profileData.slug);
        setActiveThemeId(profileData.themeId);
        setWorkItems(workSnap.docs.map(d => ({ ...d.data(), id: d.id } as WorkExperience)));
        setEducationItems(eduSnap.docs.map(d => ({ ...d.data(), id: d.id } as Education)));
        setSkillItems(profileData.skills || []);
        setCustomSections(customSnap.docs.map(d => ({ ...d.data(), id: d.id } as CustomSection)).sort((a, b) => (a.order || 0) - (b.order || 0)));
        
        setPageIsLoading(false);
        return { profile: profileData };
    }, [user, firestore, setPageIsLoading, setProfile, setInitialSlug, setActiveThemeId, setWorkItems, setEducationItems, setSkillItems, setCustomSections]);

    const autoSave = useCallback((collectionName: string, id: string, data: any) => {
        if (!user || !firestore) return;
        setIsSaving(true);
        // Profile fields save to users/{uid}, subcollections save to the subcollection doc
        const ref = (collectionName === 'profile')
            ? doc(firestore, 'users', user.uid)
            : doc(firestore, 'users', user.uid, collectionName, id);
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
            const profileRef = doc(firestore, 'users', user.uid);
            
            const currentProfileSnap = await getDoc(profileRef);
            const currentProfile = currentProfileSnap.data() || {};
            const currentSlug = currentProfile.slug || generateSlug(extractedData.personalInfo.fullName || user.displayName || 'user');
            
            const skillsArr = (extractedData.skills || []).map((s: any) => s.name || s);
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
                skills: skillsArr,
            };
            batch.set(profileRef, updatedProfile, { merge: true });
            batch.set(doc(firestore, 'slugs', updatedProfile.slug!), { userId: user.uid });

            // Clear old subcollection data
            const collectionsToClear = ['workExperience', 'education'];
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
            const slugRef = doc(firestore, 'slugs', value);
            const slugSnap = await getDoc(slugRef);
            if (slugSnap.exists() && slugSnap.data().userId !== user.uid) {
                toast({ variant: 'destructive', title: 'URL Unavailable', description: `The URL "${value}" is already taken.` });
                setProfile(prev => ({ ...prev, slug: initialSlug })); 
                return;
            }
             if (initialSlug) {
                const oldSlugRef = doc(firestore, 'slugs', initialSlug);
                deleteDocumentNonBlocking(oldSlugRef);
            }
            const newSlugRef = doc(firestore, 'slugs', value);
            setDocumentNonBlocking(newSlugRef, { userId: user.uid }, { merge: true });
            setInitialSlug(value);
        }
        autoSave('profile', user.uid, { [name]: value });
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
        const { name, value } = e.target;
        autoSave(collectionName, id, { [name]: value });
    };

    const handleAddItem = async (collectionName: 'workExperience' | 'education') => {
        let newItem: any;
        if (collectionName === 'workExperience') {
            newItem = { title: '', company: '', startDate: '', endDate: '', description: '' };
        } else {
            newItem = { institution: '', degree: '', startDate: '', endDate: '' };
        }
        const guestId = `guest-${collectionName}-${Date.now()}`;
        if (user && firestore) {
            const colRef = collection(firestore, 'users', user.uid, collectionName);
            const docRef = await addDoc(colRef, { ...newItem, userProfileId: user.uid });
            newItem.id = docRef.id;
        } else {
            newItem.id = guestId;
            newItem.userProfileId = '';
        }
        const setter = { workExperience: setWorkItems, education: setEducationItems }[collectionName];
        (setter as any)((prev: any[]) => [...prev, newItem]);
    };

    const handleDeleteItem = (collectionName: string, id: string) => {
        if (user && firestore) {
            const docRef = doc(firestore, 'users', user.uid, collectionName, id);
            deleteDocumentNonBlocking(docRef);
        }
        const setter = { workExperience: setWorkItems, education: setEducationItems }[collectionName as 'workExperience' | 'education'];
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
                // Auto-trigger generation immediately
                handleResumeUpload(f);
            }
        }
    };
    


    // Build preview data for local preview dialog (must be before early returns — Rules of Hooks)
    const previewData = useMemo(() => ({
        profile: {
            userId: user?.uid || 'guest',
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
                        <ResumeUploadPrompt onFileChange={handleFileChange} isGenerating={isGenerating} />
                        
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
                                    <ViewsLast7DaysChart userId={user.uid} />
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
                                                        if (user && firestore) {
                                                            autoSave('profile', user.uid, { avatarUrl: dataUrl });
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
                                            if (user && firestore) {
                                                autoSave('profile', user.uid, { skills: [...skillItems, ''] });
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
                                                        if (user && firestore) {
                                                            autoSave('profile', user.uid, { skills: skillItems });
                                                        }
                                                    }}
                                                />
                                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => {
                                                    const newSkills = skillItems.filter((_, i) => i !== idx);
                                                    setSkillItems(newSkills);
                                                    if (user && firestore) {
                                                        autoSave('profile', user.uid, { skills: newSkills });
                                                    }
                                                }}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* ─── CUSTOM SECTIONS ─── */}
                            {customSections.map((section, sIdx) => (
                                <Card key={section.id} className="shadow-sm">
                                    <CardContent className="pt-4 pb-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <Input
                                                value={section.sectionTitle}
                                                placeholder="Section Title (e.g. Projects)"
                                                className="h-7 text-sm font-semibold border-none bg-transparent p-0 focus-visible:ring-0 w-auto"
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCustomSections(prev => prev.map(s => s.id === section.id ? { ...s, sectionTitle: val } : s));
                                                }}
                                                onBlur={() => {
                                                    if (user && firestore) {
                                                        autoSave('customSections', section.id, { sectionTitle: section.sectionTitle });
                                                    }
                                                }}
                                            />
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                                                    const newItem: CustomSectionItem = { id: `item-${Date.now()}`, title: '', subtitle: '', description: '', date: '' };
                                                    setCustomSections(prev => prev.map(s => {
                                                        if (s.id !== section.id) return s;
                                                        const updated = { ...s, items: [...(s.items || []), newItem] };
                                                        if (user && firestore) autoSave('customSections', section.id, { items: updated.items });
                                                        return updated;
                                                    }));
                                                }}><PlusCircle className="mr-1 h-3 w-3" /> Add</Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                                    if (user && firestore) {
                                                        const docRef = doc(firestore, 'users', user.uid, 'customSections', section.id);
                                                        deleteDocumentNonBlocking(docRef);
                                                    }
                                                    setCustomSections(prev => prev.filter(s => s.id !== section.id));
                                                }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {(section.items || []).map((item, iIdx) => (
                                                <div key={item.id} className="border rounded-md p-2 space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            placeholder="Title"
                                                            value={item.title}
                                                            className="h-7 text-xs flex-1"
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setCustomSections(prev => prev.map(s => {
                                                                    if (s.id !== section.id) return s;
                                                                    return { ...s, items: s.items.map(it => it.id === item.id ? { ...it, title: val } : it) };
                                                                }));
                                                            }}
                                                            onBlur={() => {
                                                                if (user && firestore) {
                                                                    const sec = customSections.find(s => s.id === section.id);
                                                                    if (sec) autoSave('customSections', section.id, { items: sec.items });
                                                                }
                                                            }}
                                                        />
                                                        <Input
                                                            placeholder="Date"
                                                            value={item.date || ''}
                                                            className="h-7 text-xs w-24"
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                setCustomSections(prev => prev.map(s => {
                                                                    if (s.id !== section.id) return s;
                                                                    return { ...s, items: s.items.map(it => it.id === item.id ? { ...it, date: val } : it) };
                                                                }));
                                                            }}
                                                            onBlur={() => {
                                                                if (user && firestore) {
                                                                    const sec = customSections.find(s => s.id === section.id);
                                                                    if (sec) autoSave('customSections', section.id, { items: sec.items });
                                                                }
                                                            }}
                                                        />
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                                            setCustomSections(prev => prev.map(s => {
                                                                if (s.id !== section.id) return s;
                                                                const updated = { ...s, items: s.items.filter(it => it.id !== item.id) };
                                                                if (user && firestore) autoSave('customSections', section.id, { items: updated.items });
                                                                return updated;
                                                            }));
                                                        }}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                                                    </div>
                                                    <Input
                                                        placeholder="Subtitle (optional)"
                                                        value={item.subtitle || ''}
                                                        className="h-7 text-xs"
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setCustomSections(prev => prev.map(s => {
                                                                if (s.id !== section.id) return s;
                                                                return { ...s, items: s.items.map(it => it.id === item.id ? { ...it, subtitle: val } : it) };
                                                            }));
                                                        }}
                                                        onBlur={() => {
                                                            if (user && firestore) {
                                                                const sec = customSections.find(s => s.id === section.id);
                                                                if (sec) autoSave('customSections', section.id, { items: sec.items });
                                                            }
                                                        }}
                                                    />
                                                    <Textarea
                                                        placeholder="Description (optional)"
                                                        value={item.description || ''}
                                                        className="text-xs min-h-[40px] resize-none"
                                                        rows={2}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setCustomSections(prev => prev.map(s => {
                                                                if (s.id !== section.id) return s;
                                                                return { ...s, items: s.items.map(it => it.id === item.id ? { ...it, description: val } : it) };
                                                            }));
                                                        }}
                                                        onBlur={() => {
                                                            if (user && firestore) {
                                                                const sec = customSections.find(s => s.id === section.id);
                                                                if (sec) autoSave('customSections', section.id, { items: sec.items });
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-8 text-xs border-dashed"
                                onClick={async () => {
                                    const newSection: Omit<CustomSection, 'id'> = {
                                        userProfileId: user?.uid || '',
                                        sectionTitle: '',
                                        items: [],
                                        order: customSections.length,
                                    };
                                    if (user && firestore) {
                                        const colRef = collection(firestore, 'users', user.uid, 'customSections');
                                        const docRef = await addDoc(colRef, newSection);
                                        setCustomSections(prev => [...prev, { ...newSection, id: docRef.id }]);
                                    } else {
                                        setCustomSections(prev => [...prev, { ...newSection, id: `guest-cs-${Date.now()}` }]);
                                    }
                                }}
                            >
                                <PlusCircle className="mr-1 h-3 w-3" /> Add Section
                            </Button>
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
                                                        // Delete all subcollections
                                                        const collections = ['workExperience', 'education', 'customSections', 'dailyViews'];
                                                        for (const col of collections) {
                                                            const snap = await getDocs(collection(firestore, 'users', user.uid, col));
                                                            const batch = writeBatch(firestore);
                                                            snap.docs.forEach(d => batch.delete(d.ref));
                                                            if (snap.docs.length > 0) await batch.commit();
                                                        }
                                                        // Delete slug mapping
                                                        if (profile.slug) {
                                                            const { deleteDoc: delDoc } = await import('firebase/firestore');
                                                            await delDoc(doc(firestore, 'slugs', profile.slug));
                                                        }
                                                        // Delete user doc
                                                        await deleteDoc(doc(firestore, 'users', user.uid));
                                                        // Delete auth account
                                                        await user.delete();
                                                        toast({ title: 'Account deleted', description: 'All your data has been removed.' });
                                                        window.location.href = '/';
                                                    } catch (err: any) {
                                                        if (err.code === 'auth/requires-recent-login') {
                                                            toast({ variant: 'destructive', title: 'Re-authentication required', description: 'Please sign out, sign back in, and try again.' });
                                                        } else {
                                                            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete account.' });
                                                        }
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
