import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// One-time setup endpoint - creates the email_events table
// DELETE this file after the table is created
export async function GET() {
  try {
    // Check if table exists
    const { error: checkError } = await supabase.from('email_events').select('id').limit(1);
    
    if (checkError && checkError.code === 'PGRST205') {
      // Table doesn't exist - create via raw SQL using pg_net or rpc
      // Since we can't run raw SQL via supabase-js, we'll use the REST approach
      // to create via a migration
      return NextResponse.json({
        status: 'table_missing',
        message: 'Please create the email_events table in Supabase SQL editor',
        sql: `CREATE TABLE IF NOT EXISTS email_events (
  id bigserial PRIMARY KEY,
  action text NOT NULL,
  campaign text,
  email text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON email_events FOR ALL USING (true);`
      });
    }

    // Table exists - test insert
    const { error: insertError } = await supabase.from('email_events').insert({
      action: 'test',
      campaign: 'setup_test',
      email: 'test@test.com',
    });

    if (insertError) {
      return NextResponse.json({ status: 'error', error: insertError.message });
    }

    // Clean up test
    await supabase.from('email_events').delete().eq('campaign', 'setup_test');

    return NextResponse.json({ status: 'ok', message: 'email_events table is ready!' });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', error: e.message });
  }
}
