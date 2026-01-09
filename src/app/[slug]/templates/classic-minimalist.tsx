'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone, MapPin, Link as LinkIcon, Briefcase, GraduationCap, Star } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { ProfileData } from '../page';
import { cn } from '@/lib/utils';

export default function TemplateClassic(props: ProfileData) {
  const { profile, workExperience, education, skills } = props;

  return (
    <div className={cn("min-h-screen bg-gray-50 text-gray-800")}>
      <main className="container mx-auto max-w-4xl p-4 sm:p-8 md:p-12">
        <div className="bg-white p-12 rounded-lg shadow-md">
          {/* Header */}
          <header className="flex flex-col sm:flex-row items-center gap-8 mb-10">
            {profile.avatarUrl && 
                <Image
                src={profile.avatarUrl}
                alt={profile.fullName}
                width={150}
                height={150}
                className="rounded-full border-4 border-gray-200"
                data-ai-hint={profile.avatarHint || 'person portrait'}
                />
            }
            <div className="text-center sm:text-left">
              <h1 className="text-5xl font-bold text-gray-900">{profile.fullName}</h1>
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 text-gray-500">
                {profile.location && <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>}
                {profile.email && <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a href={`mailto:${profile.email}`} className="hover:text-gray-900">{profile.email}</a>
                </div>}
                {profile.phone && <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{profile.phone}</span>
                </div>}
                {profile.website && <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                   <Link href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-gray-900">
                    {profile.website}
                    </Link>
                </div>}
              </div>
            </div>
          </header>

          <Separator className="bg-gray-200" />

          {/* About Section */}
          {profile.summary && (
            <section className="py-10">
              <h2 className="mb-4 text-2xl font-bold text-gray-900 uppercase tracking-widest">About Me</h2>
              <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap">{profile.summary}</p>
            </section>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="md:col-span-2 space-y-10">
                {/* Work Experience */}
                {workExperience.length > 0 && (
                    <section>
                        <h2 className="mb-6 text-2xl font-bold text-gray-900 uppercase tracking-widest">Experience</h2>
                        <div className="space-y-8">
                            {workExperience.map(job => (
                                <div key={job.id}>
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-bold text-xl text-gray-800">{job.title}</h3>
                                        <p className="text-sm text-gray-500">{job.startDate} - {job.endDate || 'Present'}</p>
                                    </div>
                                    <p className="text-md text-gray-600 font-semibold">{job.company}</p>
                                    <p className="mt-2 text-gray-600 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Education */}
                {education.length > 0 && (
                    <section>
                        <h2 className="mb-6 text-2xl font-bold text-gray-900 uppercase tracking-widest">Education</h2>
                        <div className="space-y-6">
                            {education.map(edu => (
                            <div key={edu.id}>
                                <div className="flex justify-between items-baseline">
                                    <h3 className="font-bold text-xl text-gray-800">{edu.degree}</h3>
                                    <p className="text-sm text-gray-500">{edu.startDate} - {edu.endDate || 'Present'}</p>
                                </div>
                                <p className="text-md text-gray-600 font-semibold">{edu.institution}</p>
                            </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <div className="space-y-10">
                 {/* Skills */}
                {skills.length > 0 && (
                    <section>
                        <h2 className="mb-6 text-2xl font-bold text-gray-900 uppercase tracking-widest">Skills</h2>
                        <div className="flex flex-wrap gap-3">
                            {skills.map(skill => (
                                <Badge key={skill.id} variant="secondary" className="text-md bg-gray-200 text-gray-800 hover:bg-gray-300 py-1 px-3">
                                    {skill.name}
                                </Badge>
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
