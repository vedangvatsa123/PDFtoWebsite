"use client";

import React, { useEffect, useState } from 'react';
import TemplateModern from '@/app/[slug]/templates/modern-creative';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoginDialog } from '@/components/login-dialog';

export default function PreviewPage() {
    const [previewData, setPreviewData] = useState<any>(null);

    const loadData = () => {
        const stored = sessionStorage.getItem('parsedResume');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                const mappedData = {
                    profile: {
                        userId: 'guest',
                        slug: data.personalInfo?.slug || 'preview',
                        fullName: data.personalInfo?.fullName || 'Your Name',
                        email: data.personalInfo?.email || '',
                        phone: data.personalInfo?.phone || '',
                        location: data.personalInfo?.location || '',
                        website: data.personalInfo?.website || '',
                        github: data.personalInfo?.github || '',
                        linkedin: data.personalInfo?.linkedin || '',
                        summary: data.summary || '',
                        avatarUrl: data.personalInfo?.avatarUrl || '',
                        avatarHint: 'person portrait',
                        skills: Array.isArray(data.skills) ? data.skills.map((s: any) => s.name || s) : [],
                        links: [
                            data.personalInfo?.email && { type: 'email', value: data.personalInfo.email },
                            data.personalInfo?.phone && { type: 'phone', value: data.personalInfo.phone },
                            data.personalInfo?.location && { type: 'location', value: data.personalInfo.location },
                            data.personalInfo?.website && { type: 'website', value: data.personalInfo.website },
                            data.personalInfo?.github && { type: 'github', value: data.personalInfo.github },
                            data.personalInfo?.linkedin && { type: 'linkedin', value: data.personalInfo.linkedin },
                            // Include extra links (twitter, instagram, etc) from editor broadcast
                            ...(Array.isArray(data.personalInfo?.links)
                                ? data.personalInfo.links.filter((l: any) =>
                                    !['email','phone','location','website','github','linkedin'].includes(l?.type)
                                  )
                                : []),
                        ].filter(Boolean) as Array<{type: string; value: string}>,
                    },
                    workExperience: data.workExperience || [],
                    education: data.education || [],
                    customSections: data.customSections || [],
                };
                setPreviewData(mappedData);
            } catch (e) {
                console.error('Failed to parse preview data', e);
                setPreviewData('NOT_FOUND');
            }
        } else {
             // fallback empty state
             setPreviewData('NOT_FOUND');
        }
    };

    useEffect(() => {
        loadData();
        
        // Isolate this specific preview strictly to the exact Editor tab that opened it
        const channelId = new URLSearchParams(window.location.search).get('channel') || 'cvin_preview_channel';
        const bc = new BroadcastChannel(channelId);
        
        bc.onmessage = (event) => {
            if (event.data?.type === 'UPDATE' && event.data.payload) {
                // Instantly update layout state directly from the invisible ephemeral payload
                sessionStorage.setItem('parsedResume', JSON.stringify(event.data.payload));
                loadData();
            }
        };
        
        // Polling handshake: The moment this tab opens, immediately shout into the channel asking the Editor tab for its current memory state
        bc.postMessage('REQUEST_STATE');
        
        return () => bc.close();
    }, []);

    if (previewData === 'NOT_FOUND') {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/10 text-center px-4">
                <div className="max-w-md space-y-4 bg-background p-8 rounded-xl border shadow-sm">
                    <h1 className="text-2xl font-bold tracking-tight">Private Preview Link</h1>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        The link you clicked is a temporary local preview and cannot be shared. To view this person's profile, ask them for their public <strong>CVin.bio</strong> link!
                    </p>
                    <div className="pt-4">
                        <Button asChild className="w-full font-bold">
                            <Link href="/">Build your own profile</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!previewData) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading preview...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary/30 pb-20">
            <div className="bg-destructive text-destructive-foreground text-center text-xs py-1.5 font-bold tracking-wide shadow-sm flex items-center justify-center gap-2">
                ⚠️ THIS IS A LOCAL PREVIEW. Do not copy or share this URL. Click "Claim Link" to get a public sharable link!
            </div>
            <div className="bg-background border-b shadow-sm sticky top-0 z-50">
                <div className="container mx-auto p-4 flex justify-between items-center max-w-5xl">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
                            <Link href="/editor">
                                <ArrowLeft className="h-4 w-4 mr-2" /> back to editor
                            </Link>
                        </Button>
                        <Button variant="ghost" asChild size="icon" className="sm:hidden">
                            <Link href="/editor">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                    <LoginDialog trigger={<Button size="sm" className="font-bold" onClick={() => {
                        // Ensure data is saved before OAuth redirect
                        if (previewData) {
                            const snapshot = {
                                personalInfo: previewData.profile,
                                summary: previewData.profile?.summary || '',
                                workExperience: previewData.workExperience || [],
                                education: previewData.education || [],
                                skills: previewData.profile?.skills || [],
                                customSections: previewData.customSections || [],
                            };
                            sessionStorage.setItem('parsedResume', JSON.stringify(snapshot));
                            try { localStorage.setItem('parsedResume', JSON.stringify(snapshot)); localStorage.setItem('parsedResumeTimestamp', Date.now().toString()); } catch (e) { /* quota */ }
                        }
                    }}>Claim Link</Button>} />
                </div>
            </div>
            
            <div className="mt-8">
                <TemplateModern {...previewData} />
            </div>
        </div>
    );
}
