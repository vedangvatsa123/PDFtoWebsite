"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { Icons } from '@/components/icons';
import { useAuth } from '@/firebase';

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

export function LoginDialog({ trigger }: { trigger?: React.ReactNode } = {}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  // Smart auth: try sign-in first, auto-create if user doesn't exist
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Welcome back!', description: 'Redirecting to editor.' });
      setOpen(false);
      router.push('/editor');
    } catch (signInError: any) {
      if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          toast({ title: 'Account created!', description: 'Welcome to CVinBio.' });
          setOpen(false);
          router.push('/editor');
        } catch (signUpError: any) {
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
      setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <button className="underline hover:text-primary">Sign in</button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to CVinBio</DialogTitle>
          <DialogDescription>Enter your details to continue. New accounts are created automatically.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
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
              <Label htmlFor="dialog-email" className="text-xs">Email</Label>
              <Input id="dialog-email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-9" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="dialog-password" className="text-xs">Password</Label>
              <Input id="dialog-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-9" />
            </div>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-primary text-left -mt-1"
              onClick={async () => {
                if (!email) { toast({ variant: 'destructive', title: 'Enter your email first' }); return; }
                const { sendPasswordResetEmail } = await import('firebase/auth');
                try {
                  await sendPasswordResetEmail(auth, email);
                  toast({ title: 'Reset email sent', description: 'Check your inbox for a password reset link.' });
                } catch { toast({ variant: 'destructive', title: 'Error', description: 'Could not send reset email. Check the address.' }); }
              }}
            >
              Forgot password?
            </button>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Please wait...' : 'Continue'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
