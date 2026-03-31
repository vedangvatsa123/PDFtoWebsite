import { NextResponse, NextRequest } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';

const reports: Record<string, { title: string; path: string; fullPath: string; tagline: string; pdf: string }> = {
  'remote-talent': {
    title: 'The Remote Talent Report 2026',
    path: '/remote-talent-report',
    fullPath: '/remote-talent-report',
    pdf: '/reports/CVin-Bio-Remote-Talent-Report-2026.pdf',
    tagline: '34 million Americans work remotely. Companies offering flexibility see 3x larger candidate pools.',
  },
  'layoffs': {
    title: 'The Tech Layoffs Report 2026',
    path: '/layoffs-report',
    fullPath: '/layoffs-report?access=confirmed',
    pdf: '/reports/CVin-Bio-Tech-Layoffs-Report-2026.pdf',
    tagline: '750,000+ tech workers displaced since 2020. Who is cutting, why, and what happens next.',
  },
};

function buildUserEmail(reportKey: string, recipientEmail: string) {
  const r = reports[reportKey] || reports['remote-talent'];
  const reportUrl = `${siteUrl}${r.path}`;
  const fullReportUrl = `${siteUrl}${r.fullPath}`;
  const pdfUrl = `${siteUrl}${r.pdf}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#18181b;padding:32px 40px;">
            <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#a1a1aa;">CVin.Bio Research</p>
            <h1 style="margin:12px 0 0;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">${r.title}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 24px;">
             <p style="margin:0 0 16px;font-size:15px;color:#3f3f46;line-height:1.7;">
               Please confirm your email to unlock the full report.
             </p>
             <p style="margin:0 0 28px;font-size:14px;color:#71717a;line-height:1.7;">
               ${r.tagline}
             </p>
             <!-- CTA Button -->
             <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
               <tr>
                 <td style="background:#18181b;border-radius:8px;padding:14px 32px;">
                   <a href="${fullReportUrl}" target="_blank" style="font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;display:inline-block;">
                     Confirm &amp; read the full report &rarr;
                   </a>
                 </td>
               </tr>
             </table>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
              <tr>
                <td style="border:1px solid #e4e4e7;border-radius:8px;padding:12px 28px;">
                  <a href="${pdfUrl}" target="_blank" style="font-size:13px;font-weight:500;color:#3f3f46;text-decoration:none;display:inline-block;">
                    &#128196; Download PDF
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;text-align:center;">
              Or read online: <a href="${fullReportUrl}" style="color:#71717a;">${fullReportUrl}</a>
            </p>
          </td>
        </tr>
        <!-- Divider -->
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f4f4f5;margin:0;"></td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px 32px;">
            <p style="margin:0 0 8px;font-size:13px;color:#71717a;line-height:1.6;">
              While you are here, check out <a href="${siteUrl}/jobs" style="color:#18181b;font-weight:600;text-decoration:underline;">6,000+ open roles</a> on our job board.
            </p>
            <p style="margin:0;font-size:11px;color:#a1a1aa;">
              CVin.Bio &middot; <a href="${siteUrl}" style="color:#a1a1aa;">cvin.bio</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, report } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const reportKey = (report && reports[report]) ? report : 'remote-talent';
    const r = reports[reportKey];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createAdminClient(supabaseUrl, serviceKey || anonKey);

    const { error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        email: cleanEmail,
        purpose: 'report-download',
        message: `${r.title} download request`,
      });

    if (insertError) {
      console.error('Report download insert error:', insertError);
      return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const resend = new Resend(resendKey);

      // 1. Send report to the user
      try {
        await resend.emails.send({
          from: 'CVin.Bio <hi@cvin.bio>',
          to: cleanEmail,
          subject: `Confirm your email: ${r.title}`,
          html: buildUserEmail(reportKey, cleanEmail),
        });
      } catch (userEmailErr) {
        console.error('User email error:', userEmailErr);
      }

      // 2. Notify admin
      try {
        await resend.emails.send({
          from: 'CVin.Bio <hi@cvin.bio>',
          to: 'hi@cvin.bio',
          subject: `[Report Download] ${cleanEmail} — ${r.title}`,
          html: `
            <div style="font-family:-apple-system,sans-serif;padding:24px;">
              <h2 style="font-size:16px;margin:0 0 12px;">New Report Download</h2>
              <p style="color:#666;font-size:14px;">${r.title}</p>
              <p style="font-size:14px;"><a href="mailto:${cleanEmail}" style="color:#18181b;">${cleanEmail}</a></p>
            </div>
          `,
        });
      } catch (adminEmailErr) {
        console.error('Admin email error:', adminEmailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Report download API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
