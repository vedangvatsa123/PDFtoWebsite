import { NextResponse, NextRequest } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = ['vatsvedang@gmail.com'];

// ── X (Twitter) OAuth 1.0a ────────────────────────────────────────────────
const X_CONSUMER_KEY = process.env.X_CONSUMER_KEY;
const X_CONSUMER_SECRET = process.env.X_CONSUMER_SECRET;
const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN;
const X_ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET;

const pct = (s: string) => encodeURIComponent(String(s));

function xOauthHeader(method: string, url: string, queryParams: Record<string, string> = {}) {
  const p: Record<string, string> = {
    oauth_consumer_key: X_CONSUMER_KEY!,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: X_ACCESS_TOKEN!,
    oauth_version: '1.0',
  };
  const allParams = { ...p, ...queryParams };
  const base = Object.keys(allParams).sort().map(k => `${pct(k)}=${pct(allParams[k])}`).join('&');
  const sigBase = `${method.toUpperCase()}&${pct(url)}&${pct(base)}`;
  const sigKey = `${pct(X_CONSUMER_SECRET!)}&${pct(X_ACCESS_TOKEN_SECRET!)}`;
  p.oauth_signature = crypto.createHmac('sha1', sigKey).update(sigBase).digest('base64');
  const hdr = Object.keys(p).filter(k => k.startsWith('oauth')).sort()
    .map(k => `${pct(k)}="${pct(p[k])}"`).join(', ');
  return `OAuth ${hdr}`;
}

