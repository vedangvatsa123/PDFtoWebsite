'use client';

import { useEffect, useState } from 'react';
import TemplateModern from '@/app/[slug]/templates/modern-creative';
import type { ServerProfileData } from '@/lib/supabase-server';

export default function PreviewPage() {
  const [data, setData] = useState<ServerProfileData | null>(null);

  useEffect(() => {
    // Read draft data from sessionStorage
    const raw = sessionStorage.getItem('parsedResume');
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      const pi = parsed.personalInfo || {};

      // Build links
      const links: any[] = [];
      if (pi.github) links.push({ label: 'GitHub', url: pi.github.startsWith('http') ? pi.github : `https://${pi.github}` });
      if (pi.linkedin) links.push({ label: 'LinkedIn', url: pi.linkedin.startsWith('http') ? pi.linkedin : `https://${pi.linkedin}` });
      if (parsed.otherLinks) {
        for (const link of parsed.otherLinks) {
          if (link.url && link.url !== 'https://...') links.push({ label: link.label || 'Link', url: link.url });
        }
      }

      const previewData: ServerProfileData = {
        profile: {
          userId: 'draft',
          fullName: pi.fullName || 'Your Name',
          slug: 'preview',
          email: pi.email || undefined,
          phone: pi.phone || undefined,
          location: pi.location || undefined,
          summary: parsed.summary || '',
          themeId: 'modern-creative',
          avatarUrl: parsed.personalInfo?.avatarUrl || parsed.avatarUrl || '',
          avatarHint: 'person portrait',
          website: pi.website || undefined,
          viewCount: 0,
          skills: (parsed.skills || []).map((s: any) => s.name || s),
          links: links,
        },
        workExperience: (parsed.workExperience || []).map((w: any, i: number) => ({
          id: String(i),
          title: w.title || '',
          company: w.company || '',
          startDate: w.startDate || '',
          endDate: w.endDate || '',
          description: Array.isArray(w.description) ? w.description.join('\n') : (w.description || ''),
        })),
        education: (parsed.education || []).map((e: any, i: number) => ({
          id: String(i),
          institution: e.institution || '',
          degree: e.degree || (e.fieldOfStudy ? `${e.degree || ''} ${e.fieldOfStudy}`.trim() : ''),
          startDate: e.startDate || '',
          endDate: e.endDate || '',
          description: e.description || '',
        })),
        customSections: (parsed.customSections || []).map((s: any) => ({
          id: s.id || String(Math.random()),
          sectionTitle: s.sectionTitle || '',
          order: s.order || 0,
          items: (s.items || []).map((item: any) => ({
            id: item.id || String(Math.random()),
            title: item.title || '',
            subtitle: item.subtitle || '',
            description: item.description || '',
            date: item.date || '',
          })),
        })),
      };

      setData(previewData);
    } catch (e) {
      console.error('Failed to load preview data:', e);
    }
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-semibold text-foreground">No Preview Available</h1>
          <p className="text-sm text-muted-foreground">Upload a CV in the editor first to see a preview.</p>
          <a href="/editor" className="text-sm text-primary hover:underline">← Back to Editor</a>
        </div>
      </div>
    );
  }

  return <TemplateModern {...data} />;
}
