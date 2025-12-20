"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { mockProfile } from '@/lib/mock-data';
import type { Profile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Trash2, PlusCircle, Save } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"
import { Icons } from '@/components/icons';

export default function EditorPage() {
  const [profile, setProfile] = useState<Profile>(mockProfile);
  const { toast } = useToast()

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [name]: value } }));
  };

  const handlePublish = () => {
    console.log("Publishing profile:", profile);
    toast({
        title: "Profile Published!",
        description: "Your professional web page is now live.",
    });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold sm:inline-block font-headline">
              ResumeRack Editor
            </span>
          </Link>
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <Link href="/john-doe" target="_blank">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Link>
            </Button>
            <Button onClick={handlePublish}>
              <Save className="mr-2 h-4 w-4" />
              Publish
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8">
        <div className="container mx-auto max-w-4xl">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>This is your public calling card. Make it count.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Image src={profile.personalInfo.avatarUrl} alt="User Avatar" width={80} height={80} className="rounded-full" data-ai-hint={profile.personalInfo.avatarHint} />
                    <Button variant="outline">Change Photo</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" name="name" value={profile.personalInfo.name} onChange={handlePersonalInfoChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" value={profile.personalInfo.email} onChange={handlePersonalInfoChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" value={profile.personalInfo.phone} onChange={handlePersonalInfoChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" value={profile.personalInfo.location} onChange={handlePersonalInfoChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="website">Website/Portfolio</Label>
                      <Input id="website" name="website" value={profile.personalInfo.website} onChange={handlePersonalInfoChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea id="summary" name="summary" value={profile.personalInfo.summary} onChange={handlePersonalInfoChange} rows={5} />
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
                    {profile.workExperience.map((item, index) => (
                        <Card key={item.id} className="p-4">
                            <div className="flex justify-between items-center mb-4">
                               <p className="font-semibold">{item.role} at {item.company}</p>
                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                     <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Input value={item.role} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Company</Label>
                                        <Input value={item.company} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Input value={item.startDate} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>End Date</Label>
                                        <Input value={item.endDate} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea value={item.description} />
                                </div>
                            </div>
                        </Card>
                    ))}
                    <Button variant="outline" className="w-full">
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
                        {profile.education.map((item, index) => (
                           <Card key={item.id} className="p-4">
                                <div className="flex justify-between items-center mb-4">
                                   <p className="font-semibold">{item.degree} from {item.institution}</p>
                                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Institution</Label>
                                            <Input value={item.institution} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Degree / Certificate</Label>
                                            <Input value={item.degree} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Start Date</Label>
                                            <Input value={item.startDate} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Date</Label>
                                            <Input value={item.endDate} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea value={item.description} />
                                    </div>
                                </div>
                            </Card>
                        ))}
                         <Button variant="outline" className="w-full">
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
                            {profile.skills.map(skill => (
                                <div key={skill.id} className="flex items-center rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                                    {skill.name}
                                    <Button variant="ghost" size="icon" className="ml-1 h-5 w-5"><Trash2 className="h-3 w-3"/></Button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Input placeholder="Add a new skill..."/>
                            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add Skill</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

          </Tabs>
        </div>
      </main>
    </div>
  );
}
