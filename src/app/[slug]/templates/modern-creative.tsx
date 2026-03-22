'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone, MapPin, Globe, Download, ArrowUpRight, FileDown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { ServerProfileData as ProfileData } from '@/lib/supabase-server';

export default function TemplateModern(props: ProfileData) {
  const { profile, workExperience, education, customSections } = props;
  const skills = profile.skills || [];

  const { toast } = useToast();

  const handleDownloadPDF = useCallback(async () => {
    // Dynamically import to avoid SSR errors
    // @ts-ignore
    const html2pdf = (await import('html2pdf.js')).default;
    
    const element = document.querySelector('.resume-page');
    if (!element) return;

    toast({
      title: "Generating PDF",
      description: "Your professional resume is being prepared for download.",
    });

    const opt = {
      margin: [15, 15, 20, 15], // More generous bottom margin (20mm)
      filename: `${profile.fullName.replace(/\s+/g, '')}-CVinBio.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        windowWidth: 800 // Stable width for consistent rendering
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Use any as html2pdf has non-standard type definitions
    (html2pdf() as any).set(opt).from(element as HTMLElement).save();
  }, [profile.fullName, toast]);


  return (
    <>
      {/* Print CSS — clean resume, no browser chrome */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0.5in 0.6in;
            size: letter;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .resume-page {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .resume-outer {
            background: white !important;
            padding: 0 !important;
            min-height: auto !important;
          }
        }
      `}</style>

      <div className="resume-outer min-h-screen bg-background">
        <button
          onClick={handleDownloadPDF}
          className="no-print fixed bottom-6 right-6 z-[60] rounded-full bg-zinc-900 text-white p-4 shadow-xl hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 group flex items-center gap-2"
          title="Save as PDF"
        >
          <FileDown className="h-5 w-5" />
          <span className="text-xs font-semibold pr-1">Save PDF</span>
        </button>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
          <div className="resume-page space-y-8 pb-12">

            {/* ─── HEADER ─── */}
            <header className="text-center">
              {profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos') && (
                <div className="flex justify-center mb-4">
                  {profile.avatarUrl.startsWith('data:') ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      className="rounded-full border object-cover"
                      style={{ width: 72, height: 72 }}
                    />
                  ) : (
                    <Image
                      src={profile.avatarUrl}
                      alt={profile.fullName}
                      width={72}
                      height={72}
                      className="rounded-full border object-cover"
                      style={{ width: 72, height: 72 }}
                      data-ai-hint={profile.avatarHint || 'person portrait'}
                    />
                  )}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter text-foreground">
                {profile.fullName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {profile.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.location}
                  </span>
                )}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                    <Mail className="h-3 w-3" />
                    {profile.email}
                  </a>
                )}
                {profile.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {profile.phone}
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <Globe className="h-3 w-3" />
                    {profile.website.replace(/^https?:\/\//, '')}
                    <ArrowUpRight className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>

              {profile.summary && (
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
                  {profile.summary}
                </p>
              )}
            </header>

            <div className="h-px bg-border" />

            {/* ─── EXPERIENCE ─── */}
            {workExperience.length > 0 && (
              <>
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Experience
                  </h2>
                  <div className="space-y-5">
                    {workExperience.map(job => (
                      <div key={job.id}>
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{job.title}</h3>
                            <p className="text-sm text-muted-foreground">{job.company}</p>
                          </div>
                          <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                            {job.startDate} — {job.endDate || 'Present'}
                          </span>
                        </div>
                        {job.description && (
                          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {job.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
                <div className="h-px bg-border" />
              </>
            )}

            {/* ─── EDUCATION ─── */}
            {education.length > 0 && (
              <>
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    Education
                  </h2>
                  <div className="space-y-3">
                    {education.map(edu => (
                      <div key={edu.id}>
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{edu.institution}</h3>
                            <p className="text-xs text-muted-foreground">{edu.degree}</p>
                          </div>
                          <span className="text-xs text-muted-foreground/60 whitespace-nowrap">
                            {edu.startDate} — {edu.endDate || 'Present'}
                          </span>
                        </div>
                        {edu.description && (
                          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {edu.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
                <div className="h-px bg-border" />
              </>
            )}

            {/* ─── SKILLS ─── */}
            {skills.length > 0 && (
              <>
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Skills
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-md border px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
                {customSections?.length > 0 && <div className="h-px bg-border" />}
              </>
            )}

            {/* ─── CUSTOM SECTIONS ─── */}
            {customSections?.map((section, idx) => (
              <React.Fragment key={section.id}>
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    {section.sectionTitle}
                  </h2>
                  <div className="space-y-4">
                    {section.items?.map(item => (
                      <div key={item.id}>
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                            {item.subtitle && <p className="text-sm text-muted-foreground">{item.subtitle}</p>}
                          </div>
                          {item.date && (
                            <span className="text-xs text-muted-foreground/60 whitespace-nowrap">{item.date}</span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
                {idx < customSections.length - 1 && <div className="h-px bg-border" />}
              </React.Fragment>
            ))}

            {/* Footer - branding */}
            <div className="no-print pt-6 text-center">
              <p className="text-[11px] text-muted-foreground/40">
                Built with{' '}
                <Link href="/" className="hover:text-foreground transition-colors">
                  CVin.Bio
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
