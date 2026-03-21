
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface ServerProfileData {
  profile: {
    userId: string;
    fullName: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
    themeId?: string;
    slug: string;
    avatarUrl?: string;
    avatarHint?: string;
    website?: string;
    viewCount?: number;
    skills?: string[];
    links?: any[];
  };
  workExperience: Array<{
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  customSections: Array<{
    id: string;
    sectionTitle: string;
    items: Array<{ id: string; title: string; subtitle?: string; description?: string; date?: string }>;
    order: number;
  }>;
}

export async function getProfileBySlug(slug: string): Promise<ServerProfileData | null> {
    const { data: profile } = await supabase.from('profiles').select('*').eq('username', slug).single();
    if (!profile) return null;

    return {
        profile: {
            userId: profile.id,
            fullName: profile.full_name || 'Professional Profile',
            slug: profile.username || slug,
            email: undefined,
            phone: undefined,
            location: undefined,
            summary: profile.about || '',
            themeId: profile.target_role || 'modern-creative',
            avatarUrl: profile.profile_picture_url || '',
            avatarHint: 'person portrait',
            website: undefined,
            viewCount: profile.views || 0,
            skills: profile.skills || [],
            links: profile.links || []
        },
        workExperience: profile.experience || [],
        education: profile.education || [],
        customSections: profile.custom_sections || []
    };
}
