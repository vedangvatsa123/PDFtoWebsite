import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID!; // e.g. "@techjobsdaily"
const CRON_SECRET = process.env.CRON_SECRET || 'cvinbio-tg-2026';
const CTA_URL = 'https://cvin.bio/?utm_source=social&utm_medium=telegram&utm_campaign=techjobsdaily';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Format all jobs into a single batch message */
function formatBatchMessage(jobs: any[]): string {
  return jobs.map(job => {
    const company = escapeHtml(job.company || 'Unknown');
    const title = escapeHtml(job.title || 'Untitled');
    const url = job.apply_url || '';
    return `• ${company} is hiring <a href="${url}">${title}</a>`;
  }).join('\n');
}

/** Send a batch message to Telegram with inline keyboard button */
async function sendBatchToTelegram(text: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHANNEL_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Turn your CV into a Website', url: CTA_URL }],
        ],
      },
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error('Telegram send failed:', data);
    return false;
  }
  return true;
}

export async function GET(request: NextRequest) {
  // Simple auth check — cron-job.org will send this as a query param
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
  }

  // Fetch jobs published in the last 24 hours that haven't been posted yet
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, company, location, job_type, salary, tags, apply_url, published_at')
    .gte('published_at', twentyFourHoursAgo)
    .is('telegram_posted_at', null)
    .not('company', 'ilike', '%Gopuff%')
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Supabase query error:', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ message: 'No new jobs to post', posted: 0 });
  }

  // Send as a single batch message
  const message = formatBatchMessage(jobs);
  const success = await sendBatchToTelegram(message);

  if (success) {
    // Mark all jobs as posted
    const ids = jobs.map(j => j.id);
    await supabase
      .from('jobs')
      .update({ telegram_posted_at: new Date().toISOString() })
      .in('id', ids);

    return NextResponse.json({
      message: `Posted ${jobs.length} jobs to Telegram`,
      posted: jobs.length,
      total_found: jobs.length,
    });
  }

  return NextResponse.json({
    message: 'Failed to post to Telegram',
    posted: 0,
    total_found: jobs.length,
  }, { status: 500 });
}
