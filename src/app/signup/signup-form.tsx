'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, GoogleAuthProvider, fetchSignInMethodsForEmail } from 'firebase/auth';
import { Icons } from '@/components/icons';
import { useUser, useAuth } from '@/firebase';

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 72.2C321.7 105.3 287.4 88 248 88c-86.9 0-158.3 70.2-158.3 156s71.4 156 158.3 156c97.2 0 133-66.8 137.9-96.8H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.1z" />
  </svg>
);

function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect password. Please try again.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const fromParam = searchParams.get('from');
  const fromUpload = fromParam === 'upload';
  const fromManual = fromParam === 'manual';

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/editor');
    }
  }, [user, isUserLoading, router]);

  // Smart auth: try sign-in first, auto-create if user doesn't exist
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Try signing in first
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Welcome back!', description: 'Redirecting to your editor.' });
      router.push('/editor');
    } catch (signInError: any) {
      // If user doesn't exist, create account automatically
      if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          toast({ title: 'Account created!', description: 'Welcome to CVinBio. Redirecting to your editor.' });
          router.push('/editor');
        } catch (signUpError: any) {
          // If creation fails with email-already-in-use, it means wrong password
          if (signUpError.code === 'auth/email-already-in-use') {
            toast({ variant: 'destructive', title: 'Incorrect password', description: 'An account with this email exists. Please check your password.' });
          } else {
            toast({ variant: 'destructive', title: 'Error', description: friendlyAuthError(signUpError.code) });
          }
        }
      } else {
        toast({ variant: 'destructive', title: 'Error', description: friendlyAuthError(signInError.code) });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/editor');
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, provider);
        } catch (redirectError: any) {
          toast({ variant: 'destructive', title: 'Error', description: friendlyAuthError(redirectError.code) });
          setIsGoogleLoading(false);
        }
      } else {
        toast({ variant: 'destructive', title: 'Error', description: friendlyAuthError(error.code) });
        setIsGoogleLoading(false);
      }
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
