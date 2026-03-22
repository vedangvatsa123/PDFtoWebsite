import React from 'react';

export type Author = {
  name: string;
  avatarUrl: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: Author;
  content: React.ReactNode;
};

const h2 = "text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-10 mb-4 transition-colors";
const h3 = "text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2 transition-colors";
const callout = "bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 my-6 transition-colors";
const ul = "list-disc pl-6 space-y-2";
const ol = "list-decimal pl-6 space-y-2";
const bold = "font-semibold text-zinc-900 dark:text-zinc-50 transition-colors";

export const blogPosts: BlogPost[] = [
  {
    slug: 'cv-attachments',
    title: 'Why You Should Stop Sending PDF Resumes',
    excerpt: 'That PDF you carefully designed is probably getting mangled before anyone reads it. Here is what actually happens when you email a resume as an attachment.',
    date: 'Mar 15, 2026',
    author: {
      name: 'Marcus T.',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80'
    },
    content: (
      <div className="space-y-5 text-lg text-zinc-800 dark:text-zinc-300 transition-colors leading-relaxed">
        <h2 className={h2}>Files Look Different Everywhere</h2>
        <p>You spent hours getting the margins right in Google Docs, exported a clean PDF, and sent it off. The problem? The recruiter opened it on their phone during lunch.</p>
        <p>Your two-column layout is now a jumbled mess of overlapping text that requires pinching and zooming just to read your name. They close it and move on.</p>
        <div className={callout}>
          <h3 className={h3}>The hard truth about PDF rendering</h3>
          <ul className={ul}>
            <li><span className={bold}>60%+ of initial screens</span> now happen on mobile devices</li>
            <li>A PDF is locked to 8.5×11 inches, which is terrible for a 6-inch phone</li>
            <li>Custom fonts can fail to embed, wrecking your spacing entirely</li>
            <li>Transparent overlays from Canva sometimes render as opaque blocks</li>
          </ul>
        </div>

        <h2 className={h2}>Security Rules Kill Attachments</h2>
        <p>Enterprise email systems at large companies <span className={bold}>strip PDFs from emails entirely</span> or quarantine them for 24 hours. By the time your resume clears, fifty other candidates who sent links have already been reviewed.</p>
        <p>Even when it goes through, every attachment requires the recipient to download a file, which is a significant friction point. Modern hiring is about speed.</p>
        
        <h2 className={h2}>The Versioning Nightmare</h2>
        <p>When you send an attachment, you lose control of the content. If you find a better way to describe your current project or catch a minor error, that PDF in their inbox is now a historical relic. You cannot update it.</p>
        <div className={callout}>
          <h3 className={h3}>The advantage of the living document</h3>
          <p>A web profile is always current. If a recruiter clicks your link three days after you sent it, they see your latest accomplishments. You can even tailor the content specifically for different phases of the interview process without ever sending a second file.</p>
        </div>

        <h2 className={h2}>The Better Way</h2>
        <p>A web link sidesteps every one of these problems. The browser handles rendering natively. Content reflows to fit any screen. Nothing to download, nothing to scan, nothing to delete.</p>
        <div className={callout}>
          <h3 className={h3}>Why this matters for your candidacy</h3>
          <p>If you are applying for any role adjacent to technology, product, or design, delivering information in the most frictionless format is itself a signal of competence. <span className={bold}>Your resume is your first project deliverable.</span> Make it a good one.</p>
        </div>
      </div>
    )
  },
  {
    slug: 'mobile-responsive-cv',
    title: 'The Silent Killer: How Non-Responsive Resumes Cost You Interviews',
    excerpt: 'Recruiters are scanning candidates on their phones between meetings. If your resume forces them to pinch-zoom and scroll sideways, you have already lost.',
    date: 'Mar 16, 2026',
    author: {
      name: 'Elena R.',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80'
    },
    content: (
      <div className="space-y-5 text-lg text-zinc-800 dark:text-zinc-300 transition-colors leading-relaxed">
        <h2 className={h2}>The Annoyance of Scrolling Sideways</h2>
        <p>Open any traditional PDF resume on your phone right now. You will immediately notice the text is too small to read. To read one line, you pinch-zoom and then scroll right. For the next line, scroll down and back left. <span className={bold}>Every single line requires this tedious zigzag.</span></p>
        <p>This is called forced horizontal scrolling, and every usability study in the last twenty years classifies it as a <span className={bold}>critical interface failure</span>.</p>
        <div className={callout}>
          <h3 className={h3}>The math of the 6-second scan</h3>
          <p>The average recruiter spends <span className={bold}>6-8 seconds</span> on an initial resume scan. If two of those seconds are wasted navigating, you have lost a third of your window. They will not fight your formatting. They will close the file and open the next one.</p>
        </div>

        <h2 className={h2}>The Power of Font Legibility</h2>
        <p>On a mobile screen, font choice is not just about style. It is about physical readability. A web-based profile uses web fonts optimized for back-lit screens, not paper. The contrast is higher, the character spacing is wider, and the eye does not have to work as hard.</p>
        <p>When a reader does not have to strain to understand your words, they focus on your achievements. Physical comfort in reading leads to higher retention of what you actually did.</p>

        <h2 className={h2}>Websites Fix This Automatically</h2>
        <p>A web-based profile solves this through responsive design:</p>
        <ul className={ul}>
          <li><span className={bold}>Two columns on desktop</span> collapse into one column on mobile</li>
          <li>Text sizes adjust to stay readable across different resolutions</li>
          <li>Interactive elements like buttons are sized for finger-taps, not mouse-clicks</li>
          <li>The reader just scrolls down, the most natural phone gesture</li>
        </ul>

        <h2 className={h2}>Interactivity and Deep Dives</h2>
        <p>A non-responsive PDF is static. A web profile can have expandable sections. If a recruiter is interested in a specific project, they can click to see more details without cluttering the main page view. This allows you to provide high-level summaries and detailed deep-dives in the same document without overwhelming the reader.</p>

        <h2 className={h2}>The Speed of Decisions</h2>
        <p>When a recruiter can read your profile easily on their phone, they can act faster. They flip through profiles like a social feed. If your profile loads perfectly and looks great, you stay in the pipeline. If it feels like work, you get skipped. <span className={bold}>Responsiveness directly affects how fast you move through the process.</span></p>
      </div>
    )
  },
  {
    slug: 'cv-web-link',
    title: 'Why a URL is the Ultimate Professional Move',
    excerpt: 'Sharing a clean URL instead of an attachment changes how people perceive you before they even read a single word of your experience.',
    date: 'Mar 17, 2026',
    author: {
      name: 'James L.',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80'
    },
    content: (
      <div className="space-y-5 text-lg text-zinc-800 dark:text-zinc-300 transition-colors leading-relaxed">
        <h2 className={h2}>Sharing Is Effortless</h2>
        <p>A recruiter receives your URL and wants to share you with the hiring manager. They copy the link, paste it into Slack, and hit send. The hiring manager sees a <span className={bold}>rich preview card</span> with your photo, name, and headline, all rendered automatically.</p>
        <p>Now think about the PDF version of the same workflow. It involves downloading, hunting for the file, and re-uploading. Every step is a chance for the momentum to die.</p>

        <h2 className={h2}>Building a Personal Brand</h2>
        <p>A custom URL like cvin.bio/yourname is the beginning of your professional brand. It shows you have taken the time to curate your online presence. It moves you from being a "file on a server" to a "person with a platform." This subtle shift in status makes you more memorable when the team discusses candidates at the end of the week.</p>

        <h2 className={h2}>The Preview Card Effect</h2>
        <p>When you drop a URL into Slack, LinkedIn, iMessage, or WhatsApp, the platform automatically fetches your page metadata and renders a preview card showing:</p>
        <ul className={ul}>
          <li>Your custom OpenGraph image with your name</li>
          <li>Your current role and most impressive accolade</li>
          <li>A clean, professional summary that hooks the reader</li>
        </ul>
        <div className={callout}>
          <h3 className={h3}>Free advertising, every time</h3>
          <p>This is built into every messaging platform as the Open Graph protocol. You get a <span className={bold}>mini-billboard for your candidacy</span> every single time your URL gets pasted anywhere, completely free.</p>
        </div>

        <h2 className={h2}>The Analytics Benefit</h2>
        <p>One thing an attachment can never tell you is when it has been opened. With a web profile, you can track views. Knowing that your profile was viewed three times in the last hour from a specific city gives you a clear indication that a team is currently discussing you. This information is invaluable for managing your own nerves and following up at the right time.</p>

        <h2 className={h2}>The Psychology of Clean URLs</h2>
        <p>There is a subtle effect at work. When someone receives <span className={bold}>&quot;cvin.bio/james&quot;</span> versus a file called &quot;James_Lee_SeniorDev_Resume_March2026_FINAL.pdf,&quot; the URL feels more credible. This person has their act together. They are not just looking for a job. They are managing a career.</p>
      </div>
    )
  },
  {
    slug: 'bypass-ats',
    title: 'Bypassing Formatting Destruction with Dual-Submissions',
    excerpt: 'Your beautifully designed resume gets fed into a parser that strips every visual element. Here is how to satisfy the robot and impress the human.',
    date: 'Mar 18, 2026',
    author: {
      name: 'Sarah K.',
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80'
    },
    content: (
      <div className="space-y-5 text-lg text-zinc-800 dark:text-zinc-300 transition-colors leading-relaxed">
        <h2 className={h2}>How Parsers Destroy Your Resume</h2>
        <p>Systems like <span className={bold}>Taleo, Workday, Greenhouse, and Lever</span> all process resumes by ripping out every character of text and dropping it into a database. A recruiter then runs keyword searches against that database.</p>
        <p>The problem: the extraction engine reads text from top-left to bottom-right based on character coordinates. It does not understand columns.</p>
        <div className={callout}>
          <h3 className={h3}>What actually happens</h3>
          <p>If your skills are on the left and job history on the right, the parser merges them line by line. Your profile becomes gibberish like <span className={bold}>&quot;Python Senior Engineer 2019&quot;</span> where your skill got smashed into your job title. A keyword search for &quot;Python&quot; will not match this mangled string.</p>
        </div>

        <h2 className={h2}>The Human Factor in the ATS</h2>
        <p>Even if the robot parses your text correctly, the human recruiter eventually has to read it. Most ATS interfaces show the parsed text in a very ugly, Courier-style plain text box. Your design is gone. Your hierarchy is gone. Your personality is gone.</p>
        <p>By providing a link, you provide a choice. You give the recruiter a chance to leave the ugly ATS interface and see the "real" you on your professional profile.</p>

        <h2 className={h2}>The Dual-Submission Fix</h2>
        <p>Submit two things:</p>
        <ol className={ol}>
          <li><span className={bold}>A plain, single-column text document</span> into the ATS upload. Zero columns, zero graphics, zero fancy fonts. Designed for the robot.</li>
          <li><span className={bold}>Your web profile URL</span> at the very top of that document, right below your name. Designed for the human.</li>
        </ol>

        <h2 className={h2}>Keyword Optimization for the Robot</h2>
        <p>In your plain text document, you can afford to be repetitive. You can include a "Skills Tag Cloud" at the bottom that lists every technology you have ever touched. The robot loves this. It ranks you higher for more searches. But you would never do this on your "real" resume because it looks desperate to a human. The dual-submission flow lets you be optimized for keywords and optimized for design simultaneously.</p>

        <h2 className={h2}>Do Recruiters Actually Click?</h2>
        <p>Yes, if you make it obvious. Put the URL right below your name, above everything else:</p>
        <div className={callout}>
          <p className="text-center italic">&quot;View my complete profile at <span className={bold}>cvin.bio/sarah</span>&quot;</p>
        </div>
        <p>Recruiters prefer good user experiences. When they see a clean link promising a better version of the clunky ATS view, they click it out of relief. You have given both the algorithm and the person exactly what they need.</p>
      </div>
    )
  },
  {
    slug: 'stand-out-inbox',
    title: 'Using Clean URLs to Stand Out in Application Inboxes',
    excerpt: 'When every candidate sends the same file type with the same naming convention, breaking that pattern is the fastest way to get noticed.',
    date: 'Mar 19, 2026',
    author: {
      name: 'David C.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80'
    },
    content: (
      <div className="space-y-5 text-lg text-zinc-800 dark:text-zinc-300 transition-colors leading-relaxed">
        <h2 className={h2}>300 Identical Attachments</h2>
        <p>Picture a recruiter&apos;s inbox after posting a Senior Frontend role on LinkedIn. Within 48 hours: <span className={bold}>300 applications</span>. Each one is an email with a PDF. The filenames are all variations of the same thing:</p>
        <ul className={ul}>
          <li>&quot;John_Smith_Resume.pdf&quot;</li>
          <li>&quot;Resume_JohnSmith_2026.pdf&quot;</li>
          <li>&quot;JS_FrontendDev_Final.pdf&quot;</li>
        </ul>
        <p>Click. Download. Wait. Scan for six seconds. Close. Repeat, dozens of times per hour. The cognitive fatigue is real.</p>
        <p>Now imagine one email does not have an attachment. Instead, it says: <span className={bold}>&quot;My profile is at cvin.bio/david.&quot;</span> The recruiter clicks it. A polished page loads in under a second. No download. No hunting through files.</p>

        <h2 className={h2}>The Forwarding Chain</h2>
        <p>Resumes are rarely read by one person. They are forwarded from recruiters to hiring managers, and from managers to team leads. With a PDF, this chain creates multiple copies of the file floating around Slack and Email. If you find a mistake and send a "corrected" version, you have now doubled the number of files in the chain.</p>
        <div className={callout}>
          <h3 className={h3}>The link is the single source of truth</h3>
          <p>When you share a link, everyone in the chain is looking at the same thing. If you update your profile, the entire chain is updated instantly. There is no risk of the CEO looking at "Resume_v1" while the manager looks at "Resume_Final_v3."</p>
        </div>

        <h2 className={h2}>The Visual Preview Advantage</h2>
        <p>Most email clients render link previews inline. With proper OpenGraph tags, the recruiter sees your profile card <span className={bold}>before even clicking</span>:</p>
        <div className={callout}>
          <ul className={ul}>
            <li>Your photo and headline appear inline in the email body</li>
            <li>You claim a massive chunk of visual attention with zero extra effort</li>
            <li>In a field of 300 grey paperclip icons, you are the one with an actual visual presence</li>
          </ul>
        </div>

        <h2 className={h2}>Interactive Portfolios</h2>
        <p>A web profile is not just for text. You can embed links to live projects, GitHub repositories, or even video introductions. A PDF that says "I built a trading platform" is a claim. A web profile with a "View Live" button that opens the actual platform is proof. Recruiters value proof over claims every single time.</p>

        <h2 className={h2}>Easy to Forward, Easy to Remember</h2>
        <p>Links compound in value:</p>
        <ul className={ul}>
          <li><span className={bold}>Easy to share</span>: copy the URL, drop it in Slack. Everyone views it instantly.</li>
          <li><span className={bold}>Easy to remember</span>: &quot;cvin.bio/david&quot; sticks in your head. &quot;David_Chen_FrontendSenior_Resume_v4_March2026.pdf&quot; does not.</li>
          <li><span className={bold}>Easy to revisit</span>: two days later in a debrief meeting, the recruiter can pull up your profile from memory instead of digging through Downloads.</li>
        </ul>
      </div>
    )
  },
  {
    slug: 'pdf-breaks-ats',
    title: 'Why Complex PDFs Break Recruiter Algorithms',
    excerpt: 'That gorgeous two-column Canva resume is getting turned into garbled text by the very systems designed to evaluate it.',
    date: 'Mar 20, 2026',
    author: {
      name: 'Anna M.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80'
    },
    content: (
      <div className="space-y-5 text-lg text-zinc-800 dark:text-zinc-300 transition-colors leading-relaxed">
        <h2 className={h2}>Fonts Turning Into Pictures</h2>
        <p>Canva, Figma, and many online templates handle custom fonts by converting them into <span className={bold}>vector outlines</span> instead of embedding font data. Visually identical. But underneath, the text is now a collection of shapes.</p>
        <p>When an ATS encounters these shapes, it runs OCR to convert them back into text. The result:</p>
        <div className={callout}>
          <p><span className={bold}>What you wrote:</span> &quot;5 years of experience with React and TypeScript&quot;</p>
          <p className="mt-2"><span className={bold}>What the ATS reads:</span> &quot;5years ofexperience wxth Reac7 and TypeScripl&quot;</p>
        </div>
        <p><span className={bold}>Test this yourself:</span> open your PDF, select all text, copy it, and paste into Notepad. If it is garbled, that is exactly what the ATS sees.</p>

        <h2 className={h2}>The Data Integrity Gap</h2>
        <p>Recruiters rely on automated filters. If the ATS reads your "2023" as "2O23" (using the letter O instead of the number zero), you might be filtered out of a search for candidates with recent experience. Subtle glitches in OCR create massive gaps in your data integrity. Web profiles provide the raw text, ensuring 100% accuracy for every tool that reads them.</p>

        <h2 className={h2}>Messy Background Layers</h2>
        <p>Designed resumes use background colors and sidebars as separate layers. The parser does not understand layers. It reads characters in coordinate order regardless of which visual layer they belong to.</p>
        <p>A sidebar heading &quot;Experience&quot; next to a job title &quot;Senior Software Engineer&quot; can become:</p>
        <div className={callout}>
          <p className="font-mono text-sm">&quot;ExSenior Software Engineerperience&quot;</p>
          <p className="text-sm mt-2 text-zinc-500 dark:text-zinc-400">Characters merged based on vertical position, not visual grouping.</p>
        </div>

        <h2 className={h2}>Semantic Tags for the Win</h2>
        <p>Web profiles use semantic HTML tags. This tells the reader (and the machine) exactly what is what. An h1 tag is always a title. A li tag is always a list item. This eliminates the "coordinate guessing game" that PDF parsers have to play. It is the difference between reading a recipe and trying to guess one from a picture of a meal.</p>

        <h2 className={h2}>Why HTML Just Works</h2>
        <p>A web page has none of these problems because the content structure is explicit. No ambiguous coordinates. No overlapping layers. No character recognition. Text is stored as actual text, perfectly machine-readable every single time.</p>
      </div>
    )
  },
  {
    slug: 'tech-resume-keywords',
    title: 'Mapping Visual Hierarchy for Technical Recruiters',
    excerpt: 'Technical recruiters spend four seconds scanning before deciding to read further. Where your keywords sit on the page determines whether you pass that scan.',
    date: 'Mar 21, 2026',
    author: {
      name: 'Alex B.',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80'
    },
    content: (
      <div className="space-y-5 text-lg text-zinc-800 dark:text-zinc-300 transition-colors leading-relaxed">
        <h2 className={h2}>Stop Burying Your Keywords</h2>
        <p>Most resumes bury critical information inside dense paragraphs. A recruiter looking for React experience has to read through three sentences about team size and timelines before finding &quot;React&quot; mentioned casually on line four. <span className={bold}>By that point, they have already left.</span></p>
        <div className={callout}>
          <h3 className={h3}>How recruiters actually scan</h3>
          <p>Eyes follow an <span className={bold}>F-shaped pattern</span>: read the top line, drop down the left edge, scan again. If your keywords are not in those zones, they literally do not register.</p>
        </div>
        <p>The fix is simple:</p>
        <ul className={ul}>
          <li><span className={bold}>Pull keywords out of paragraphs</span> and into standalone positions</li>
          <li>Use clear headings like &quot;Stack&quot; instead of burying tools in sentences</li>
          <li>Front-load every bullet with the technology name first</li>
        </ul>

        <h2 className={h2}>Managing Cognitive Load</h2>
        <p>Every time a recruiter has to hunt for information, their cognitive load increases. When they get tired or frustrated, they default to "No." Your goal is to make the "Yes" decision as physically effortless as possible. This means perfect contrast, large enough fonts, and a layout that tells them exactly where to look next.</p>

        <h2 className={h2}>White Space Is a Feature</h2>
        <p>When every inch of your resume is packed with text, <span className={bold}>nothing stands out</span>. Everything blurs into a single grey block. Adding generous margins around headings and breathing room between bullets makes each piece of information distinct and scannable.</p>
        <p>A web-based profile enforces this naturally because the template handles spacing, fonts, and hierarchy for you. You do not have to fight the urge to "fill the page."</p>

        <h2 className={h2}>Visual Anchors and Scanning Signals</h2>
        <p>Use visual anchors like bold text for job titles and skill names. These act as "scanning signals" that help the recruiter jump from one relevant point to the next. If they can see "Senior Dev," "Node.js," and "AWS" in under two seconds, they will commit to reading the rest of the page.</p>

        <h2 className={h2}>Front-Load Every Bullet</h2>
        <p>Start each bullet point with the most important word. The keyword hits their eye immediately. The context follows for anyone who wants depth. This is the principle newspaper writers have used for a hundred years: <span className={bold}>lead with the important thing.</span></p>
      </div>
    )
  },
  {
    slug: 'update-cv-anytime',
    title: 'The Hidden Advantage of Fixing Typos Anytime',
    excerpt: 'You sent your resume and noticed a typo. With a PDF, it is too late. With a web profile, you fix it in thirty seconds and nobody ever knows.',
    date: 'Mar 22, 2026',
    author: {
      name: 'Michelle P.',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80'
    },
    content: (
      <div className="space-y-5 text-lg text-zinc-800 dark:text-zinc-300 transition-colors leading-relaxed">
        <h2 className={h2}>The 10:15 AM Panic</h2>
        <p>You submitted at 10 AM. At 10:15, you realize you wrote <span className={bold}>&quot;Javscript&quot;</span> instead of &quot;JavaScript&quot; in your skills section. With a PDF, your options are limited and awkward. You can do nothing and hope they do not notice, or send a correction email that looks even worse than the typo.</p>
        <p>With a web profile, you open the editor, fix the typo, and save. The recruiter clicks your link at 2 PM and sees the corrected version. <span className={bold}>They never knew the typo existed.</span></p>

        <h2 className={h2}>Iterate Between Applications</h2>
        <p>Real-time updates let you do something PDFs never could: <span className={bold}>run experiments</span>. Submit your profile, see if you hear back. If not, tweak your headline and reorder your projects. Apply to the next role with an improved version. There is only one version, and it is always your latest and best work.</p>

        <h2 className={h2}>Adapting to Industry Trends</h2>
        <p>The tech landscape moves fast. If a new framework becomes the "must-have" for your target roles, you can add your relevant experience to your profile tonight and every recruiter who has your link will see it tomorrow. You do not have to re-send files to everyone you have talked to this month. Your link is an evolving record of your expertise.</p>

        <h2 className={h2}>The Mid-Interview Pivot</h2>
        <p>This advantage is most powerful during an active interview process. Phone screen on Monday where the interviewer mentions the team is migrating to <span className={bold}>Kubernetes</span>. You have Kubernetes experience but did not highlight it. Before Thursday&apos;s on-site, you add a Kubernetes section and reorder your projects.</p>
        <div className={callout}>
          <h3 className={h3}>The "Right Candidate" Effect</h3>
          <p>The panel reviews your link and sees a candidate who <span className={bold}>perfectly matches their current priorities</span>. It feels like fate to the hiring manager. It is actually just smart use of a live, editable profile. A PDF cannot do this. Once sent, it is frozen. <span className={bold}>A link is alive.</span></p>
        </div>
      </div>
    )
  }
];
