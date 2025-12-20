
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { UserProfile, WorkExperience, Education, Skill } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Trash2, PlusCircle, Loader2, UploadCloud, FileUp, FilePenLine, BarChart2, Users, Map, ArrowRight, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Header from '@/components/header';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, collection, addDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { mockProfile } from '@/lib/mock-data';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Progress } from '@/components/ui/progress';


function generateSlug(name: string) {
  const randomString = Math.random().toString(36).substring(2, 7);
  return name.toLowerCase().replace(/\s+/g, '-') + '-' + randomString;
}

const Chart = ({data}: {data: any[]}) => (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
      </BarChart>
    </ResponsiveContainer>
);

const MOCK_ANALYTICS_DATA = {
    totalViews: 1345,
    viewsLast24h: 78,
    dailyViews: [
        { name: "Mon", total: Math.floor(Math.random() * 200) + 50 },
        { name: "Tue", total: Math.floor(Math.random() * 200) + 50 },
        { name: "Wed", total: Math.floor(Math.random() * 200) + 50 },
        { name: "Thu", total: Math.floor(Math.random() * 200) + 50 },
        { name: "Fri", total: Math.floor(Math.random() * 200) + 50 },
        { name: "Sat", total: Math.floor(Math.random() * 200) + 50 },
        { name: "Sun", total: Math.floor(Math.random() * 200) + 50 },
    ],
    viewsByCountry: [
        { country: "United States", views: 450, code: "US" },
        { country: "India", views: 210, code: "IN" },
        { country: "Germany", views: 120, code: "DE" },
        { country: "United Kingdom", views: 95, code: "GB" },
        { country: "Canada", views: 70, code: "CA" },
    ]
};

