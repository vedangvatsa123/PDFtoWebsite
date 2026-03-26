'use client';

import { useState } from 'react';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';

const PURPOSE_OPTIONS = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'support', label: 'Support' },
  { value: 'bug-report', label: 'Bug Report' },
  { value: 'feature-request', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
];

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) { setError('Please enter a valid email.'); return; }
    if (!purpose) { setError('Please select a purpose.'); return; }
    if (!message || message.trim().length < 10) { setError('Message must be at least 10 characters.'); return; }

    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose, message }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      setSent(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {sent ? (
            <div className="text-center space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Message Sent</h1>
              <p className="text-sm text-muted-foreground">
                Thank you for reaching out. We&apos;ll get back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Contact Us</h1>
                <p className="text-sm text-muted-foreground">
                  We&apos;d love to hear from you. Fill out the form below.
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="contact-email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-10"
                />
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Purpose</label>
                <div className="flex flex-wrap gap-2">
                  {PURPOSE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPurpose(opt.value)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200
                        ${purpose === opt.value
                          ? 'border-foreground bg-foreground text-background shadow-sm scale-[1.02]'
                          : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label htmlFor="contact-message" className="text-sm font-medium">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  placeholder="Tell us what's on your mind..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  maxLength={5000}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none transition-colors"
                />
                <p className="text-[11px] text-muted-foreground/50 text-right">
                  {message.length}/5000
                </p>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-destructive font-medium animate-in fade-in-0 duration-200">
                  {error}
                </p>
              )}

              {/* Submit */}
              <Button type="submit" className="w-full h-10" disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>

              <p className="text-[11px] text-muted-foreground/50 text-center">
                You can also email us directly at{' '}
                <a href="mailto:hi@cvin.bio" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
                  hi@cvin.bio
                </a>
              </p>
            </form>
          )}

        </div>
      </main>
      <MicroFooter />
    </div>
  );
}
