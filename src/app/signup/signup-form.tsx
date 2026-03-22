'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { GoogleIcon } from '@/components/google-icon';
import { friendlyAuthError } from '@/lib/auth-utils';
import { useUser } from '@/auth';
import { createClient } from '@/utils/supabase/client';
import { Mail } from 'lucide-react';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const fromParam = searchParams.get('from');
  const fromUpload = fromParam === 'upload';
  const fromManual = fromParam === 'manual';

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/editor');
    }
  }, [user, isUserLoading, router]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/editor`,
      },
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: friendlyAuthError(error.message) });
    } else {
      setEmailSent(true);
    }
    setIsLoading(false);
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback?next=/editor` } });
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: friendlyAuthError(error.message) });
        setIsGoogleLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="grid gap-4 text-center py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <div className="grid gap-1">
          <h3 className="text-lg font-semibold">Check your email</h3>
          <p className="text-sm text-muted-foreground">
            We sent a sign-in link to <span className="font-medium text-foreground">{email}</span>. Click the link in your email to continue.
          </p>
        </div>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
          onClick={() => { setEmailSent(false); setEmail(''); }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {fromUpload && (
        <p className="text-sm text-center text-muted-foreground bg-accent/50 rounded-md p-2">
          Sign in to generate your profile from your resume.
        </p>
      )}
      {fromManual && (
        <p className="text-sm text-center text-muted-foreground bg-accent/50 rounded-md p-2">
          Sign in to build your profile and get a shareable link.
        </p>
      )}

      <Button variant="outline" className="w-full" onClick={handleGoogleAuth} disabled={isGoogleLoading}>
        {isGoogleLoading ? <Icons.logo className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or use email</span>
        </div>
      </div>

      <form onSubmit={handleMagicLink} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="email" className="text-xs">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-9" />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Secure Link'}
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground mt-2">
        No password needed. We&apos;ll email you a secure link to log in instantly.
      </p>
    </div>
  );
}
