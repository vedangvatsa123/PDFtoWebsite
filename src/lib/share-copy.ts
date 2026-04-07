// Rotating share copy pools — randomly picked per user so feeds look organic

export const LINKEDIN_CAPTIONS = [
  (s: string) => `Stopped sending my CV as a PDF. Here's the link.\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
  (s: string) => `My CV is a website now.\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
  (s: string) => `No more "see attached" from me.\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
  (s: string) => `Updated my CV. Didn't attach it.\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
  (s: string) => `Recruiters spend 6 seconds on a PDF. I gave them something worth clicking.\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
  (s: string) => `My profile lives here now.\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
  (s: string) => `I retired resume_final_v3.pdf\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
  (s: string) => `No download required. Here's my profile.\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
  (s: string) => `Open to new roles. Here's my work.\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
  (s: string) => `Sharing my profile, not a file.\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
  (s: string) => `My next role starts with someone clicking this link.\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
  (s: string) => `I stopped emailing PDFs.\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
  (s: string) => `My CV is now a link, not an attachment.\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
  (s: string) => `If you're hiring, here's where to start.\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
  (s: string) => `Here's where I've been and what I'm building toward.\nhttps://cvin.bio/${s}?utm_source=linkedin&utm_medium=social`,
];

export const X_COPIES = [
  (s: string) => `My CV is a URL now.\nhttps://cvin.bio/${s}?utm_source=x&utm_medium=social`,
  (s: string) => `Stopped attaching my CV. Here's the link.\nhttps://cvin.bio/${s}?utm_source=x&utm_medium=social`,
  (s: string) => `My CV is a link now.\nhttps://cvin.bio/${s}?utm_source=x&utm_medium=social`,
  (s: string) => `Finally killed my CV.pdf.\nhttps://cvin.bio/${s}?utm_source=x&utm_medium=social — feel free to stalk`,
  (s: string) => `I retired resume_final_v3.pdf.\nhttps://cvin.bio/${s}?utm_source=x&utm_medium=social`,
  (s: string) => `My CV has dark mode now.\nhttps://cvin.bio/${s}?utm_source=x&utm_medium=social`,
  (s: string) => `My CV evolution: doc → pdf → link.\nhttps://cvin.bio/${s}?utm_source=x&utm_medium=social`,
  (s: string) => `Dropped my PDF habit.\nhttps://cvin.bio/${s}?utm_source=x&utm_medium=social`,
  (s: string) => `My profile, not a 2MB attachment.\nhttps://cvin.bio/${s}?utm_source=x&utm_medium=social`,
  (s: string) => `Recruiters: here's my link.\nhttps://cvin.bio/${s}?utm_source=x&utm_medium=social`,
  (s: string) => `Turns out my CV can just be a URL.\nhttps://cvin.bio/${s}?utm_source=x&utm_medium=social`,
  (s: string) => `No more "see attached" from me.\nhttps://cvin.bio/${s}?utm_source=x&utm_medium=social`,
  (s: string) => `My CV is live at https://cvin.bio/${s}?utm_source=x&utm_medium=social`,
  (s: string) => `I stopped sending PDFs. Here's my profile.\nhttps://cvin.bio/${s}?utm_source=x&utm_medium=social`,
  (s: string) => `My link, not an attachment.\nhttps://cvin.bio/${s}?utm_source=x&utm_medium=social`,
];

export const WHATSAPP_COPIES = [
  (s: string) => `My CV is a link now.\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
  (s: string) => `Stopped sending PDFs. Here's mine:\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
  (s: string) => `Here's my profile if you're looking:\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
  (s: string) => `My CV is a website now.\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
  (s: string) => `Replaced my CV with a URL.\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
  (s: string) => `My profile is live.\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
  (s: string) => `Sharing my link, not a PDF.\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
  (s: string) => `I stopped attaching my CV. Here's the link:\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
  (s: string) => `My CV has no filename anymore.\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
  (s: string) => `Here's my profile:\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
  (s: string) => `My CV has dark mode now.\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
  (s: string) => `Dropped my CV link.\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
  (s: string) => `My profile, if anyone needs it:\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
  (s: string) => `My CV is now a website.\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
  (s: string) => `Here's mine:\nhttps://cvin.bio/${s}?utm_source=whatsapp&utm_medium=social`,
];

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
