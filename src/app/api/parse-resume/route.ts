
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

const parseResumeText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');

    const getSectionLines = (sectionKeywords: string[], endKeywords: string[]): string[] => {
        let startIndex = -1;
        for (const keyword of sectionKeywords) {
            startIndex = lines.findIndex(line => new RegExp(`^${keyword}$`, 'i').test(line.trim()));
            if (startIndex !== -1) break;
        }
        if (startIndex === -1) return [];

        let endIndex = lines.length;
        for (const endKeyword of endKeywords) {
            const potentialEndIndex = lines.findIndex((line, index) => index > startIndex && new RegExp(`^${endKeyword}$`, 'i').test(line.trim()));
            if (potentialEndIndex !== -1) {
                endIndex = potentialEndIndex;
                break;
            }
        }
        return lines.slice(startIndex + 1, endIndex);
    };

    const allSectionKeywords = ['experience', 'work experience', 'education', 'skills', 'summary', 'profile'];
    const experienceKeywords = ['experience', 'work experience'];
    const educationKeywords = ['education'];
    const skillsKeywords = ['skills', 'technical skills'];
    const summaryKeywords = ['summary', 'profile'];

    const experienceSectionLines = getSectionLines(experienceKeywords, [...educationKeywords, ...skillsKeywords, ...summaryKeywords]);
    const educationSectionLines = getSectionLines(educationKeywords, [...experienceKeywords, ...skillsKeywords, ...summaryKeywords]);
    const skillsSectionLines = getSectionLines(skillsKeywords, [...experienceKeywords, ...educationKeywords, ...summaryKeywords]);

    // Very basic personal info extraction
    const fullName = lines[0] || 'Full Name';
    const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
    const emailMatch = text.match(emailRegex);
    const email = emailMatch ? emailMatch[0] : '';
    
    // Heuristic for summary: lines before the first major section
     let firstSectionIndex = lines.length;
     [...experienceKeywords, ...educationKeywords, ...skillsKeywords].forEach(keyword => {
        const index = lines.findIndex(line => new RegExp(`^${keyword}$`, 'i').test(line.trim()));
        if (index !== -1 && index < firstSectionIndex) {
            firstSectionIndex = index;
        }
    });
    // Assume a few lines after name/contact for summary
    const summary = lines.slice(1, firstSectionIndex > 0 ? firstSectionIndex : 3).join(' ').trim();


    const parseEntries = (lines: string[]) => {
        // This is still a very naive parser and would need significant improvement for production use.
        // It assumes a new entry starts with a line that might be a company or school name.
        if (lines.length === 0) return [];
        const entries: {title: string, subtitle: string, date: string, description: string}[] = [];
        // A simple heuristic: if a line contains a common date separator, it might be a new entry.
        // This is not very reliable. A better approach would be to look for patterns.
        let currentEntry: string[] = [];

        lines.forEach(line => {
            // A better heuristic might be looking for a date range, or a capitalized line following a blank line.
            // This is still very basic.
            if (/\s(20\d{2}|present|current)\s?-\s?/i.test(line) && currentEntry.length > 1) {
                if (currentEntry.length > 0) {
                     entries.push({
                        title: currentEntry[0] || 'N/A',
                        subtitle: currentEntry[1] || 'N/A',
                        date: currentEntry.find(l => /\s(20\d{2}|present|current)\s?-\s?/i.test(l)) || 'N/A',
                        description: currentEntry.slice(2).join(' ').replace(currentEntry.find(l => /\s(20\d{2}|present|current)\s?-\s?/i.test(l)) || '', '').trim()
                    });
                    currentEntry = [];
                }
            }
            currentEntry.push(line);
        });

        if (currentEntry.length > 0) {
            entries.push({
                title: currentEntry[0] || 'N/A',
                subtitle: currentEntry[1] || 'N/A',
                date: currentEntry.find(l => /\s(20\d{2}|present|current)\s?-\s?/i.test(l)) || 'N/A',
                description: currentEntry.slice(2).join(' ').replace(currentEntry.find(l => /\s(20\d{2}|present|current)\s?-\s?/i.test(l)) || '', '').trim()
            });
        }
        
        // This is a placeholder for actual parsing logic
        if (entries.length > 0) {
            return entries.map((entry, index) => ({
                id: `entry${index}`,
                ...entry
            }));
        }

        // Fallback for very simple lists
        return lines.length > 0 ? [{ id: 'entry1', title: lines[0], subtitle: lines[1] || '', description: lines.slice(2).join(' '), date: '' }] : [];
    };

    const workExperienceParsed = parseEntries(experienceSectionLines);
    const educationParsed = parseEntries(educationSectionLines);

    const workExperience = workExperienceParsed.map(entry => ({
        company: entry.subtitle,
        title: entry.title,
        startDate: entry.date.split('-')[0]?.trim() || 'Date',
        endDate: entry.date.split('-')[1]?.trim() || 'Present',
        description: entry.description,
    }));

    const education = educationParsed.map(entry => ({
        institution: entry.title,
        degree: entry.subtitle,
        startDate: entry.date.split('-')[0]?.trim() || 'Date',
        endDate: entry.date.split('-')[1]?.trim() || 'Present',
        description: entry.description
    }));

    // Skills are often comma-separated or one per line
    const skills = skillsSectionLines.join(' ').split(/, | \/ | • | \| /).flatMap(skill => skill.split('\n')).map(s => s.trim()).filter(s => s && s.length > 1 && s.length < 30).map(s => ({name: s}));

    return {
        fullName,
        email,
        summary,
        workExperience,
        education,
        skills,
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
    
    const structuredData = parseResumeText(data.text);
    
    return NextResponse.json(structuredData, { status: 200 });

  } catch (error) {
    console.error('Error parsing resume:', error);
    return NextResponse.json({ error: 'Failed to parse resume.' }, { status: 500 });
  }
}
