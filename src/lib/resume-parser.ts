export interface ParsedResume {
  personalInfo: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    website?: string;
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

// Phone: standard formats, must have 7–15 digits, not followed by letters (avoids matching years in text)
const PHONE_RE = /(?:\+?\d[\d\s\-().]{7,}\d)(?!\s*[a-z])/i;

// URL: explicit http/https or www.
const URL_RE = /https?:\/\/[^\s<>"]+|www\.[^\s<>"]+/i;

// Month names (full or abbreviated)
const MONTH = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
// Date token: "Jan 2021" | "01/2021" | "2021"
const DATE_TOKEN = `(?:${MONTH}[,\\.\\s]+\\d{4}|\\d{1,2}\\/\\d{4}|\\d{4})`;
const DATE_RE = new RegExp(DATE_TOKEN, 'i');
// Date range: <date> – <date|present>
const DATE_RANGE_RE = new RegExp(
  `(${DATE_TOKEN})\\s*(?:[-–—]+|\\bto\\b)\\s*(${DATE_TOKEN}|[Pp]resent|[Cc]urrent|[Nn]ow|[Oo]ngoing|[Tt]oday)`,
  'i'
);

// Section headers — handles all-caps, title case, with/without colon
const SECTION_MAP: Array<[string, RegExp]> = [
  ['summary',    /^(summary|profile|objective|about\s*me?|professional\s+summary|career\s+(summary|objective)|overview|highlights|personal\s+statement)/i],
  ['experience', /^(experience|work\s+(experience|history)|employment(\s+history)?|professional\s+experience|career\s+history|positions?\s+held|work\s+background|jobs?|internship)/i],
  ['education',  /^(education(\s+&?\s+training)?|academic\s+(background|history)?|qualifications?|degrees?|schooling|universities|colleges?)/i],
  ['skills',     /^(skills?(\s+&?\s+expertise)?|technical\s+skills?|core\s+competencies?|competencies|technologies|tech\s+stack|tools?(\s+&\s+technologies)?|proficiencies|expertise|programming|languages?(\s+&\s+tools)?)/i],
  ['projects',   /^(projects?|personal\s+projects?|side\s+projects?|open[\s-]source|portfolio)/i],
  ['certifications', /^(certifications?|certificates?|licenses?|accreditations?|credentials?|awards?(\s+&?\s+certifications?)?|achievements?|honors?)/i],
  ['languages',  /^(languages?(\s+spoken)?|language\s+proficiency|spoken\s+languages?)/i],
  ['volunteer',  /^(volunteer(ing)?(\s+experience)?|community\s+(service|involvement)|social\s+work|extracurricular)/i],
];

// Job title keywords
const JOB_TITLE_RE = /\b(engineer|developer|manager|director|analyst|designer|consultant|architect|lead|senior|junior|intern|associate|specialist|coordinator|officer|president|vp|cto|ceo|cfo|head\s+of|product|software|data|full[\s-]?stack|front[\s-]?end|back[\s-]?end|devops|qa|scrum|agile|marketing|sales|hr|recruiter|accountant|nurse|doctor|teacher|professor|researcher|scientist|administrator|technician|support|advisor|strategist)\b/i;

// Degree keywords
const DEGREE_RE = /\b(bachelor|b\.?\s*s\.?|b\.?\s*a\.?|b\.?\s*e\.?|b\.?\s*tech|b\.?\s*sc|master|m\.?\s*s\.?|m\.?\s*a\.?|m\.?\s*e\.?|m\.?\s*tech|m\.?\s*sc|mba|ph\.?\s*d\.?|phd|diploma|certificate|associate|llb|llm|a\.?\s*s\.?|a\.?\s*a\.?|high\s+school|secondary|undergraduate|postgraduate|honours?|hons\.?|degree)\b/i;

// Institution keywords
const INSTITUTION_RE = /\b(university|college|institute|school|academy|polytechnic|iit|nit|bits|mit|stanford|oxford|cambridge|harvard|faculty|department)\b/i;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cleanLine(line: string): string {
  return line
    .replace(/\u0000/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b-\u200f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoLines(text: string): string[] {
  return text
    .split(/\r?\n|\f/)
    .map(cleanLine)
    .filter(l => l.length > 1);
}

function normalizeHeader(line: string): string {
  return line
    .replace(/[:\-_•*|#=~\[\]()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSectionHeader(line: string): string | null {
  const norm = normalizeHeader(line);
  if (norm.length > 80 || norm.length < 3) return null;
  if (norm.split(/\s+/).length > 6) return null;
  for (const [key, re] of SECTION_MAP) {
    if (re.test(norm)) return key;
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
  return line.replace(/^[•\-*▪▸►◆→✓✔‣⁃◦·]\s*/, '').trim();
}

// ─── Contact Info ─────────────────────────────────────────────────────────────

function expandContactLines(lines: string[]): string[] {
  const result: string[] = [];
  for (const line of lines) {
    if (/[|·•]/.test(line) && line.length < 300) {
      result.push(...line.split(/\s*[|·•]\s*/).map(s => s.trim()).filter(Boolean));
    } else {
      result.push(line);
    }
  }
  return result;
}

function extractPersonalInfo(lines: string[]): ParsedResume['personalInfo'] {
  const searchLines = lines.slice(0, 30);
  const expanded = expandContactLines(searchLines);

  let email = '';
  let phone: string | undefined;
  let website: string | undefined;
  let location: string | undefined;
  let fullName = '';

  for (const line of expanded) {
    if (!email) {
      const m = line.match(EMAIL_RE);
      if (m) { email = m[0]; continue; }
    }
    if (!website) {
      const m = line.match(URL_RE);
      if (m) { website = m[0]; continue; }
    }
    if (!phone) {
      const m = line.match(PHONE_RE);
      if (m) {
        const candidate = m[0].trim();
        const digits = candidate.replace(/\D/g, '');
        if (digits.length >= 7 && digits.length <= 15) {
          phone = candidate;
          continue;
        }
      }
    }
    if (!location) {
      // "City, STATE" or "City, Country"
      const m = line.match(/^([A-Za-z\s'-]+),\s*([A-Z]{2}|[A-Za-z]+(?:\s[A-Za-z]+)?)$/);
      if (m && line.length < 60 && !EMAIL_RE.test(line) && !URL_RE.test(line)) {
        location = line;
        continue;
      }
      // "City, State, Country"
      const m2 = line.match(/^([A-Za-z\s'-]+),\s*([A-Za-z\s]+),\s*([A-Za-z]+)$/);
      if (m2 && line.length < 80 && !EMAIL_RE.test(line)) {
        location = line;
        continue;
      }
    }
  }

  // Find name: first short line that looks like a proper name
  for (const line of lines.slice(0, 12)) {
    if (EMAIL_RE.test(line) || URL_RE.test(line)) continue;
    if (isSectionHeader(line)) break;
    const clean = line.replace(/^(dr\.?|mr\.?|ms\.?|mrs\.?|prof\.?|rev\.?)\s+/i, '').trim();
    if (
      /^[A-Za-z'-]+(?:\s+[A-Za-z.'-]+){1,4}$/.test(clean) &&
      clean.length >= 4 &&
      clean.length < 60 &&
      !JOB_TITLE_RE.test(clean) &&
      !DEGREE_RE.test(clean) &&
      !INSTITUTION_RE.test(clean) &&
      !/^\d/.test(clean)
    ) {
      // Convert ALL CAPS to Title Case
      fullName = clean === clean.toUpperCase()
        ? clean.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        : clean;
      break;
    }
  }

  return { fullName: fullName || 'Unknown', email, phone, location, website };
}

// ─── Section Splitter ─────────────────────────────────────────────────────────

function splitSections(lines: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = {
    header: [], summary: [], experience: [], education: [],
    skills: [], projects: [], certifications: [], languages: [], volunteer: [], other: [],
  };

  let current = 'header';

  for (const line of lines) {
    const section = isSectionHeader(line);
    if (section) {
      current = section in sections ? section : 'other';
      continue;
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
    if (hasDateRange && current.length > 0) {
      blocks.push(current);
      current = [line];
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
        const atMatch = rest.match(/^(.+?)\s+(?:at|@|,)\s+(.+)$/i);
        const sepMatch = rest.match(/^(.+?)\s*[|·•]\s*(.+)$/);
        if (atMatch) {
          if (!title) title = atMatch[1].trim();
          if (!company) company = atMatch[2].trim();
        } else if (sepMatch) {
          if (!title) title = sepMatch[1].trim();
          if (!company) company = sepMatch[2].trim();
        } else if (!title) {
          title = rest;
        }
      }
      continue;
    }

    if (!metaLinesDone) {
      const atMatch = line.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i);
      const sepMatch = line.match(/^(.+?)\s*[|·•]\s*(.+)$/);

      if (atMatch && !title) {
        title = atMatch[1].trim();
        company = atMatch[2].trim();
        continue;
      }
      if (sepMatch && !title) {
        title = sepMatch[1].trim();
        company = sepMatch[2].trim();
        continue;
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
      const dateRange = extractDateRange(line);
      if (dateRange && !startDate) {
        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
        const rest = stripDates(line);
        if (rest.length > 2) {
          if (DEGREE_RE.test(rest) && !degree) degree = rest;
          else if (INSTITUTION_RE.test(rest) && !institution) institution = rest;
        }
        continue;
      }
      if (INSTITUTION_RE.test(line) && !institution) { institution = line; continue; }
      if (DEGREE_RE.test(line) && !degree) { degree = line; continue; }
      if (!institution && line.length < 120) { institution = line; continue; }
      if (!degree && line.length < 120) { degree = line; continue; }
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
    const clean = s.trim().replace(/^[•\-*▪▸►◆→]\s*/, '').trim();
    if (clean.length < 2 || clean.length > 50) return;
    if (/^\d+$/.test(clean)) return;
    if (clean.split(/\s+/).length > 5) return;
    const key = clean.toLowerCase();
    if (!seen.has(key)) { seen.add(key); skills.push({ name: clean }); }
  };

  for (const line of lines) {
    const colonMatch = line.match(/^[^:]{1,40}:\s*(.+)$/);
    const content = colonMatch ? colonMatch[1] : line;

    if (/[,|;•]/.test(content)) {
      content.split(/[,|;•]+/).forEach(addSkill);
    } else {
      addSkill(content);
    }
  }

  return skills;
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function extractSummary(lines: string[], workExp: ParsedResume['workExperience']): string {
  if (lines.length > 0) return lines.join(' ').trim();
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (DATE_RANGE_RE.test(line)) {
      const dr = extractDateRange(line)!;
      const prevLine = i > 0 ? lines[i - 1] : '';
      const descLines: string[] = [];

      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (DATE_RE.test(lines[j])) break;
        if (lines[j].length > 3) descLines.push(stripBullet(lines[j]));
      }

      if (DEGREE_RE.test(prevLine) || INSTITUTION_RE.test(prevLine)) {
        education.push({
          institution: prevLine,
          degree: stripDates(line) || prevLine,
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

    // Comma-separated skill lines
    if (/,/.test(line) && line.split(',').length >= 3 && line.length < 200) {
      const parts = line.split(',').map(s => s.trim()).filter(s => s.length > 1 && s.length < 40);
      if (parts.every(p => p.split(' ').length <= 4)) {
        parts.forEach(name => skills.push({ name }));
      }
    }
  }

  return { workExperience, education, skills, summary: '' };
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

  return { personalInfo, summary, workExperience, education, skills };
}
