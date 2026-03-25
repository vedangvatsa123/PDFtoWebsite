import type { Metadata } from 'next';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';

export const metadata: Metadata = {
  title: 'Privacy Policy - CVin.Bio',
  description: 'Detailed information regarding how CVin.Bio collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-extrabold mb-8 tracking-tight text-foreground">Privacy Policy</h1>
        <div className="prose prose-base dark:prose-invert space-y-8 text-muted-foreground">
          <p className="text-sm"><strong>Last updated:</strong> March 2026</p>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Introduction</h2>
            <p>
              Welcome to CVin.Bio ("we", "our", or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website and in using our services. This Privacy Policy outlines our practices regarding the collection, use, and disclosure of your information when you use the CVin.Bio website and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Information We May Collect</h2>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Personal Information:</strong> When you register an account, we may collect identifiable information such as your name, email address, and authentication data provided by third-party identity providers.</li>
              <li><strong>Resume and Profile Data:</strong> To help generate your personal website, we may collect information contained within the resumes or CVs you upload. This can include your employment history, educational background, skills, and profile photos.</li>
              <li><strong>Usage Data:</strong> We might collect automatic information about how you interact with our platform, including IP addresses, browser types, and page views, to help us understand use patterns and improve our service.</li>
              <li><strong>Cookies and Tracking:</strong> We may use cookies to help maintain your session and authentication status. We strive to avoid employing invasive third-party tracking cookies where possible.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. How We May Use Your Information</h2>
            <p>We may use the collected information for various purposes, which can include:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>To help provide, operate, and maintain the CVin.Bio service.</li>
              <li>To help parse and generate your public-facing professional profile.</li>
              <li>To process authentication via our partners.</li>
              <li>To help track profile and page view analytics to display on your dashboard.</li>
              <li>To improve, personalize, and expand our platform functionalities.</li>
              <li>To communicate with you regarding updates, security alerts, support messages, and occasional promotional offers or marketing insights that may be relevant to your professional growth.</li>
              <li><strong>Showcase & Promotion:</strong> We may feature your public profile, profile link, or selected content in our marketing materials, website showcases, testimonials, and social media channels. This can help both the platform grow and provide your professional brand with increased visibility. You can always opt out by deleting your account at any time.</li>
              <li><strong>Platform Evolution & Innovation:</strong> We may occasionally utilize aggregated or profile insights to help us build new tools, develop features, identify industry trends, or explore new business models as our platform evolves. We are always striving to continuously adapt to the needs of the modern workforce.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Information Sharing and Disclosure</h2>
            <p>
              CVin.Bio is designed to try and help you proactively grow your career. To do this, we may offer features that can match your public profile data with relevant recruiters and exciting job opportunities.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Recruiters and Partners:</strong> We may use this sharing capability to try and benefit your career, and you always retain autonomous control. If you decide you no longer want to participate in this network, you can opt-out by permanently deleting your account and associated professional data. We aim to never sell your personal contact data to bulk marketing lists.</li>
              <li><strong>Service Providers:</strong> We may use third-party cloud infrastructure like Supabase and Vercel to help run the website and process data securely.</li>
              <li><strong>Legal Requirements:</strong> If requested by valid legal process, we may occasionally need to disclose information to authorized public authorities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Data Security & Storage</h2>
            <p>
              Security is highly important to us. Your public profile data is stored in a secure Supabase PostgreSQL database and any media is hosted on Supabase Storage. All data is encrypted both in transit (using HTTPS/TLS) and at rest. Authentication securely avoids password storage by utilizing Supabase's robust identity platform. While we strive to use commercially acceptable means to protect your data, remember that no method of transmission over the internet or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Your Data Autonomy</h2>
            <p>
              We firmly believe in building a platform that respects your privacy and ownership. We try to give you as much autonomous control over your public footprint as possible. From your account Editor dashboard, you can generally:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Access and Modify:</strong> You can edit your work history, skills, links, and personal information whenever you wish.</li>
              <li><strong>Right to Erasure (Deletion):</strong> You can permanently delete your account autonomously. This action instantly removes your profile from our active databases, ensuring your data is forgotten.</li>
              <li><strong>Withdraw Consent:</strong> Because you control your public link, you can unpublish or delete your profile at any time to withdraw it from public view.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We advise you to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at{' '}
              <a href="mailto:hi@cvin.bio" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-500 transition-colors">hi@cvin.bio</a>.
            </p>
          </section>
        </div>
      </main>
      <MicroFooter />
    </div>
  );
}
