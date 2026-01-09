'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone, MapPin, Link as LinkIcon, Briefcase, GraduationCap, Wrench } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { ProfileData } from '../page';
import { cn } from '@/lib/utils';

export default function TemplateModern(props: ProfileData) {
  const { profile, workExperience, education, skills } = props;

  // Define a consistent primary color for this template
  const primaryColor = 'blue-600';
  const primaryHoverColor = 'blue-700';
  const primaryBgSoftColor = 'blue-50';

  return (
    <div className={cn("min-h-screen bg-gray-50 text-gray-700", "font-manrope")}>
      {/* Header Bar */}
      <div className={`h-2 bg-${primaryColor}`} />

      <main className="container mx-auto max-w-5xl p-4 sm:p-6 md:p-10">
        <div className="bg-white shadow-2xl shadow-gray-300/30 rounded-xl overflow-hidden">
          {/* Profile Header */}
          <header className="p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8 bg-white">
            {profile.avatarUrl && 
                <Image
                src={profile.avatarUrl}
                alt={profile.fullName}
                width={160}
                height={160}
                className="rounded-full border-8 border-white shadow-lg"
                data-ai-hint={profile.avatarHint || 'person portrait'}
                />
            }
            <div className="space-y-3 text-center sm:text-left">
              <h1 className={`text-5xl font-extrabold text-gray-800`}>{profile.fullName}</h1>
              {profile.summary && (
                <p className="text-xl text-gray-500 leading-relaxed">{profile.summary}</p>
              )}
              <div className={`pt-2 flex flex-wrap justify-center sm:justify-start gap-x-5 gap-y-2 text-gray-500`}>
                {profile.location && <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>}
                {profile.email && <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${profile.email}`} className={`hover:text-${primaryColor}`}>{profile.email}</a>
                </div>}
                {profile.phone && <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{profile.phone}</span>
                </div>}
                {profile.website && <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                   <Link href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className={`hover:text-${primaryColor}`}>
                    {profile.website}
                    </Link>
                </div>}
              </div>
            </div>
          </header>

          <div className="p-8 sm:p-12 bg-gray-50/70 space-y-12">
            {/* Work Experience */}
            {workExperience.length > 0 && (
                <section>
                    <h2 className={`flex items-center gap-3 text-3xl font-bold text-gray-800 mb-8`}>
                        <Briefcase className={`text-${primaryColor} h-8 w-8`} /> Work Experience
                    </h2>
                    <div className="space-y-8 relative border-l-2 border-gray-200 ml-4 pl-10">
                        {workExperience.map(job => (
                            <div key={job.id} className="relative">
                                <div className={`absolute -left-[45px] top-1.5 h-3 w-3 rounded-full bg-${primaryColor}`} />
                                <p className="text-sm text-gray-500 mb-1">{job.startDate} - {job.endDate || 'Present'}</p>
                                <h3 className="font-bold text-xl text-gray-900">{job.title}</h3>
                                <p className="text-md text-gray-600">{job.company}</p>
                                <p className="mt-3 text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
            
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
                {/* Education */}
                {education.length > 0 && (
                    <section>
                        <h2 className={`flex items-center gap-3 text-3xl font-bold text-gray-800 mb-8`}>
                           <GraduationCap className={`text-${primaryColor} h-8 w-8`} /> Education
                        </h2>
                        <div className="space-y-6">
                            {education.map(edu => (
                            <div key={edu.id}>
                                <h3 className="font-bold text-xl text-gray-900">{edu.institution}</h3>
                                <p className="text-md text-gray-600">{edu.degree}</p>
                                <p className="text-sm text-gray-500 mt-1">{edu.startDate} - {edu.endDate || 'Present'}</p>
                            </div>
                            ))}
                        </div>
                    </section>
                )}
            
                {/* Skills */}
                {skills.length > 0 && (
                    <section>
                        <h2 className={`flex items-center gap-3 text-3xl font-bold text-gray-800 mb-8`}>
                           <Wrench className={`text-${primaryColor} h-8 w-8`} /> Skills
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {skills.map(skill => (
                                <Badge key={skill.id} variant="secondary" className={`text-md bg-white text-gray-700 hover:bg-gray-100 py-2 px-4 shadow-sm border border-gray-200`}>{skill.name}</Badge>
                            ))}
                        </div>
                    </section>
                )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}