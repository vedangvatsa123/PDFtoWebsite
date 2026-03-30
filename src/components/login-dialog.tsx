"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { GoogleIcon } from '@/components/google-icon';
import { friendlyAuthError } from '@/lib/auth-utils';
import { createClient } from '@/utils/supabase/client';
import { Mail } from 'lucide-react';

export function LoginDialog({ trigger }: { trigger?: React.ReactNode } = {}) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

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
    // Reset loading state after 10s if redirect was blocked (popup blocker, etc.)
    setTimeout(() => setIsGoogleLoading(false), 10000);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEmailSent(false);
      setEmail('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <button className="underline hover:text-primary">Sign in</button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="sr-only">Sign In to CVin.Bio</DialogTitle>
        </DialogHeader>

        {emailSent ? (
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
        ) : (
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

            <form onSubmit={handleMagicLink} className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="dialog-email" className="text-xs">Email</Label>
                <Input id="dialog-email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-9" />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send sign-in link'}
              </Button>
            </form>

            <p className="text-xs text-center text-muted-foreground">
              No password needed. We will email you a secure sign-in link.
            </p>

            <p className="text-[11px] text-center text-muted-foreground px-2">
              By signing up, you agree to our <a href="/terms" target="_blank" className="underline hover:text-foreground">terms</a>.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
