

"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { Eye, Trash2, PlusCircle, Loader2, UploadCloud, FileUp, FilePenLine, BarChart2, Users, Map, Settings, ArrowRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Header from '@/components/header';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc, setDoc, collection, addDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { mockProfile } from '@/lib/mock-data';
import { setDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"


function generateSlug(name: string) {
  const randomString = Math.random().toString(36).substring(2, 7);
  return name.toLowerCase().replace(/\s+/g, '-') + '-' + randomString;
}

// Simple check to see if a profile is new/empty
function isNewProfile(profile: Partial<UserProfile>, work: WorkExperience[], education: Education[], skills: Skill[]) {
    return (
        profile.summary === mockProfile.personalInfo.summary &&
        work.length <= 2 &&
        education.length <= 1 &&
        skills.length <= 9 
    );
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

const EditorDashboard = ({ profile, onProfileUpdate }: { profile: Partial<UserProfile>, onProfileUpdate: () => void }) => {
    const [showEditor, setShowEditor] = useState(false);
    
    if (showEditor) {
        return <EditorForm profile={profile} onBackToDashboard={() => setShowEditor(false)} onProfileUpdate={onProfileUpdate} />;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Welcome back, {profile.fullName}!</h1>
                    <p className="text-muted-foreground">Here's a look at your profile's performance.</p>
                </div>
                <Button size="lg" onClick={() => setShowEditor(true)}>
                    <FilePenLine />
                    Edit Your Profile
                </Button>
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
                           All-time profile views
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Views (Last 24h)</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{MOCK_ANALYTICS_DATA.viewsLast24h}</div>
                        <p className="text-xs text-muted-foreground">
                            +20.1% from last day
                        </p>
                    </CardContent>
                </Card>
                 <Card className="col-span-1 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Your Public Link</CardTitle>
                        <Link href={`/${profile.slug}`} target="_blank"><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link>
                    </CardHeader>
                    <CardContent>
                         <div className="text-2xl font-bold truncate">
                             <Link href={`/${profile.slug}`} target="_blank" className="hover:underline">
                                /{profile.slug}
                            </Link>
                         </div>
                        <p className="text-xs text-muted-foreground">
                           Share this link with anyone.
                        </p>
                    </CardContent>
                </Card>
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


const EditorForm = ({ profile: initialProfile, onBackToDashboard, onProfileUpdate }: { profile: Partial<UserProfile>, onBackToDashboard: () => void, onProfileUpdate: () => void }) => {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    
    const [profile, setProfile] = useState<Partial<UserProfile>>(initialProfile);
    const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
    const [educations, setEducations] = useState<Education[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [newSkill, setNewSkill] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const autoSave = useCallback((updatedData: any) => {
        if (!user || !firestore) return;
        setIsSaving(true);
        const { collectionName, id, ...data } = updatedData;
        const ref = doc(firestore, 'users', user.uid, collectionName, id);
        setDocumentNonBlocking(ref, data, { merge: true });
        
        if (collectionName === 'userProfile') {
            const slugRef = doc(firestore, 'userProfilesBySlug', profile.slug!);
            const slugData = { userId: user.uid, ...profile, ...data };
            setDocumentNonBlocking(slugRef, slugData, { merge: true });
        }

        setTimeout(() => setIsSaving(false), 500); // Visual feedback
    }, [user, firestore, profile]);


     useEffect(() => {
    if (user && firestore) {
      const fetchProfileData = async () => {
        setIsLoading(true);
          
          const workCol = collection(firestore, 'users', user.uid, 'workExperiences');
          const eduCol = collection(firestore, 'users', user.uid, 'educations');
          const skillsCol = collection(firestore, 'users', user.uid, 'skills');

          const [workSnap, eduSnap, skillsSnap] = await Promise.all([
             getDocs(workCol),
             getDocs(eduCol),
             getDocs(skillsCol)
          ]);

          const work = workSnap.docs.map(d => ({...d.data(), id: d.id } as WorkExperience));
          const edu = eduSnap.docs.map(d => ({...d.data(), id: d.id } as Education));
          const userSkills = skillsSnap.docs.map(d => ({...d.data(), id: d.id } as Skill));

        setWorkExperiences(work);
        setEducations(edu);
        setSkills(userSkills);

        setIsLoading(false);
      };

      fetchProfileData();
    }
  }, [user, firestore, initialProfile]);


    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const newProfile = { ...profile, [name]: value };
        setProfile(newProfile);
        autoSave({ collectionName: 'userProfile', id: user?.uid, [name]: value });
    };

    const handleSubcollectionChange = <T extends {id: string}>(
        id: string, 
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, 
        collectionState: T[], 
        setCollectionState: React.Dispatch<React.SetStateAction<T[]>>,
        collectionName: string
        ) => {
        const { name, value } = e.target;
        setCollectionState(prev => prev.map(item => item.id === id ? {...item, [name]: value} : item));
        autoSave({ collectionName, id, [name]: value });
    }

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
                    toast({ title: "Item Added", description: "Your new item has been saved." });
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
                <div className="flex items-center gap-2">
                    {isSaving && <Loader2 className="animate-spin text-muted-foreground" />}
                    {profile.slug && (
                        <Button variant="outline" asChild>
                            <Link href={`/${profile.slug}`}>
                                <Eye />
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

            <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content">
                    <Card>
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
                                                <Input name="title" value={item.title} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences, 'workExperiences')} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Company</Label>
                                                <Input name="company" value={item.company} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences, 'workExperiences')} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Start Date</Label>
                                                <Input name="startDate" value={item.startDate} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences, 'workExperiences')} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>End Date</Label>
                                                <Input name="endDate" value={item.endDate || ''} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences, 'workExperiences')} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea name="description" value={item.description} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences, 'workExperiences')} />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            <Button variant="outline" className="w-full" onClick={() => handleAddItem({ title: 'New Role', company: 'New Company', startDate: 'Date', description: '', userProfileId: user?.uid }, 'workExperiences', setWorkExperiences)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
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
                                                <Input name="institution" value={item.institution} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations, 'educations')} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Degree / Certificate</Label>
                                                <Input name="degree" value={item.degree} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations, 'educations')}/>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Start Date</Label>
                                                <Input name="startDate" value={item.startDate} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations, 'educations')} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>End Date</Label>
                                                <Input name="endDate" value={item.endDate || ''} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations, 'educations')} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea name="description" value={item.description || ''} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations, 'educations')} />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            <Button variant="outline" className="w-full" onClick={() => handleAddItem({ institution: 'New School', degree: 'Degree', startDate: 'Date', userProfileId: user?.uid }, 'educations', setEducations)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
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
                                <Input id="fullName" name="fullName" value={profile.fullName || ''} onChange={handleProfileChange} />
                                </div>
                                <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" value={profile.email || ''} onChange={handleProfileChange} />
                                </div>
                                <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" name="phone" value={profile.phone || ''} onChange={handleProfileChange} />
                                </div>
                                <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input id="location" name="location" value={profile.location || ''} onChange={handleProfileChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website/Portfolio</Label>
                                <Input id="website" name="website" value={profile.website || ''} onChange={handleProfileChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="summary">Summary</Label>
                                <Textarea id="summary" name="summary" value={profile.summary || ''} onChange={handleProfileChange} rows={5} />
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
                                <Input id="slug" name="slug" value={profile.slug || ''} onChange={handleProfileChange} />
                                {profile.slug && <p className="text-sm text-muted-foreground">Your profile is available at: <Link href={`/${profile.slug}`} target="_blank" className="text-primary hover:underline">/{profile.slug}</Link></p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="slug">Template</Label>
                                <p className="text-sm text-muted-foreground">Choose a visual theme for your public profile.</p>
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline">Default</Button>
                                    <Button variant="secondary">Modern</Button>
                                    <Button variant="secondary">Classic</Button>
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
  const firestore = useFirestore();
  const router = useRouter();

  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
      if (user && firestore) {
        setIsLoading(true);
        const profileRef = doc(firestore, 'users', user.uid, 'userProfile', user.uid);
        const profileSnap = await getDoc(profileRef);

        let userProfile: UserProfile;

        if (profileSnap.exists()) {
          userProfile = profileSnap.data() as UserProfile;
        } else {
          // Create a mock profile if one doesn't exist
          userProfile = {
            userId: user.uid,
            fullName: user.displayName || 'Your Name',
            email: user.email || '',
            summary: mockProfile.personalInfo.summary,
            slug: generateSlug(user.displayName || 'user'),
            avatarUrl: user.photoURL || mockProfile.personalInfo.avatarUrl,
            avatarHint: mockProfile.personalInfo.avatarHint,
          };
          
          setDocumentNonBlocking(doc(firestore, 'users', user.uid, 'userProfile', user.uid), userProfile, { merge: false });
          setDocumentNonBlocking(doc(firestore, 'userProfilesBySlug', userProfile.slug), { ...userProfile });
          
          mockProfile.workExperience.forEach(item => {
              addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'workExperiences'), {...item, userProfileId: user.uid});
          });
          mockProfile.education.forEach(item => {
              addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'educations'), {...item, userProfileId: user.uid});
          });
          mockProfile.skills.forEach(item => {
              addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'skills'), {...item, userProfileId: user.uid});
          });
        }

        setProfile(userProfile);
        setIsLoading(false);
      }
  }, [user, firestore]);
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
      fetchProfile();
  }, [user, firestore, fetchProfile]);
  
  if (isLoading || isUserLoading) {
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
            <EditorDashboard profile={profile} onProfileUpdate={fetchProfile} />
        </div>
      </main>
    </div>
  );
}
