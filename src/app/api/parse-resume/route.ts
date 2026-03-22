
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { parseResumeText } from '@/lib/resume-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const systemInstruction = `You are a strict, highly accurate JSON API extracting candidate resumes.
Return ONLY RAW JSON matching EXACTLY this structure (do not use markdown blocks like \`\`\`json):
{
  "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "", "website": "", "github": "", "linkedin": "" },
  "summary": "",
  "workExperience": [{ "company": "", "title": "", "startDate": "", "endDate": "", "description": [""] }],
  "education": [{ "institution": "", "degree": "", "fieldOfStudy": "", "startDate": "", "endDate": "", "description": "" }],
  "skills": [""],
  "customSections": [{ "id": "1", "userProfileId": "", "sectionTitle": "Section Name", "order": 1, "items": [{ "id": "1", "title": "", "subtitle": "", "description": "", "date": "" }] }]
}

OCR CLEANING RULE: If the input PDF contains garbled characters (like Ä, Ê, ó), use your visual reasoning to determine the correct English word intended. For example, if you see 'ÄÊóOSGeoGoogle', correctly extract 'Google Summer of Code'.
If a field doesn't exist, leave it as an empty string or array.
CRITICAL RULE FOR UNMAPPED SECTIONS: If the CV contains extra sections like 'Publications', 'Patents', 'Hackathons', or 'Awards' that don't fit into Experience or Education, you MUST logically extract them into the "customSections" array. 
DO NOT throw data away!`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // --- ZERO-COST FIREWALL (Rule 1): Max 10MB File Size ---
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'This file is too large to be a CV. Please upload a resume under 10MB.' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File is not a PDF.' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // We execute local pdf-parse first to mathematically test the structure for free
    const data = await pdf(fileBuffer);
    
    // --- ZERO-COST FIREWALL (Rule 2): Max 10 Pages ---
    if (data.numpages > 10) {
      return NextResponse.json({ error: `This document is ${data.numpages} pages long. Standard CVs are under 10 pages. Please upload a professional resume.` }, { status: 400 });
    }

    // --- ZERO-COST FIREWALL (Rule 3): Keyword Heuristics (Only if PDF contains text) ---
    // If it's a scanned PDF (image only), it will have ~0 text, so we skip the keyword check safely!
    const extractedText = data.text.toLowerCase();
    if (extractedText.length > 100) {
      const professionalKeywords = ['experience', 'work', 'education', 'skills', 'university', 'college', 'job', 'project', 'resume', 'cv'];
      const hasKeywords = professionalKeywords.some(keyword => extractedText.includes(keyword));
      
      if (!hasKeywords) {
        return NextResponse.json({ error: 'This file lacks fundamental professional identifiers (like "Experience" or "Education"). It appears to be a random document, book, or essay. Please upload a valid CV.' }, { status: 400 });
      }
    }

    // 1. Primary Engine: Smart Multimodal AI Parsing (Handles Scanned PDFs & Images)
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        // Convert the raw PDF binary into a base64 encoded stream so Gemini can visually "see" the CV
        const base64Pdf = fileBuffer.toString('base64');
        const pdfPart = {
          inlineData: {
            data: base64Pdf,
            mimeType: 'application/pdf',
          },
        };

        const result = await model.generateContent([systemInstruction, pdfPart]);
        let rawResponse = result.response.text();
        
        // Clean markdown backticks natively if model hallucinates them
        rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiStructuredData = JSON.parse(rawResponse);
        
        return NextResponse.json(aiStructuredData, { status: 200 });
      } catch (aiError) {
        console.warn('AI Parsing encountered a syntax failure, executing native local algorithmic fallback immediately:', aiError);
      }
    }

    // 2. Fallback Engine: Fast Local Mathematical Regex
    // This strictly executes if AI fails, relying strictly on whatever raw text it can rip from the file bytes.
    const fallbackStructuredData = parseResumeText(data.text);
    return NextResponse.json(fallbackStructuredData, { status: 200 });

  } catch (error) {
    console.error('Error parsing resume:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to parse resume.', details: errorMessage }, { status: 500 });
  }
}
