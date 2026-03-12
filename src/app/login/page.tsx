import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import LoginForm from './login-form';

export const metadata: Metadata = {
  title: 'Login',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="absolute left-4 top-4">
          <Link href="/" className="flex items-center space-x-2 text-primary hover:underline">
            <Icons.logo className="h-6 w-6" />
          </Link>
        </div>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>Enter your email below to login to your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </Suspense>
  );
}
