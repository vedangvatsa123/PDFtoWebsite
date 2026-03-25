import type { Metadata } from 'next';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';

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
              By accessing or using CVin.Bio, you agree to be legally bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service. These Terms apply to all visitors, users, and others who access or use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Description of Service</h2>
            <p>
              CVin.Bio provides a digital platform that can enable users to upload PDF resumes or manually input professional history to generate a localized, customized, and shareable web profile (the "Service"). In most cases, you may be provided with a unique URL to display this generated profile publicly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Account Registration:</strong> We ask that you try to provide accurate information when creating an account.</li>
              <li><strong>Account Security & Communications:</strong> You are generally responsible for safeguarding your login credentials. By creating an account, you consent to receive periodic service updates, newsletters, and promotional communications regarding your professional profile, which you can opt out of at any time.</li>
              <li><strong>Notifications:</strong> We appreciate it if you can notify us upon becoming aware of any breach of security regarding your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. User Content</h2>
            <p>
              When you use our service, you might upload and provide information like your resume, contact details, and work history.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Data Ownership:</strong> You retain complete ownership of the professional details and resume data you provide. By uploading your information, you grant CVin.Bio a license to securely host, format, display, reproduce, and distribute your data to help power your unique profile URL and operate the Service.</li>
              <li><strong>Future Development & Ecosystem Evolution:</strong> Because we aim to constantly evolve CVin.Bio to better serve your career growth, you also grant us permission to adapt, compile, or utilize uploaded professional data to develop new tools, features, or related business models over time. We generally hope to use this flexible ecosystem to steer our platform toward whatever innovations or partnerships might best support the modern workforce.</li>
              <li><strong>Showcase & Promotional License:</strong> By creating a public profile, you can grant us permission to feature your profile, profile link, or excerpts in our marketing materials, website showcases, and social media. This may help us grow the platform while giving your profile increased visibility. You can always opt out of promotional use at any time by deleting your account.</li>
              <li><strong>Proactive Matchmaking:</strong> To try and actively help you land your next big role, we may occasionally surface your profile to verified hiring partners within our network. You naturally maintain control over this visibility, and you can revoke this access by deleting your account.</li>
              <li><strong>Your Responsibility:</strong> You are generally responsible for trying to ensure the information you provide is accurate and truthful.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Acceptable Use Policy</h2>
            <p>
              We ask that you do not use the Service in any way that may be unlawful or cause harm to CVin.Bio, our service providers, or other users. Behaviors we ask you to avoid include:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Uploading potentially malicious files, viruses, or harmful code.</li>
              <li>Impersonating another person or entity.</li>
              <li>Using the platform to generate spam or to host illegal or inherently offensive content.</li>
              <li>Attempting to reverse engineer or scrape the platform's infrastructure.</li>
            </ul>
            <p className="mt-2">We may elect to remove Content and suspend or terminate accounts that seem to violate this policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Intellectual Property Rights</h2>
            <p>
              Aside from your personal User Content, the Service and its original content, features, aesthetic designs, code, and functionality generally remain the exclusive property of CVin.Bio and its licensors. We ask that our intellectual property not be used in connection with any external product or service without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Disclaimers and Limitations of Liability</h2>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>"As Is" Service:</strong> The Service is largely provided on an "AS IS" and "AS AVAILABLE" basis. CVin.Bio makes no guarantees or absolute warranties of any kind regarding the continuous uptime, complete accuracy, or availability of the Service.</li>
              <li><strong>AI Extraction Limitations:</strong> Resume parsing utilizes AI technology which may occasionally misinterpret specific document layouts or text formatting. Users are encouraged to verify the accuracy of their generated profile data before sharing it publicly.</li>
              <li><strong>Liability Limit:</strong> To the greatest extent permitted by law, CVin.Bio may not be liable for indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of your access to or use of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">8. Account Termination</h2>
            <p>
              You may generally terminate your account at any time via the Editor dashboard. Upon termination, your right to use the Service may instantly cease, and your public profile and corresponding data are typically permanently deleted from our active systems. We may also occasionally need to terminate or suspend an account if a significant breach of the Terms is detected.
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
              For any questions or concerns regarding these Terms of Service, please feel free to reach out to our team at{' '}
              <a href="mailto:hi@cvin.bio" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-500 transition-colors">hi@cvin.bio</a>.
            </p>
          </section>
        </div>
      </main>
      <MicroFooter />
    </div>
  );
}
