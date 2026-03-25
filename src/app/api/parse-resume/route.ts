import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { parseResumeText } from '@/lib/resume-parser';

const systemInstruction = `You are a strict, highly accurate JSON API extracting candidate resumes.
Return ONLY RAW JSON matching EXACTLY this structure (do not use markdown blocks):
{
  "personalInfo": { "fullName": "", "email": "", "phone": "", "location": "", "website": "", "github": "", "linkedin": "", "additionalLinks": [{ "label": "", "url": "" }] },
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
4. CUSTOM SECTIONS RULE: If the CV contains ANY supplementary sections beyond work/education/skills, you MUST map them into "customSections". This includes but is not limited to: 'Awards', 'Achievements', 'Honors', 'Certifications', 'Licenses', 'Publications', 'Patents', 'Projects', 'Volunteering', 'Community Service', 'Languages', 'Interests', 'Hobbies', 'Testimonials', 'References', 'Courses', 'Training', 'Conferences', 'Memberships', 'Professional Affiliations', 'Research', 'Presentations', 'Extracurricular Activities', 'Competitions', 'Scholarships', 'Fellowships', 'Grants'. Use this schema: { "id": "1", "userProfileId": "", "sectionTitle": "Exact Section Name From CV", "order": 1, "items": [{ "id": "1", "title": "", "subtitle": "", "description": "", "date": "" }] }. EVERY distinct section in the CV that is not work/education/skills MUST appear as a separate customSection. Do NOT silently skip any section!
5. OCR CLEANING RULE: If the input contains garbled characters, aggressively apply reasoning to reconstruct the intended words. Maintain detailed descriptions and retain bullet point formatting.
6. LOCATION PRIVACY RULE: Do NOT extract full specific street addresses. ONLY output the generalized "City, Country" (e.g., "San Francisco, USA", "London, UK") for the personal location field!
7. LINKS RULE: Extract ALL URLs/links found anywhere in the CV. Put GitHub in "github", LinkedIn in "linkedin", and a personal website/portfolio in "website". ALL other links (ResearchGate, Google Scholar, Twitter/X, Behance, Dribbble, Medium, Stack Overflow, Kaggle, ORCID, YouTube, Facebook, Instagram, or any other URL) MUST go into "additionalLinks" with a human-readable "label" (e.g. "ResearchGate", "Google Scholar", "Twitter") and the full "url". Do NOT drop any link!
8. COMPLETENESS RULE: Count every distinct section heading in the CV. Every one must appear in your output (as workExperience, education, skills, or customSections). If your output has fewer sections than the CV, you are WRONG.
DO NOT THROW ANY REAL WORK DATA AWAY!`;

// Supported file types
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/rtf': 'rtf',
  'text/rtf': 'rtf',
  'text/plain': 'txt',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/heic': 'image',
  'image/heif': 'image',
};

// Rate Limiter: In-memory for guests (best-effort in serverless), Supabase-backed for auth users
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
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

async function isUserRateLimited(userId: string): Promise<boolean> {
  try {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const oneHourAgo = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const { count } = await supabaseAdmin
      .from('parse_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', oneHourAgo);
    return (count || 0) >= RATE_LIMIT;
  } catch {
    return false; // Fail open — don't block if DB is unreachable
  }
}

