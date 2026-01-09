
import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import { parseResume } from '@/ai/flows/parse-resume-flow';

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
    
    // Use the new AI-powered parser
    const structuredData = await parseResume(data.text);
    
    return NextResponse.json(structuredData, { status: 200 });

  } catch (error) {
    console.error('Error parsing resume with AI:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during AI parsing.';
    return NextResponse.json({ error: 'Failed to parse resume.', details: errorMessage }, { status: 500 });
  }
}
