'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone, MapPin, Globe, Download, ArrowUpRight, FileDown, Github, Linkedin, Twitter, Youtube, Facebook, Instagram, BookOpen, GraduationCap, Palette, Code2, Pen, MessageCircle, Send, Music, Headphones, Tv, Hash, Figma, Package, Gamepad2, Megaphone, Users, Briefcase, Rss, FileCode2, GitBranch } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { ServerProfileData as ProfileData } from '@/lib/supabase-server';

const LINK_ICON_MAP: Record<string, { icon: React.ComponentType<any>; color: string }> = {
  // Major social
  'twitter': { icon: Twitter, color: '#1DA1F2' },
  'x': { icon: Twitter, color: '#000000' },
  'youtube': { icon: Youtube, color: '#FF0000' },
  'facebook': { icon: Facebook, color: '#1877F2' },
  'instagram': { icon: Instagram, color: '#E4405F' },
  'tiktok': { icon: Music, color: '#000000' },
  'threads': { icon: Hash, color: '#000000' },
  'pinterest': { icon: Palette, color: '#E60023' },
  'snapchat': { icon: MessageCircle, color: '#FFFC00' },
  // Messaging (regional)
  'telegram': { icon: Send, color: '#26A5E4' },
  'whatsapp': { icon: MessageCircle, color: '#25D366' },
  'wechat': { icon: MessageCircle, color: '#07C160' },
  'weixin': { icon: MessageCircle, color: '#07C160' },
  'line': { icon: MessageCircle, color: '#00C300' },
  'kakaotalk': { icon: MessageCircle, color: '#FFE812' },
  'kakao': { icon: MessageCircle, color: '#FFE812' },
  'discord': { icon: Gamepad2, color: '#5865F2' },
  'slack': { icon: Hash, color: '#4A154B' },
  // Professional (regional)
  'xing': { icon: Briefcase, color: '#006567' },
  'vk': { icon: Users, color: '#4680C2' },
  'vkontakte': { icon: Users, color: '#4680C2' },
  // Fediverse / New social
  'mastodon': { icon: Megaphone, color: '#6364FF' },
  'bluesky': { icon: Globe, color: '#0085FF' },
  // Writing & Publishing
  'medium': { icon: Pen, color: '#000000' },
  'substack': { icon: Rss, color: '#FF6719' },
  'hashnode': { icon: Hash, color: '#2962FF' },
  'dev': { icon: Code2, color: '#0A0A0A' },
  'devto': { icon: Code2, color: '#0A0A0A' },
  'dev.to': { icon: Code2, color: '#0A0A0A' },
  // Design
  'dribbble': { icon: Palette, color: '#EA4C89' },
  'behance': { icon: Palette, color: '#1769FF' },
  'figma': { icon: Figma, color: '#F24E1E' },
  'artstation': { icon: Palette, color: '#13AFF0' },
  'deviantart': { icon: Palette, color: '#00E59B' },
  // Developer
  'stackoverflow': { icon: Code2, color: '#F48024' },
  'stack-overflow': { icon: Code2, color: '#F48024' },
  'kaggle': { icon: Code2, color: '#20BEFF' },
  'gitlab': { icon: GitBranch, color: '#FC6D26' },
  'bitbucket': { icon: GitBranch, color: '#0052CC' },
  'codepen': { icon: FileCode2, color: '#000000' },
  'hackerrank': { icon: Code2, color: '#00EA64' },
  'leetcode': { icon: Code2, color: '#FFA116' },
  'codeforces': { icon: Code2, color: '#1F8ACB' },
  'npm': { icon: Package, color: '#CB3837' },
  'pypi': { icon: Package, color: '#3775A9' },
  'notion': { icon: BookOpen, color: '#000000' },
  // Academic
  'researchgate': { icon: BookOpen, color: '#00CCBB' },
  'google-scholar': { icon: GraduationCap, color: '#4285F4' },
  'orcid': { icon: BookOpen, color: '#A6CE39' },
  'scholar': { icon: GraduationCap, color: '#4285F4' },
  'academia': { icon: GraduationCap, color: '#41454A' },
  'pubmed': { icon: BookOpen, color: '#326599' },
  'scopus': { icon: BookOpen, color: '#E9711C' },
  // Media & Entertainment
  'soundcloud': { icon: Headphones, color: '#FF5500' },
  'spotify': { icon: Music, color: '#1DB954' },
  'twitch': { icon: Tv, color: '#9146FF' },
  'vimeo': { icon: Tv, color: '#1AB7EA' },
};

