'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/auth';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Calendar as CalendarIcon, CheckCircle2, Clock, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';

export default function Web3SocialCalendar() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'twitter' | 'bluesky' | 'linkedin' | 'instagram'>('twitter');
  const user = useUser();

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();
        const { data: session } = await supabase.auth.getSession();
        const token = session.session?.access_token;
        if (!token) return;

        const res = await fetch('/api/admin/web3-social', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch web3 social schedule', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground w-6 h-6" /></div>;
  if (!data) return null;

  const { contentSchedule, publishState, bufferState } = data;
  const scheduleArray = Array.isArray(contentSchedule) ? contentSchedule : [];

  // Parse direct states
  const twitterPostedIds = new Set(publishState?.twitter?.posted || []);
  const blueskyPostedIds = new Set(publishState?.bluesky?.posted || []);

  // Filter schedule for each platform
  const getQueueList = (platform: string) => {
    return scheduleArray.map((post: any) => {
      let isPosted = false;
      let isScheduled = false;

      if (platform === 'twitter') isPosted = twitterPostedIds.has(post.id);
      if (platform === 'bluesky') isPosted = blueskyPostedIds.has(post.id);
      
      // Buffer handling (approximated based on what's available in Buffer state vs content length)
      if (platform === 'linkedin') {
        const postedHashesLength = bufferState?.linkedin?.postedHashes?.length || 0;
        const postIndex = scheduleArray.findIndex(p => p.id === post.id);
        if (postIndex < postedHashesLength) {
           isScheduled = true; // Buffer holds these
        }
      }
      
      if (platform === 'instagram') {
        const postedHashesLength = bufferState?.instagram?.postedHashes?.length || 0;
        const postIndex = scheduleArray.findIndex(p => p.id === post.id);
        if (postIndex < postedHashesLength) {
           isScheduled = true; 
        }
      }

      return {
        id: post.id,
        text: post[platform]?.text || 'No text defined for this platform',
        hasImage: !!post.image || !!post.imageUrl,
        hasVideo: !!post.videoUrl,
        isPosted,
        isScheduled,
        disabledForPlatform: !post[platform]
      };
    }).filter(p => !p.disabledForPlatform);
  };

  const tabs = [
    { id: 'twitter', label: 'Twitter / X' },
    { id: 'bluesky', label: 'Bluesky' },
    { id: 'linkedin', label: 'LinkedIn (Buffer)' },
    { id: 'instagram', label: 'Instagram (Buffer)' }
  ] as const;

  const currentList = getQueueList(activeTab);
  const postedCount = currentList.filter(p => p.isPosted || p.isScheduled).length;
  const totalCount = currentList.length;

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden my-8">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Web3-Jobs Social Schedule</h3>
        </div>
        <span className="text-sm text-muted-foreground">{postedCount} / {totalCount} completed</span>
      </div>

      <div className="flex border-b border-border overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-foreground text-foreground' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-0 max-h-[500px] overflow-y-auto">
        {currentList.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No posts found for {activeTab}.</div>
        ) : (
          <div className="divide-y divide-border">
            {currentList.map((post, idx) => (
              <div key={post.id} className={`p-4 flex gap-4 transition-colors hover:bg-muted/10 ${post.isPosted || post.isScheduled ? 'opacity-60' : ''}`}>
                <div className="mt-1">
                  {post.isPosted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : post.isScheduled ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">#{idx + 1}</span>
                    <span className="text-sm font-medium truncate">{post.id}</span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3 mb-2">{post.text}</p>
                  <div className="flex gap-2">
                    {post.hasImage && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full"><ImageIcon className="w-3 h-3" /> Image</span>}
                    {post.hasVideo && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full"><VideoIcon className="w-3 h-3" /> Video</span>}
                    {post.isPosted && <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">Published</span>}
                    {post.isScheduled && <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">In Buffer</span>}
                    {!post.isPosted && !post.isScheduled && <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">Queued</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