async function fetchXUserMetrics(): Promise<any> {
  if (!X_CONSUMER_KEY || !X_ACCESS_TOKEN) return null;
  try {
    // First get user ID
    const meUrl = 'https://api.twitter.com/2/users/me';
    const meQp = { 'user.fields': 'public_metrics,created_at,description,profile_image_url' };
    const meAuth = xOauthHeader('GET', meUrl, meQp);
    const meRes = await fetch(`${meUrl}?${new URLSearchParams(meQp)}`, {
      headers: { Authorization: meAuth },
    });
    if (!meRes.ok) return null;
    const meData = await meRes.json();

    // Fetch recent tweets with metrics
    const userId = meData.data?.id;
    if (!userId) return meData.data || null;

    const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets`;
    const tweetsQp = { 'max_results': '100', 'tweet.fields': 'public_metrics,created_at' };
    const tweetsAuth = xOauthHeader('GET', tweetsUrl, tweetsQp);
    const tweetsRes = await fetch(`${tweetsUrl}?${new URLSearchParams(tweetsQp)}`, {
      headers: { Authorization: tweetsAuth },
    });

    let tweetMetrics = null;
    if (tweetsRes.ok) {
      const tweetsData = await tweetsRes.json();
      const tweets = tweetsData.data || [];
      tweetMetrics = {
        totalTweetsFetched: tweets.length,
        totalLikes: tweets.reduce((s: number, t: any) => s + (t.public_metrics?.like_count || 0), 0),
        totalRetweets: tweets.reduce((s: number, t: any) => s + (t.public_metrics?.retweet_count || 0), 0),
        totalReplies: tweets.reduce((s: number, t: any) => s + (t.public_metrics?.reply_count || 0), 0),
        totalImpressions: tweets.reduce((s: number, t: any) => s + (t.public_metrics?.impression_count || 0), 0),
        totalBookmarks: tweets.reduce((s: number, t: any) => s + (t.public_metrics?.bookmark_count || 0), 0),
        topTweets: tweets
          .sort((a: any, b: any) => (b.public_metrics?.impression_count || 0) - (a.public_metrics?.impression_count || 0))
          .slice(0, 5)
          .map((t: any) => ({
            id: t.id,
            text: t.text?.substring(0, 100),
            likes: t.public_metrics?.like_count || 0,
            retweets: t.public_metrics?.retweet_count || 0,
            impressions: t.public_metrics?.impression_count || 0,
            replies: t.public_metrics?.reply_count || 0,
            bookmarks: t.public_metrics?.bookmark_count || 0,
            createdAt: t.created_at,
          })),
      };
    }

    return {
      user: meData.data || null,
      tweetMetrics,
    };
  } catch (e) {
    console.error('X API error:', e);
    return null;
  }
}

// ── Bluesky API ────────────────────────────────────────────────────────────
async function fetchBlueskyStats(): Promise<any> {
  try {
    const handle = 'cv-in-bio.bsky.social';
    const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${handle}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      handle: data.handle,
      displayName: data.displayName,
      followersCount: data.followersCount || 0,
      followsCount: data.followsCount || 0,
      postsCount: data.postsCount || 0,
      avatar: data.avatar,
    };
  } catch (e) {
    console.error('Bluesky API error:', e);
    return null;
  }
}

// ── Read state files ────────────────────────────────────────────────────────
function readStateFile(filename: string): any {
  const paths = [
    join(process.cwd(), '.github/scripts', filename),
    join(process.cwd(), '.github', 'scripts', filename),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      try { return JSON.parse(readFileSync(p, 'utf8')); } catch { continue; }
    }
  }
  return null;
}

function readContentFile(filename: string): any {
  const p = join(process.cwd(), '.github/scripts', filename);
  if (existsSync(p)) {
    try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    // Auth check
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

    // Fetch live APIs in parallel
    const [xData, bskyData] = await Promise.all([
      fetchXUserMetrics(),
      fetchBlueskyStats(),
    ]);

    // Read state files
    const xState = readStateFile('x-state.json');
    const bskyState = readStateFile('bsky-state.json');
    const metaState = readStateFile('meta-state.json');
    const bufferState = readStateFile('buffer-state.json');
    const bloggerState = readStateFile('blogger-state.json');

    // Read content files
    const xContent = readContentFile('x-content.json');

    // Calculate queue stats
    const xQueue = {
      threads: { total: xContent?.threads?.length || 0, posted: xState?.threads?.index || 0 },
      insights: { total: xContent?.insights?.length || 0, posted: xState?.insights?.index || 0 },
      engagement: { total: xContent?.engagement?.length || 0, posted: xState?.engagement?.index || 0 },
      threadHistory: (xState?.threadHistory || []).map((t: any) => ({
        topic: t.topic,
        tweetCount: t.tweetIds?.length || 0,
        postedAt: t.postedAt,
      })),
      lastPostedAt: xState?.lastPostedAt || {},
    };

    const bskyQueue = {
      posted: bskyState?.index || 0,
      lastPostedAt: bskyState?.lastPostedAt || null,
    };

    const metaQueue = {
      facebook: { posted: metaState?.facebook?.index || 0 },
      instagram: { posted: metaState?.instagram?.index || 0 },
      threads: { posted: metaState?.threads?.index || 0 },
      lastPostedAt: metaState?.lastPostedAt || null,
    };

    const bufferQueue = {
      linkedin: bufferState?.linkedin || 0,
      instagram: bufferState?.instagram || 0,
      facebook: bufferState?.facebook || 0,
    };

    const bloggerQueue = {
      posted: bloggerState?.index || 0,
      lastPostedAt: bloggerState?.lastPostedAt || null,
      publishedCount: bloggerState?.published?.length || 0,
    };

    // Summary stats
    const totalPostsAcrossPlatforms =
      (xQueue.threads.posted + xQueue.insights.posted + xQueue.engagement.posted) +
      bskyQueue.posted +
      (metaQueue.facebook.posted + metaQueue.instagram.posted + metaQueue.threads.posted) +
      (bufferQueue.linkedin + bufferQueue.instagram + bufferQueue.facebook) +
      bloggerQueue.posted;

    const totalTweetsInThreads = (xState?.threadHistory || []).reduce(
      (s: number, t: any) => s + (t.tweetIds?.length || 0), 0
    );

    return NextResponse.json({
      summary: {
        totalPostsAcrossPlatforms,
        totalTweetsInThreads,
        activePlatforms: 7,
      },
      x: {
        live: xData,
        queue: xQueue,
      },
      bluesky: {
        live: bskyData,
        queue: bskyQueue,
      },
      meta: {
        queue: metaQueue,
      },
      buffer: {
        queue: bufferQueue,
      },
      blogger: {
        queue: bloggerQueue,
      },
    });
  } catch (error) {
    console.error('Social API error:', error);
    return NextResponse.json(
      { error: 'Internal error', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
