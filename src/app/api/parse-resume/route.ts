
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
    
    // 1. Zero-Cost Firewall: Page Count
    const pdfData = await pdf(fileBuffer);
    if (pdfData.numpages > 10) {
      return NextResponse.json({ error: `This document is ${pdfData.numpages} pages long. Please upload a professional resume under 10 pages.` }, { status: 400 });
    }

    // --- 100% FORCED AI VISION ENGINE (v1 Stable) ---
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
       return NextResponse.json({ error: 'Production Error: GEMINI_API_KEY is missing. Check Vercel Settings.' }, { status: 500 });
    }

    try {
      console.log(`Initializing Gemini 1.5 Flash (Key Length: ${apiKey.length})`);
      const genAIInstance = new GoogleGenerativeAI(apiKey);
      
      // Use the stable model ID. 'gemini-1.5-flash' is the most compatible.
      const model = genAIInstance.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const base64Pdf = fileBuffer.toString('base64');
      const pdfPart = { inlineData: { data: base64Pdf, mimeType: 'application/pdf' } };

      const result = await model.generateContent([systemInstruction, pdfPart]);
      const responseText = result.response.text();
      
      let rawResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiStructuredData = JSON.parse(rawResponse);
      
      return NextResponse.json(aiStructuredData, { status: 200 });
    } catch (aiError) {
      console.error('LIVE PRODUCTION AI ERROR:', aiError);
      const message = aiError instanceof Error ? aiError.message : 'Unknown AI error';
      return NextResponse.json({ 
        error: `AI Engine failed (404/Auth): ${message}. Check Project/Region access for Gemini 1.5 Flash.`,
        source: 'ai_error_report'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Fatal API Error:', error);
    return NextResponse.json({ error: 'Failed to process resume document.' }, { status: 500 });
  }
}
