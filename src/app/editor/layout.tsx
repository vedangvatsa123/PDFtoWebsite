import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Editor | Build Your Profile',
  description: 'Build your digital CV on CVin.Bio. Use AI to parse your PDF CV, edit your work experience, and publish your professional portfolio website.',
  robots: { index: false, follow: false },
};

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
