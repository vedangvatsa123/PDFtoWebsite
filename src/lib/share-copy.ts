// Rotating share copy pools — randomly picked per user so feeds look organic

export const LINKEDIN_CAPTIONS = [
  (s: string) => `Stopped sending my resume as a PDF. Here's the link.\nhttps://cvin.bio/${s}`,
  (s: string) => `My CV is a website now.\nhttps://cvin.bio/${s}`,
  (s: string) => `No more "see attached" from me.\nhttps://cvin.bio/${s}`,
  (s: string) => `Updated my resume. Didn't attach it.\nhttps://cvin.bio/${s}`,
  (s: string) => `Recruiters spend 6 seconds on a PDF. I gave them something worth clicking.\nhttps://cvin.bio/${s}`,
  (s: string) => `My profile lives here now.\nhttps://cvin.bio/${s}`,
  (s: string) => `I retired resume_final_v3.pdf\nhttps://cvin.bio/${s}`,
  (s: string) => `No download required. Here's my profile.\nhttps://cvin.bio/${s}`,
  (s: string) => `Open to new roles. Here's my work.\nhttps://cvin.bio/${s}`,
  (s: string) => `Sharing my profile, not a file.\nhttps://cvin.bio/${s}`,
  (s: string) => `My next role starts with someone clicking this link.\nhttps://cvin.bio/${s}`,
  (s: string) => `I stopped emailing PDFs.\nhttps://cvin.bio/${s}`,
  (s: string) => `My resume is now a link, not an attachment.\nhttps://cvin.bio/${s}`,
  (s: string) => `If you're hiring, here's where to start.\nhttps://cvin.bio/${s}`,
  (s: string) => `Here's where I've been and what I'm building toward.\nhttps://cvin.bio/${s}`,
];

export const X_COPIES = [
  (s: string) => `My resume is a URL now.\nhttps://cvin.bio/${s}`,
  (s: string) => `Stopped attaching my resume. Here's the link.\nhttps://cvin.bio/${s}`,
  (s: string) => `My CV is a link now.\nhttps://cvin.bio/${s}`,
  (s: string) => `Finally killed my resume.pdf.\nhttps://cvin.bio/${s} — feel free to stalk`,
  (s: string) => `I retired resume_final_v3.pdf.\nhttps://cvin.bio/${s}`,
  (s: string) => `My resume has dark mode now.\nhttps://cvin.bio/${s}`,
  (s: string) => `My CV evolution: doc → pdf → link.\nhttps://cvin.bio/${s}`,
  (s: string) => `Dropped my PDF habit.\nhttps://cvin.bio/${s}`,
  (s: string) => `My profile, not a 2MB attachment.\nhttps://cvin.bio/${s}`,
  (s: string) => `Recruiters: here's my link.\nhttps://cvin.bio/${s}`,
  (s: string) => `Turns out my resume can just be a URL.\nhttps://cvin.bio/${s}`,
  (s: string) => `No more "see attached" from me.\nhttps://cvin.bio/${s}`,
  (s: string) => `My resume is live at https://cvin.bio/${s}`,
  (s: string) => `I stopped sending PDFs. Here's my profile.\nhttps://cvin.bio/${s}`,
  (s: string) => `My link, not an attachment.\nhttps://cvin.bio/${s}`,
];

export const WHATSAPP_COPIES = [
  (s: string) => `My resume is a link now.\nhttps://cvin.bio/${s}`,
  (s: string) => `Stopped sending PDFs. Here's mine:\nhttps://cvin.bio/${s}`,
  (s: string) => `Here's my profile if you're looking:\nhttps://cvin.bio/${s}`,
  (s: string) => `My CV is a website now.\nhttps://cvin.bio/${s}`,
  (s: string) => `Replaced my resume with a URL.\nhttps://cvin.bio/${s}`,
  (s: string) => `My profile is live.\nhttps://cvin.bio/${s}`,
  (s: string) => `Sharing my link, not a PDF.\nhttps://cvin.bio/${s}`,
  (s: string) => `I stopped attaching my resume. Here's the link:\nhttps://cvin.bio/${s}`,
  (s: string) => `My resume has no filename anymore.\nhttps://cvin.bio/${s}`,
  (s: string) => `Here's my profile:\nhttps://cvin.bio/${s}`,
  (s: string) => `My CV has dark mode now.\nhttps://cvin.bio/${s}`,
  (s: string) => `Dropped my PDF. Here's my URL.\nhttps://cvin.bio/${s}`,
  (s: string) => `My profile, if anyone needs it:\nhttps://cvin.bio/${s}`,
  (s: string) => `My resume is now a website.\nhttps://cvin.bio/${s}`,
  (s: string) => `Here's mine:\nhttps://cvin.bio/${s}`,
];

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
