import type { Profile } from '@/types';
import { PlaceHolderImages } from './placeholder-images';

const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar-1') ?? {
  imageUrl: 'https://picsum.photos/seed/user1/200/200',
  imageHint: 'person portrait'
};

// This mock profile is now used to seed a new user's profile in the editor.
export const mockProfile: Profile = {
  personalInfo: {
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    phone: '123-456-7890',
    location: 'San Francisco, CA',
    website: 'janedoe.dev',
    summary:
      'Innovative and results-driven full-stack developer with over 5 years of experience in designing, developing, and managing complex web applications. Proficient in JavaScript, React, Node.js, and cloud technologies. Passionate about creating intuitive user experiences and writing clean, efficient code.',
    avatarUrl: userAvatar.imageUrl,
    avatarHint: userAvatar.imageHint,
  },
  workExperience: [
    {
      id: 'work1',
      company: 'Tech Solutions Inc.',
      title: 'Senior Software Engineer',
      startDate: 'Jan 2021',
      endDate: 'Present',
      description:
        'Led the development of a new client-facing analytics dashboard using React and D3.js, improving data visualization and user engagement by 40%. Mentored junior developers and conducted code reviews to maintain high code quality standards.',
    },
    {
      id: 'work2',
      company: 'Innovate Co.',
      title: 'Software Engineer',
      startDate: 'Jun 2018',
      endDate: 'Dec 2020',
      description:
        'Developed and maintained features for a large-scale e-commerce platform using Next.js and GraphQL. Collaborated with product managers and designers to translate requirements into technical solutions.',
    },
  ],
  education: [
    {
      id: 'edu1',
      institution: 'State University',
      degree: 'B.S. in Computer Science',
      startDate: 'Aug 2014',
      endDate: 'May 2018',
      description: 'Graduated with honors. Member of the university coding club and participated in multiple hackathons.',
    },
  ],
  skills: [
    { id: 'skill1', name: 'JavaScript' },
    { id: 'skill2', name: 'TypeScript' },
    { id: 'skill3', name: 'React' },
    { id: 'skill4', name: 'Next.js' },
    { id: 'skill5', name: 'Node.js' },
    { id: 'skill6', name: 'GraphQL' },
    { id: 'skill7', name: 'PostgreSQL' },
    { id: 'skill8', name: 'Docker' },
    { id: 'skill9', name: 'AWS' },
  ],
};
