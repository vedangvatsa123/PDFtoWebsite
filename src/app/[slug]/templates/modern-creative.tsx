'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone, MapPin, Globe, Download, ArrowUpRight, FileDown, Github, Linkedin } from 'lucide-react';
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
      margin: [12, 12, 12, 12], // Reduced global margins slightly for a denser fit
      filename: `${profile.fullName.replace(/\s+/g, '')}-CVinBio.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      pagebreak: { mode: 'css', avoid: '.avoid-break' },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        windowWidth: 800 // Stable width for consistent rendering
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const root = window.document.documentElement;
    const isDark = root.classList.contains('dark');
    if (isDark) root.classList.remove('dark');

    // Slight delay to allow DOM to repaint text colors to black
    await new Promise(r => setTimeout(r, 50));

    // Wait for the PDF to be fully generated and saved
    await (html2pdf() as any).set(opt).from(element as HTMLElement).save();

    if (isDark) root.classList.add('dark');
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
            gap: 1rem !important;
          }
          .resume-page .space-y-5 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.75rem !important; /* Denser top level */
          }
          .resume-page .space-y-3 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.35rem !important; /* Denser items */
          }
          .resume-page .space-y-2\\.5 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.35rem !important;
          }
          .resume-page p, .resume-page span, .resume-page h3 {
            line-height: 1.35 !important;
          }
          .resume-page h2 {
            margin-bottom: 0.25rem !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .resume-page .mb-4 { margin-bottom: 0.5rem !important; }
          .resume-page .mt-4 { margin-top: 0.5rem !important; }
          .resume-page .pt-6 { padding-top: 0.5rem !important; }
          
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          .resume-outer {
            background: white !important;
            padding: 0 !important;
            min-height: auto !important;
          }
        }
      `}</style>

      <div className="resume-outer min-h-screen bg-background">
        {/* Temporarily disabled PDF button: 
        <button
          onClick={handleDownloadPDF}
          className="no-print fixed bottom-6 right-6 z-[60] rounded-full bg-zinc-900 text-white p-4 shadow-xl hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 group flex items-center gap-2"
          title="Save as PDF"
        >
          <FileDown className="h-5 w-5" />
          <span className="text-xs font-semibold pr-1">Save PDF</span>
        </button> 
        */}

        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="resume-page space-y-5 pb-8">

            {/* ─── HEADER ─── */}
            <header className="text-center">
              {profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos') && (
                <div className="flex justify-center mb-4">
                  <div className="relative overflow-hidden rounded-full border bg-muted shrink-0 flex items-center justify-center transform-gpu" style={{ width: 72, height: 72, borderRadius: '50%' }}>
                    {profile.avatarUrl.startsWith('data:') ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.fullName}
                        className="w-full h-full object-cover"
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <Image
                        src={profile.avatarUrl}
                        alt={profile.fullName}
                        fill
                        className="object-cover"
                        style={{ width: '100%', height: '100%' }}
                        unoptimized={true}
                        crossOrigin="anonymous"
                        data-ai-hint={profile.avatarHint || 'person portrait'}
                      />
                    )}
                  </div>
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter text-foreground">
                {profile.fullName}
              </h1>
              <div className="mt-2 text-center text-xs text-muted-foreground">
                {profile.location && (
                  <span className="inline-flex items-center mx-2 my-1">
                    <MapPin className="h-3 w-3 shrink-0 mr-1.5 relative top-[-1px]" />
                    <span>{profile.location}</span>
                  </span>
                )}
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="inline-flex items-center hover:text-foreground transition-colors mx-2 my-1">
                    <Mail className="h-3 w-3 shrink-0 mr-1.5 relative top-[-1px]" />
                    <span>{profile.email}</span>
                  </a>
                )}
                {profile.phone && (
                  <span className="inline-flex items-center mx-2 my-1">
                    <Phone className="h-3 w-3 shrink-0 mr-1.5 relative top-[-1px]" />
                    <span>{profile.phone}</span>
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center hover:text-foreground transition-colors mx-2 my-1"
                  >
                    <Globe className="h-3 w-3 shrink-0 mr-1.5 relative top-[-1px]" />
                    <span>{profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                    <ArrowUpRight className="h-2.5 w-2.5 shrink-0 ml-1 relative top-[1px]" />
                  </a>
                )}
                {profile.github && (
                  <a
                    href={profile.github.startsWith('http') ? profile.github : `https://${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center hover:text-foreground transition-colors mx-2 my-1"
                  >
                    <Github className="h-3 w-3 shrink-0 mr-1.5 relative top-[-1px]" />
                    <span>{profile.github.replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, '').replace(/\/$/, '')}</span>
                    <ArrowUpRight className="h-2.5 w-2.5 shrink-0 ml-1 relative top-[1px]" />
                  </a>
                )}
                {profile.linkedin && (
                  <a
                    href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center hover:text-foreground transition-colors mx-2 my-1"
                  >
                    <Linkedin className="h-3 w-3 shrink-0 mr-1.5 relative top-[-1px]" />
                    <span>{profile.linkedin.replace(/^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\//i, '').replace(/\/$/, '')}</span>
                    <ArrowUpRight className="h-2.5 w-2.5 shrink-0 ml-1 relative top-[1px]" />
                  </a>
                )}
              </div>

              {profile.summary && (
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
                  {profile.summary}
                </p>
              )}
            </header>

            {(workExperience.length > 0 || education.length > 0 || skills.length > 0 || customSections?.length > 0) && <div className="h-px bg-border" />}

            {/* ─── EXPERIENCE ─── */}
            {workExperience.length > 0 && (
              <>
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Experience
                  </h2>
                  <div className="space-y-3">
                    {workExperience.map(job => (
                      <div key={job.id} className="avoid-break">
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
                {(education.length > 0 || skills.length > 0 || customSections?.length > 0) && <div className="h-px bg-border" />}
              </>
            )}

            {/* ─── EDUCATION ─── */}
            {education.length > 0 && (
              <>
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Education
                  </h2>
                  <div className="space-y-2.5">
                    {education.map(edu => (
                      <div key={edu.id} className="avoid-break">
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
                {(skills.length > 0 || customSections?.length > 0) && <div className="h-px bg-border" />}
              </>
            )}

            {/* ─── SKILLS ─── */}
            {skills.length > 0 && (
              <>
                <section>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Skills
                  </h2>
                  <div className="block" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-block rounded-md border text-xs text-muted-foreground"
                        style={{ padding: '4px 10px', margin: '0 6px 6px 0', backgroundColor: '#fafafa' }}
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
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                    {section.sectionTitle}
                  </h2>
                  <div className="space-y-3">
                    {section.items?.map(item => (
                      <div key={item.id} className="avoid-break">
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
