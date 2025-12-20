
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Icons } from '@/components/icons';
import { useUser } from '@/firebase';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
        router.push('/editor');
    }
  },[user, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Login Successful',
        description: "Welcome back! We're redirecting you to the editor.",
      });
      router.push('/editor');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    
    signInWithPopup(auth, provider)
      .then(() => {
        toast({
            title: 'Login Successful',
            description: "Welcome! We're redirecting you to the editor.",
        });
        router.push('/editor');
      })
      .catch((error: any) => {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message,
        });
      })
      .finally(() => {
        setIsGoogleLoading(false);
      });
  };

  return (
    <div className="grid gap-4">
    <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
        {isGoogleLoading ? (
        <Icons.logo className="mr-2 h-4 w-4 animate-spin" />
        ) : (
            // A simple Google icon SVG
            <svg className="mr-2 h-4 w-4" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 72.2C321.7 105.3 287.4 88 248 88c-86.9 0-158.3 70.2-158.3 156s71.4 156 158.3 156c97.2 0 133-66.8 137.9-96.8H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.1z"></path></svg>
        )}
        Sign in with Google
    </Button>
    <div className="relative">
        <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
            Or continue with
            </span>
        </div>
    </div>
    <form onSubmit={handleLogin} className="grid gap-4">
        <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
        </div>
        <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input 
            id="password" 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login with Email'}
        </Button>
    </form>
    <div className="mt-4 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="underline">
        Sign up
        </Link>
    </div>
  </div>
  )
}
