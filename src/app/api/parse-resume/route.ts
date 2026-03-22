
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { parseResumeText } from '@/lib/resume-parser';

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

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'This file is too large. Please upload a resume under 10MB.' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File is not a PDF.' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdf(fileBuffer);
    
    if (pdfData.numpages > 10) {
      return NextResponse.json({ error: `Document is ${pdfData.numpages} pages long. Max 10 pages.` }, { status: 400 });
    }

    // --- THE DEFINITIVE FIX: DIRECT REST API CALL (v1 Stable) ---
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
       return NextResponse.json({ error: 'Production Error: GEMINI_API_KEY is missing. Check Vercel Settings.' }, { status: 500 });
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: systemInstruction },
                {
                  inline_data: {
                    mime_type: 'application/pdf',
                    data: fileBuffer.toString('base64')
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.1,
              topP: 0.95,
              topK: 64,
              maxOutputTokens: 65536,
              responseMimeType: 'application/json'
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API Error ${response.status}`);
      }

      const result = await response.json();
      const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) throw new Error('Empty response from AI engine');
      
      let rawResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiStructuredData = JSON.parse(rawResponse);
      
      return NextResponse.json(aiStructuredData, { status: 200 });
    } catch (aiError) {
      console.error('ULTIMATE REST FAILURE:', aiError);
      const message = aiError instanceof Error ? aiError.message : 'Unknown AI error';
      return NextResponse.json({ 
        error: `Definitive Repair Mode Failed: ${message}.`,
        source: 'rest_api_failure'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Fatal API Error:', error);
    return NextResponse.json({ error: 'Failed to process resume document.' }, { status: 500 });
  }
}
