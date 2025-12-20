
"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, Firestore, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { type UserProfile, type ResumeSection } from '@/types';
import { 
    Mail, Phone, MapPin, Link as LinkIcon, Loader2,
    Briefcase, GraduationCap, Wrench, FolderKanban, Award, BookText, HeartHandshake, FileText
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { notFound } from 'next/navigation';
import Header from '@/components/header';
import React from 'react';

async function getProfileData(firestore: Firestore, slug: string): Promise<{ profile: UserProfile, sections: ResumeSection[] } | null> {
    const slugRef = doc(firestore, 'userProfilesBySlug', slug);
    const slugSnap = await getDoc(slugRef);

    if (!slugSnap.exists()) {
        return null;
    }

    const { userId } = slugSnap.data();
    if (!userId) return null;

    const profileRef = doc(firestore, 'users', userId, 'userProfile', userId);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
        return null;
    }
    
    const profileData = profileSnap.data() as UserProfile;

    const sectionsQuery = query(collection(firestore, 'users', userId, 'resumeSections'), orderBy('order'));
    const sectionsSnap = await getDocs(sectionsQuery);
    
    const sections = sectionsSnap.docs.map(d => ({...d.data(), id: d.id } as ResumeSection));

    return { profile: profileData, sections };
}

const SECTION_ICON_MAP: { [key: string]: React.ElementType } = {
    experience: Briefcase,
    education: GraduationCap,
    skills: Wrench,
    projects: FolderKanban,
    awards: Award,
    volunteer: HeartHandshake,
    certifications: FileText,
    publications: BookText,
};

const getIconForSection = (title: string) => {
    const lowerTitle = title.toLowerCase();
    for (const key in SECTION_ICON_MAP) {
        if (lowerTitle.includes(key)) {
            return SECTION_ICON_MAP[key];
        }
    }
    return BookText; // Default icon
};


type PageProps = {
  params: { slug: string };
};

export default function ProfileSlugPage({ params }: PageProps) {
  const firestore = useFirestore();
  const { slug } = params;
  
  const [data, setData] = useState<{ profile: UserProfile, sections: ResumeSection[] } | null>(null);
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

  const { profile, sections } = data;

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
            {/* Summary */}
            {profile.summary && (
              <section>
                <h2 className="mb-4 text-2xl font-bold">About Me</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{profile.summary}</p>
              </section>
            )}
            
            {/* Dynamic Sections from Resume */}
            {sections.map((section) => {
              const Icon = getIconForSection(section.title);
              return (
                <section key={section.id}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Icon className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold">{section.title}</h2>
                    </div>
                    <div className="border-l-2 border-border ml-6 pl-12">
                        <p className="text-muted-foreground whitespace-pre-wrap py-2">
                            {section.content}
                        </p>
                    </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
