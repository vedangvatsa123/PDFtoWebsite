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

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        const signUpRes = await supabase.auth.signUp({ email, password });
        if (signUpRes.error) {
          toast({ variant: 'destructive', title: 'Error', description: friendlyAuthError(signUpRes.error.message) });
        } else {
          toast({ title: 'Account created!', description: 'Welcome to CVinBio.' });
          router.push('/editor');
        }
      } else {
        toast({ variant: 'destructive', title: 'Error', description: friendlyAuthError(error.message) });
      }
    } else {
      toast({ title: 'Welcome back!', description: 'Redirecting to your editor.' });
      router.push('/editor');
    }
    setIsLoading(false);
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/editor` } });
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: friendlyAuthError(error.message) });
        setIsGoogleLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({ variant: 'destructive', title: 'Enter your email first' });
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not send reset email. Check the address.' });
    } else {
      toast({ title: 'Reset email sent', description: 'Check your inbox for a password reset link.' });
    }
  };

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

      <form onSubmit={handleEmailAuth} className="grid gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="email" className="text-xs">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-9" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password" className="text-xs">Password</Label>
          <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-9" />
        </div>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-primary text-left -mt-1"
          onClick={handlePasswordReset}
        >
          Forgot password?
        </button>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Please wait...' : 'Continue'}
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground">
        New users will be registered automatically. Existing users will be signed in.
      </p>
    </div>
  );
}
