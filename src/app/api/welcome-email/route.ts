import { NextResponse, NextRequest } from 'next/server';
import { Resend } from 'resend';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Auth check — only authenticated users can trigger their own welcome email
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createAdminClient(supabaseUrl, serviceKey || anonKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug } = body;
    const firstName = (name || 'there').split(' ')[0];
    const profileUrl = `https://cvin.bio/${slug || ''}`;

    const resend = new Resend(resendKey);

    await resend.emails.send({
      from: 'CVin.Bio <hi@cvin.bio>',
      to: user.email,
      subject: `Welcome to CVin.Bio, ${firstName}! 🎉`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1e1b4b,#4338ca);padding:40px 32px 32px;text-align:center;">
            <p style="margin:0;font-size:14px;font-weight:600;letter-spacing:1.5px;color:rgba(199,210,254,0.9);text-transform:uppercase;">CVin.Bio</p>
            <h1 style="margin:16px 0 0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">
              Welcome, ${firstName}!
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
              Your professional profile is live. Share a single link instead of attaching PDFs — recruiters, clients, and collaborators can see your experience instantly.
            </p>

            <!-- Profile Link Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="background:#f3f4f6;border-radius:8px;padding:16px 20px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600;">Your Profile</p>
                  <a href="${profileUrl}" style="font-size:16px;font-weight:600;color:#4338ca;text-decoration:none;">${profileUrl.replace('https://', '')}</a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#111827;">
              Quick tips to stand out:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr>
                <td style="padding:8px 0;font-size:14px;color:#374151;line-height:1.5;">
                  <span style="display:inline-block;width:24px;height:24px;background:#eef2ff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#4338ca;margin-right:10px;vertical-align:middle;">1</span>
                  <strong>Add a profile photo</strong> — profiles with photos get 3× more views
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-size:14px;color:#374151;line-height:1.5;">
                  <span style="display:inline-block;width:24px;height:24px;background:#eef2ff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#4338ca;margin-right:10px;vertical-align:middle;">2</span>
                  <strong>Write a summary</strong> — a few sentences about what you do
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-size:14px;color:#374151;line-height:1.5;">
                  <span style="display:inline-block;width:24px;height:24px;background:#eef2ff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#4338ca;margin-right:10px;vertical-align:middle;">3</span>
                  <strong>Add your skills</strong> — helps people find you for the right roles
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;font-size:14px;color:#374151;line-height:1.5;">
                  <span style="display:inline-block;width:24px;height:24px;background:#eef2ff;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#4338ca;margin-right:10px;vertical-align:middle;">4</span>
                  <strong>Share your link</strong> — on LinkedIn, X, WhatsApp, or your email signature
                </td>
              </tr>
            </table>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 16px;">
                  <a href="https://cvin.bio/editor" style="display:inline-block;padding:12px 32px;background:#4338ca;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
                    Complete Your Profile →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
              Built with care by <a href="https://cvin.bio" style="color:#6366f1;text-decoration:none;">CVin.Bio</a><br/>
              Turn your CV into a website in seconds.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Welcome email error:', error);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
