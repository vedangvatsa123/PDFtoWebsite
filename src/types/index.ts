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
    role: string;
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
