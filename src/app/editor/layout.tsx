import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Editor — Build Your Profile',
  description: 'Build and customize your professional profile on CVinBio. Add your experience, education, skills, and more to create a beautiful, shareable CV website.',
  robots: { index: false, follow: false },
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
