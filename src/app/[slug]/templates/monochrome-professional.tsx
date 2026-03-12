'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone, MapPin, Link as LinkIcon, Briefcase, GraduationCap, Star } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { ServerProfileData as ProfileData } from '@/lib/firebase-rest';
import { cn } from '@/lib/utils';

export default function TemplateMonochrome(props: ProfileData) {
  const { profile, workExperience, education, skills } = props;

  return (
    <div className={cn("min-h-screen")}>
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* Sidebar */}
        <aside className="w-full md:w-1/3 bg-gray-900 text-white p-8 md:p-12 flex flex-col items-center text-center md:items-start md:text-left">
          {profile.avatarUrl && 
              <Image
              src={profile.avatarUrl}
              alt={profile.fullName}
              width={160}
              height={160}
              className="rounded-full border-4 border-gray-700 mb-6"
              data-ai-hint={profile.avatarHint || 'person portrait'}
              />
          }
          <h1 className="text-4xl font-bold text-white">{profile.fullName}</h1>
          
          <Separator className="my-8 bg-gray-700" />
          
          <div className="space-y-4 text-gray-300">
            {profile.location && <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span>{profile.location}</span>
            </div>}
            {profile.email && <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <a href={`mailto:${profile.email}`} className="hover:text-white">{profile.email}</a>
            </div>}
             {profile.phone && <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <span>{profile.phone}</span>
            </div>}
            {profile.website && <div className="flex items-center gap-3">
              <LinkIcon className="h-5 w-5 text-gray-400" />
               <Link href={profile.website!.startsWith('http') ? profile.website! : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                {profile.website}
                </Link>
            </div>}
          </div>

          {skills.length > 0 && (
              <>
                <Separator className="my-8 bg-gray-700" />
                <section>
                    <h2 className="text-2xl font-bold text-white mb-4">Skills</h2>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {skills.map(skill => (
                            <Badge key={skill.id} variant="secondary" className="bg-gray-700 text-gray-200 hover:bg-gray-600 text-md py-1 px-3">{skill.name}</Badge>
                        ))}
                    </div>
                </section>
              </>
          )}

        </aside>

        {/* Main Content */}
        <main className="w-full md:w-2/3 bg-white text-gray-800 p-8 md:p-12 overflow-y-auto">
          {profile.summary && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Summary</h2>
              <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap font-sans">{profile.summary}</p>
            </section>
          )}

          {workExperience.length > 0 && (
              <section className="mb-12">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Work Experience</h2>
                  <div className="space-y-8 border-l-2 border-gray-200 pl-8">
                      {workExperience.map(job => (
                          <div key={job.id} className="relative">
                            <div className="absolute -left-[37px] top-1.5 h-4 w-4 rounded-full bg-gray-900" />
                              <p className="text-sm text-gray-500 font-sans">{job.startDate} - {job.endDate || 'Present'}</p>
                              <h3 className="font-bold text-2xl text-gray-800 mt-1">{job.title}</h3>
                              <p className="text-lg text-gray-600 font-semibold">{job.company}</p>
                              <p className="mt-2 text-gray-600 leading-relaxed whitespace-pre-wrap font-sans">{job.description}</p>
                          </div>
                      ))}
                  </div>
              </section>
          )}
          
          {education.length > 0 && (
              <section>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Education</h2>
                  <div className="space-y-8 border-l-2 border-gray-200 pl-8">
                      {education.map(edu => (
                         <div key={edu.id} className="relative">
                            <div className="absolute -left-[37px] top-1.5 h-4 w-4 rounded-full bg-gray-900" />
                              <p className="text-sm text-gray-500 font-sans">{edu.startDate} - {edu.endDate || 'Present'}</p>
                              <h3 className="font-bold text-2xl text-gray-800 mt-1">{edu.degree}</h3>
                              <p className="text-lg text-gray-600 font-semibold">{edu.institution}</p>
                         </div>
                      ))}
                  </div>
              </section>
          )}

        </main>
      </div>
    </div>
  );
}
