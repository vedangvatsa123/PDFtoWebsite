// This file is now deprecated and will be replaced by a dynamic route [slug]/page.tsx
// Keeping it for now to avoid breaking changes during transition.
// The new dynamic page is located at src/app/[slug]/page.tsx

import Image from 'next/image';
import Link from 'next/link';
import { mockProfile } from '@/lib/mock-data';
import { Briefcase, Mail, Phone, MapPin, Link as LinkIcon, GraduationCap, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const profile = mockProfile;

  return (
    <div className="min-h-screen bg-secondary">
      <main className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          {/* Header */}
          <div className="flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:text-left">
            <Image
              src={profile.personalInfo.avatarUrl}
              alt={profile.personalInfo.name}
              width={128}
              height={128}
              className="rounded-full border-4 border-primary shadow-lg"
              data-ai-hint={profile.personalInfo.avatarHint}
            />
            <div className="space-y-2">
              <h1 className="font-headline text-4xl font-bold">{profile.personalInfo.name}</h1>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-muted-foreground sm:justify-start">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${profile.personalInfo.email}`} className="hover:text-primary">{profile.personalInfo.email}</a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{profile.personalInfo.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.personalInfo.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                   <Link href={`https://${profile.personalInfo.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    {profile.personalInfo.website}
                    </Link>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="p-8">
            {/* Summary */}
            <section className="mb-8">
              <h2 className="mb-4 font-headline text-2xl font-bold">About Me</h2>
              <p className="text-muted-foreground">{profile.personalInfo.summary}</p>
            </section>
            
            <Separator className="my-8" />

            {/* Work Experience */}
            <section className="mb-8">
              <h2 className="mb-4 font-headline text-2xl font-bold flex items-center gap-3"><Briefcase /> Work Experience</h2>
              <div className="space-y-6">
                {profile.workExperience.map((job) => (
                  <div key={job.id} className="flex gap-4">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0"></div>
                    <div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                        <h3 className="text-lg font-semibold">{job.role}</h3>
                        <p className="text-sm text-muted-foreground">{job.startDate} - {job.endDate}</p>
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
                {profile.education.map((edu) => (
                   <div key={edu.id} className="flex gap-4">
                     <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0"></div>
                     <div>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                            <h3 className="text-lg font-semibold">{edu.degree}</h3>
                            <p className="text-sm text-muted-foreground">{edu.startDate} - {edu.endDate}</p>
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
                {profile.skills.map((skill) => (
                  <Badge key={skill.id} variant="secondary" className="text-sm">{skill.name}</Badge>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
