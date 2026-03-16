import type { Metadata } from 'next';
import Header from '@/components/header';

export const metadata: Metadata = {
  title: 'Terms of Service',
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">Terms of Service</h1>
        <div className="prose prose-sm dark:prose-invert space-y-4 text-sm text-muted-foreground">
          <p><strong>Last updated:</strong> March 2026</p>

          <h2 className="text-base font-semibold text-foreground">Acceptance</h2>
          <p>By using CVinBio, you agree to these terms. If you don't agree, please don't use the service.</p>

          <h2 className="text-base font-semibold text-foreground">The service</h2>
          <p>CVinBio lets you create a public professional profile from your resume. Profiles are publicly accessible via a unique URL. You are responsible for the accuracy of the information you provide.</p>

          <h2 className="text-base font-semibold text-foreground">Your content</h2>
          <p>You retain ownership of all content you upload. By publishing a profile, you grant CVinBio a license to display that content publicly on your profile page. You can revoke this at any time by deleting your profile.</p>

          <h2 className="text-base font-semibold text-foreground">Acceptable use</h2>
          <p>Do not use CVinBio to publish misleading, defamatory, or illegal content. We reserve the right to remove profiles that violate these terms.</p>

          <h2 className="text-base font-semibold text-foreground">Account termination</h2>
          <p>You can delete your account at any time. We may also terminate accounts that violate these terms. Upon deletion, all your data is permanently removed.</p>

          <h2 className="text-base font-semibold text-foreground">Limitation of liability</h2>
          <p>CVinBio is provided "as is" without warranties. We are not liable for any damages arising from your use of the service.</p>

          <h2 className="text-base font-semibold text-foreground">Changes</h2>
          <p>We may update these terms. Continued use after changes constitutes acceptance.</p>
        </div>
      </main>
    </div>
  );
}
