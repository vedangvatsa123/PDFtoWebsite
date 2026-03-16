import type { Metadata } from 'next';
import Header from '@/components/header';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose prose-sm dark:prose-invert space-y-4 text-sm text-muted-foreground">
          <p><strong>Last updated:</strong> March 2026</p>

          <h2 className="text-base font-semibold text-foreground">What we collect</h2>
          <p>When you create a CVinBio profile, we store the information you provide — your name, email, work history, education, and skills. If you upload a PDF resume, we parse it to extract this information.</p>

          <h2 className="text-base font-semibold text-foreground">How we use it</h2>
          <p>Your data is used solely to generate and display your public profile page. We track anonymous view counts on profiles for analytics shown in your dashboard. We do not sell or share your personal data with third parties.</p>

          <h2 className="text-base font-semibold text-foreground">Authentication</h2>
          <p>We use Firebase Authentication (Google or email/password). We do not store your password — it is handled securely by Google Firebase.</p>

          <h2 className="text-base font-semibold text-foreground">Data storage</h2>
          <p>Your profile data is stored in Google Cloud Firestore. Profile photos are stored in Firebase Storage. All data is encrypted in transit and at rest.</p>

          <h2 className="text-base font-semibold text-foreground">Your rights</h2>
          <p>You can delete your account and all associated data at any time from the Editor page. This permanently removes your profile, work history, education, skills, and view analytics.</p>

          <h2 className="text-base font-semibold text-foreground">Cookies</h2>
          <p>We use essential cookies for authentication only. We do not use tracking or advertising cookies.</p>

          <h2 className="text-base font-semibold text-foreground">Contact</h2>
          <p>For privacy questions, reach out via the contact details on our website.</p>
        </div>
      </main>
    </div>
  );
}
