
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

const parseResumeText = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    const getSectionLines = (sectionKeywords: string[], allKeywords: string[]): [string[], number] => {
        let startIndex = -1;
        for (const keyword of sectionKeywords) {
            const regex = new RegExp(`^${keyword}$`, 'i');
            startIndex = lines.findIndex(line => regex.test(line));
            if (startIndex !== -1) break;
        }

        if (startIndex === -1) return [[], -1];

        let endIndex = lines.length;
        const remainingKeywords = allKeywords.filter(k => !sectionKeywords.includes(k));
        for (let i = startIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            for (const endKeyword of remainingKeywords) {
                const regex = new RegExp(`^${endKeyword}$`, 'i');
                if (regex.test(line)) {
                    endIndex = i;
                    // Return the lines and the start index of the next section
                    return [lines.slice(startIndex + 1, endIndex), endIndex];
                }
            }
        }

        // If no other section is found, return all lines until the end
        return [lines.slice(startIndex + 1), lines.length];
    };

    const experienceKeywords = ['experience', 'work experience', 'professional experience', 'employment history'];
    const educationKeywords = ['education', 'academic background'];
    const skillsKeywords = ['skills', 'technical skills', 'proficiencies'];
    const summaryKeywords = ['summary', 'profile', 'objective', 'about me'];
    const allKeywords = [...experienceKeywords, ...educationKeywords, ...skillsKeywords, ...summaryKeywords];

    // Find Summary/Profile
    const [summaryLines] = getSectionLines(summaryKeywords, allKeywords);

    // Find Experience, Education, Skills
    const [experienceSectionLines] = getSectionLines(experienceKeywords, allKeywords);
    const [educationSectionLines] = getSectionLines(educationKeywords, allKeywords);
    const [skillsSectionLines] = getSectionLines(skillsKeywords, allKeywords);
    
    // --- Personal Info Extraction ---
    // Assume the first few lines are personal info if no summary section is explicitly found early.
    let personalInfoLines = lines.slice(0, 5); // Take top 5 lines as potential personal info block
    const emailRegex = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
    const phoneRegex = /(\+?\d{1,2}[-.\s]?)?(\(?\d{3}\)?[-.\s]?){1,2}\d{3}[-.\s]?\d{4}/;
    
    const emailMatch = text.match(emailRegex);
    const email = emailMatch ? emailMatch[0] : '';
    const phoneMatch = text.match(phoneRegex);
    const phone = phoneMatch ? phoneMatch[0] : '';

    let fullName = lines[0] && !allKeywords.some(k => lines[0].toLowerCase().includes(k)) ? lines[0] : 'Full Name';
    if (fullName.includes(email) || fullName.includes(phone)) {
        fullName = 'Full Name'; // Reset if name seems to be contact info
    }

    let summary = summaryLines.join(' ');
    // If no summary section, try to infer it from lines after personal info.
    if (!summary) {
        let firstSectionIndex = lines.length;
        allKeywords.forEach(keyword => {
            const index = lines.findIndex(line => new RegExp(`^${keyword}$`, 'i').test(line.trim()));
            if (index !== -1 && index < firstSectionIndex) {
                firstSectionIndex = index;
            }
        });

        // Find where personal info likely ends
        let personalInfoEndIndex = 0;
        for (let i = 0; i < Math.min(lines.length, 5); i++) {
            if (emailRegex.test(lines[i]) || phoneRegex.test(lines[i]) || /linkedin\.com|github\.com/i.test(lines[i])) {
                personalInfoEndIndex = i + 1;
            }
        }
        
        if (firstSectionIndex > personalInfoEndIndex) {
            summary = lines.slice(personalInfoEndIndex, firstSectionIndex).join(' ').trim();
        }
    }


    const parseEntries = (lines: string[]) => {
        if (lines.length === 0) return [];
        const entries: { title: string, subtitle: string; date: string, description: string }[] = [];
        let currentEntryLines: string[] = [];

        // Regex to detect a date range, which often signals the start of a new entry.
        const dateRangeRegex = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)[\s.,]*\d{4}\s*(?:-|to|–|—)\s*(?:Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)[\s.,]*\d{4})/i;

        lines.forEach((line, index) => {
            // Heuristic for new entry: a date range, or a line that looks like a title after a few descriptive lines.
            const isNewEntry = dateRangeRegex.test(line) || 
                               (currentEntryLines.length > 2 && lines[index-1].endsWith('.') && !line.startsWith('-') && !line.startsWith('•'));
            
            if (isNewEntry && currentEntryLines.length > 0) {
                // Process the previous entry
                const dateLine = currentEntryLines.find(l => dateRangeRegex.test(l)) || '';
                const title = currentEntryLines[0];
                const subtitle = currentEntryLines[1] && !dateRangeRegex.test(currentEntryLines[1]) ? currentEntryLines[1] : '';
                const description = currentEntryLines.slice(subtitle ? 2 : 1).filter(l => l !== dateLine).join(' ').trim();

                entries.push({ title, subtitle, date: dateLine, description });
                currentEntryLines = [line];
            } else {
                currentEntryLines.push(line);
            }
        });

        // Add the last entry
        if (currentEntryLines.length > 0) {
            const dateLine = currentEntryLines.find(l => dateRangeRegex.test(l)) || '';
            const title = currentEntryLines[0] || 'N/A';
            const subtitle = currentEntryLines.length > 1 && !dateRangeRegex.test(currentEntryLines[1]) ? currentEntryLines[1] : '';
             const description = currentEntryLines.slice(subtitle ? 2 : 1).filter(l => l !== dateLine).join(' ').trim();
            entries.push({ title, subtitle, date: dateLine, description });
        }
        
        return entries;
    };
    
    const workExperienceParsed = parseEntries(experienceSectionLines);
    const educationParsed = parseEntries(educationSectionLines);

    const workExperience = workExperienceParsed.map(entry => {
        const [startDate, endDate] = entry.date.split(/\s*(-|to|–|—)\s*/).map(d => d.trim());
        return {
            company: entry.subtitle,
            title: entry.title,
            startDate: startDate || 'Date',
            endDate: endDate || 'Present',
            description: entry.description,
        };
    });

    const education = educationParsed.map(entry => {
        const [startDate, endDate] = entry.date.split(/\s*(-|to|–|—)\s*/).map(d => d.trim());
        return {
            institution: entry.title,
            degree: entry.subtitle,
            startDate: startDate || 'Date',
            endDate: endDate || 'Present',
            description: entry.description
        };
    });

    // Skills: split by commas, slashes, or bullet points, then process each line.
    const skills = skillsSectionLines
        .join(' ')
        .split(/, | \/ | • | \| /)
        .flatMap(skill => skill.split('\n'))
        .map(s => s.trim())
        .filter(s => s && s.length > 1 && s.length < 50) // Filter out noise
        .map(s => ({name: s}));


    return {
        fullName,
        email,
        phone,
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
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during parsing.';
    return NextResponse.json({ error: 'Failed to parse resume.', details: errorMessage }, { status: 500 });
  }
}

    