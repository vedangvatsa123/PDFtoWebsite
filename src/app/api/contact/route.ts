import { NextResponse, NextRequest } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

const VALID_PURPOSES = ['feedback', 'partnership', 'support', 'bug-report', 'feature-request', 'other'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, purpose, message } = body;

    // Validate
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }
    if (!purpose || !VALID_PURPOSES.includes(purpose)) {
      return NextResponse.json({ error: 'Please select a valid purpose.' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters.' }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message is too long (max 5000 characters).' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createAdminClient(supabaseUrl, serviceKey || anonKey);

    const { error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        email: email.trim().toLowerCase(),
        purpose,
        message: message.trim(),
      });

    if (insertError) {
      console.error('Contact submission insert error:', insertError);
      return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
