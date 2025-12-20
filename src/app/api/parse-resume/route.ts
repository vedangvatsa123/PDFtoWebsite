
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

// A very basic parser. This is a starting point and will need to be made more robust.
const parseResumeText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    // Basic heuristics to find sections
    const experienceIndex = lines.findIndex(line => line.toLowerCase().includes('experience'));
    const educationIndex = lines.findIndex(line => line.toLowerCase().includes('education'));
    const skillsIndex = lines.findIndex(line => line.toLowerCase().includes('skills'));

    // Basic data extraction - THIS IS A SIMPLISTIC PLACEHOLDER
    const summary = lines.slice(1, experienceIndex > -1 ? experienceIndex : 3).join(' ');
    const fullName = lines[0]; // Assume first line is the name

    // In a real implementation, you would use more complex logic or regex to parse these sections.
    const workExperience = experienceIndex > -1 
        ? [{ id: 'work1', company: 'Extracted Company', title: 'Extracted Title', startDate: 'Jan 2020', endDate: 'Present', description: lines.slice(experienceIndex + 1, educationIndex > -1 ? educationIndex : experienceIndex + 3).join(' ') }] 
        : [];
    
    const education = educationIndex > -1 
        ? [{ id: 'edu1', institution: 'Extracted University', degree: 'Extracted Degree', startDate: 'Sep 2016', endDate: 'May 2020', description: lines.slice(educationIndex + 1, skillsIndex > -1 ? skillsIndex : educationIndex + 3).join(' ') }]
        : [];

    const skills = skillsIndex > -1
        ? lines.slice(skillsIndex + 1, skillsIndex + 4).map((skill, i) => ({ id: `skill${i}`, name: skill.trim() }))
        : [];


    return {
        fullName,
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

    // Here you would implement your robust text parsing logic.
    // For now, we'll use a very basic placeholder parser.
    const structuredData = parseResumeText(data.text);
    
    return NextResponse.json(structuredData, { status: 200 });

  } catch (error) {
    console.error('Error parsing resume:', error);
    return NextResponse.json({ error: 'Failed to parse resume.' }, { status: 500 });
  }
}
