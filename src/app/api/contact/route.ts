import { NextResponse, NextRequest } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const VALID_PURPOSES = ['feedback', 'partnership', 'support', 'bug-report', 'feature-request', 'other'];

const PURPOSE_LABELS: Record<string, string> = {
  'feedback': 'Feedback',
  'partnership': 'Partnership',
  'support': 'Support',
  'bug-report': 'Bug Report',
  'feature-request': 'Feature Request',
  'other': 'Other',
};

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

    const cleanEmail = email.trim().toLowerCase();
    const cleanMessage = message.trim();
    const purposeLabel = PURPOSE_LABELS[purpose] || purpose;

    // 1. Save to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createAdminClient(supabaseUrl, serviceKey || anonKey);

    const { error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        email: cleanEmail,
        purpose,
        message: cleanMessage,
      });

    if (insertError) {
      console.error('Contact submission insert error:', insertError);
      return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 });
    }

    // 2. Send email notification via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: 'CVin.Bio Contact <hi@cvin.bio>',
          to: 'hi@cvin.bio',
          subject: `[CVin.Bio Contact] ${purposeLabel} from ${cleanEmail}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
              <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 16px 0; color: #111;">New Contact Submission</h2>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #333;">
                <tr>
                  <td style="padding: 8px 12px; font-weight: 600; color: #666; width: 80px; vertical-align: top;">From</td>
                  <td style="padding: 8px 12px;"><a href="mailto:${cleanEmail}" style="color: #4F46E5;">${cleanEmail}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: 600; color: #666; vertical-align: top;">Purpose</td>
                  <td style="padding: 8px 12px;">
                    <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: #F3F4F6; font-size: 12px; font-weight: 500;">${purposeLabel}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: 600; color: #666; vertical-align: top;">Message</td>
                  <td style="padding: 8px 12px; white-space: pre-wrap; line-height: 1.5;">${cleanMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
                </tr>
              </table>
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0 12px;" />
              <p style="font-size: 11px; color: #9CA3AF; margin: 0;">Sent from CVin.Bio contact form</p>
            </div>
          `,
        });
      } catch (emailErr) {
        // Email is best-effort — don't fail the request if email fails
        console.error('Resend email error:', emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
