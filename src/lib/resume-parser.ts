export interface ParsedResume {
  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    website?: string;
    github?: string;
    linkedin?: string;
  };
  summary: string;
  workExperience: {
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    startDate: string;
    endDate?: string;
  }[];
  skills: { name: string }[];
}

// ─── Regexes ─────────────────────────────────────────────────────────────────

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i;

// Phone: handles international formats, parentheses, dots, dashes
const PHONE_RE = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/;

// URL patterns - broader to catch LinkedIn, GitHub, personal sites
const URL_RE = /(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in\/[\w-]+|github\.com\/[\w-]+|[\w-]+\.(?:com|org|net|io|dev|me|co|app|xyz|tech|design|page|site|portfolio)(?:\/[\w./-]*)?)/i;
const STRICT_URL_RE = /https?:\/\/[^\s<>"]+/i;

// Month names (full or abbreviated)
const MONTH = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
// Date token: "Jan 2021" | "01/2021" | "2021" | "Jan. 2021" | "January, 2021"
const DATE_TOKEN = `(?:${MONTH}[,.\\/\\s]*\\d{4}|\\d{1,2}\\/\\d{2,4}|\\d{4})`;
const DATE_RE = new RegExp(DATE_TOKEN, 'i');
// Date range: <date> – <date|present>
const DATE_RANGE_RE = new RegExp(
  `(${DATE_TOKEN})\\s*(?:[-–—]+|\\bto\\b|\\btill\\b|\\buntil\\b)\\s*(${DATE_TOKEN}|[Pp]resent|[Cc]urrent|[Nn]ow|[Oo]ngoing|[Tt]oday)`,
  'i'
);

// Section headers — comprehensive pattern matching
const SECTION_MAP: Array<[string, RegExp]> = [
  ['summary',    /^(summary|profile|objective|about\s*me?|professional\s+summary|career\s+(summary|objective)|executive\s+summary|overview|highlights|personal\s+statement|introduction)/i],
  ['experience', /^(experience|work\s+(experience|history)|employment(\s+history)?|professional\s+experience|career\s+history|positions?\s+held|work\s+background|relevant\s+experience|jobs?|internships?|professional\s+background|working\s+experience)/i],
  ['education',  /^(education(al)?(\s+&?\s+training)?|academic\s+(background|history|qualifications?)?|qualifications?|degrees?|schooling|universities|colleges?|academic\s+credentials?)/i],
  ['skills',     /^(skills?(\s+&?\s+expertise)?|technical\s+skills?|core\s+competenc(ies|y)|competencies|technologies|tech\s+stack|tools?(\s+&\s+technologies)?|proficiencies|expertise|programming|languages?(\s+&\s+tools)?|software|technical\s+proficiency|areas?\s+of\s+expertise|key\s+skills?|additional\s+skills?)/i],
  ['projects',   /^(projects?|personal\s+projects?|side\s+projects?|open[\s-]source|portfolio|notable\s+projects?|key\s+projects?|academic\s+projects?)/i],
  ['certifications', /^(certifications?|certificates?|licenses?|accreditations?|credentials?|awards?(\s+&?\s+certifications?)?|achievements?|honors?(\s+&?\s+awards?)?|professional\s+development)/i],
  ['languages',  /^(languages?(\s+spoken)?|language\s+proficiency|spoken\s+languages?|language\s+skills?)/i],
  ['volunteer',  /^(volunteer(ing)?(\s+experience)?|community\s+(service|involvement)|social\s+work|extracurricular(\s+activities)?|leadership(\s+&?\s+activities)?|activities)/i],
  ['publications', /^(publications?|research|papers?|conference\s+presentations?)/i],
  ['references', /^(references?|referees?)/i],
  ['interests',  /^(interests?|hobbies|personal\s+interests?)/i],
];

// Job title keywords - expanded
const JOB_TITLE_RE = /\b(engineer|developer|manager|director|analyst|designer|consultant|architect|lead|senior|junior|intern|associate|specialist|coordinator|officer|president|vp|cto|ceo|cfo|coo|cio|head\s+of|product|software|data|full[\s-]?stack|front[\s-]?end|back[\s-]?end|devops|qa|scrum|agile|marketing|sales|hr|recruiter|accountant|nurse|doctor|teacher|professor|researcher|scientist|administrator|technician|support|advisor|strategist|founder|co[\s-]?founder|partnerships?|partner|executive|assistant|clerk|programmer|operator|supervisor|representative|trainee|apprentice|fellow|postdoc|lecturer|instructor|tutor|correspondent|editor|writer|content|graphic|ui[\s\/]?ux|mobile|cloud|security|network|database|systems?\s+admin|web\s+developer|project\s+manager|program\s+manager|team\s+lead|tech\s+lead|engineering\s+manager)\b/i;

// Degree keywords - expanded
const DEGREE_RE = /\b(bachelor'?s?|b\.?\s*s\.?|b\.?\s*a\.?|b\.?\s*e\.?|b\.?\s*tech\.?|b\.?\s*sc\.?|b\.?\s*com\.?|master'?s?|m\.?\s*s\.?|m\.?\s*a\.?|m\.?\s*e\.?|m\.?\s*tech\.?|m\.?\s*sc\.?|m\.?\s*com\.?|mba|m\.?\s*b\.?\s*a\.?|ph\.?\s*d\.?|phd|doctor(ate)?|diploma|certificate|associate'?s?|llb|ll\.?\s*b\.?|llm|ll\.?\s*m\.?|a\.?\s*s\.?|a\.?\s*a\.?|high\s+school|secondary|undergraduate|postgraduate|honours?|hons\.?|degree|bca|mca|bba|b\.?\s*des\.?|m\.?\s*des\.?|b\.?\s*arch\.?|m\.?\s*arch\.?|b\.?\s*ed\.?|m\.?\s*ed\.?|b\.?\s*pharm\.?|mbbs|md|j\.?\s*d\.?|dba)\b/i;

// Institution keywords - expanded
const INSTITUTION_RE = /\b(university|college|institute|school|academy|polytechnic|iit|nit|iiit|bits|mit|stanford|oxford|cambridge|harvard|yale|princeton|caltech|berkeley|eth|imperial|ucl|nyu|ucla|columbia|cornell|brown|dartmouth|upenn|penn\s+state|georgia\s+tech|carnegie\s+mellon|faculty|department|conservatory|seminary|iisc|isb|xlri|iim|jnu|du|bhu|anna\s+university)\b/i;

// LinkedIn pattern
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cleanLine(line: string): string {
  return line
    // Remove null bytes and BOM
    .replace(/\u0000|\uFEFF/g, '')
    // Replace non-breaking spaces
    .replace(/\u00a0/g, ' ')
    // Remove zero-width characters
    .replace(/[\u200b-\u200f\u2028\u2029]/g, '')
    // Fix common ligature issues from PDF extraction
    .replace(/ﬁ/g, 'fi')
    .replace(/ﬂ/g, 'fl')
    .replace(/ﬀ/g, 'ff')
    .replace(/ﬃ/g, 'ffi')
    .replace(/ﬄ/g, 'ffl')
    // Normalize dashes
    .replace(/[\u2013\u2014]/g, '–')
    // Normalize quotes
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // Normalize bullet points
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25AB\u25CF\u25CB\u25A0\u25A1\u2605\u2606]/g, '•')
    // Remove image/binary artifacts (common from PDF image extraction)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Remove PDF stream markers and binary-looking content
    .replace(/(?:endstream|endobj|stream|obj)\b/gi, '')
    .replace(/\/[A-Z][a-z]+(?:\s+\d+){0,3}/g, '') // PDF operators like /Type 0 0 R
    // Remove coordinate/transform strings (from image positioning)
    .replace(/\b\d+\.\d+\s+\d+\.\d+\s+\d+\.\d+\s+\d+\.\d+\b/g, '')
    .replace(/\b(?:cm|m|l|re|W|n|q|Q|BT|ET|Tf|Td|TJ|Tj)\b/g, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

function isGarbageLine(line: string): boolean {
  if (line.length < 2) return true;
  // Lines that are mostly non-alphanumeric (binary/image data)
  const alphaCount = (line.match(/[a-zA-Z]/g) || []).length;
  if (line.length > 5 && alphaCount / line.length < 0.3) return true;
  // Lines with excessive special characters
  if (/^[^a-zA-Z0-9\s]{3,}$/.test(line)) return true;
  // Very short lines that are just numbers or symbols
  if (line.length < 4 && !/[a-zA-Z]/.test(line)) return true;
  // Lines that look like PDF internal references
  if (/^\d+\s+\d+\s+R$/.test(line)) return true;
  if (/^\/[A-Z]/.test(line) && line.length < 30) return true;
  // Encoded image data fragments
  if (/^[A-Za-z0-9+/=]{20,}$/.test(line.replace(/\s/g, ''))) return true;
  return false;
}

function splitIntoLines(text: string): string[] {
  return text
    .split(/\r?\n|\f/)
    .map(cleanLine)
    .filter(l => !isGarbageLine(l));
}

function normalizeHeader(line: string): string {
  return line
    .replace(/^[\d]+[.)]\s*/, '') // Strip numbered headers like "1. " or "2)"
    .replace(/[:\-_•*|#=~\[\]()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSectionHeader(line: string): string | null {
  // Check original line for ALL CAPS pattern (common in resumes)
  const cleanedLine = line.replace(/[:\-_•*|#=~\[\]()]+/g, '').trim();
  
  // Lines that are very long can't be section headers
  if (cleanedLine.length > 80 || cleanedLine.length < 3) return null;
  if (cleanedLine.split(/\s+/).length > 8) return null;
  
  const norm = normalizeHeader(line);
  if (norm.length > 80 || norm.length < 3) return null;
  if (norm.split(/\s+/).length > 8) return null;
  
  for (const [key, re] of SECTION_MAP) {
    if (re.test(norm)) return key;
  }
  
  // Also check if the line is ALL CAPS and matches
  if (cleanedLine === cleanedLine.toUpperCase() && cleanedLine.length > 3 && cleanedLine.length < 40) {
    const lower = cleanedLine.toLowerCase();
    for (const [key, re] of SECTION_MAP) {
      if (re.test(lower)) return key;
    }
  }
  
  return null;
}

function extractDateRange(text: string): { startDate: string; endDate?: string } | null {
  const m = text.match(DATE_RANGE_RE);
  if (m) {
    return {
      startDate: m[1].trim(),
      endDate: /present|current|now|ongoing|today/i.test(m[2]) ? 'Present' : m[2].trim(),
    };
  }
  const single = text.match(DATE_RE);
  if (single) return { startDate: single[0].trim() };
  return null;
}

function stripDates(line: string): string {
  return line
    .replace(DATE_RANGE_RE, '')
    .replace(DATE_RE, '')
    .replace(/\s*[-–—|,·•]+\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripBullet(line: string): string {
  return line.replace(/^[•\-*▪▸►◆→✓✔‣⁃◦·○●■□▻▷>\s]+/, '').trim();
}

// ─── Contact Info ─────────────────────────────────────────────────────────────

function expandContactLines(lines: string[]): string[] {
  const result: string[] = [];
  for (const line of lines) {
    // Split on common separators: | · • , (but not commas in location like "City, State")
    if (/[|·•]/.test(line) && line.length < 300) {
      result.push(...line.split(/\s*[|·•]\s*/).map(s => s.trim()).filter(Boolean));
    } else if (/\s{3,}/.test(line) && line.length < 300) {
      // Handle lines with large gaps (common in PDF column merging)
      result.push(...line.split(/\s{3,}/).map(s => s.trim()).filter(Boolean));
    } else {
      result.push(line);
    }
  }
  return result;
}

function extractPersonalInfo(lines: string[]): ParsedResume['personalInfo'] {
  // Search more lines for contact info (some resumes put it further down)
  const searchLines = lines.slice(0, 40);
  const expanded = expandContactLines(searchLines);

  let email = '';
  let phone: string | undefined;
  let website: string | undefined;
  let github: string | undefined;
  let linkedin: string | undefined;
  let location: string | undefined;
  let fullName = '';

  // First pass: find explicitly labeled fields
  for (const line of expanded) {
    const lower = line.toLowerCase();
    
    // Email
    if (!email) {
      const m = line.match(EMAIL_RE);
      if (m) { email = m[0]; }
    }
    
    // LinkedIn
    if (!linkedin) {
      const match = line.match(LINKEDIN_RE);
      if (match) { linkedin = match[0]; continue; }
    }
    
    // GitHub
    if (!github) {
      const match = line.match(GITHUB_RE);
      if (match) { github = match[0]; continue; }
    }
    
    // Website (if not already matched as LinkedIn or GitHub)
    if (!website) {
      const strictUrl = line.match(STRICT_URL_RE);
      if (strictUrl && !EMAIL_RE.test(strictUrl[0])) { website = strictUrl[0]; continue; }
      
      const url = line.match(URL_RE);
      if (url && !EMAIL_RE.test(url[0]) && !LINKEDIN_RE.test(url[0]) && !GITHUB_RE.test(url[0])) { website = url[0]; continue; }
    }
    
    // Phone
    if (!phone) {
      // Skip lines that are clearly not phone numbers
      if (lower.includes('page') || lower.includes('gpa')) continue;
      const m = line.match(PHONE_RE);
      if (m) {
        const candidate = m[0].trim();
        const digits = candidate.replace(/\D/g, '');
        // Must be 7-15 digits, and the line shouldn't be a date
        if (digits.length >= 7 && digits.length <= 15 && !DATE_RE.test(line)) {
          phone = candidate;
        }
      }
    }
    
    // Location: "City, STATE" or "City, Country" or labeled
    if (!location) {
      if (/^(?:location|address|city)\s*[:]\s*/i.test(line)) {
        location = line.replace(/^(?:location|address|city)\s*[:]\s*/i, '').trim();
        continue;
      }
      // "City, STATE" or "City, State" or "City, ST ZIP"
      const locMatch = line.match(/^([A-Za-z\s'-]+),\s*([A-Z]{2}(?:\s+\d{5})?|[A-Za-z]+(?:\s[A-Za-z]+)?)$/);
      if (locMatch && line.length < 60 && !EMAIL_RE.test(line) && !URL_RE.test(line) && !PHONE_RE.test(line)) {
        location = line;
        continue;
      }
      // "City, State, Country"
      const locMatch2 = line.match(/^([A-Za-z\s'-]+),\s*([A-Za-z\s]+),\s*([A-Za-z]+)$/);
      if (locMatch2 && line.length < 80 && !EMAIL_RE.test(line)) {
        location = line;
        continue;
      }
      // Just "City, State" within a broader line
      if (!location && EMAIL_RE.test(line)) {
        const parts = line.split(/\s*[|·•]\s*/);
        for (const part of parts) {
          const trimmed = part.trim();
          if (/^[A-Za-z\s'-]+,\s*[A-Z]{2}/.test(trimmed) && trimmed.length < 40) {
            location = trimmed;
            break;
          }
        }
      }
    }
  }

  // Find name: first short line that looks like a proper name
  for (const line of lines.slice(0, 15)) {
    if (EMAIL_RE.test(line) || URL_RE.test(line) || PHONE_RE.test(line)) continue;
    if (isSectionHeader(line)) break;
    
    const clean = line
      .replace(/^(dr\.?|mr\.?|ms\.?|mrs\.?|prof\.?|rev\.?)\s+/i, '')
      .replace(/[,|·•].*$/, '') // Remove trailing separators and content
      .trim();
    
    if (
      /^[A-Za-z'-]+(?:\s+[A-Za-z.'-]+){1,4}$/.test(clean) &&
      clean.length >= 4 &&
      clean.length < 60 &&
      !JOB_TITLE_RE.test(clean) &&
      !DEGREE_RE.test(clean) &&
      !INSTITUTION_RE.test(clean) &&
      !/^\d/.test(clean) &&
      !DATE_RE.test(clean) &&
      !/^(phone|email|address|location|linkedin|github|website|portfolio)/i.test(clean)
    ) {
      // Convert ALL CAPS to Title Case
      fullName = clean === clean.toUpperCase()
        ? clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        : clean;
      break;
    }
  }

  return { fullName: fullName || 'Unknown', email, phone, location, website, github, linkedin };
}

// ─── Section Splitter ─────────────────────────────────────────────────────────

function splitSections(lines: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = {
    header: [], summary: [], experience: [], education: [],
    skills: [], projects: [], certifications: [], languages: [],
    volunteer: [], publications: [], references: [], interests: [], other: [],
  };

  let current = 'header';
  let headerDone = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const section = isSectionHeader(line);
    
    if (section) {
      if (section in sections) {
        current = section;
      } else {
        current = 'other';
      }
      headerDone = true;
      continue;
    }
    
    // Before the first section header, decide if lines go to header or summary
    if (!headerDone && current === 'header') {
      // Contact info lines go to header
      if (EMAIL_RE.test(line) || PHONE_RE.test(line) || URL_RE.test(line)) {
        sections.header.push(line);
        continue;
      }
      // Short lines are likely part of header (name, title, location)
      if (line.length < 80 && i < 10) {
        sections.header.push(line);
        continue;
      }
      // Longer text before first section is likely a summary
      if (line.length > 60 && i > 2) {
        current = 'summary';
      }
    }
    
    sections[current].push(line);
  }

  return sections;
}

function hasAnySections(sections: Record<string, string[]>): boolean {
  return sections.experience.length > 0 || sections.education.length > 0 || sections.skills.length > 0;
}

// ─── Work Experience Parser ───────────────────────────────────────────────────

function groupIntoJobBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    const hasDateRange = DATE_RANGE_RE.test(line);
    const hasTitle = JOB_TITLE_RE.test(line) && line.length < 120;
    
    // Start a new block when we see a date range (primary signal) or a clear job title
    if (hasDateRange && current.length > 0) {
      blocks.push(current);
      current = [line];
    } else if (hasTitle && !hasDateRange && current.length > 2) {
      // If we see a title-like line after description lines, start new block
      const prevLinesAreBullets = current.slice(-2).every(l => /^[•\-*]/.test(l) || l.length > 80);
      if (prevLinesAreBullets) {
        blocks.push(current);
        current = [line];
      } else {
        current.push(line);
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);
  if (blocks.length === 0 && lines.length > 0) return [lines];
  return blocks;
}

function parseJobBlock(block: string[]): ParsedResume['workExperience'][0] | null {
  let title = '';
  let company = '';
  let startDate = '';
  let endDate: string | undefined;
  const descLines: string[] = [];
  let metaLinesDone = false;

  for (let i = 0; i < block.length; i++) {
    const line = block[i];

    // Extract dates
    const dateRange = extractDateRange(line);
    if (dateRange && !startDate) {
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
      const rest = stripDates(line);
      if (rest.length > 2) {
        // Parse "Title at Company", "Title @ Company", "Company – Title"
        const atMatch = rest.match(/^(.+?)\s+(?:at|@|,)\s+(.+)$/i);
        const sepMatch = rest.match(/^(.+?)\s*[|·•]\s*(.+)$/);
        if (atMatch) {
          if (!title) title = atMatch[1].trim();
          if (!company) company = atMatch[2].trim();
        } else if (sepMatch) {
          // Determine which part is title and which is company
          const part1 = sepMatch[1].trim();
          const part2 = sepMatch[2].trim();
          if (JOB_TITLE_RE.test(part1)) {
            if (!title) title = part1;
            if (!company) company = part2;
          } else {
            if (!company) company = part1;
            if (!title) title = part2;
          }
        } else if (!title) {
          title = rest;
        }
      }
      continue;
    }

    if (!metaLinesDone) {
      // Handle "Title at Company" pattern
      const atMatch = line.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
      if (atMatch && !title) {
        title = atMatch[1].trim();
        company = atMatch[2].trim();
        continue;
      }
      
      // Handle "Title | Company" or "Company | Title" pattern
      const sepMatch = line.match(/^(.+?)\s*[|·•]\s*(.+)$/);
      if (sepMatch && !title) {
        const part1 = sepMatch[1].trim();
        const part2 = sepMatch[2].trim();
        // If part1 looks like a job title
        if (JOB_TITLE_RE.test(part1)) {
          title = part1;
          company = part2;
        } else if (JOB_TITLE_RE.test(part2)) {
          company = part1;
          title = part2;
        } else {
          title = part1;
          company = part2;
        }
        continue;
      }
      
      // Handle "Title, Company" pattern (comma separated on single line)
      const commaMatch = line.match(/^(.+?),\s+(.+)$/);
      if (commaMatch && !title && !DATE_RE.test(line) && line.length < 100) {
        const part1 = commaMatch[1].trim();
        const part2 = commaMatch[2].trim();
        // Only treat as title/company if parts look right
        if (JOB_TITLE_RE.test(part1) && part2.length < 60) {
          title = part1;
          company = part2;
          continue;
        }
      }
      
      if (!title && line.length < 100 && !DATE_RE.test(line)) {
        title = line;
        continue;
      }
      if (!company && line.length < 100 && !DATE_RE.test(line) && !JOB_TITLE_RE.test(line)) {
        company = line;
        metaLinesDone = true;
        continue;
      }
      // If we already have title but line has a job title keyword, it might be a better title
      if (title && !company && JOB_TITLE_RE.test(line) && line.length < 100) {
        company = title;
        title = line;
        metaLinesDone = true;
        continue;
      }
    }

    const stripped = stripBullet(line);
    if (stripped.length > 3) descLines.push(stripped);
  }

  if (!title && !company) return null;

  return {
    title: title || 'Position',
    company: company || 'Company',
    startDate,
    endDate,
    description: descLines.join('\n'),
  };
}

function parseWorkExperience(lines: string[]): ParsedResume['workExperience'] {
  if (lines.length === 0) return [];
  return groupIntoJobBlocks(lines)
    .map(parseJobBlock)
    .filter((j): j is ParsedResume['workExperience'][0] => j !== null);
}

// ─── Education Parser ─────────────────────────────────────────────────────────

function parseEducation(lines: string[]): ParsedResume['education'] {
  const entries: ParsedResume['education'] = [];
  if (lines.length === 0) return entries;

  const blocks: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    // Start new block on institution/degree keywords or date ranges
    if ((INSTITUTION_RE.test(line) || DEGREE_RE.test(line)) && current.length > 0) {
      blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);
  if (blocks.length === 0 && lines.length > 0) blocks.push(lines);

  for (const block of blocks) {
    if (block.length === 0) continue;

    let institution = '';
    let degree = '';
    let startDate = '';
    let endDate: string | undefined;

    for (const line of block) {
      // Extract dates
      const dateRange = extractDateRange(line);
      if (dateRange && !startDate) {
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
        const rest = stripDates(line);
        if (rest.length > 2) {
          if (DEGREE_RE.test(rest) && !degree) degree = rest;
          else if (INSTITUTION_RE.test(rest) && !institution) institution = rest;
          else if (!institution && rest.length < 120) institution = rest;
        }
        continue;
      }
      
      // Handle "Institution – Degree" or "Degree | Institution" patterns
      const sepMatch = line.match(/^(.+?)\s*[|–—-]\s*(.+)$/);
      if (sepMatch && (!institution || !degree)) {
        const part1 = sepMatch[1].trim();
        const part2 = sepMatch[2].trim();
        if (INSTITUTION_RE.test(part1)) {
          if (!institution) institution = part1;
          if (!degree) degree = part2;
        } else if (DEGREE_RE.test(part1)) {
          if (!degree) degree = part1;
          if (!institution) institution = part2;
        } else if (INSTITUTION_RE.test(part2)) {
          if (!institution) institution = part2;
          if (!degree) degree = part1;
        }
        continue;
      }
      
      if (INSTITUTION_RE.test(line) && !institution) { institution = line; continue; }
      if (DEGREE_RE.test(line) && !degree) { degree = line; continue; }
      if (!institution && line.length < 120 && !DATE_RE.test(line)) { institution = line; continue; }
      if (!degree && line.length < 120 && !DATE_RE.test(line)) { degree = line; continue; }
    }

    if (institution || degree) {
      entries.push({
        institution: institution || degree || 'Institution',
        degree: degree || institution || 'Degree',
        startDate,
        endDate,
      });
    }
  }

  return entries;
}

// ─── Skills Parser ────────────────────────────────────────────────────────────

function parseSkills(lines: string[]): ParsedResume['skills'] {
  const seen = new Set<string>();
  const skills: ParsedResume['skills'] = [];

  const addSkill = (s: string) => {
    const clean = s
      .trim()
      .replace(/^[•\-*▪▸►◆→]+\s*/, '')
      .replace(/[()]+$/, '') // Remove trailing parens
      .trim();
    if (clean.length < 2 || clean.length > 60) return;
    if (/^\d+$/.test(clean)) return;
    if (clean.split(/\s+/).length > 6) return;
    // Skip obvious non-skills
    if (/^(and|or|the|etc|years?|months?|experience|proficient|expert|beginner|intermediate|advanced)$/i.test(clean)) return;
    const key = clean.toLowerCase();
    if (!seen.has(key)) { seen.add(key); skills.push({ name: clean }); }
  };

  for (const line of lines) {
    // Handle "Category: Skill1, Skill2, Skill3" format
    const colonMatch = line.match(/^[^:]{1,50}:\s*(.+)$/);
    const content = colonMatch ? colonMatch[1] : line;

    if (/[,|;•\/]/.test(content)) {
      content.split(/[,|;•\/]+/).forEach(addSkill);
    } else {
      addSkill(content);
    }
  }

  return skills;
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function extractSummary(lines: string[], workExp: ParsedResume['workExperience']): string {
  if (lines.length > 0) {
    const summary = lines.join(' ').trim();
    // If summary is too short (just a fragment), return empty
    if (summary.length < 10) return '';
    return summary;
  }
  if (workExp.length > 0) {
    const latest = workExp[0];
    const role = [latest.title, latest.company].filter(Boolean).join(' at ');
    return role ? `${role}.` : '';
  }
  return '';
}

// ─── Fallback: no section headers detected ────────────────────────────────────

function fallbackParse(lines: string[]): Pick<ParsedResume, 'workExperience' | 'education' | 'skills' | 'summary'> {
  const workExperience: ParsedResume['workExperience'] = [];
  const education: ParsedResume['education'] = [];
  const skills: ParsedResume['skills'] = [];
  const summaryLines: string[] = [];
  const processedIndices = new Set<number>();

  // First pass: find all date ranges and build experience/education entries
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (DATE_RANGE_RE.test(line)) {
      const dr = extractDateRange(line)!;
      const prevLine = i > 0 ? lines[i - 1] : '';
      const descLines: string[] = [];

      // Collect description lines after the date
      for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
        if (DATE_RANGE_RE.test(lines[j])) break;
        if (isSectionHeader(lines[j])) break;
        if (lines[j].length > 3) {
          descLines.push(stripBullet(lines[j]));
          processedIndices.add(j);
        }
      }
      processedIndices.add(i);
      if (i > 0) processedIndices.add(i - 1);

      if (DEGREE_RE.test(prevLine) || INSTITUTION_RE.test(prevLine) || DEGREE_RE.test(line) || INSTITUTION_RE.test(line)) {
        const rest = stripDates(line);
        education.push({
          institution: INSTITUTION_RE.test(prevLine) ? prevLine : rest || prevLine || 'Institution',
          degree: DEGREE_RE.test(prevLine) ? prevLine : DEGREE_RE.test(line) ? rest : prevLine || 'Degree',
          startDate: dr.startDate,
          endDate: dr.endDate,
        });
      } else {
        const rest = stripDates(line);
        workExperience.push({
          title: JOB_TITLE_RE.test(prevLine) ? prevLine : rest || prevLine || 'Position',
          company: rest || 'Company',
          startDate: dr.startDate,
          endDate: dr.endDate,
          description: descLines.join('\n'),
        });
      }
    }
  }
  
  // Second pass: find skill-like lines and summary paragraphs
  for (let i = 0; i < lines.length; i++) {
    if (processedIndices.has(i)) continue;
    const line = lines[i];
    
    // Comma-separated skill lines
    if (/,/.test(line) && line.split(',').length >= 3 && line.length < 200) {
      const parts = line.split(',').map(s => s.trim()).filter(s => s.length > 1 && s.length < 50);
      if (parts.every(p => p.split(' ').length <= 4)) {
        parts.forEach(name => {
          const key = name.toLowerCase();
          if (![...skills].some(s => s.name.toLowerCase() === key)) {
            skills.push({ name });
          }
        });
        continue;
      }
    }
    
    // Long paragraph-like text early in the resume could be a summary
    if (i < 15 && line.length > 80 && !DATE_RE.test(line) && !EMAIL_RE.test(line)) {
      summaryLines.push(line);
    }
  }

  return { workExperience, education, skills, summary: summaryLines.join(' ').trim() };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function parseResumeText(text: string): ParsedResume {
  const lines = splitIntoLines(text);
  const sections = splitSections(lines);
  const personalInfo = extractPersonalInfo(lines);

  let workExperience: ParsedResume['workExperience'];
  let education: ParsedResume['education'];
  let skills: ParsedResume['skills'];
  let summary: string;

  if (hasAnySections(sections)) {
    workExperience = parseWorkExperience(sections.experience);
    education = parseEducation(sections.education);
    skills = parseSkills([
      ...sections.skills,
      ...sections.languages,
      ...sections.certifications,
    ]);
    summary = extractSummary(sections.summary, workExperience);
  } else {
    const fb = fallbackParse(lines);
    workExperience = fb.workExperience;
    education = fb.education;
    skills = fb.skills;
    summary = fb.summary;
  }

  // Also try to extract skills from projects section
  if (sections.projects?.length > 0) {
    const projectSkills: string[] = [];
    for (const line of sections.projects) {
      const techMatch = line.match(/(?:technologies?|tech\s+stack|built\s+with|using|tools?)\s*:?\s*(.+)/i);
      if (techMatch) {
        techMatch[1].split(/[,|;]+/).forEach(s => {
          const clean = s.trim();
          if (clean.length > 1 && clean.length < 50 && !skills.some(sk => sk.name.toLowerCase() === clean.toLowerCase())) {
            skills.push({ name: clean });
          }
        });
      }
    }
  }

  return { personalInfo, summary, workExperience, education, skills };
}
