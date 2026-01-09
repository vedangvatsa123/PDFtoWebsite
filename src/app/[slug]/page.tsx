
"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, Firestore, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { type UserProfile, type WorkExperience, type Education, type Skill } from '@/types';
import { 
    Mail, Phone, MapPin, Link as LinkIcon, Loader2,
    Briefcase, GraduationCap, Wrench
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { notFound } from 'next/navigation';
import Header from '@/components/header';
import React from 'react';
import { Badge } from '@/components/ui/badge';

type ProfileData = {
    profile: UserProfile;
    workExperience: WorkExperience[];
    education: Education[];
    skills: Skill[];
};

async function getProfileData(firestore: Firestore, slug: string): Promise<ProfileData | null> {
    const slugRef = doc(firestore, 'userProfilesBySlug', slug);
    const slugSnap = await getDoc(slugRef);

    if (!slugSnap.exists()) {
        return null;
    }

    const { userId } = slugSnap.data();
    if (!userId) return null;

    // Fetch profile, work experience, education, and skills in parallel
    const profileRef = doc(firestore, 'users', userId, 'userProfile', userId);
    const workQuery = query(collection(firestore, 'users', userId, 'workExperience'), orderBy('startDate', 'desc'));
    const eduQuery = query(collection(firestore, 'users', userId, 'education'), orderBy('startDate', 'desc'));
    const skillsQuery = query(collection(firestore, 'users', userId, 'skills'));

    const [profileSnap, workSnap, eduSnap, skillsSnap] = await Promise.all([
        getDoc(profileRef),
        getDocs(workQuery),
        getDocs(eduQuery),
        getDocs(skillsQuery)
    ]);

    if (!profileSnap.exists()) {
        return null;
    }
    
    const profileData = profileSnap.data() as UserProfile;
    const workExperience = workSnap.docs.map(d => ({ ...d.data(), id: d.id } as WorkExperience));
    const education = eduSnap.docs.map(d => ({ ...d.data(), id: d.id } as Education));
    const skills = skillsSnap.docs.map(d => ({ ...d.data(), id: d.id } as Skill));

    return { profile: profileData, workExperience, education, skills };
}

type PageProps = {
  params: { slug: string };
};

export default function ProfileSlugPage({ params }: PageProps) {
  const firestore = useFirestore();
  const { slug } = params;
  
  const [data, setData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetch(`/api/views/${slug}`, { method: 'POST' }).catch(console.error);
    }
  }, [slug]);

  useEffect(() => {
    if (firestore && slug) {
      setIsLoading(true);
      getProfileData(firestore, slug)
        .then(profileData => {
          if (profileData) {
            setData(profileData);
          } else {
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
    return notFound();
  }

  const { profile, workExperience, education, skills } = data;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
        <div>
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
              <h1 className="text-4xl font-bold">{profile.fullName}</h1>
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

          <div className="p-8 space-y-12">
            {profile.summary && (
              <section>
                <h2 className="mb-4 text-2xl font-bold">About Me</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{profile.summary}</p>
              </section>
            )}
            
            {workExperience.length > 0 && (
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold">Work Experience</h2>
                    </div>
                    <div className="space-y-8 border-l-2 border-border ml-6 pl-12">
                        {workExperience.map(job => (
                            <div key={job.id} className="relative">
                                <div className="absolute -left-[58px] top-1 h-4 w-4 rounded-full bg-primary" />
                                <p className="font-semibold text-lg">{job.title}</p>
                                <p className="text-muted-foreground">{job.company}</p>
                                <p className="text-sm text-muted-foreground">{job.startDate} - {job.endDate || 'Present'}</p>
                                <p className="mt-2 whitespace-pre-wrap">{job.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
            
            {education.length > 0 && (
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <GraduationCap className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold">Education</h2>
                    </div>
                     <div className="space-y-8 border-l-2 border-border ml-6 pl-12">
                        {education.map(edu => (
                           <div key={edu.id} className="relative">
                                <div className="absolute -left-[58px] top-1 h-4 w-4 rounded-full bg-primary" />
                                <p className="font-semibold text-lg">{edu.degree}</p>
                                <p className="text-muted-foreground">{edu.institution}</p>
                                <p className="text-sm text-muted-foreground">{edu.startDate} - {edu.endDate || 'Present'}</p>
                           </div>
                        ))}
                    </div>
                </section>
            )}
            
            {skills.length > 0 && (
                <section>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Wrench className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold">Skills</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-6">
                        {skills.map(skill => (
                            <Badge key={skill.id} variant="secondary" className="text-lg py-1 px-4">{skill.name}</Badge>
                        ))}
                    </div>
                </section>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
