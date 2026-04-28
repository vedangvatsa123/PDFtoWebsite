import { NextResponse } from 'next/server';
import { getPlatformStats } from '@/lib/get-platform-stats';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cvin.bio';
  const stats = await getPlatformStats();
  
  return NextResponse.json({
    schema_version: 'v1',
    name_for_human: 'CVin.Bio',
    name_for_model: 'cvinbio',
    description_for_human: `Convert your CV to a professional website. Browse ${stats.jobCountDisplay} tech jobs at ${stats.companyCountDisplay} companies with AI skill matching.`,
    description_for_model: `CVin.Bio converts PDF resumes into professional web profiles and provides a job board with ${stats.jobCountDisplay} tech listings from ${stats.companyCountDisplay} companies (OpenAI, Stripe, Anthropic, Cloudflare, etc). Use this to find tech jobs, company career pages, or information about the tech job market. The site also publishes research reports on tech hiring trends, layoffs, and remote work.`,
    auth: { type: 'none' },
    api: {
      type: 'openapi',
      url: `${siteUrl}/llms.txt`,
    },
    logo_url: `${siteUrl}/opengraph-image`,
    contact_email: 'hello@cvin.bio',
    legal_info_url: `${siteUrl}/terms`,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
