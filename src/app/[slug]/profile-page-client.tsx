"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import TemplateModern from './templates/modern-creative';
import type { ServerProfileData } from '@/lib/supabase-server';
import { createClient } from '@/utils/supabase/client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { LINKEDIN_CAPTIONS, X_COPIES, WHATSAPP_COPIES, pick } from '@/lib/share-copy';

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

  // Record view
  useEffect(() => {
    fetch(`/api/views/${slug}`, { method: 'POST' }).catch(console.error);
  }, [slug]);

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
      setShowCelebration(true);
      confetti({ particleCount: 160, spread: 70, origin: { y: 0.6 } });
      setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 100, origin: { y: 0.55 } }), 350);
      setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 100, origin: { y: 0.55 } }), 600);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generate 9:16 story card when celebration opens
  useEffect(() => {
    if (!showCelebration) return;
    setCardDataUrl(null);
    const name = data.profile.fullName || '';
    const timer = setTimeout(() => {
      try {
        const W = 1080, H = 1920;
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext('2d')!;
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#1e1b4b');
        grad.addColorStop(0.5, '#3730a3');
        grad.addColorStop(1, '#4c1d95');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.045)';
        for (let x = 72; x < W; x += 90) for (let y = 72; y < H; y += 90) {
          ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = 'rgba(199,210,254,0.75)';
        ctx.font = '500 44px -apple-system,BlinkMacSystemFont,sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CVin.Bio', W / 2, 210);
        ctx.strokeStyle = 'rgba(165,180,252,0.3)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(220, 255); ctx.lineTo(860, 255); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.97)';
        let fs = 108;
        ctx.font = `bold ${fs}px -apple-system,BlinkMacSystemFont,sans-serif`;
        while (ctx.measureText(name).width > 900 && fs > 52) { fs -= 4; ctx.font = `bold ${fs}px -apple-system,BlinkMacSystemFont,sans-serif`; }
        ctx.fillText(name, W / 2, 890);
        ctx.fillStyle = 'rgba(199,210,254,0.88)';
        ctx.font = '54px -apple-system,BlinkMacSystemFont,sans-serif';
        ctx.fillText('pdf is dead.', W / 2, 1010);
        ctx.fillText("here's my link ↓", W / 2, 1082);
        const urlText = `cvin.bio/${slug}`;
        let ufs = 72;
        ctx.font = `bold ${ufs}px -apple-system,BlinkMacSystemFont,sans-serif`;
        while (ctx.measureText(urlText).width > 780 && ufs > 44) { ufs -= 4; ctx.font = `bold ${ufs}px -apple-system,BlinkMacSystemFont,sans-serif`; }
        ctx.fillStyle = 'rgba(255,255,255,0.13)';
        ctx.beginPath(); ctx.roundRect(130, 1210, 820, 130, 22); ctx.fill();
        ctx.fillStyle = 'white';
        ctx.fillText(urlText, W / 2, 1290);
        ctx.fillStyle = 'rgba(165,180,252,0.5)';
        ctx.font = '40px -apple-system,BlinkMacSystemFont,sans-serif';
        ctx.fillText('Scan · Click · Connect', W / 2, 1770);
        setCardDataUrl(canvas.toDataURL('image/png'));
      } catch (e) { console.error('Story card error', e); }
    }, 150);
    return () => clearTimeout(timer);
  }, [showCelebration, slug, data.profile.fullName]);

  return (
    <>
      <TemplateModern {...data} />

      {/* 🎉 First-visit Celebration Dialog */}
      <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
        <DialogContent className="max-w-md text-center max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Your profile is live!</DialogTitle>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="text-5xl">🎉</div>
            <div>
              <h2 className="text-xl font-bold">PDF is dead. You've got a link.</h2>
              <p className="text-sm text-muted-foreground mt-1">Drop it anywhere. No attachment, no version confusion.</p>
            </div>
            {/* URL pill */}
            <div className="w-full bg-secondary rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
              <span className="text-sm font-mono truncate text-foreground">cvin.bio/{slug}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(`https://cvin.bio/${slug}`); toast({ title: 'Copied!' }); }}
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
                  toast({ title: 'Caption copied!', description: 'Paste it into your LinkedIn post.' });
                  setTimeout(() => window.open('https://www.linkedin.com/feed/', '_blank'), 300);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#0A66C2] text-[#0A66C2] text-sm font-semibold py-2.5 hover:bg-[#0A66C2]/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn
              </button>
              <button
                onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(copiedX)}`, '_blank')}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-foreground/30 text-foreground text-sm font-semibold py-2.5 hover:bg-foreground/5 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                X
              </button>
              <button
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://cvin.bio/${slug}`)}`, '_blank')}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#1877F2] text-[#1877F2] text-sm font-semibold py-2.5 hover:bg-[#1877F2]/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </button>
              <button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(copiedWhatsApp)}`, '_blank')}
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
