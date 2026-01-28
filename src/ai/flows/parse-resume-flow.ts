
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalInfoSchema = z.object({
  fullName: z.string().describe('The full name of the person.'),
  email: z.string().describe('The email address.'),
  phone: z.string().optional().describe('The phone number.'),
  location: z.string().optional().describe('The city and state, e.g., "San Francisco, CA".'),
  website: z.string().optional().describe("The personal website or portfolio link. Do not include company or social media links."),
});

const WorkExperienceSchema = z.object({
  company: z.string().describe('The name of the company.'),
  title: z.string().describe('The job title.'),
  startDate: z.string().describe('The start date (Month Year, e.g., "Jan 2021").'),
  endDate: z.string().optional().describe('The end date (Month Year, e.g., "Dec 2022") or "Present".'),
  description: z.string().describe("A summary of the role's key responsibilities and accomplishments. Preserve the original meaning and details from the resume, using newline characters to separate bullet points or distinct tasks."),
});

const EducationSchema = z.object({
  institution: z.string().describe('The name of the university or school.'),
  degree: z.string().describe('The degree obtained, e.g., "B.S. in Computer Science".'),
  startDate: z.string().describe('The start date (Month Year).'),
  endDate: z.string().optional().describe('The end date (Month Year).'),
});

const SkillSchema = z.object({
  name: z.string().describe('The name of the skill, e.g., "TypeScript".'),
});

const ParsedResumeSchema = z.object({
  personalInfo: PersonalInfoSchema.describe('The personal contact information from the resume.'),
  summary: z.string().describe('A 2-4 sentence professional summary. If the resume has a summary, use it. If not, generate one based on the experience and skills.'),
  workExperience: z.array(WorkExperienceSchema).describe('A list of all work experience entries.'),
  education: z.array(EducationSchema).describe('A list of all education entries.'),
  skills: z.array(SkillSchema).describe('A list of key skills.'),
});

export type ParsedResume = z.infer<typeof ParsedResumeSchema>;

export async function parseResume(text: string): Promise<ParsedResume> {
    return parseResumeFlow(text);
}

const parseResumeFlow = ai.defineFlow(
  {
    name: 'parseResumeFlow',
    inputSchema: z.string(),
    outputSchema: ParsedResumeSchema,
  },
  async (resumeText) => {
    const {output} = await ai.generate({
      prompt: `You are an expert AI assistant specializing in parsing human resumes. Your task is to meticulously extract structured information from the provided resume text and format it according to the defined JSON schema.

Pay close attention to the following guidelines:
- **Accuracy is paramount.** Only extract information that is explicitly present in the resume text. Do not infer or invent details.
- **Professional Summary**: If the resume includes a "Summary" or "Objective" section, use that content for the 'summary' field. If no such section exists, you MUST generate a concise, 2-3 sentence professional summary based on the candidate's most recent work experience and key skills.
- **Work Experience**: For each job, extract the key responsibilities and accomplishments. Preserve the original meaning and detail, but format it for clarity.
- **Dates**: Format all dates as "Month Year" (e.g., "Jan 2021"). If only the year is provided, that is acceptable.
- **Omissions**: If a specific piece of information (like a phone number or end date for a current job) is not found, simply omit the corresponding field from the output.

Resume Text to Parse:
---
${resumeText}
---
`,
      output: {
        schema: ParsedResumeSchema,
      },
      config: {
        temperature: 0.2, // Slightly increase temperature for better summary generation if needed
      }
    });
    
    return output!;
  }
);
