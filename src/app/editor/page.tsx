
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { UserProfile, WorkExperience, Education, Skill } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Trash2, PlusCircle, Save, Loader2, UploadCloud } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Icons } from '@/components/icons';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, collection, addDoc, deleteDoc, writeBatch, getDocs } from 'firebase/firestore';
import { mockProfile } from '@/lib/mock-data'; 

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

export default function EditorPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Partial<UserProfile>>({});
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (user && firestore) {
      const fetchProfile = async () => {
        setIsLoading(true);
        const profileRef = doc(firestore, 'users', user.uid, 'userProfile', user.uid);
        const profileSnap = await getDoc(profileRef);

        let userProfile: UserProfile;
        let work: WorkExperience[], edu: Education[], userSkills: Skill[];

        if (profileSnap.exists()) {
          userProfile = profileSnap.data() as UserProfile;
          
          const workCol = collection(firestore, 'users', user.uid, 'workExperiences');
          const eduCol = collection(firestore, 'users', user.uid, 'educations');
          const skillsCol = collection(firestore, 'users', user.uid, 'skills');

          const [workSnap, eduSnap, skillsSnap] = await Promise.all([
             getDocs(workCol),
             getDocs(eduCol),
             getDocs(skillsCol)
          ]);

          work = workSnap.docs.map(d => ({...d.data(), id: d.id } as WorkExperience));
          edu = eduSnap.docs.map(d => ({...d.data(), id: d.id } as Education));
          userSkills = skillsSnap.docs.map(d => ({...d.data(), id: d.id } as Skill));

        } else {
          userProfile = {
            userId: user.uid,
            fullName: user.displayName || 'Your Name',
            email: user.email || '',
            summary: mockProfile.personalInfo.summary,
            slug: generateSlug(user.displayName || 'user'),
            avatarUrl: user.photoURL || mockProfile.personalInfo.avatarUrl,
            avatarHint: mockProfile.personalInfo.avatarHint,
          };
          await setDoc(profileRef, userProfile);
          
          const batch = writeBatch(firestore);
          mockProfile.workExperience.forEach(item => {
              const ref = doc(collection(firestore, 'users', user.uid, 'workExperiences'));
              batch.set(ref, {...item, userProfileId: user.uid, id: ref.id, title: item.role});
          });
          mockProfile.education.forEach(item => {
              const ref = doc(collection(firestore, 'users', user.uid, 'educations'));
              batch.set(ref, {...item, userProfileId: user.uid, id: ref.id});
          });
          mockProfile.skills.forEach(item => {
              const ref = doc(collection(firestore, 'users', user.uid, 'skills'));
              batch.set(ref, {...item, userProfileId: user.uid, id: ref.id});
          });
          await batch.commit();
          
          const workCol = collection(firestore, 'users', user.uid, 'workExperiences');
          const eduCol = collection(firestore, 'users', user.uid, 'educations');
          const skillsCol = collection(firestore, 'users', user.uid, 'skills');

          const [workSnap, eduSnap, skillsSnap] = await Promise.all([
             getDocs(workCol),
             getDocs(eduCol),
             getDocs(skillsCol)
          ]);

          work = workSnap.docs.map(d => ({...d.data(), id: d.id } as WorkExperience));
          edu = eduSnap.docs.map(d => ({...d.data(), id: d.id } as Education));
          userSkills = skillsSnap.docs.map(d => ({...d.data(), id: d.id } as Skill));
        }

        setProfile(userProfile);
        setWorkExperiences(work);
        setEducations(edu);
        setSkills(userSkills);

        if (isNewProfile(userProfile, work, edu, userSkills)) {
            setShowUploadPrompt(true);
        }

        setIsLoading(false);
      };

      fetchProfile();
    }
  }, [user, firestore, router]);
  

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubcollectionChange = <T extends {id: string}>(
      id: string, 
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, 
      collection: T[], 
      setCollection: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
    const { name, value } = e.target;
    setCollection(prev => prev.map(item => item.id === id ? {...item, [name]: value} : item));
  }

  const handleAddItem = async <T extends {}>(
      newItem: T,
      collectionName: string,
      setCollection: React.Dispatch<React.SetStateAction<(T & {id: string})[]>>
  ) => {
      if (!user || !firestore) return;
      const colRef = collection(firestore, 'users', user.uid, collectionName);
      const docRef = await addDoc(colRef, newItem);
      setCollection(prev => [...prev, {...newItem, id: docRef.id}]);
  }

  const handleDeleteItem = (
      id: string,
      collectionName: string,
      setCollection: React.Dispatch<React.SetStateAction<any[]>>
  ) => {
      if (!user || !firestore) return;
      const docRef = doc(firestore, 'users', user.uid, collectionName, id);
      deleteDoc(docRef).then(() => {
          setCollection(prev => prev.filter(item => item.id !== id));
      });
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && user) {
        handleAddItem({ name: newSkill.trim(), userProfileId: user.uid }, 'skills', setSkills);
        setNewSkill('');
    }
  }


  const handlePublish = async () => {
    if (!user || !firestore || !profile.slug) return;
    setIsSaving(true);
    try {
      const batch = writeBatch(firestore);

      const profileRef = doc(firestore, 'users', user.uid, 'userProfile', user.uid);
      batch.set(profileRef, profile, { merge: true });

      const slugRef = doc(firestore, 'userProfilesBySlug', profile.slug);
      batch.set(slugRef, { userId: user.uid });
      
      workExperiences.forEach(item => {
          const ref = doc(firestore, 'users', user.uid, 'workExperiences', item.id);
          batch.set(ref, item, {merge: true});
      });
       educations.forEach(item => {
          const ref = doc(firestore, 'users', user.uid, 'educations', item.id);
          batch.set(ref, item, {merge: true});
      });
       skills.forEach(item => {
          const ref = doc(firestore, 'users', user.uid, 'skills', item.id);
          batch.set(ref, item, {merge: true});
      });

      await batch.commit();

      toast({
          title: "Profile Published!",
          description: "Your professional web page is now live.",
      });

    } catch (e: any) {
       console.error(e);
       toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: e.message || "Could not save profile.",
       });
    } finally {
        setIsSaving(false);
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
    // In a real app, this would trigger the backend to parse the PDF
    // and update the Firestore data. For now, we simulate this.
    toast({
      title: 'Resume Processing...',
      description: `We're analyzing ${fileName}. Your profile will update shortly.`,
    });
    // For demo, we just hide the prompt.
    // A real implementation would involve a loading state and then a data refetch.
    setShowUploadPrompt(false);
  }

  if (isLoading || isUserLoading) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-16 w-16 animate-spin" />
          </div>
      )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold sm:inline-block font-headline">
              Editor
            </span>
          </Link>
          <div className="flex items-center space-x-2">
            {profile.slug && (
              <Button variant="outline" asChild>
                <Link href={`/${profile.slug}`} target="_blank">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Link>
              </Button>
            )}
            <Button onClick={handlePublish} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto max-w-4xl">
            {showUploadPrompt ? (
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Welcome! Let's build your profile.</CardTitle>
                        <CardDescription>Upload your resume (PDF) to get started automatically, or fill out the form manually.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <label htmlFor="resume-upload" className="flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors hover:bg-accent/50">
                            <UploadCloud className="mr-4 h-8 w-8 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                {fileName ? `Selected: ${fileName}` : 'Drag & drop or click to upload PDF'}
                            </span>
                            <Input id="resume-upload" type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                        </label>
                        <Button size="lg" className="w-full" onClick={handleResumeUpload} disabled={!fileName}>
                           Generate Profile from PDF
                        </Button>
                         <Button variant="link" className="w-full" onClick={() => setShowUploadPrompt(false)}>
                            Or fill it out manually
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="education">Education</TabsTrigger>
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal">
                    <Card>
                        <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>This is your public calling card. Make it count.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                    </TabsContent>

                    <TabsContent value="experience">
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
                                                <Input name="title" value={item.title} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Company</Label>
                                                <Input name="company" value={item.company} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Start Date</Label>
                                                <Input name="startDate" value={item.startDate} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>End Date</Label>
                                                <Input name="endDate" value={item.endDate || ''} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea name="description" value={item.description} onChange={(e) => handleSubcollectionChange(item.id, e, workExperiences, setWorkExperiences)} />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            <Button variant="outline" className="w-full" onClick={() => handleAddItem({ title: 'New Role', company: 'New Company', startDate: 'Date', description: '', userProfileId: user?.uid }, 'workExperiences', setWorkExperiences)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
                            </Button>
                        </CardContent>
                    </Card>
                    </TabsContent>

                    <TabsContent value="education">
                        <Card>
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
                                                    <Input name="institution" value={item.institution} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Degree / Certificate</Label>
                                                    <Input name="degree" value={item.degree} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations)}/>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Start Date</Label>
                                                    <Input name="startDate" value={item.startDate} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>End Date</Label>
                                                    <Input name="endDate" value={item.endDate || ''} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations)} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Description</Label>
                                                <Textarea name="description" value={item.description || ''} onChange={(e) => handleSubcollectionChange(item.id, e, educations, setEducations)} />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                <Button variant="outline" className="w-full" onClick={() => handleAddItem({ institution: 'New School', degree: 'Degree', startDate: 'Date', userProfileId: user?.uid }, 'educations', setEducations)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Education
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="skills">
                        <Card>
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
                                    <Input placeholder="Add a new skill..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} />
                                    <Button onClick={handleAddSkill}><PlusCircle className="mr-2 h-4 w-4" /> Add Skill</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="settings">
                        <Card>
                            <CardHeader>
                                <CardTitle>Settings</CardTitle>
                                <CardDescription>Manage your public profile URL.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                <Label htmlFor="slug">Public URL Slug</Label>
                                <Input id="slug" name="slug" value={profile.slug || ''} onChange={handleProfileChange} />
                                {profile.slug && <p className="text-sm text-muted-foreground">Your profile will be available at: <Link href={`/${profile.slug}`} target="_blank" className="text-primary hover:underline">/{profile.slug}</Link></p>}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
      </main>
    </div>
  );
}
