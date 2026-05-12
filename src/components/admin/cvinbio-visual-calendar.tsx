'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/auth';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type QueueType = 'threads' | 'insights' | 'engagement' | 'linkedin' | 'instagram' | 'facebook';

interface CalendarEvent {
  date: Date;
  type: QueueType;
  index: number;
  post: any;
  isPast: boolean;
}

export default function CVinBioVisualCalendar() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/admin/social-content', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch social schedule', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data || !editingEvent) return;
    setSaving(true);
    
    try {
      const { type, index } = editingEvent;
      const isBuffer = ['linkedin', 'instagram', 'facebook'].includes(type);
      const newContent = { ...data.content };
      const newBufferContent = { ...data.bufferContent };
      
      if (type === 'threads') {
        newContent[type][index].topic = editValue;
      } else if (isBuffer) {
        newBufferContent[type][index] = editValue;
      } else {
        newContent[type][index].text = editValue;
      }

      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      const payload = isBuffer 
        ? { bufferContent: newBufferContent } 
        : { content: newContent };

      const res = await fetch('/api/admin/social-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setData({ ...data, content: newContent, bufferContent: newBufferContent });
        setEditingEvent(null);
      }
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground w-6 h-6" /></div>;
  if (!data) return null;

  // Generate Calendar Events
  const events: CalendarEvent[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const addQueueEvents = (type: QueueType, list: any[], currentIndex: number, lastPostedAt: Date | null, intervalDays: number) => {
    const baseDate = lastPostedAt ? new Date(lastPostedAt) : new Date();
    
    list.forEach((post, i) => {
      let eventDate = new Date(baseDate);
      
      if (i < currentIndex) {
        // Past posts - we just estimate they were posted on the interval leading up to lastPostedAt
        const daysAgo = (currentIndex - 1 - i) * intervalDays;
        eventDate.setDate(eventDate.getDate() - daysAgo);
      } else {
        // Future posts
        const daysAhead = (i - currentIndex + 1) * intervalDays;
        eventDate.setDate(today.getDate() + daysAhead); // start counting from today for future
      }
      
      events.push({
        date: eventDate,
        type,
        index: i,
        post,
        isPast: i < currentIndex
      });
    });
  };

  const { content, bufferContent, states } = data;
  
  // Safe parsing dates
  const safeDate = (d: any) => d ? new Date(d) : null;

  // X/Bluesky/Meta intervals (assume 1 day)
  addQueueEvents('threads', content.threads || [], states.x?.threads?.index || 0, safeDate(states.x?.lastPostedAt?.thread), 1);
  addQueueEvents('insights', content.insights || [], states.x?.insights?.index || 0, safeDate(states.x?.lastPostedAt?.insight), 1);
  addQueueEvents('engagement', content.engagement || [], states.x?.engagement?.index || 0, safeDate(states.x?.lastPostedAt?.engagement), 1);

  // Buffer intervals (3 days)
  addQueueEvents('linkedin', bufferContent?.linkedin || [], states.buffer?.linkedin?.index || 0, safeDate(states.buffer?.linkedin?.lastPostedAt), 3);
  addQueueEvents('instagram', bufferContent?.instagram || [], states.buffer?.instagram?.index || 0, safeDate(states.buffer?.instagram?.lastPostedAt), 3);
  addQueueEvents('facebook', bufferContent?.facebook || [], states.buffer?.facebook?.index || 0, safeDate(states.buffer?.facebook?.lastPostedAt), 3);

  // Generate calendar grid
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const getBadgeColor = (type: QueueType, isPast: boolean) => {
    if (isPast) return 'bg-muted text-muted-foreground border-border opacity-50';
    switch (type) {
      case 'threads': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'insights': return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
      case 'engagement': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'linkedin': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      case 'instagram': return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      case 'facebook': return 'bg-blue-600/10 text-blue-700 border-blue-600/20';
      default: return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  const getShortName = (type: QueueType) => {
    switch (type) {
      case 'threads': return 'X Thrd';
      case 'insights': return 'BSky';
      case 'engagement': return 'Meta Eng';
      case 'linkedin': return 'LI Buf';
      case 'instagram': return 'IG Buf';
      case 'facebook': return 'FB Buf';
      default: return type;
    }
  };

  return (
    <div className="my-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-500" />
            Social Content Calendar
          </h3>
          <p className="text-sm text-muted-foreground">Manage upcoming posts across all platforms</p>
        </div>
        <div className="flex items-center gap-4 bg-card border border-border rounded-lg p-1">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8"><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-semibold w-32 text-center">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-[120px]">
          {days.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="border-r border-b border-border/50 bg-muted/10 p-2" />;
            
            const dayEvents = events.filter(e => 
              e.date.getDate() === date.getDate() && 
              e.date.getMonth() === date.getMonth() && 
              e.date.getFullYear() === date.getFullYear()
            );

            const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

            return (
              <div key={date.toISOString()} className={`border-r border-b border-border/50 p-2 overflow-y-auto no-scrollbar relative transition-colors hover:bg-muted/5 ${isToday ? 'bg-indigo-500/5' : ''}`}>
                <div className={`text-xs font-medium mb-1.5 flex items-center justify-between`}>
                  <span className={`${isToday ? 'bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-muted-foreground pl-1'}`}>
                    {date.getDate()}
                  </span>
                  {dayEvents.length > 0 && <span className="text-[10px] text-muted-foreground/60 pr-1">{dayEvents.length} posts</span>}
                </div>
                <div className="space-y-1">
                  {dayEvents.map((ev, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setEditingEvent(ev);
                        const isBuffer = ['linkedin', 'instagram', 'facebook'].includes(ev.type);
                        setEditValue(ev.type === 'threads' ? ev.post.topic : (isBuffer ? ev.post : ev.post.text));
                      }}
                      className={`w-full text-left text-[10px] px-1.5 py-1 rounded border ${getBadgeColor(ev.type, ev.isPast)} truncate transition-opacity hover:opacity-80`}
                      title={ev.type === 'threads' ? ev.post.topic : (['linkedin', 'instagram', 'facebook'].includes(ev.type) ? ev.post : ev.post.text)}
                    >
                      <span className="font-semibold mr-1">{getShortName(ev.type)}</span>
                      {ev.type === 'threads' ? ev.post.topic : 'Post'}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-muted-foreground" />
              Edit {editingEvent?.type} post #{editingEvent ? editingEvent.index + 1 : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              value={editValue} 
              onChange={(e) => setEditValue(e.target.value)} 
              className="min-h-[150px] text-sm"
              disabled={editingEvent?.isPast}
            />
            {editingEvent?.isPast && (
              <p className="text-xs text-amber-500 mt-2">This post has already been published and cannot be modified.</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingEvent(null)}>Cancel</Button>
            {!editingEvent?.isPast && (
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
                Save Changes
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