function getLinkIcon(type: string): { Icon: React.ComponentType<any>; color: string } {
  const key = type.toLowerCase().replace(/\s+/g, '-');
  const match = LINK_ICON_MAP[key];
  if (match) return { Icon: match.icon, color: match.color };
  // Try partial matching for labels like "Google Scholar Profile"
  for (const [k, v] of Object.entries(LINK_ICON_MAP)) {
    if (key.includes(k)) return { Icon: v.icon, color: v.color };
  }
  return { Icon: Globe, color: '#4285F4' };
}

function LinkifiedLine({ text }: { text: string }) {
  const urlRegex = /((?:https?:\/\/|www\.)[^\s<>()[\]{}]+)/gi;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, i) => {
        if (part.match(urlRegex)) {
          const href = part.startsWith('http') ? part : 'https://' + part;
          return (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-muted-foreground/40 hover:decoration-foreground transition-colors">
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// Detects if a line is a bullet point (•, -, *, or numbered like "1.")
function isBulletLine(line: string): boolean {
  return /^(\s*)(•|-|\*|\d+\.)\s+/.test(line);
}

function stripBulletPrefix(line: string): string {
  return line.replace(/^(\s*)(•|-|\*|\d+\.)\s+/, '').trim();
}

function StructuredText({ text }: { text?: string }) {
  if (!text) return null;

  const lines = text.split('\n');
  const blocks: Array<{ type: 'bullet' | 'para'; lines: string[] }> = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue; // skip blank lines between sections

    if (isBulletLine(line)) {
      // Append to existing bullet block or start a new one
      if (blocks.length > 0 && blocks[blocks.length - 1].type === 'bullet') {
        blocks[blocks.length - 1].lines.push(line);
      } else {
        blocks.push({ type: 'bullet', lines: [line] });
      }
    } else {
      // Plain paragraph — always start its own block
      blocks.push({ type: 'para', lines: [line] });
    }
  }

  return (
    <div className="space-y-1.5">
      {blocks.map((block, bi) => {
        if (block.type === 'bullet') {
          return (
            <ul key={bi} className="list-disc list-outside ml-4 space-y-0.5">
              {block.lines.map((line, li) => (
                <li key={li} className="text-xs text-muted-foreground leading-relaxed">
                  <LinkifiedLine text={stripBulletPrefix(line)} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi} className="text-xs text-muted-foreground leading-relaxed">
            <LinkifiedLine text={block.lines[0]} />
          </p>
        );
      })}
    </div>
  );
}


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

    // Increased delay to allow full CSS repaint of text colors for PDF capture
    await new Promise(r => setTimeout(r, 300));

    try {
      // Wait for the PDF to be fully generated and saved
      await (html2pdf() as any).set(opt).from(element as HTMLElement).save();
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError);
      toast({
        variant: "destructive",
        title: "PDF generation failed",
        description: "Could not generate PDF. Try using your browser's Print → Save as PDF instead.",
      });
    } finally {
      if (isDark) root.classList.add('dark');
    }
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

        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="resume-page space-y-5 pb-8">

            {/* ─── HEADER ─── */}
            <header className="text-center">
              {profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos') && (
                <div className="flex justify-center mb-4">
                  <div className="relative overflow-hidden rounded-full border-2 border-indigo-100 dark:border-indigo-900/50 bg-muted shrink-0 flex items-center justify-center transform-gpu shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)] dark:shadow-[0_0_40px_-5px_rgba(99,102,241,0.3)] transition-all hover:shadow-[0_0_50px_-5px_rgba(99,102,241,0.6)]" style={{ width: 72, height: 72, borderRadius: '50%' }}>
                    {profile.avatarUrl.startsWith('data:') ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.fullName}
                        className="w-full h-full object-cover"
                        style={{ width: '100%', height: '100%' }}
                        fetchPriority="high"
                        loading="eager"
                      />
                    ) : (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.fullName}
                        className="w-full h-full object-cover"
                        style={{ width: '100%', height: '100%' }}
                        data-ai-hint={profile.avatarHint || 'person portrait'}
                        fetchPriority="high"
                        loading="eager"
                      />
                    )}
                  </div>
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tighter text-foreground">
                {profile.fullName}
              </h1>
              {/* ── Contact & social row ── */}
              <div className="mt-3 flex flex-wrap justify-center items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                {profile.location && (
                  <span className="inline-flex items-center gap-1.5 cursor-default">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[#E74C3C]" />
                    <span>{profile.location}</span>
                  </span>
                )}
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0 text-[#EA4335]" />
                    <span>{profile.email}</span>
                  </a>
                )}
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0 text-[#25D366]" />
                    <span>{profile.phone}</span>
                  </a>
                )}
                {profile.website && (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted/60 hover:bg-muted transition-colors"
                  >
                    <Globe className="h-4 w-4 text-[#4285F4]" />
                  </a>
                )}
                {profile.github && (
                  <a
                    href={profile.github.startsWith('http') ? profile.github : `https://github.com/${profile.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={profile.github.replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, '').replace(/\/$/, '')}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted/60 hover:bg-muted transition-colors"
                  >
                    <Github className="h-4 w-4 text-[#181717] dark:text-[#f0f6fc]" />
                  </a>
                )}
                {profile.linkedin && (
                  <a
                    href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={profile.linkedin.replace(/^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\//i, '').replace(/\/$/, '')}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted/60 hover:bg-muted transition-colors"
                  >
                    <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                  </a>
                )}
                {/* Additional links (ResearchGate, Google Scholar, Twitter, etc.) */}
                {profile.links?.filter((l: any) => !['email', 'phone', 'location', 'website', 'github', 'linkedin'].includes(l.type)).map((link: any, idx: number) => {
                  const { Icon, color } = getLinkIcon(link.type);
                  const label = link.type.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                  return (
                    <a
                      key={idx}
                      href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={label}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted/60 hover:bg-muted transition-colors"
                    >
                      <Icon className="h-4 w-4" style={{ color }} />
                    </a>
                  );
                })}
              </div>

              {profile.summary && (
                <div className="mt-8 text-left w-full">
                  <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                    {profile.summary}
                  </p>
                </div>
              )}
            </header>

            {(workExperience.length > 0 || education.length > 0 || skills.length > 0 || customSections?.some(s => s.items?.length > 0)) && <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/30 dark:via-indigo-400/30 to-transparent" />}

            {/* ─── EXPERIENCE ─── */}
            {workExperience.length > 0 && (
              <>
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2.5">
                    Experience
                  </h2>
                  <div className="space-y-4">
                    {workExperience.map(job => (
                      <div key={job.id} className="avoid-break relative pl-4 border-l-2 border-indigo-200/70 dark:border-indigo-700/50">
                        {/* Timeline dot */}
                        <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-400/80 dark:bg-indigo-500/80" />
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5">
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">{job.title}</h3>
                            <p className="text-sm text-muted-foreground">{job.company}</p>
                          </div>
                          <span className="text-xs font-medium text-indigo-600/80 dark:text-indigo-400/80 whitespace-nowrap">
                            {job.startDate && job.endDate ? `${job.startDate} — ${job.endDate}` : job.startDate ? `${job.startDate} — Present` : job.endDate || ''}
                          </span>
                        </div>
                        {job.description && (
                          <div className="mt-1.5">
                            <StructuredText text={job.description} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
                {(education.length > 0 || skills.length > 0 || customSections?.some(s => s.items?.length > 0)) && <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/30 dark:via-indigo-400/30 to-transparent" />}
              </>
            )}

            {/* ─── EDUCATION ─── */}
            {education.length > 0 && (
              <>
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2.5">
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
                          <span className="text-xs font-medium text-indigo-600/80 dark:text-indigo-400/80 whitespace-nowrap">
                            {edu.startDate && edu.endDate ? `${edu.startDate} — ${edu.endDate}` : edu.startDate || edu.endDate || ''}
                          </span>
                        </div>
                        {edu.description && (
                          <div className="mt-1.5">
                            <StructuredText text={edu.description} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
                {(skills.length > 0 || customSections?.some(s => s.items?.length > 0)) && <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/30 dark:via-indigo-400/30 to-transparent" />}
              </>
            )}

            {/* ─── SKILLS ─── */}
            {skills.length > 0 && (
              <>
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2.5">
                    Skills
                  </h2>
                  <div className="block" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-block rounded-md border border-indigo-500/20 bg-indigo-50/50 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-950/30 dark:text-indigo-300 text-xs px-2.5 py-1 mb-1.5 mr-1.5"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
                {customSections?.some(s => s.items?.length > 0) && <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/30 dark:via-indigo-400/30 to-transparent" />}
              </>
            )}

            {/* ─── CUSTOM SECTIONS ─── */}
            {customSections?.filter(s => s.items && s.items.length > 0).map((section, idx, filteredArr) => (
              <React.Fragment key={section.id}>
                <section>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2.5">
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
                            <span className="text-xs font-medium text-indigo-600/80 dark:text-indigo-400/80 whitespace-nowrap">{item.date}</span>
                          )}
                        </div>
                        {item.description && (
                          <div className="mt-1.5">
                            <StructuredText text={item.description} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
                {idx < filteredArr.length - 1 && <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/30 dark:via-indigo-400/30 to-transparent" />}
              </React.Fragment>
            ))}

            {/* Footer - branding */}
            <div className="no-print pt-6 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <span className="text-[10px]">✦</span>
                Made with CVin.Bio
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
