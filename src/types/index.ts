export type Skill = {
    id: string;
    userProfileId: string;
    name: string;
};

export type Education = {
    id:string;
    userProfileId: string;
    institution: string;
    degree: string;
    startDate: string;
    endDate?: string;
};

export type WorkExperience = {
    id: string;
    userProfileId: string;
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    description: string;
};

// Generic section type is deprecated but kept for reference during migration
export type ResumeSection = {
    id: string;
    userProfileId: string;
    title: string;
    content: string;
    order: number;
};

export type UserProfile = {
    id?: string;
    userId: string;
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    summary: string;
    themeId?: string;
    slug: string;
    avatarUrl?: string;
    avatarHint?: string;
    website?: string;
    viewCount?: number;
};

export type Theme = {
  id: string;
  name: string;
  thumbnailUrl: string;
}

// This represents the fully structured profile data
export type Profile = {
  personalInfo: UserProfile;
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
};
