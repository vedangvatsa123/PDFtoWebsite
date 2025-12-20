
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { UserProfile, ResumeSection } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Trash2, PlusCircle, Loader2, UploadCloud, FileUp, Trophy, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Header from '@/components/header';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, collection, addDoc, deleteDoc, writeBatch, getDocs, query, orderBy } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Progress } from '@/components/ui/progress';
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

function generateSlug(name: string) {
  const randomString = Math.random().toString(36).substring(2, 7);
  const firstName = name.split(' ')[0] || 'user';
  return firstName.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + randomString;
}

const ResumeUploadPrompt = ({ onFileChange, onUpload, fileName, isGenerating }: { onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void, onUpload: () => void, fileName: string | null, isGenerating: boolean }) => (
    <Card className="w-full border-dashed border-2 hover:border-primary transition-colors mb-8">
        <CardHeader>
            <CardTitle>Generate with your Resume</CardTitle>
            <CardDescription>Upload your resume (PDF) to automatically fill out your profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

const ProfileCompleteness = ({ profile, sections, onNavigate }: { profile: Partial<UserProfile>, sections: ResumeSection[], onNavigate: (tab: string) => void }) => {
    const completeness = useMemo(() => {
        const checks = [
            { name: "Add a Profile Photo", complete: !!(profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos')), section: 'settings' },
            { name: "Write a Summary", complete: !!profile.summary, section: 'settings' },
            { name: "Add Contact Info (Phone or Website)", complete: !!(profile.phone || profile.website), section: 'settings' },
            { name: "Add at least one resume section", complete: sections.length > 0, section: 'content' },
        ];
        const completeCount = checks.filter(c => c.complete).length;
        const totalCount = checks.length;
        const score = Math.round((completeCount / totalCount) * 100);

        return { score, checks, isComplete: completeCount === totalCount };
    }, [profile, sections]);

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

const VisitorMetrics = ({ viewCount }: { viewCount: number }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Views</CardTitle>
                <CardDescription>Total number of times your public profile has been viewed.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">{viewCount}</p>
            </CardContent>
        </Card>
    )
}

const chartData = [
  { country: "USA", views: 186, fill: "var(--color-usa)" },
  { country: "India", views: 120, fill: "var(--color-india)" },
  { country: "Germany", views: 98, fill: "var(--color-germany)" },
  { country: "UK", views: 87, fill: "var(--color-uk)" },
  { country: "Canada", views: 76, fill: "var(--color-canada)" },
  { country: "Other", views: 110, fill: "var(--color-other)" },
]

const chartConfig = {
  views: {
    label: "Views",
  },
  usa: {
    label: "USA",
    color: "hsl(var(--chart-1))",
  },
  india: {
    label: "India",
    color: "hsl(var(--chart-2))",
  },
  germany: {
    label: "Germany",
    color: "hsl(var(--chart-3))",
  },
   uk: {
    label: "UK",
    color: "hsl(var(--chart-4))",
  },
  canada: {
    label: "Canada",
    color: "hsl(var(--chart-5))",
  },
  other: {
    label: "Other",
    color: "hsl(var(--muted))",
  }
} satisfies ChartConfig

export function ViewsByCountryChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Views by Country</CardTitle>
        <CardDescription>Top countries where your profile is viewed.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" dataKey="views" hide />
            <Bar dataKey="views" layout="vertical" radius={5} />
             <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

const last7DaysData = [
    { date: 'Day 1', views: Math.floor(Math.random() * 10) },
    { date: 'Day 2', views: Math.floor(Math.random() * 10) },
    { date: 'Day 3', views: Math.floor(Math.random() * 10) },
    { date: 'Day 4', views: Math.floor(Math.random() * 10) },
    { date: 'Day 5', views: Math.floor(Math.random() * 10) },
    { date: 'Day 6', views: Math.floor(Math.random() * 10) },
    { date: 'Day 7', views: Math.floor(Math.random() * 10) },
];

const last7DaysConfig = {
  views: {
    label: "Views",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function ViewsLast7DaysChart() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Views (Last 7 Days)</CardTitle>
                <CardDescription>Your profile views over the past week.</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={last7DaysConfig} className="min-h-[200px] w-full">
                    <BarChart accessibilityLayer data={last7DaysData}>
                         <CartesianGrid vertical={false} />
                         <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            />
                        <Bar dataKey="views" fill="var(--color-views)" radius={4} />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

export default function EditorPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const lastSavedData = useRef<{
        profile: Partial<UserProfile>;
        sections: ResumeSection[];
    }>({ profile: {}, sections: [] });

    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [initialSlug, setInitialSlug] = useState<string | undefined>(undefined);
    const [sections, setSections] = useState<ResumeSection[]>([]);
    
    const [pageIsLoading, setPageIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [activeTheme, setActiveTheme] = useState('default');
    const [activeTab, setActiveTab] = useState('dashboard');

    const contentRef = useRef<HTMLDivElement>(null);

    // Redirect if user is not logged in
    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    const fetchProfileData = useCallback(async () => {
        if (!user || !firestore) return;
        setPageIsLoading(true);

        const profileRef = doc(firestore, 'users', user.uid, 'userProfile', user.uid);
        const sectionsQuery = query(collection(firestore, 'users', user.uid, 'resumeSections'), orderBy('order'));
        
        const [profileSnap, sectionsSnap] = await Promise.all([
            getDoc(profileRef),
            getDocs(sectionsQuery),
        ]);
        
        let profileData: UserProfile;
        const sectionsData = sectionsSnap.docs.map(d => ({ ...d.data(), id: d.id } as ResumeSection));

        if (profileSnap.exists()) {
            profileData = profileSnap.data() as UserProfile;
        } else {
            // New user, create a shell profile
            profileData = {
                userId: user.uid,
                fullName: user.displayName || 'Your Name',
                email: user.email || '',
                summary: '',
                slug: generateSlug(user.displayName || 'user'),
                avatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
                avatarHint: 'person portrait',
                themeId: 'default',
                viewCount: 0,
            };
            const userProfileDocRef = doc(firestore, 'users', user.uid, 'userProfile', user.uid);
            const slugDocRef = doc(firestore, 'userProfilesBySlug', profileData.slug!);
            
            // Non-blocking writes for new user setup
            setDocumentNonBlocking(userProfileDocRef, profileData, { merge: true });
            setDocumentNonBlocking(slugDocRef, { userId: user.uid, ...profileData }, { merge: true });
        }

        const dataBundle = {
            profile: profileData,
            sections: sectionsData,
        };

        setProfile(dataBundle.profile);
        setInitialSlug(dataBundle.profile.slug);
        setActiveTheme(dataBundle.profile.themeId || 'default');
        setSections(dataBundle.sections);
        
        lastSavedData.current = JSON.parse(JSON.stringify(dataBundle));
        
        setPageIsLoading(false);
    }, [user, firestore]);

    useEffect(() => {
        if (user && firestore) {
            fetchProfileData();
        }
    }, [user, firestore, fetchProfileData]);

    const checkSlugAvailability = async (slug: string): Promise<boolean> => {
        if (!firestore || !slug) return false;
        const slugRef = doc(firestore, 'userProfilesBySlug', slug);
        const slugSnap = await getDoc(slugRef);
        return !slugSnap.exists() || slugSnap.data().userId === user?.uid;
    };

    const autoSave = useCallback((collectionName: string, id: string, data: any) => {
        if (!user || !firestore) return;
        setIsSaving(true);
        
        let ref: any;
        const currentProfile = {...profile, ...data};

        if (collectionName === 'userProfile') {
            if (data.slug && initialSlug && data.slug !== initialSlug) {
                const oldSlugRef = doc(firestore, 'userProfilesBySlug', initialSlug);
                deleteDocumentNonBlocking(oldSlugRef);
            }
            ref = doc(firestore, 'users', user.uid, 'userProfile', user.uid);
            const slugRef = doc(firestore, 'userProfilesBySlug', currentProfile.slug!);
            setDocumentNonBlocking(slugRef, { userId: user.uid, ...currentProfile }, { merge: true });
        } else {
             ref = doc(firestore, 'users', user.uid, collectionName, id);
        }
        
        setDocumentNonBlocking(ref, data, { merge: true });
        
        if (collectionName === 'userProfile') {
            lastSavedData.current.profile = { ...lastSavedData.current.profile, ...data };
        } else if (collectionName === 'resumeSections') {
            const itemIndex = lastSavedData.current.sections.findIndex(item => item.id === id);
            if (itemIndex > -1) {
                lastSavedData.current.sections[itemIndex] = { ...lastSavedData.current.sections[itemIndex], ...data };
            }
        }

        setTimeout(() => setIsSaving(false), 700);
    }, [user, firestore, profile, initialSlug]);

    const handleThemeChange = (themeId: string) => {
        setActiveTheme(themeId);
        setProfile(prev => ({...prev, themeId}));
        autoSave('userProfile', user!.uid, { themeId });
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({...prev, [name]: value}));
    };
    
    const handleProfileBlur = async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const lastSavedValue = (lastSavedData.current.profile as any)[name];
        if (lastSavedValue === value) return;
    
        if (name === 'slug') {
            if (value === initialSlug) return;
            const isAvailable = await checkSlugAvailability(value);
            if (!isAvailable) {
                toast({
                    variant: 'destructive',
                    title: 'URL Unavailable',
                    description: `The URL "${value}" is already taken. Please choose another.`,
                });
                setProfile(prev => ({ ...prev, slug: lastSavedData.current.profile.slug })); 
                return;
            }
        }
        autoSave('userProfile', user!.uid, { [name]: value });
    };

    const handleSectionChange = (id: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSections(prev => prev.map(item => item.id === id ? {...item, [name]: value} : item));
    }

    const handleSectionBlur = (id: string, e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const lastSavedItem = lastSavedData.current.sections.find((i: any) => i.id === id);
        const lastSavedValue = lastSavedItem ? (lastSavedItem as any)[name] : undefined;
        if (value === lastSavedValue) return;
        autoSave('resumeSections', id, { [name]: value });
    };

    const handleAddItem = async () => {
        if (!user || !firestore) return;
        const newItem: Omit<ResumeSection, 'id'> = { 
            title: 'New Section', 
            content: 'Section content goes here.', 
            userProfileId: user.uid,
            order: sections.length,
        };
        const colRef = collection(firestore, 'users', user.uid, 'resumeSections');
        const docRef = await addDocumentNonBlocking(colRef, newItem);
        if (docRef) {
            const addedItem = { ...newItem, id: docRef.id };
            setSections(prev => [...prev, addedItem]);
            lastSavedData.current.sections.push(addedItem);
        }
    }

    const handleDeleteItem = (id: string) => {
        if (!user || !firestore) return;
        const docRef = doc(firestore, 'users', user.uid, 'resumeSections', id);
        deleteDocumentNonBlocking(docRef);
        setSections(prev => prev.filter(item => item.id !== id));
        lastSavedData.current.sections = lastSavedData.current.sections.filter(i => i.id !== id);
    }
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type === 'application/pdf' && selectedFile.size <= 10 * 1024 * 1024) {
                setFile(selectedFile);
                setFileName(selectedFile.name);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Invalid File',
                    description: 'Please select a PDF file under 10MB.',
                });
                event.target.value = '';
                setFile(null);
                setFileName(null);
            }
        } else {
            setFile(null);
            setFileName(null);
        }
    };

    const handleResumeUpload = async () => {
        if (!file || !user || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'No file selected or user not logged in.' });
            return;
        }

        setIsGenerating(true);
        toast({ title: 'Processing Resume...', description: `We're analyzing ${fileName}. Your profile will update shortly.` });

        try {
            const formData = new FormData();
            formData.append('resume', file);

            const response = await fetch('/api/parse-resume', { method: 'POST', body: formData });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to parse resume');
            }

            const extractedData = await response.json();

            const batch = writeBatch(firestore);
            const profileRef = doc(firestore, 'users', user.uid, 'userProfile', user.uid);
            const updatedProfile = {
                ...profile,
                fullName: extractedData.fullName || profile.fullName,
                summary: extractedData.summary || profile.summary,
                phone: extractedData.phone || profile.phone,
                website: extractedData.website || profile.website,
            };
            batch.set(profileRef, updatedProfile, { merge: true });

            const sectionsSnap = await getDocs(collection(firestore, 'users', user.uid, 'resumeSections'));
            sectionsSnap.forEach(doc => batch.delete(doc.ref));

            extractedData.sections?.forEach((item: Omit<ResumeSection, 'id' | 'userProfileId'>) => {
                const newSectionRef = doc(collection(firestore, 'users', user.uid, 'resumeSections'));
                batch.set(newSectionRef, { ...item, userProfileId: user.uid });
            });
            
            await batch.commit();

            toast({ title: 'Success!', description: 'Your profile has been updated with your resume content.' });

            await fetchProfileData();

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: error instanceof Error ? error.message : 'An unknown error occurred.' });
        } finally {
            setIsGenerating(false);
            setFile(null);
            setFileName(null);
        }
    }
    
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
                                    <Link href={`/${profile.slug}`} prefetch={false}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Preview
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <ResumeUploadPrompt 
                            onFileChange={handleFileChange}
                            onUpload={handleResumeUpload}
                            fileName={fileName}
                            isGenerating={isGenerating}
                        />

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                                <TabsTrigger value="content">Content</TabsTrigger>
                                <TabsTrigger value="settings">Settings</TabsTrigger>
                            </TabsList>

                             <TabsContent value="dashboard">
                                <div className="grid gap-6 pt-6">
                                     <Card>
                                        <CardHeader>
                                            <CardTitle>Your Public Link</CardTitle>
                                            <CardDescription>Share this link to your public profile page.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-lg font-bold truncate p-4 bg-secondary rounded-md">
                                                <Link href={`/${profile.slug}`} className="hover:underline" prefetch={false} target="_blank">
                                                    /{profile.slug}
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <VisitorMetrics viewCount={profile.viewCount || 0} />
                                        <ProfileCompleteness 
                                            profile={profile} 
                                            sections={sections} 
                                            onNavigate={(tab) => setActiveTab(tab)}
                                        />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <ViewsByCountryChart />
                                        <ViewsLast7DaysChart />
                                    </div>
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="content" ref={contentRef}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Resume Sections</CardTitle>
                                        <CardDescription>Edit the content parsed from your resume. Each card represents a section.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {sections.map((item) => (
                                            <Card key={item.id} className="p-4">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <div className="space-y-2 flex-grow">
                                                            <Label>Section Title</Label>
                                                            <Input name="title" value={item.title} onChange={(e) => handleSectionChange(item.id, e)} onBlur={(e) => handleSectionBlur(item.id, e)} />
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="ml-4" onClick={() => handleDeleteItem(item.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Section Content</Label>
                                                        <Textarea name="content" value={item.content} onChange={(e) => handleSectionChange(item.id, e)} onBlur={(e) => handleSectionBlur(item.id, e)} rows={8} />
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                        <Button variant="outline" className="w-full" onClick={handleAddItem}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add Section
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="settings">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Personal Information</CardTitle>
                                        <CardDescription>This is your public calling card. Make it count.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>Profile Photo</Label>
                                            <div className="flex items-center space-x-4">
                                                <Image src={profile.avatarUrl || '/placeholder.svg'} alt="User Avatar" width={80} height={80} className="rounded-full" data-ai-hint={profile.avatarHint || 'person portrait'} />
                                            </div>
                                            <p className="text-sm text-muted-foreground">Your photo comes from your Google account. You can change it there.</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                            <Label htmlFor="fullName">Full Name</Label>
                                            <Input id="fullName" name="fullName" value={profile.fullName || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} />
                                            </div>
                                            <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" name="email" type="email" value={profile.email || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} />
                                            </div>
                                            <div className="space-y-2">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input id="phone" name="phone" value={profile.phone || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} />
                                            </div>
                                            <div className="space-y-2">
                                            <Label htmlFor="location">Location</Label>
                                            <Input id="location" name="location" value={profile.location || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="website">Website/Portfolio</Label>
                                            <Input id="website" name="website" placeholder="your-website.com" value={profile.website || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="summary">Summary</Label>
                                            <Textarea id="summary" name="summary" value={profile.summary || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} rows={5} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="mt-6">
                                    <CardHeader>
                                        <CardTitle>Profile Settings</CardTitle>
                                        <CardDescription>Manage your public profile URL and theme.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="slug">Public URL Slug</Label>
                                            <Input id="slug" name="slug" value={profile.slug || ''} onChange={handleProfileChange} onBlur={handleProfileBlur} />
                                            {profile.slug && <p className="text-sm text-muted-foreground">Your profile is available at: <Link href={`/${profile.slug}`} target="_blank" className="text-primary hover:underline" rel="noopener noreferrer">/{profile.slug}</Link></p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="template">Template</Label>
                                            <p className="text-sm text-muted-foreground">Choose a visual theme for your public profile.</p>
                                            <div className="flex gap-2 pt-2">
                                                <Button variant={activeTheme === 'default' ? 'default' : 'secondary'} onClick={() => handleThemeChange('default')}>Default</Button>
                                                <Button variant={activeTheme === 'modern' ? 'default' : 'secondary'} onClick={() => handleThemeChange('modern')}>Modern</Button>
                                                <Button variant={activeTheme === 'classic' ? 'default' : 'secondary'} onClick={() => handleThemeChange('classic')}>Classic</Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>
        </div>
    );
}
    

    