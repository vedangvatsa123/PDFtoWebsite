
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

// A more robust list of potential section headers, case-insensitive
const SECTION_KEYWORDS: { [key: string]: string[] } = {
    summary: ['summary', 'profile', 'objective', 'about me', 'professional summary'],
    experience: ['experience', 'work experience', 'professional experience', 'employment history', 'work history'],
    education: ['education', 'academic background', 'academic history'],
    skills: ['skills', 'technical skills', 'proficiencies', 'core competencies'],
    projects: ['projects', 'personal projects', 'portfolio'],
    certifications: ['certifications', 'licenses & certifications'],
    awards: ['awards', 'honors & awards'],
    publications: ['publications'],
    volunteer: ['volunteer experience', 'community involvement'],
};

// Combine all keywords for easier searching
const ALL_KEYWORDS = Object.values(SECTION_KEYWORDS).flat();

/**
 * A smarter parser that identifies sections and extracts their content block.
 * @param text The raw text from the PDF.
 * @returns An object with personal info and an array of flexible sections.
 */
const parseResumeTextSmarter = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // --- Personal Info Extraction ---
    const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
    const phoneRegex = /(\+?\d{1,2}[-.\s]?)?(\(?\d{3}\)?[-.\s]?){1,2}\d{3}[-.\s]?\d{4}/;
    const websiteRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/i;

    const emailMatch = text.match(emailRegex);
    const phoneMatch = text.match(phoneRegex);
    const websiteMatch = text.match(websiteRegex);

    const email = emailMatch ? emailMatch[0] : '';
    const phone = phoneMatch ? phoneMatch[0] : '';
    let website = websiteMatch ? websiteMatch[0] : '';
    
    // Clean up website URL
    if (website) {
        website = website.replace(/^https?:\/\//, '').replace(/^www\./, '');
    }

    let fullName = lines[0] && !ALL_KEYWORDS.some(k => lines[0].toLowerCase().includes(k)) ? lines[0] : '';

    // --- Section Identification and Extraction ---
    const sections: { title: string; content: string; order: number }[] = [];
    let sectionStarts: { index: number; title: string }[] = [];

    // Find all lines that look like section headers
    lines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();
        for (const sectionType in SECTION_KEYWORDS) {
            if (SECTION_KEYWORDS[sectionType].includes(lowerLine)) {
                sectionStarts.push({ index, title: line });
                return; // Found a match, move to next line
            }
        }
        // Fallback for any capitalized line with 1-3 words
        if (/^[A-Z][a-zA-Z\s&]{4,25}$/.test(line) && line.split(' ').length <= 4 && lines[index + 1]?.length > 0) {
             sectionStarts.push({ index, title: line });
        }
    });

    // Deduplicate and sort section starts
    const uniqueSectionStarts = sectionStarts.filter((section, index, self) => 
        index === self.findIndex(s => s.index === section.index)
    ).sort((a, b) => a.index - b.index);

    
    // Extract content for each section
    uniqueSectionStarts.forEach((start, i) => {
        const startIndex = start.index + 1;
        const endIndex = (i + 1 < uniqueSectionStarts.length) ? uniqueSectionStarts[i + 1].index : lines.length;
        const contentLines = lines.slice(startIndex, endIndex);
        const content = contentLines.join('\n').replace(/\n\n+/g, '\n'); // Clean up excessive newlines
        
        if (content.trim()) {
            sections.push({
                title: start.title,
                content: content.trim(),
                order: i
            });
        }
    });

    // Try to find summary if it's not a formal section
    let summary = '';
    const summarySection = sections.find(s => SECTION_KEYWORDS.summary.includes(s.title.toLowerCase()));
    if (summarySection) {
        summary = summarySection.content;
        // Remove summary from the generic sections array
        sections.splice(sections.findIndex(s => s.title === summarySection.title), 1);
    } else if (uniqueSectionStarts.length > 0 && uniqueSectionStarts[0].index > 1) {
        // Assume text before the first section is the summary
        const personalInfoLines = lines.slice(0, uniqueSectionStarts[0].index);
        summary = personalInfoLines.filter(line => !emailRegex.test(line) && !phoneRegex.test(line) && line !== fullName).join(' ');
    }


    return {
        fullName,
        email,
        phone,
        website,
        summary,
        sections,
    };
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
        return NextResponse.json({ error: 'File is not a PDF.' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const data = await pdf(fileBuffer);
    
    // Use the smarter parser
    const structuredData = parseResumeTextSmarter(data.text);
    
    return NextResponse.json(structuredData, { status: 200 });

  } catch (error) {
    console.error('Error parsing resume:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during parsing.';
    return NextResponse.json({ error: 'Failed to parse resume.', details: errorMessage }, { status: 500 });
  }
}
