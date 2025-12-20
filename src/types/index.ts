
export type Skill = {
    id: string;
    userProfileId?: string;
    name: string;
    level?: string;
};

export type Education = {
    id:string;
    userProfileId?: string;
    institution: string;
    degree: string;
    startDate: string;
    endDate?: string;
    description?: string;
};

export type WorkExperience = {
    id: string;
    userProfileId?: string;
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    description: string;
};

// A flexible type to hold any section from a parsed resume.
export type ResumeSection = {
    id: string;
    userProfileId: string;
    // The title of the section from the resume, e.g., "Work Experience", "Projects"
    title: string;
    // The raw text content of the section.
    content: string;
    // To maintain the order from the resume.
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

// This corresponds to the mock data structure and what the UI currently uses.
// We will migrate towards the Firestore-aligned types.
export type Profile = {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    summary: string;
    avatarUrl: string;
    avatarHint: string;
  };
  workExperience: {
    id: string;
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  skills: {
    id: string;
    name: string;
  }[];
};
