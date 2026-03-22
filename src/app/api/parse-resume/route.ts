
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
    
    // 1. Initial Local Text Extraction
    const pdfData = await pdf(fileBuffer);
    
    // --- ZERO-COST FIREWALL (Rule 2): Max 10 Pages ---
    if (pdfData.numpages > 10) {
      return NextResponse.json({ error: `This document is ${pdfData.numpages} pages long. Standard CVs are under 10 pages. Please upload a professional resume.` }, { status: 400 });
    }

    const extractedText = pdfData.text;
    
    // --- ZERO-COST FIREWALL (Rule 3): Keyword Heuristics ---
    const lowerExtractedText = extractedText.toLowerCase();
    if (lowerExtractedText.length > 100) {
      const professionalKeywords = ['experience', 'work', 'education', 'skills', 'university', 'college', 'job', 'project', 'resume', 'cv'];
      const hasKeywords = professionalKeywords.some(keyword => lowerExtractedText.includes(keyword));
      if (!hasKeywords) {
        return NextResponse.json({ error: 'This file lacks fundamental professional identifiers (like "Experience" or "Education"). Please upload a valid CV.' }, { status: 400 });
      }
    }

    // 2. Intelligent Hybrid Analysis
    const localParsed = parseResumeText(extractedText);
    
    // Aggressive Garbled Detection: Any non-standard/binary-looking characters trigger Vision.
    // We look for common PDF encoding artifacts: ÄÊó, but also control chars and high-count symbols.
    const isGarbled = /[ÄÊó\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/.test(extractedText) || 
                     (extractedText.match(/[^a-zA-Z0-9\s.,!?;:'"()\-\/]/g)?.length ?? 0) > (extractedText.length * 0.05);
    
    const wordCount = extractedText.split(/\s+/).length;
    
    // 3. Adaptive AI Pathway (The Mix)
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        let response;
        if (!isGarbled && wordCount > 50) {
          // MODE A: Clean Text Pathway (Cheapest)
          const prompt = `${systemInstruction}\n\nRAW TEXT:\n${extractedText}\n\nLOCAL PARSE HINTS:\n${JSON.stringify(localParsed)}`;
          response = await model.generateContent(prompt);
          console.log('Mode: Clean Text');
        } else {
          // MODE B: High-Fidelity Vision Pathway (Safest)
          const base64Pdf = fileBuffer.toString('base64');
          const pdfPart = { inlineData: { data: base64Pdf, mimeType: 'application/pdf' } };
          response = await model.generateContent([systemInstruction, pdfPart]);
          console.log('Mode: High-Fidelity Vision');
        }

        let rawResponse = response.response.text();
        rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiStructuredData = JSON.parse(rawResponse);
        
        return NextResponse.json({ 
          ...aiStructuredData, 
          source: isGarbled ? 'hybrid_vision' : 'hybrid_text' 
        }, { status: 200 });
        
      } catch (aiError) {
        console.warn('AI Hybrid Pathway failed:', aiError);
      }
    }

    // 4. Absolute Fallback: Basic Local Extraction
    return NextResponse.json({ ...localParsed, source: 'local_fallback' }, { status: 200 });

  } catch (error) {
    console.error('Error parsing resume:', error);
    return NextResponse.json({ error: 'Failed to parse resume.' }, { status: 500 });
  }
}
