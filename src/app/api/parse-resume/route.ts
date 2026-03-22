import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { parseResumeText } from '@/lib/resume-parser';

const systemInstruction = `You are a strict, highly accurate JSON API extracting candidate resumes.
Return ONLY RAW JSON matching EXACTLY this structure (do not use markdown blocks):
{
  "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "", "website": "", "github": "", "linkedin": "" },
  "summary": "",
  "workExperience": [{ "company": "", "title": "", "startDate": "", "endDate": "", "description": "" }], 
  "education": [{ "institution": "", "degree": "", "fieldOfStudy": "", "startDate": "", "endDate": "", "description": "" }],
  "skills": [""],
  "customSections": []
}

CRITICAL RULES:
1. ONLY extract information that is explicitly present in the provided resume text. DO NOT hallucinate, guess, or invent ANY details or dummy placeholders.
2. If a section (like workExperience, education) doesn't exist, leave that array completely EMPTY ([]). Do NOT populate [] with dummy objects.
3. EXTRACT ALL PROFESSIONAL EXPERIENCE into "workExperience"! Even if it is labeled irregularly (e.g. 'Internships', 'Freelance', 'Partnerships', 'Self-Employed', 'Leadership'), aggressively map it to "workExperience" to ensure no primary job data is lost.
4. If the CV contains extra supplementary sections (e.g. 'Publications', 'Patents', 'Awards', 'Testimonials') map them purely into "customSections" using this schema: { "id": "1", "userProfileId": "", "sectionTitle": "Exact Section Name From CV", "order": 1, "items": [{ "id": "1", "title": "", "subtitle": "", "description": "", "date": "" }] }.
5. OCR CLEANING RULE: If the input contains garbled characters, aggressively apply reasoning to reconstruct the intended words. Maintain detailed descriptions and retain bullet point formatting.
DO NOT THROW ANY REAL WORK DATA AWAY!`;

// Supported file types
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
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

    if (file.name.toLowerCase().endsWith('.doc') || file.type === 'application/msword') {
      return NextResponse.json({ error: 'Legacy .doc files are not supported by the parser. Please save and upload your resume as a .pdf or .docx file.' }, { status: 400 });
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

    let requestBody;
    let pageCount = 0;
    let extractedText = '';
    let aiStructuredData: any = null;

    try {
      if (fileType === 'pdf') {
        let pdfData;
        try {
          pdfData = await pdf(fileBuffer);
        } catch (err: any) {
          if (err?.name === 'PasswordException' || err?.message?.toLowerCase().includes('password')) {
            return NextResponse.json({ error: 'This PDF is password-protected. Please unlock your resume and try again.' }, { status: 400 });
          }
          throw err;
        }
        
        pageCount = pdfData.numpages;
        extractedText = pdfData.text || '';
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
        if (fileType === 'docx') {
          try {
            const mammothResult = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = mammothResult.value;
          } catch (err) {
            return NextResponse.json({ error: 'This Word document appears to be corrupted or password-protected. Please save it as a PDF and try again.' }, { status: 400 });
          }
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
      
      let responseText = '';
      for (const part of parts) {
        if (part.text) responseText = part.text;
      }
      if (!responseText) throw new Error('Empty response from AI engine');

      let rawResponse = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      aiStructuredData = JSON.parse(rawResponse);

    } catch (aiError) {
      console.warn("AI extraction failed/rate-limited, attempting regex fallback...", aiError);
      
      if (!extractedText || extractedText.trim().length < 50) {
          const message = aiError instanceof Error ? aiError.message : 'Unknown error';
          return NextResponse.json({ error: `Parse failed: ${message}` }, { status: 500 });
      }
      
      // Fallback
      aiStructuredData = parseResumeText(extractedText);
    }
    
    // Resume processing after successful extraction (AI or Fallback)
    const duration = Date.now() - startTime;
    
    // ---------- Option C: Safe Slug Generation (No Aggressive Backend Upsert) ----------
      const supabaseUserClient = await createClient();
      const { data: { user } } = await supabaseUserClient.auth.getUser();

      let finalSlug;

      if (user) {
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Prioritize keeping their existing URL stable if they already have one
        const { data: currentProfile, error: profileErr } = await supabaseAdmin
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .maybeSingle();

        if (currentProfile && currentProfile.username) {
          finalSlug = currentProfile.username;
        } else {
          // 2. Generate a new universally unique slug for them using FIRST NAME only
          const rawFullName = aiStructuredData.personalInfo?.fullName || 'profile';
          const firstNameOnly = rawFullName.trim().split(/\s+/)[0].toLowerCase();
          
          const prefixSlug = firstNameOnly
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 40) || 'profile';

          finalSlug = prefixSlug;
          let isUnique = false;
          
          while (!isUnique) {
            const { data: existingProfile, error: existErr } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('username', finalSlug)
              .maybeSingle();
            
            // If the query failed (e.g., timeout), don't falsely assume uniqueness
            if (existErr) {
              console.error("Database connection issue assessing DB uniqueness", existErr);
              throw new Error("Unable to create a unique URL presently. Please try again.");
            }

            if (!existingProfile || existingProfile.id === user.id) {
              isUnique = true;
            } else {
              const suffix = Math.random().toString(36).substring(2, 6);
              finalSlug = `${prefixSlug}-${suffix}`;
            }
          }
        }
        
        // Inject the safe unique slug into the payload to allow the frontend to safely upsert and preview it
        if (!aiStructuredData.personalInfo) {
          aiStructuredData.personalInfo = {};
        }
        aiStructuredData.personalInfo.slug = finalSlug;
      }

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

  } catch (error) {
    console.error('Fatal API Error:', error);
    return NextResponse.json({ error: 'Failed to process resume.' }, { status: 500 });
  }
}