const ResumeUploadPrompt = ({ onFileChange, onUpload, fileName, onCancel, showCancel = true }: { onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void, onUpload: () => void, fileName: string | null, onCancel?: () => void, showCancel?: boolean }) => (
    <Card className="w-full border-dashed border-2 hover:border-primary transition-colors mb-8">
        <CardHeader>
            <CardTitle>Generate with AI</CardTitle>
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
                <Button size="lg" className="w-full" onClick={onUpload} disabled={!fileName}>
                    <FileUp className="mr-2 h-4 w-4" />
                    Generate from PDF
                </Button>
                {onCancel && showCancel && (
                    <Button variant="ghost" className="w-full sm:w-auto" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
            </div>
        </CardContent>
    </Card>
);

const ProfileCompleteness = ({ profile, work, education, skills, onNavigate }: { profile: Partial<UserProfile>, work: WorkExperience[], education: Education[], skills: Skill[], onNavigate: (section: string) => void }) => {
    const completeness = useMemo(() => {
        const checks = [
            { name: "Add a Profile Photo", complete: !!(profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos')), section: 'personal' },
            { name: "Write a Summary", complete: !!(profile.summary && profile.summary !== mockProfile.personalInfo.summary), section: 'personal' },
            { name: "Add Contact Info (Phone or Website)", complete: !!(profile.phone || profile.website), section: 'personal' },
            { name: "Add Work Experience", complete: work.length > 0, section: 'work' },
            { name: "Add Education", complete: education.length > 0, section: 'education' },
            { name: "Add at least 3 Skills", complete: skills.length >= 3, section: 'skills' },
        ];
        const completeCount = checks.filter(c => c.complete).length;
        const totalCount = checks.length;
        const score = Math.round((completeCount / totalCount) * 100);

        return { score, checks, isComplete: completeCount === totalCount };
    }, [profile, work, education, skills]);

    const { score, checks, isComplete } = completeness;

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy /> Profile Completeness
                </CardTitle>
                 <CardDescription>A complete profile stands out more to recruiters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <Progress value={score} className="w-full" />
                    <span className="text-lg font-bold">{score}%</span>
                </div>
                {isComplete ? (
                    <div className="text-sm text-green-500 flex items-center gap-2 font-semibold">
                       <CheckCircle className="h-5 w-5" /> Great job! Your profile is complete.
                    </div>
                ) : (
                     <div className="space-y-2">
                        <p className="text-sm font-medium">To-do:</p>
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

const EditorDashboard = ({ onSwitchToEditor }: { onSwitchToEditor: (section?: string) => void }) => {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [work, setWork] = useState<WorkExperience[]>([]);
    const [education, setEducation] = useState<Education[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfileData = useCallback(async () => {
        if (!user || !firestore) return null;
        
        const profileRef = doc(firestore, 'users', user.uid, 'userProfile', user.uid);
        
        const [profileSnap, workSnap, eduSnap, skillsSnap] = await Promise.all([
            getDoc(profileRef),
            getDocs(collection(firestore, 'users', user.uid, 'workExperiences')),
            getDocs(collection(firestore, 'users', user.uid, 'educations')),
            getDocs(collection(firestore, 'users', user.uid, 'skills')),
        ]);

        let userProfile: UserProfile;
        let userWork: WorkExperience[] = workSnap.docs.map(d => ({...d.data(), id: d.id } as WorkExperience));
        let userEducation: Education[] = eduSnap.docs.map(d => ({...d.data(), id: d.id } as Education));
        let userSkills: Skill[] = skillsSnap.docs.map(d => ({...d.data(), id: d.id } as Skill));

        if (profileSnap.exists()) {
            userProfile = profileSnap.data() as UserProfile;
        } else {
            // This is a new user, so we seed their profile with mock data.
            userProfile = {
                userId: user.uid,
                fullName: user.displayName || 'Your Name',
                email: user.email || '',
                summary: mockProfile.personalInfo.summary,
                slug: generateSlug(user.displayName || 'user'),
                avatarUrl: user.photoURL || mockProfile.personalInfo.avatarUrl,
                avatarHint: mockProfile.personalInfo.avatarHint,
                themeId: 'default',
            };
            
            const userProfileDocRef = doc(firestore, 'users', user.uid, 'userProfile', user.uid);
            const slugDocRef = doc(firestore, 'userProfilesBySlug', userProfile.slug!);

            setDocumentNonBlocking(userProfileDocRef, userProfile, { merge: true });
            setDocumentNonBlocking(slugDocRef, { userId: user.uid, ...userProfile }, { merge: true });
            
            userWork = mockProfile.workExperience.map(item => ({...item, userProfileId: user.uid}));
            userEducation = mockProfile.education.map(item => ({...item, userProfileId: user.uid}));
            userSkills = mockProfile.skills.map(item => ({...item, userProfileId: user.uid}));

            userWork.forEach(item => {
                const { id, ...rest } = item;
                const workRef = doc(collection(firestore, 'users', user.uid, 'workExperiences'));
                setDocumentNonBlocking(workRef, rest, { merge: true });
            });
            userEducation.forEach(item => {
                const { id, ...rest } = item;
                const eduRef = doc(collection(firestore, 'users', user.uid, 'educations'));
                setDocumentNonBlocking(eduRef, rest, { merge: true });
            });
            userSkills.forEach(item => {
                const { id, ...rest } = item;
                const skillRef = doc(collection(firestore, 'users', user.uid, 'skills'));
                setDocumentNonBlocking(skillRef, rest, { merge: true });
            });
        }

        return { profile: userProfile, work: userWork, education: userEducation, skills: userSkills };
    }, [user, firestore]);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const data = await fetchProfileData();
        if (data) {
            setProfile(data.profile);
            setWork(data.work);
            setEducation(data.education);
            setSkills(data.skills);
        }
        setIsLoading(false);
    }, [fetchProfileData]);

    useEffect(() => {
        if (user && firestore) {
            loadData();
        }
    }, [user, firestore, loadData]);


    if (isLoading || isUserLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Welcome back, {profile.fullName}!</h1>
                    <p className="text-muted-foreground">Here's a look at your profile's performance.</p>
                </div>
                <div className="flex gap-2">
                    {profile.slug && (
                        <Button variant="outline" asChild>
                            <Link href={`/${profile.slug}`} prefetch={false}>
                                <Eye className="mr-2 h-4 w-4" />
                                Preview Profile
                            </Link>
                        </Button>
                    )}
                    <Button size="lg" onClick={() => onSwitchToEditor()}>
                        <FilePenLine />
                        Edit Your Profile
                    </Button>
                </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{MOCK_ANALYTICS_DATA.totalViews.toLocaleString()}</div>
                         <p className="text-xs text-muted-foreground">
                           All-time profile views.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Recent Views</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{MOCK_ANALYTICS_DATA.viewsLast24h}</div>
                        <p className="text-xs text-muted-foreground">
                            Views in the last 24 hours.
                        </p>
                    </CardContent>
                </Card>
                <ProfileCompleteness 
                    profile={profile} 
                    work={work} 
                    education={education} 
                    skills={skills} 
                    onNavigate={(section) => onSwitchToEditor(section)}
                />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-1 lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Daily Views</CardTitle>
                        <CardDescription>Your profile views over the last 7 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Chart data={MOCK_ANALYTICS_DATA.dailyViews} />
                    </CardContent>
                </Card>
                <Card className="col-span-1 lg:col-span-3">
                     <CardHeader>
                        <CardTitle>Your Public Link</CardTitle>
                         <CardDescription>Share this link to show off your profile.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate p-4 bg-secondary rounded-md">
                           <Link href={`/${profile.slug}`} className="hover:underline" prefetch={false}>
                                /{profile.slug}
                            </Link>
                         </div>
                    </CardContent>
                    <CardHeader>
                        <CardTitle>Views by Country</CardTitle>
                        <CardDescription>Top countries where your profile is being viewed.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                       {MOCK_ANALYTICS_DATA.viewsByCountry.map((item) => (
                           <div key={item.code} className="flex items-center">
                               <div>{item.country}</div>
                               <div className="ml-auto font-semibold">{item.views.toLocaleString()}</div>
                           </div>
                       ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


const EditorForm = ({ onBackToDashboard, section }: { onBackToDashboard: () => void, section?: string }) => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [initialSlug, setInitialSlug] = useState<string | undefined>(undefined);
    const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
    const [educations, setEducations] = useState<Education[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [newSkill, setNewSkill] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [activeTheme, setActiveTheme] = useState('default');
    const [activeTab, setActiveTab] = useState(section === 'personal' ? 'settings' : 'content');

    const refs = {
        work: React.useRef<HTMLDivElement>(null),
        education: React.useRef<HTMLDivElement>(null),
        skills: React.useRef<HTMLDivElement>(null),
    };


     const fetchProfileData = useCallback(async () => {
        if (!user || !firestore) return;
        setIsLoading(true);

        const profileRef = doc(firestore, 'users', user.uid, 'userProfile', user.uid);
        const [profileSnap, workSnap, eduSnap, skillsSnap] = await Promise.all([
            getDoc(profileRef),
            getDocs(collection(firestore, 'users', user.uid, 'workExperiences')),
            getDocs(collection(firestore, 'users', user.uid, 'educations')),
            getDocs(collection(firestore, 'users', user.uid, 'skills')),
        ]);

        if (profileSnap.exists()) {
            const profileData = profileSnap.data() as UserProfile;
            setProfile(profileData);
            setInitialSlug(profileData.slug);
            setActiveTheme(profileData.themeId || 'default');
            setWorkExperiences(workSnap.docs.map(d => ({ ...d.data(), id: d.id } as WorkExperience)));
            setEducations(eduSnap.docs.map(d => ({ ...d.data(), id: d.id } as Education)));
            setSkills(skillsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Skill)));
        }
        
        setIsLoading(false);
    }, [user, firestore]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    useEffect(() => {
        if (section && !isLoading) {
            if (section === 'personal') {
                setActiveTab('settings');
            } else if (refs[section as keyof typeof refs]?.current) {
                setActiveTab('content');
                // Timeout to ensure content is rendered before scrolling
                setTimeout(() => {
                    refs[section as keyof typeof refs].current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [section, isLoading, refs]);


    const checkSlugAvailability = async (slug: string): Promise<boolean> => {
        if (!firestore) return false;
        const slugRef = doc(firestore, 'userProfilesBySlug', slug);
        const slugSnap = await getDoc(slugRef);
        if (slugSnap.exists() && slugSnap.data().userId !== user?.uid) {
            return false;
        }
        return true;
    };

    const autoSave = useCallback((updatedData: any) => {
        if (!user || !firestore) return;
        setIsSaving(true);
        const { collectionName, id, ...data } = updatedData;
        
        let ref: any;

        if (collectionName === 'userProfile') {
            const currentProfile = {...profile, ...data};
            
            if (data.slug && initialSlug && data.slug !== initialSlug) {
                const oldSlugRef = doc(firestore, 'userProfilesBySlug', initialSlug);
                deleteDocumentNonBlocking(oldSlugRef);
            }

            ref = doc(firestore, 'users', user.uid, collectionName, user.uid);
            const slugRef = doc(firestore, 'userProfilesBySlug', currentProfile.slug!);
            setDocumentNonBlocking(slugRef, { userId: user.uid, ...currentProfile }, { merge: true });
        } else {
             ref = doc(firestore, 'users', user.uid, collectionName, id);
        }

        setDocumentNonBlocking(ref, data, { merge: true });
        
        setTimeout(() => setIsSaving(false), 700);
    }, [user, firestore, profile, initialSlug]);


    const handleThemeChange = (themeId: string) => {
        setActiveTheme(themeId);
        setProfile(prev => ({...prev, themeId}));
        autoSave({ collectionName: 'userProfile', themeId: themeId });
    };

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({...prev, [name]: value}));
    };
    
    const handleProfileBlur = async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const initialValue = (profile as any)[name];
    
        if (name === 'slug') {
            if (value === initialSlug) return;
            const isAvailable = await checkSlugAvailability(value);
            if (!isAvailable) {
                toast({
                    variant: 'destructive',
                    title: 'Slug Unavailable',
                    description: `The URL slug "${value}" is already taken. Please choose another.`,
                });
                setProfile(prev => ({ ...prev, slug: initialSlug }));
                return;
            }
            autoSave({ collectionName: 'userProfile', slug: value });
            setInitialSlug(value); // Update the baseline slug for future checks
            return;
        }

        if (initialValue !== value) {
            autoSave({ collectionName: 'userProfile', [name]: value });
        }
    };


    const handleSubcollectionChange = <T extends {id: string}>(
        id: string, 
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, 
        collectionState: T[], 
        setCollectionState: React.Dispatch<React.SetStateAction<T[]>>
        ) => {
        const { name, value } = e.target;
        setCollectionState(prev => prev.map(item => item.id === id ? {...item, [name]: value} : item));
    }

     const handleSubcollectionBlur = <T extends {id: string}>(
        id: string,
        e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
        collectionName: string,
        collectionState: T[]
    ) => {
        const { name, value } = e.target;
        const item = collectionState.find(i => i.id === id);
        if (item && (item as any)[name] !== value) {
            autoSave({ collectionName, id, [name]: value });
        }
    };

    const handleAddItem = async <T extends {}>(
        newItem: T,
        collectionName: string,
        setCollection: React.Dispatch<React.SetStateAction<(T & {id: string})[]>>
    ) => {
        if (!user || !firestore) return;
        const colRef = collection(firestore, 'users', user.uid, collectionName);
        addDocumentNonBlocking(colRef, newItem)
            .then(docRef => {
                if (docRef) {
                    setCollection(prev => [...prev, {...newItem, id: docRef.id}]);
                }
            });
    }

    const handleDeleteItem = (
        id: string,
        collectionName: string,
        setCollection: React.Dispatch<React.SetStateAction<any[]>>
    ) => {
        if (!user || !firestore) return;
        const docRef = doc(firestore, 'users', user.uid, collectionName, id);
        deleteDocumentNonBlocking(docRef);
        setCollection(prev => prev.filter(item => item.id !== id));
        toast({ title: "Item Removed", variant: "destructive" });
    }

    const handleAddSkill = () => {
        if (newSkill.trim() && user) {
            handleAddItem({ name: newSkill.trim(), userProfileId: user.uid }, 'skills', setSkills);
            setNewSkill('');
        }
    }
    
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
        if (file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
            setFileName(file.name);
        } else {
            toast({
                variant: 'destructive',
                title: 'Invalid File',
                description: 'Please select a PDF file under 5MB.',
            });
            event.target.value = '';
            setFileName(null);
        }
        } else {
        setFileName(null);
        }
    };

    const handleResumeUpload = () => {
        if (!fileName) {
        toast({
            variant: 'destructive',
            title: 'No file selected',
            description: 'Please select a PDF file to upload.',
        });
        return;
        }
        toast({
        title: 'Resume Processing...',
        description: `We're analyzing ${fileName}. Your profile will update shortly.`,
        });
    }
    
     if (isLoading) {
      return (
          <div className="flex h-screen flex-col">
              <div className="flex flex-1 items-center justify-center">
                  <Loader2 className="h-16 w-16 animate-spin" />
              </div>
          </div>
      )
  }

    return (
         <div>
            <div className="flex justify-between items-center mb-8">
                <Button variant="outline" onClick={onBackToDashboard}>Dashboard</Button>
                <div className="flex items-center gap-4">
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
             
            <ResumeUploadPrompt 
                onFileChange={handleFileChange}
                onUpload={handleResumeUpload}
                fileName={fileName}
                showCancel={false}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content">
                    <Card ref={refs.work}>
                        <CardHeader>
                            <CardTitle>Work Experience</CardTitle>
                            <CardDescription>Detail your professional journey.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {workExperiences.map((item) => (
                                <Card key={item.id} className="p-4">
                                    <div className="flex justify-between items-center mb-4">
                                    <p className="font-semibold">{item.title} at {item.company}</p>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id, 'workExperiences', setWorkExperiences)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Role</Label>
                                                <Input name="title" value={item.title} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences)} onBlur={(e) => handleSubcollectionBlur(item.id, e, 'workExperiences', workExperiences)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Company</Label>
                                                <Input name="company" value={item.company} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences)} onBlur={(e) => handleSubcollectionBlur(item.id, e, 'workExperiences', workExperiences)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Start Date</Label>
                                                <Input name="startDate" value={item.startDate} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences)} onBlur={(e) => handleSubcollectionBlur(item.id, e, 'workExperiences', workExperiences)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>End Date</Label>
                                                <Input name="endDate" value={item.endDate || ''} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences)} onBlur={(e) => handleSubcollectionBlur(item.id, e, 'workExperiences', workExperiences)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea name="description" value={item.description} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences)} onBlur={(e) => handleSubcollectionBlur(item.id, e, 'workExperiences', workExperiences)} />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            <Button variant="outline" className="w-full" onClick={() => handleAddItem({ title: 'New Role', company: 'New Company', startDate: 'Date', description: '', userProfileId: user?.uid }, 'workExperiences', setWorkExperiences)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="mt-6" ref={refs.education}>
                        <CardHeader>
                            <CardTitle>Education</CardTitle>
                            <CardDescription>Your academic background.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {educations.map((item) => (
                            <Card key={item.id} className="p-4">
                                    <div className="flex justify-between items-center mb-4">
                                    <p className="font-semibold">{item.degree} from {item.institution}</p>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id, 'educations', setEducations)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Institution</Label>
                                                <Input name="institution" value={item.institution} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations)} onBlur={(e) => handleSubcollectionBlur(item.id, e, 'educations', educations)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Degree / Certificate</Label>
                                                <Input name="degree" value={item.degree} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations)} onBlur={(e) => handleSubcollectionBlur(item.id, e, 'educations', educations)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Start Date</Label>
                                                <Input name="startDate" value={item.startDate} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations)} onBlur={(e) => handleSubcollectionBlur(item.id, e, 'educations', educations)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>End Date</Label>
                                                <Input name="endDate" value={item.endDate || ''} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations)} onBlur={(e) => handleSubcollectionBlur(item.id, e, 'educations', educations)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea name="description" value={item.description || ''} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations)} onBlur={(e) => handleSubcollectionBlur(item.id, e, 'educations', educations)} />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            <Button variant="outline" className="w-full" onClick={() => handleAddItem({ institution: 'New School', degree: 'Degree', startDate: 'Date', userProfileId: user?.uid }, 'educations', setEducations)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="mt-6" ref={refs.skills}>
                        <CardHeader>
                            <CardTitle>Skills</CardTitle>
                            <CardDescription>List your key technical and soft skills.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {skills.map(skill => (
                                    <div key={skill.id} className="flex items-center rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                                        {skill.name}
                                        <Button variant="ghost" size="icon" className="ml-1 h-5 w-5" onClick={() => handleDeleteItem(skill.id, 'skills', setSkills)}><Trash2 className="h-3 w-3"/></Button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Input placeholder="Add a new skill..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()} />
                                <Button onClick={handleAddSkill}><PlusCircle className="mr-2 h-4 w-4" /> Add Skill</Button>
                            </div>
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
                            <div className="flex items-center space-x-4">
                                <Image src={profile.avatarUrl || '/placeholder.svg'} alt="User Avatar" width={80} height={80} className="rounded-full" data-ai-hint={profile.avatarHint || 'person portrait'} />
                                <Button variant="outline">Change Photo</Button>
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
                            <div className="spacey-y-2">
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
    );
};


export default function EditorPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [section, setSection] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleSwitchToEditor = (section?: string) => {
      setSection(section);
      setView('editor');
  };

  if (isUserLoading) {
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
        <div className="container mx-auto max-w-7xl p-4 md:p-8">
            {view === 'dashboard' ? (
                <EditorDashboard onSwitchToEditor={handleSwitchToEditor} />
            ) : (
                <EditorForm onBackToDashboard={() => setView('dashboard')} section={section} />
            )}
        </div>
      </main>
    </div>
  );
}


    