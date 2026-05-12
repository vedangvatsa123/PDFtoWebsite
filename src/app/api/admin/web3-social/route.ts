import { NextResponse, NextRequest } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
const ADMIN_EMAILS = ['vatsvedang@gmail.com'];

function readLocalJson(pathStr: string) {
  if (existsSync(pathStr)) {
    try {
      return JSON.parse(readFileSync(pathStr, 'utf8'));
    } catch (e) {
      return null;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'No token' }, { status: 403 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createAdminClient(supabaseUrl, serviceKey || anonKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const basePath = '/Users/vedang/web3jobs/Web3-Jobs/scripts/social';
    const contentSchedule = readLocalJson(join(basePath, 'content-schedule.json')) || [];
    const publishState = readLocalJson(join(basePath, 'publish-state.json')) || {};
    const bufferState = readLocalJson(join(basePath, 'buffer-refill-state.json')) || {};

    return NextResponse.json({
      contentSchedule,
      publishState,
      bufferState
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal error', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
