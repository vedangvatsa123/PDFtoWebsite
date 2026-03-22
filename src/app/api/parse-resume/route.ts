import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
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

OCR CLEANING RULE: If the input contains garbled characters, use your reasoning to determine the correct word intended.
If a field doesn't exist, leave it as an empty string or array.
CRITICAL RULE FOR UNMAPPED SECTIONS: If the CV contains extra sections like 'Publications', 'Patents', 'Hackathons', or 'Awards' that don't fit into Experience or Education, you MUST logically extract them into the "customSections" array.
DO NOT throw data away!`;

// Supported file types
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/rtf': 'rtf',
  'text/rtf': 'rtf',
  'text/plain': 'txt',
};

// Rate Limiter: Max 5 parses per IP per hour
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests. Max 5 uploads per hour.' }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    const fileType = ALLOWED_TYPES[file.type];
    if (!fileType) {
      return NextResponse.json({ error: 'Unsupported file type. Please upload your CV in a common format.' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const startTime = Date.now();

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is missing.' }, { status: 500 });
    }

    try {
      let requestBody;
      let pageCount = 0;

      if (fileType === 'pdf') {
        // PDF: Vision Mode (send binary for visual analysis)
        const pdfData = await pdf(fileBuffer);
        pageCount = pdfData.numpages;
        if (pdfData.numpages > 10) {
          return NextResponse.json({ error: `Document is ${pdfData.numpages} pages. Max 10.` }, { status: 400 });
        }

        requestBody = {
          contents: [{
            parts: [
              { text: systemInstruction },
              { inline_data: { mime_type: 'application/pdf', data: fileBuffer.toString('base64') } }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' }
        };

      } else {
        // DOC/DOCX/RTF/TXT: Extract text, then send to AI
        let extractedText = '';

        if (fileType === 'doc' || fileType === 'docx') {
          const mammothResult = await mammoth.extractRawText({ buffer: fileBuffer });
          extractedText = mammothResult.value;
        } else if (fileType === 'rtf') {
          // RTF: strip formatting tags and extract plain text
          const rtfContent = fileBuffer.toString('utf-8');
          extractedText = rtfContent
            .replace(/\\[a-z]+\d*\s?/gi, '')
            .replace(/[{}]/g, '')
            .replace(new RegExp("\\\\'[0-9a-f]{2}", 'gi'), '')
            .trim();
        } else {
          // TXT: direct read
          extractedText = fileBuffer.toString('utf-8');
        }

        if (!extractedText || extractedText.trim().length < 50) {
          return NextResponse.json({ error: 'Could not extract enough text from this document.' }, { status: 400 });
        }

        requestBody = {
          contents: [{
            parts: [
              { text: `${systemInstruction}\n\nRESUME TEXT:\n${extractedText}` }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' }
        };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API Error ${response.status}`);
      }

      const result = await response.json();
      const parts = result.candidates?.[0]?.content?.parts || [];
      
      // Gemini 2.5 Flash may return multiple parts (thinking + response). Get the last text part.
      let responseText = '';
      for (const part of parts) {
        if (part.text) responseText = part.text;
      }
      if (!responseText) throw new Error('Empty response from AI engine');

      let rawResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiStructuredData = JSON.parse(rawResponse);

      const duration = Date.now() - startTime;
      console.log(JSON.stringify({
        event: 'cv_parse_success',
        fileType,
        fileSizeKB: Math.round(file.size / 1024),
        pageCount,
        durationMs: duration,
        sectionsFound: {
          work: aiStructuredData.workExperience?.length || 0,
          education: aiStructuredData.education?.length || 0,
          skills: aiStructuredData.skills?.length || 0,
          custom: aiStructuredData.customSections?.length || 0,
        },
        ip,
      }));

      return NextResponse.json(aiStructuredData, { status: 200 });
    } catch (aiError) {
      const duration = Date.now() - startTime;
      const message = aiError instanceof Error ? aiError.message : 'Unknown error';
      console.log(JSON.stringify({
        event: 'cv_parse_failure',
        fileType,
        fileSizeKB: Math.round(file.size / 1024),
        durationMs: duration,
        error: message,
        ip,
      }));
      return NextResponse.json({ error: `Parse failed: ${message}` }, { status: 500 });
    }

  } catch (error) {
    console.error('Fatal API Error:', error);
    return NextResponse.json({ error: 'Failed to process resume.' }, { status: 500 });
  }
}
