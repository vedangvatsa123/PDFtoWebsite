import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

export async function DELETE() {
  try {
    // 1. Verify the user is authenticated via their session cookie
    const supabaseUser = await createClient();
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Use service role key to bypass RLS and delete everything
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Delete profile row
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileDeleteError) {
      console.error('Profile deletion failed:', profileDeleteError);
      return NextResponse.json({ error: profileDeleteError.message }, { status: 500 });
    }

    // 4. Delete auth user (requires service role)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      console.error('Auth user deletion failed:', authDeleteError);
      // Profile is already deleted, log the orphan but don't fail the user
      return NextResponse.json({ error: 'Profile deleted but auth cleanup failed. Contact support.' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Account deletion error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
