import type { Metadata } from 'next';
import Header from '@/components/header';
import MicroFooter from '@/components/micro-footer';

export const metadata: Metadata = {
  title: 'Terms & Privacy',
  description: 'Terms of Service and Privacy Policy for the CVin.Bio platform.',
  openGraph: {
    title: 'Terms & Privacy | CVin.Bio',
    description: 'Terms of Service and Privacy Policy for the CVin.Bio platform.',
    url: 'https://cvin.bio/terms',
    images: [{ url: 'https://cvin.bio/opengraph-image', width: 1200, height: 630, alt: 'CVin.Bio Terms & Privacy' }],
  },
  twitter: { card: 'summary_large_image', title: 'Terms & Privacy | CVin.Bio' },
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1 mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-extrabold mb-8 tracking-tight text-foreground">Terms & Privacy</h1>
        <div className="prose prose-base dark:prose-invert space-y-8 text-muted-foreground">
          <p className="text-sm"><strong>Last updated:</strong> March 2026</p>

          {/* ── Terms of Service ── */}
          <h2 className="text-2xl font-extrabold text-foreground mb-4 pt-4 border-t">Terms of Service</h2>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">1. Agreement to Terms</h3>
            <p>
              By accessing or using CVin.Bio, you agree to be legally bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service. These Terms apply to all visitors, users, and others who access or use the platform.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">2. Description of Service</h3>
            <p>
              CVin.Bio provides a digital platform that can enable users to upload PDF resumes or manually input professional history to generate a localized, customized, and shareable web profile (the &quot;Service&quot;). In most cases, you may be provided with a unique URL to display this generated profile publicly.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">3. User Accounts</h3>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Account Registration:</strong> We ask that you try to provide accurate information when creating an account.</li>
              <li><strong>Account Security & Communications:</strong> You are generally responsible for safeguarding your login credentials. By creating an account, you consent to receive periodic service updates, newsletters, and promotional communications regarding your professional profile, which you can opt out of at any time.</li>
              <li><strong>Notifications:</strong> We appreciate it if you can notify us upon becoming aware of any breach of security regarding your account.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">4. User Content</h3>
            <p>
              When you use our service, you might upload and provide information like your resume, contact details, and work history.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Data Ownership:</strong> You retain complete ownership of the professional details and resume data you provide. By uploading your information, you grant CVin.Bio a license to securely host, format, display, reproduce, and distribute your data to help power your unique profile URL and operate the Service.</li>
              <li><strong>Future Development & Ecosystem Evolution:</strong> Because we aim to constantly evolve CVin.Bio to better serve your career growth, you also grant us permission to adapt, compile, or utilize uploaded professional data to develop new tools, features, or related business models over time.</li>
              <li><strong>Showcase & Promotional License:</strong> By creating a public profile, you can grant us permission to feature your profile, profile link, or excerpts in our marketing materials, website showcases, and social media. You can always opt out of promotional use at any time by deleting your account.</li>
              <li><strong>Proactive Matchmaking:</strong> To try and actively help you land your next big role, we may occasionally surface your profile to verified hiring partners within our network. You maintain control over this visibility, and you can revoke this access by deleting your account.</li>
              <li><strong>AI Agent Accessibility:</strong> Whatever you add to your profile is accessible to AI systems, including AI assistants, search agents, and automated recruiting tools. If you do not want something indexed by AI, do not add it to your profile. You can remove all data at any time by deleting your account.</li>
              <li><strong>Your Responsibility:</strong> You are generally responsible for trying to ensure the information you provide is accurate and truthful.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">5. Acceptable Use Policy</h3>
            <p>
              We ask that you do not use the Service in any way that may be unlawful or cause harm to CVin.Bio, our service providers, or other users. Behaviors we ask you to avoid include:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Uploading potentially malicious files, viruses, or harmful code.</li>
              <li>Impersonating another person or entity.</li>
              <li>Using the platform to generate spam or to host illegal or inherently offensive content.</li>
              <li>Attempting to reverse engineer or scrape the platform&apos;s infrastructure.</li>
            </ul>
            <p className="mt-2">We may elect to remove Content and suspend or terminate accounts that seem to violate this policy.</p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">6. Intellectual Property Rights</h3>
            <p>
              Aside from your personal User Content, the Service and its original content, features, aesthetic designs, code, and functionality generally remain the exclusive property of CVin.Bio and its licensors.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">7. Disclaimers and Limitations of Liability</h3>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>&quot;As Is&quot; Service:</strong> The Service is largely provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. CVin.Bio makes no guarantees or absolute warranties of any kind regarding the continuous uptime, complete accuracy, or availability of the Service.</li>
              <li><strong>AI Extraction Limitations:</strong> Resume parsing utilizes AI technology which may occasionally misinterpret specific document layouts or text formatting. Users are encouraged to verify the accuracy of their generated profile data before sharing it publicly.</li>
              <li><strong>Liability Limit:</strong> To the greatest extent permitted by law, CVin.Bio may not be liable for indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of your access to or use of the Service.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">8. Account Termination</h3>
            <p>
              You may generally terminate your account at any time via the Editor dashboard. Upon termination, your right to use the Service may instantly cease, and your public profile and corresponding data are typically permanently deleted from our active systems.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">8a. Job Board Disclaimer</h3>
            <p>
              CVin.Bio is not affiliated with, endorsed by, or sponsored by any of the employers listed on our Job Board. Job listings are aggregated from publicly available career pages and applicant tracking systems. CVin.Bio does not guarantee the accuracy, availability, or completeness of any job listing. Users are encouraged to verify all details directly with the hiring company before applying.
            </p>
          </section>

          {/* ── Privacy Policy ── */}
          <h2 id="privacy" className="text-2xl font-extrabold text-foreground mb-4 pt-8 border-t scroll-mt-20">Privacy Policy</h2>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">9. Information We Collect</h3>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Personal Information:</strong> When you register an account, we may collect identifiable information such as your name, email address, and authentication data provided by third-party identity providers.</li>
              <li><strong>Resume and Profile Data:</strong> When you upload a resume or CV, we process the document using AI-powered parsing to extract structured data including your name, contact details, employment history, educational background, skills, and profile photos. The original uploaded file is not stored permanently; only the extracted structured data is retained in your profile. You certify that any document you upload contains your own information and that you have the right to share it.</li>
              <li><strong>Usage Data:</strong> We might collect automatic information about how you interact with our platform, including IP addresses, browser types, and page views, to help us understand use patterns and improve our service.</li>
              <li><strong>Cookies and Tracking:</strong> We use essential cookies to maintain your session and authentication status. We also use PostHog for product analytics, which may set cookies to track anonymized usage patterns. We do not use invasive third-party advertising cookies. You can manage cookie preferences through your browser settings. By continuing to use the Service, you consent to our use of essential and analytics cookies.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">10. How We Use Your Information</h3>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>To help provide, operate, and maintain the CVin.Bio service.</li>
              <li>To help parse and generate your public-facing professional profile.</li>
              <li>To process authentication via our partners.</li>
              <li>To help track profile and page view analytics to display on your dashboard.</li>
              <li>To improve, personalize, and expand our platform functionalities.</li>
              <li>To communicate with you regarding updates, security alerts, support messages, and occasional promotional offers.</li>
              <li><strong>Showcase & Promotion:</strong> We may feature your public profile in our marketing materials and social media channels. You can opt out by deleting your account.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">11. Information Sharing and Disclosure</h3>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Recruiters and Partners:</strong> We may share profile data with relevant recruiters and job opportunities to benefit your career. You retain control and can opt out by deleting your account.</li>
              <li><strong>AI Agents and Automated Systems:</strong> Whatever you add to your profile is made available to AI agents, AI-powered search engines, and automated hiring tools. These systems may index, read, and surface your profile data to connect you with relevant job opportunities. Private account data (email, authentication credentials) is never exposed.</li>
              <li><strong>Service Providers:</strong> We may use third-party cloud infrastructure like Supabase and Vercel to help run the website and process data securely.</li>
              <li><strong>Legal Requirements:</strong> If requested by valid legal process, we may occasionally need to disclose information to authorized public authorities.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">12. Data Security & Storage</h3>
            <p>
              Your profile data is stored in a secure Supabase PostgreSQL database with media hosted on Supabase Storage. All data is encrypted in transit (HTTPS/TLS) and at rest. Authentication avoids password storage by utilizing Supabase&apos;s identity platform. While we strive to use commercially acceptable means to protect your data, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">13. Your Data Rights</h3>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>Access and Modify:</strong> You can edit your work history, skills, links, and personal information whenever you wish via the Editor.</li>
              <li><strong>Data Export:</strong> You can access all your profile data at any time through your Editor dashboard.</li>
              <li><strong>Right to Erasure (Right to be Forgotten):</strong> You can permanently delete your account and all associated data at any time. Upon deletion, your profile is immediately removed from public view and all personal data — including parsed resume data, profile information, analytics, and any uploaded media — is permanently purged from our active databases within 30 days. Cached copies in CDN or search engine indexes may take additional time to expire but are not within our control.</li>
              <li><strong>Withdraw Consent:</strong> You can unpublish or delete your profile at any time to withdraw it from public view and AI agent indexing.</li>
              <li><strong>Data Portability:</strong> Upon request to hi@cvin.bio, we can provide a machine-readable export of your personal data.</li>
              <li><strong>Cookie Management:</strong> You can disable non-essential cookies through your browser settings. Disabling essential cookies may affect your ability to use the Service.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">14. Changes to These Policies</h3>
            <p>
              We may update these Terms and Privacy Policy from time to time. We will notify you of changes by posting the updated version on this page. Continued use of the Service after changes constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-bold text-foreground mb-3">15. Contact Us</h3>
            <p>
              For any questions regarding these Terms or Privacy Policy, please reach out at{' '}
              <a href="mailto:hi@cvin.bio" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:text-indigo-500 transition-colors">hi@cvin.bio</a>.
            </p>
          </section>
        </div>
      </main>
      <MicroFooter />
    </div>
  );
}
