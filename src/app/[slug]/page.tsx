"use client";

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs, Firestore, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { type UserProfile, type WorkExperience, type Education, type Skill } from '@/types';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import TemplateMonochrome from './templates/monochrome-professional';
import TemplateModern from './templates/modern-creative';
import TemplateClassic from './templates/classic-minimalist';

export type ProfileData = {
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

  const { themeId = 'modern-creative' } = data.profile;

  const renderTemplate = () => {
    switch (themeId) {
      case 'monochrome-professional':
        return <TemplateMonochrome {...data} />;
      case 'classic-minimalist':
        return <TemplateClassic {...data} />;
      case 'modern-creative':
      default:
        return <TemplateModern {...data} />;
    }
  };

  return renderTemplate();
}
