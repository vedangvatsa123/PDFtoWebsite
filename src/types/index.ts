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
    skills?: string[];
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

export type Education = {
    id: string;
    userProfileId: string;
    institution: string;
    degree: string;
    startDate: string;
    endDate?: string;
};

export type CustomSectionItem = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  date?: string;
};

export type CustomSection = {
  id: string;
  userProfileId: string;
  sectionTitle: string;
  items: CustomSectionItem[];
  order: number;
};

// Fully structured profile data
export type Profile = {
  personalInfo: UserProfile;
  workExperience: WorkExperience[];
  education: Education[];
  customSections: CustomSection[];
};
