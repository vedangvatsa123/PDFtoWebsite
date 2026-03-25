"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

import TemplateModern from './templates/modern-creative';
import type { ServerProfileData } from '@/lib/supabase-server';
import { createClient } from '@/utils/supabase/client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Trophy } from 'lucide-react';
import { LINKEDIN_CAPTIONS, X_COPIES, WHATSAPP_COPIES, pick } from '@/lib/share-copy';
import posthog from 'posthog-js';
import { PROFILE_EVENTS } from '@/lib/posthog-events';

interface Props {
  data: ServerProfileData;
  slug: string;
}

/** Mirrors the editor's Job Readiness Score exactly — all 6 must pass (100%) */
function isProfileComplete(data: ServerProfileData): boolean {
  const { profile, workExperience, education } = data;
  const skills: string[] = profile.skills || [];

  const hasPhoto    = !!profile.avatarUrl && !profile.avatarUrl.includes('picsum.photos');
  const hasSummary  = !!profile.summary?.trim();
  const hasLocation = !!profile.location?.trim();
  const hasWork     = workExperience.some(w =>
    w.title?.trim() || w.company?.trim() || w.description?.trim()
  );
  const hasEdu      = education.some(e =>
    e.institution?.trim() || e.degree?.trim()
  );
  const hasSkills   = skills.some(s => (typeof s === 'string' ? s.trim() : s) !== '');

  return hasPhoto && hasSummary && hasLocation && hasWork && hasEdu && hasSkills;
}