async function logParseEvent(userId: string | null, ip: string): Promise<void> {
  if (!userId) return;
  try {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabaseAdmin.from('parse_logs').insert({ user_id: userId, ip });
  } catch {
    // Non-fatal
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // Auth-based rate limiting (persistent across cold starts)
  let authUserId: string | null = null;
  try {
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (user) {
      authUserId = user.id;
      if (await isUserRateLimited(user.id)) {
        return NextResponse.json({ error: 'Too many requests. Max 10 uploads per hour.' }, { status: 429 });
      }
    }
  } catch { /* continue without auth rate limiting */ }

  // Fallback IP-based rate limiting (best-effort for guests)
  if (!authUserId && isRateLimited(ip)) {
    console.warn(`Rate limit hit: ${ip}`);
    return NextResponse.json({ error: 'Too many requests. Max 10 uploads per hour.' }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // .doc files and images are handled natively by Gemini's vision/document understanding

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    let fileType = ALLOWED_TYPES[file.type];
    // Fallback: check extension if MIME type not in map (some OS report wrong MIME for HEIC etc.)
    if (!fileType) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') fileType = 'pdf';
      else if (ext === 'docx') fileType = 'docx';
      else if (ext === 'doc') fileType = 'doc';
      else if (ext === 'rtf') fileType = 'rtf';
      else if (ext === 'txt') fileType = 'txt';
      else if (ext && ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext)) fileType = 'image';
      else return NextResponse.json({ error: 'Unsupported file type. Please upload your CV as PDF, Word, text, or image.' }, { status: 400 });
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

        // Use text-only path when pdf-parse got enough text (cheaper). Fall back to inline_data for scanned PDFs.
        if (extractedText && extractedText.trim().length >= 50) {
          requestBody = {
            contents: [{
              parts: [
                { text: `${systemInstruction}\n\nRESUME TEXT:\n${extractedText}` }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' }
          };
        } else {
          // Scanned/image PDF — send binary for Gemini Vision
          requestBody = {
            contents: [{
              parts: [
                { text: systemInstruction },
                { inline_data: { mime_type: 'application/pdf', data: fileBuffer.toString('base64') } }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' }
          };
        }

      } else if (fileType === 'image') {
        // Send image directly to Gemini Vision — it can read CV screenshots/photos
        const mimeType = file.type.startsWith('image/') ? file.type : 'image/jpeg';
        requestBody = {
          contents: [{
            parts: [
              { text: systemInstruction },
              { inline_data: { mime_type: mimeType, data: fileBuffer.toString('base64') } }
            ]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' }
        };

      } else if (fileType === 'doc') {
        // .doc files: try mammoth first, fall back to Gemini inline
        try {
          const mammothResult = await mammoth.extractRawText({ buffer: fileBuffer });
          extractedText = mammothResult.value;
        } catch (err) {
          // mammoth can't handle old .doc — try sending raw to Gemini
          extractedText = '';
        }
        
        if (extractedText && extractedText.trim().length >= 50) {
          requestBody = {
            contents: [{
              parts: [
                { text: `${systemInstruction}\n\nRESUME TEXT:\n${extractedText}` }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' }
          };
        } else {
          // If mammoth couldn't extract, send as binary to Gemini
          requestBody = {
            contents: [{
              parts: [
                { text: systemInstruction + '\n\nExtract the resume data from this document.' },
                { inline_data: { mime_type: 'application/msword', data: fileBuffer.toString('base64') } }
              ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 8192, responseMimeType: 'application/json' }
          };
        }

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

      // Retry loop for transient Gemini API failures (429 rate limit, 503 overloaded, timeouts)
      const MAX_RETRIES = 2;
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
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
            const errorData = await response.json().catch(() => ({}));
            const statusCode = response.status;
            const errorMsg = errorData.error?.message || `API Error ${statusCode}`;
            
            // Retry on transient errors (429 rate limit, 500 internal, 503 overloaded)
            if ((statusCode === 429 || statusCode >= 500) && attempt < MAX_RETRIES) {
              console.warn(`Gemini API returned ${statusCode}, retrying (attempt ${attempt + 1}/${MAX_RETRIES})...`);
              lastError = new Error(errorMsg);
              await new Promise(r => setTimeout(r, 1500 * (attempt + 1))); // 1.5s, then 3s backoff
              continue;
            }
            throw new Error(errorMsg);
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
          break; // Success — exit retry loop
          
        } catch (retryError) {
          lastError = retryError instanceof Error ? retryError : new Error('Unknown error');
          if (attempt < MAX_RETRIES && (lastError.name === 'AbortError' || lastError.message.includes('fetch'))) {
            console.warn(`Gemini request failed (attempt ${attempt + 1}), retrying...`, lastError.message);
            await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
            continue;
          }
          throw lastError;
        }
      }
      
      if (!aiStructuredData && lastError) throw lastError;

    } catch (aiError) {
      console.warn("AI extraction failed after retries, attempting regex fallback...", aiError);
      
      if (!extractedText || extractedText.trim().length < 50) {
          const message = aiError instanceof Error ? aiError.message : 'Unknown error';
          // For images, there's no text fallback — give a helpful hint
          if (fileType === 'image') {
            return NextResponse.json({ error: 'Could not read the image. Please try a clearer photo or upload your CV as a PDF instead.' }, { status: 500 });
          }
          return NextResponse.json({ error: `Parse failed: ${message}` }, { status: 500 });
      }
      
      // Fallback
      aiStructuredData = parseResumeText(extractedText);
    }
    
    // Resume processing after successful extraction (AI or Fallback)
    const duration = Date.now() - startTime;
    
    // ---------- Option C: Safe Slug Generation (Non-Fatal — frontend has its own fallback) ----------
    try {
      const supabaseUserClient = await createClient();
      const { data: { user } } = await supabaseUserClient.auth.getUser();

      if (user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 1. Prioritize keeping their existing URL stable if they already have one
        const { data: currentProfile } = await supabaseAdmin
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .maybeSingle();

        let finalSlug;
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
          let attempt = 0;
          
          while (!isUnique && attempt < 100) {
            const { data: existingProfile, error: existErr } = await supabaseAdmin
              .from('profiles')
              .select('id')
              .eq('username', finalSlug)
              .maybeSingle();
            
            if (existErr) {
              console.error("Slug uniqueness check failed, frontend will handle:", existErr);
              break; // Non-fatal — let frontend handle slug
            }

            if (!existingProfile || existingProfile.id === user.id) {
              isUnique = true;
            } else {
              attempt++;
              finalSlug = `${prefixSlug}${attempt}`;
            }
          }
        }
        
        // Inject the safe unique slug into the payload
        if (finalSlug) {
          if (!aiStructuredData.personalInfo) {
            aiStructuredData.personalInfo = {};
          }
          aiStructuredData.personalInfo.slug = finalSlug;
        }
      }
    } catch (slugError) {
      console.warn('Slug generation failed (non-fatal, frontend will handle):', slugError);
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

      // Log parse event for rate limiting (non-blocking)
      logParseEvent(authUserId, ip);

      return NextResponse.json(aiStructuredData, { status: 200 });

  } catch (error) {
    console.error('Fatal API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to process resume: ${message}` }, { status: 500 });
  }
}
