import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import fs from 'fs';
import path from 'path';

const ADMIN_EMAILS = ['vatsvedang@gmail.com'];
const CONTENT_FILE = path.join(/*turbopackIgnore: true*/ process.cwd(), '.github', 'scripts', 'x-content.json');
const BUFFER_CONTENT_FILE = path.join(/*turbopackIgnore: true*/ process.cwd(), '.github', 'scripts', 'buffer-content.json');

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!fs.existsSync(CONTENT_FILE)) {
      return NextResponse.json({ error: 'Content file not found' }, { status: 404 });
    }

    const content = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'));
    let bufferContent = { linkedin: [], instagram: [], facebook: [] };
    if (fs.existsSync(BUFFER_CONTENT_FILE)) {
      bufferContent = JSON.parse(fs.readFileSync(BUFFER_CONTENT_FILE, 'utf8'));
    }

    // Try to get states to know what is posted vs upcoming
    let xState = { threads: { index: 0 }, insights: { index: 0 }, engagement: { index: 0 } };
    try { xState = JSON.parse(fs.readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), '.github', 'scripts', 'x-state.json'), 'utf8')); } catch(e){}

    let bskyState = { index: 0 };
    try { bskyState = JSON.parse(fs.readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), '.github', 'scripts', 'bsky-state.json'), 'utf8')); } catch(e){}

    let metaState = { facebook: { index: 0 }, instagram: { index: 0 }, threads: { index: 0 } };
    try { metaState = JSON.parse(fs.readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), '.github', 'scripts', 'meta-state.json'), 'utf8')); } catch(e){}

    let bufferState = { linkedin: { index: 0 }, instagram: { index: 0 }, facebook: { index: 0 } };
    try { bufferState = JSON.parse(fs.readFileSync(path.join(/*turbopackIgnore: true*/ process.cwd(), '.github', 'scripts', 'buffer-state.json'), 'utf8')); } catch(e){}

    return NextResponse.json({
      content,
      bufferContent,
      states: {
        x: xState,
        bsky: bskyState,
        meta: metaState,
        buffer: bufferState
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, bufferContent } = await req.json();
    if (content) {
      fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
    }
    if (bufferContent) {
      fs.writeFileSync(BUFFER_CONTENT_FILE, JSON.stringify(bufferContent, null, 2));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