export default function ProfilePageClient({ data, slug }: Props) {
  const { toast } = useToast();
  const [showCelebration, setShowCelebration] = useState(false);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [copiedLinkedIn, setCopiedLinkedIn] = useState('');
  const [copiedX, setCopiedX] = useState('');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState('');

  // Record view with rich context
  useEffect(() => {
    const startTime = Date.now();
    posthog.capture(PROFILE_EVENTS.VIEWED, {
      slug,
      has_photo: !!data.profile.avatarUrl && !data.profile.avatarUrl.includes('picsum.photos'),
      has_work: (data.workExperience?.length || 0) > 0,
      has_education: (data.education?.length || 0) > 0,
      skill_count: (data.profile.skills?.length || 0),
      has_summary: !!(data.profile.summary?.trim()),
      work_count: data.workExperience?.length || 0,
      is_complete: isProfileComplete(data),
    });
    fetch(`/api/views/${slug}`, { method: 'POST' }).catch(console.error);

    // Track time on page when leaving
    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      posthog.capture(PROFILE_EVENTS.TIME_SPENT, { slug, seconds: timeSpent });
    };
  }, [slug, data]);

  // Check: owner + profile complete + first visit → celebrate
  useEffect(() => {
    if (localStorage.getItem('cvibio_celebrated')) return;
    if (!isProfileComplete(data)) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: authData }) => {
      if (!authData?.user) return;
      if (authData.user.id !== data.profile.userId) return;

      // All conditions met — fire!
      localStorage.setItem('cvibio_celebrated', '1');
      setCopiedLinkedIn(pick(LINKEDIN_CAPTIONS)(slug));
      setCopiedX(pick(X_COPIES)(slug));
      setCopiedWhatsApp(pick(WHATSAPP_COPIES)(slug));
      posthog.capture(PROFILE_EVENTS.CELEBRATION_SHOWN, { slug });
      setShowCelebration(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate 9:16 story card when celebration opens
  useEffect(() => {
    if (!showCelebration) return;
    setCardDataUrl(null);

    const generateCard = async () => {
      const W = 1080, H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // roundRect polyfill for older browsers
      const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };

      // — Guaranteed solid dark background first (canvas default is transparent)
      ctx.fillStyle = '#0f0d2e';
      ctx.fillRect(0, 0, W, H);
      // — Gradient overlay
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#0f0d2e');
      grad.addColorStop(0.45, '#2d2b7a');
      grad.addColorStop(1, '#3b1f6e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // — Subtle dot grid
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let x = 80; x < W; x += 90) for (let y = 80; y < H; y += 90) {
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      }

      try { await document.fonts.load('bold 96px Inter'); await document.fonts.load('500 44px Inter'); } catch (_) {}
      const font = document.fonts.check('bold 96px Inter') ? 'Inter' : '-apple-system,BlinkMacSystemFont,sans-serif';

      // — Top branding
      ctx.fillStyle = 'rgba(165,180,252,0.8)';
      ctx.font = `500 46px ${font}`; ctx.textAlign = 'center';
      ctx.fillText('CVin.Bio', W / 2, 180);
      ctx.strokeStyle = 'rgba(129,140,248,0.3)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(240, 220); ctx.lineTo(840, 220); ctx.stroke();

      // — Photo via same-origin proxy (avoids canvas CORS taint)
      const hasPhoto = !!data.profile.avatarUrl && !data.profile.avatarUrl.includes('picsum.photos');
      const photoRadius = 170;
      const photoCY = 620;
      const nameCY = hasPhoto ? 880 : 760;

      if (hasPhoto) {
        await new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            const cx = W / 2;
            ctx.save();
            ctx.shadowColor = 'rgba(129,140,248,0.7)'; ctx.shadowBlur = 50;
            ctx.beginPath(); ctx.arc(cx, photoCY, photoRadius + 8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(99,102,241,0.25)'; ctx.fill(); ctx.restore();
            ctx.beginPath(); ctx.arc(cx, photoCY, photoRadius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(165,180,252,0.7)'; ctx.lineWidth = 4; ctx.stroke();
            ctx.save();
            ctx.beginPath(); ctx.arc(cx, photoCY, photoRadius, 0, Math.PI * 2); ctx.clip();
            ctx.drawImage(img, cx - photoRadius, photoCY - photoRadius, photoRadius * 2, photoRadius * 2);
            ctx.restore();
            resolve();
          };
          img.onerror = () => resolve();
          // Use same-origin proxy — avoids CORS taint entirely
          img.src = `/api/avatar/${slug}`;
        });
      }

      // — Name
      const name = data.profile.fullName || '';
      ctx.fillStyle = 'rgba(255,255,255,0.97)';
      let nameFSize = 108;
      ctx.font = `bold ${nameFSize}px ${font}`;
      while (ctx.measureText(name).width > 920 && nameFSize > 56) { nameFSize -= 4; ctx.font = `bold ${nameFSize}px ${font}`; }
      ctx.fillText(name, W / 2, nameCY);

      // — Role (first job title if available, otherwise location)
      const role = data.workExperience?.[0]
        ? `${data.workExperience[0].title} · ${data.workExperience[0].company}`
        : data.profile.location || '';
      if (role) {
        ctx.fillStyle = 'rgba(199,210,254,0.7)';
        ctx.font = `400 48px ${font}`;
        let roleFSize = 48;
        while (ctx.measureText(role).width > 900 && roleFSize > 32) { roleFSize -= 2; ctx.font = `400 ${roleFSize}px ${font}`; }
        ctx.fillText(role, W / 2, nameCY + 72);
      }

      // — URL pill
      const pillY = nameCY + (role ? 160 : 100);
      ctx.fillStyle = 'rgba(99,102,241,0.2)';
      ctx.strokeStyle = 'rgba(165,180,252,0.4)'; ctx.lineWidth = 2;
      roundRect(120, pillY, 840, 130, 28); ctx.fill(); ctx.stroke();
      const urlText = `cvin.bio/${slug}`;
      let urlFSize = 76; ctx.font = `bold ${urlFSize}px ${font}`;
      while (ctx.measureText(urlText).width > 780 && urlFSize > 44) { urlFSize -= 4; ctx.font = `bold ${urlFSize}px ${font}`; }
      ctx.fillStyle = 'white';
      ctx.fillText(urlText, W / 2, pillY + 82);

      try { setCardDataUrl(canvas.toDataURL('image/png')); } catch (e) { console.error('Story card export error', e); }
    };


    const timer = setTimeout(() => generateCard().catch(e => console.error('Story card error', e)), 200);
    return () => clearTimeout(timer);
  }, [showCelebration, slug, data.profile.fullName, data.profile.avatarUrl]);

  return (
    <>
      <TemplateModern {...data} />

      {/* 🏆 First-visit Celebration Dialog */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="max-w-md text-center max-h-[90vh] overflow-y-auto p-0 overflow-hidden">
          <DialogTitle className="sr-only">Your profile is live!</DialogTitle>
          {/* Indigo accent bar at top */}
          <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />
          <div className="flex flex-col items-center gap-4 px-6 py-5">
            {/* Trophy icon badge */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl scale-150" />
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                <Trophy className="h-8 w-8 text-white" strokeWidth={1.75} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">It's live. Now get it seen.</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">Most jobs come through someone who knew you were looking. Every share puts you in front of that person.</p>
            </div>
            {/* URL pill */}
            <div className="w-full bg-secondary rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
              <span className="text-sm font-mono truncate text-foreground">cvin.bio/{slug}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(`https://cvin.bio/${slug}`); posthog.capture(PROFILE_EVENTS.SHARE_LINK_COPIED, { slug, source: 'celebration' }); toast({ title: 'Copied!' }); }}
                className="shrink-0 text-xs text-primary font-semibold hover:text-primary/80 transition-colors"
              >
                Copy
              </button>
            </div>
            {/* 2×2 social grid */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(copiedLinkedIn);
                  posthog.capture(PROFILE_EVENTS.SHARE_LINKEDIN, { slug });
                  toast({ title: 'Caption copied!', description: 'Paste it into your LinkedIn post.' });
                  setTimeout(() => window.open('https://www.linkedin.com/feed/', '_blank'), 300);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#0A66C2] text-[#0A66C2] text-sm font-semibold py-2.5 hover:bg-[#0A66C2]/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </button>
              <button
                onClick={() => { posthog.capture(PROFILE_EVENTS.SHARE_X, { slug }); window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(copiedX)}`, '_blank'); }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-foreground/30 text-foreground text-sm font-semibold py-2.5 hover:bg-foreground/5 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                X
              </button>
              <button
                onClick={() => { posthog.capture(PROFILE_EVENTS.SHARE_FACEBOOK, { slug }); window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://cvin.bio/${slug}`)}`, '_blank'); }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1877F2] text-[#1877F2] text-sm font-semibold py-2.5 hover:bg-[#1877F2]/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </button>
              <button
                onClick={() => { posthog.capture(PROFILE_EVENTS.SHARE_WHATSAPP, { slug }); window.open(`https://wa.me/?text=${encodeURIComponent(copiedWhatsApp)}`, '_blank'); }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#25D366] text-[#25D366] text-sm font-semibold py-2.5 hover:bg-[#25D366]/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </button>
            </div>
            {/* Story card */}
            <div className="w-full flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Story Card</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            {cardDataUrl ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <img src={cardDataUrl} alt="Story card preview" className="w-24 rounded-xl shadow-lg border border-border" />
                <a
                  href={cardDataUrl}
                  download={`cvin-${slug}.png`}
                  onClick={() => posthog.capture(PROFILE_EVENTS.STORY_CARD_DOWNLOADED, { slug })}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  ↓ Download story card
                </a>
                <p className="text-[11px] text-muted-foreground">Drop it on <span className="font-medium">Instagram</span> · <span className="font-medium">WhatsApp</span> · <span className="font-medium">TikTok</span> stories</p>
              </div>
            ) : (
              <div className="w-16 aspect-[9/16] rounded-xl bg-muted animate-pulse" />
            )}
            <Link href={`/${slug}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
              Close and view profile →
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
