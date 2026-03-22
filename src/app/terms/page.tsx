import type { Metadata } from 'next';
import Header from '@/components/header';

export const metadata: Metadata = {
  title: 'Terms of Service - CVin.Bio',
  description: 'Detailed Terms of Service and user agreements for the CVin.Bio platform.',
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-extrabold mb-8 tracking-tight text-foreground">Terms of Service</h1>
        <div className="prose prose-base dark:prose-invert space-y-8 text-muted-foreground">
          <p className="text-sm"><strong>Last updated:</strong> March 2026</p>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Agreement to Terms</h2>
            <p>
              By accessing or using CVin.Bio, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service. These Terms apply to all visitors, users, and others who access or use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Description of Service</h2>
            <p>
              CVin.Bio provides a digital platform that enables users to upload PDF resumes or manually input professional history to rapidly generate a localized, customized, and shareable web profile (the "Service"). You are provided a unique URL to display this generated profile publicly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Account Registration:</strong> You must provide accurate and complete information when creating an account.</li>
              <li><strong>Account Security:</strong> You are responsible for safeguarding your login credentials (managed via Supabase Auth or alternate OAuth) and for all activities that occur under your account.</li>
              <li><strong>Notifications:</strong> You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. User Content</h2>
            <p>
              When you use our service, you'll be uploading and providing information like your resume, contact details, and work history.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Data Ownership:</strong> You retain complete ownership of the professional details and resume data you provide. By uploading your information, you grant CVin.Bio a license to securely host, format, and display your data strictly to power your unique profile URL.</li>
              <li><strong>Proactive Matchmaking:</strong> To actively help you land your next big role, we may surface your profile to verified hiring partners within our network. You maintain absolute control over this visibility. If you prefer to remove your profile from our network completely, you can instantly revoke this access by permanently deleting your account and all associated data through your dashboard settings.</li>
              <li><strong>Your Responsibility:</strong> You are responsible for ensuring the information you provide is accurate and truthful.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Acceptable Use Policy</h2>
            <p>
              You agree not to use the Service in any way that is unlawful or harms CVin.Bio, our service providers, or other users. Prohibited behavior includes:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Uploading malicious files, viruses, or harmful code.</li>
              <li>Impersonating another person or entity, or misrepresenting your professional background fraudulently.</li>
              <li>Using the platform to generate spam, unsolicited promotions, or to host illegal, offensive, or defamatory content.</li>
              <li>Attempting to reverse engineer or scrape the platform's infrastructure.</li>
            </ul>
            <p className="mt-2">We reserve the right to remove Content and suspend or terminate accounts that violate this policy without prior notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Intellectual Property Rights</h2>
            <p>
              Aside from User Content, the Service and its original content, features, aesthetic designs, code, and functionality are and will remain the exclusive property of CVin.Bio and its licensors. Our intellectual property may not be used in connection with any product or service without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Disclaimers and Limitations of Liability</h2>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>"As Is" Service:</strong> The Service is provided on an "AS IS" and "AS AVAILABLE" basis. CVin.Bio makes no representations or warranties of any kind, express or implied, regarding the uptime, accuracy, or availability of the Service.</li>
              <li><strong>AI Extraction Limitations:</strong> Resume parsing utilizes AI technology which may occasionally misinterpret specific document layouts or text. Users are responsible for verifying the accuracy of their generated profile data before sharing.</li>
              <li><strong>Liability Limit:</strong> In no event shall CVin.Bio be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of your access to or use of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Account Termination</h2>
            <p>
              You may terminate your account at any time via the Editor dashboard. Upon termination, your right to use the Service will immediately cease, and your public profile and corresponding data will be permanently deleted from active systems. We may also terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">9. Modifications to the Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">10. Contact Us</h2>
            <p>
              For any questions or concerns regarding these Terms of Service, please reach out to our team through our official support contact channels.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
