
"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { type UserProfile, type WorkExperience, type Education, type Skill } from '@/types';
import { Briefcase, Mail, Phone, MapPin, Link as LinkIcon, GraduationCap, Award, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { notFound } from 'next/navigation';

async function getProfileData(firestore: any, slug: string): Promise<{ profile: UserProfile, work: WorkExperience[], education: Education[], skills: Skill[] } | null> {
    const slugRef = doc(firestore, 'userProfilesBySlug', slug);
    const slugSnap = await getDoc(slugRef);

    if (!slugSnap.exists()) {
        return null;
    }

    const { userId } = slugSnap.data();

    const profileRef = doc(firestore, 'users', userId, 'userProfile', userId);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
        return null;
    }
    
    const profileData = profileSnap.data() as UserProfile;

    const workCol = collection(firestore, 'users', userId, 'workExperiences');
    const eduCol = collection(firestore, 'users', userId, 'educations');
    const skillsCol = collection(firestore, 'users', userId, 'skills');

    const [workSnap, eduSnap, skillsSnap] = await Promise.all([
        getDocs(workCol),
        getDocs(eduCol),
        getDocs(skillsCol)
    ]);
    
    const work = workSnap.docs.map(d => d.data() as WorkExperience);
    const education = eduSnap.docs.map(d => d.data() as Education);
    const skills = skillsSnap.docs.map(d => d.data() as Skill);

    return { profile: profileData, work, education, skills };
}


export default function ProfileSlugPage({ params }: { params: { slug: string } }) {
  const firestore = useFirestore();
  const { slug } = params;
  const [data, setData] = useState<{ profile: UserProfile, work: WorkExperience[], education: Education[], skills: Skill[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (firestore && slug) {
      getProfileData(firestore, slug)
        .then(profileData => {
          if (profileData) {
            setData(profileData);
          } else {
             // Will trigger not-found UI
             notFound();
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [firestore, slug]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  if (!data) {
    // This should be caught by notFound(), but as a fallback:
    return notFound();
  }

  const { profile, work, education, skills } = data;

  return (
    <div className="min-h-screen bg-secondary">
      <main className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          {/* Header */}
          <div className="flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:text-left">
            {profile.avatarUrl && 
                <Image
                src={profile.avatarUrl}
                alt={profile.fullName}
                width={128}
                height={128}
                className="rounded-full border-4 border-primary shadow-lg"
                data-ai-hint={profile.avatarHint || 'person portrait'}
                />
            }
            <div className="space-y-2">
              <h1 className="font-headline text-4xl font-bold">{profile.fullName}</h1>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-muted-foreground sm:justify-start">
                {profile.email && <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${profile.email}`} className="hover:text-primary">{profile.email}</a>
                </div>}
                 {profile.phone && <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{profile.phone}</span>
                </div>}
                {profile.location && <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>}
                {profile.website && <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                   <Link href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    {profile.website}
                    </Link>
                </div>}
              </div>
            </div>
          </div>

          <Separator />

          <div className="p-8">
            {/* Summary */}
            <section className="mb-8">
              <h2 className="mb-4 font-headline text-2xl font-bold">About Me</h2>
              <p className="text-muted-foreground">{profile.summary}</p>
            </section>
            
            <Separator className="my-8" />

            {/* Work Experience */}
            <section className="mb-8">
              <h2 className="mb-4 font-headline text-2xl font-bold flex items-center gap-3"><Briefcase /> Work Experience</h2>
              <div className="space-y-6">
                {work.map((job, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0"></div>
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        <p className="text-sm text-muted-foreground">{job.startDate} - {job.endDate || 'Present'}</p>
                      </div>
                      <p className="text-md font-medium text-primary">{job.company}</p>
                      <p className="mt-2 text-muted-foreground">{job.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            <Separator className="my-8" />

            {/* Education */}
            <section className="mb-8">
              <h2 className="mb-4 font-headline text-2xl font-bold flex items-center gap-3"><GraduationCap /> Education</h2>
              <div className="space-y-6">
                {education.map((edu, index) => (
                   <div key={index} className="flex gap-4">
                     <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0"></div>
                     <div>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                            <h3 className="text-lg font-semibold">{edu.degree}</h3>
                            <p className="text-sm text-muted-foreground">{edu.startDate} - {edu.endDate || 'Present'}</p>
                        </div>
                       <p className="text-md font-medium text-primary">{edu.institution}</p>
                       <p className="mt-2 text-muted-foreground">{edu.description}</p>
                     </div>
                   </div>
                ))}
              </div>
            </section>

            <Separator className="my-8" />
            
            {/* Skills */}
            <section>
              <h2 className="mb-4 font-headline text-2xl font-bold flex items-center gap-3"><Award /> Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">{skill.name}</Badge>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
