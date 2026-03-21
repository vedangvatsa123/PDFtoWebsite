import type { Metadata } from 'next';
import Header from '@/components/header';

export const metadata: Metadata = {
  title: 'Privacy Policy - CVinBio',
  description: 'Detailed information regarding how CVinBio collects, uses, and protects your data.',
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
              Welcome to CVinBio ("we", "our", or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our website and in using our services. This Privacy Policy outlines our practices regarding the collection, use, and disclosure of your information when you use the CVinBio website and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Personal Information:</strong> When you register an account, we may collect identifiable information such as your name, email address, and authentication data provided by Google or other third-party identity providers.</li>
              <li><strong>Resume and Profile Data:</strong> To generate your personal website, we collect information contained within the resumes or CVs you upload (e.g., PDFs), or information you explicitly enter into our Editor. This includes your employment history, educational background, skills, and profile photo.</li>
              <li><strong>Usage Data:</strong> We may collect automatic information about how you interact with our platform, including IP addresses, browser types, operating systems, and page views, to help us understand use patterns and improve our service.</li>
              <li><strong>Cookies and Tracking:</strong> We use essential cookies strictly to maintain your session and authentication status. We do not employ invasive third-party tracking or advertising cookies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. How We Use Your Information</h2>
            <p>We use the collected information for various purposes, including:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>To provide, operate, and maintain the CVinBio service.</li>
              <li>To automatically parse and generate your public-facing professional profile.</li>
              <li>To process authentication securely via Supabase.</li>
              <li>To track profile and page view analytics to display on your personal dashboard.</li>
              <li>To improve, personalize, and expand our platform functionalities.</li>
              <li>To communicate with you regarding updates, security alerts, and support messages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Information Sharing and Disclosure</h2>
            <p>
              A big part of CVinBio is helping you get noticed! Because of this, we might share your public profile data, resume details, and contact info with recruiters, potential employers, or other groups we think might be relevant to your career.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Recruiters and Partners:</strong> We actively try to get your profile in front of people who are hiring. We may provide your data directly to these third parties to help you land your next gig.</li>
              <li><strong>Service Providers:</strong> We use trusted third-party services (like Google Cloud and Supabase) to run the website. They strictly help us securely store and manage your data.</li>
              <li><strong>Legal Requirements:</strong> If the law requires it, we may need to hand over certain information to public authorities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Data Security & Storage</h2>
            <p>
              Security is highly important to us. Your public profile data is stored in Google Cloud Postgres and images are hosted on Supabase Storage. All data is encrypted both in transit (using HTTPS/TLS) and at rest. Authentication securely avoids password storage by utilizing Supabase's robust identity platform. While we strive to use commercially acceptable means to protect your data, remember that no method of transmission over the internet or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Your Data Rights</h2>
            <p>
              You have complete control over your profile data. From your account Editor dashboard, you retain the ability to:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Access and Update:</strong> Modify your work history, skills, links, and personal information at any time.</li>
              <li><strong>Delete:</strong> Permanently delete your account. This action instantly removes your profile from our active databases, including parsed resume data and view analytics.</li>
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
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at our official support email.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
