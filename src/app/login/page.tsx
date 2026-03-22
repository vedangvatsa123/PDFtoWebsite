import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | CVin.Bio',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  redirect('/signup');
}
