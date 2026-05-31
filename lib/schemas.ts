import { z } from "zod";

export const applicationProfileSchema = z.object({
  id: z.string().optional(),
  student: z.object({
    name: z.string().min(1, "请输入学生姓名"),
    email: z.string().optional(),
    phone: z.string().optional(),
    currentSchool: z.string().optional(),
    currentMajor: z.string().optional(),
  }),
  education: z.string().optional(),
  tests: z.string().optional(),
  researchExperiences: z.string().optional(),
  projects: z.string().optional(),
  internships: z.string().optional(),
  publications: z.string().optional(),
  awards: z.string().optional(),
  skills: z.string().optional(),
  motivation: z.string().optional(),
  targetProgram: z.object({
    school: z.string().optional(),
    program: z.string().optional(),
    degree: z.string().optional(),
    direction: z.string().optional(),
    facultyOrLab: z.string().optional(),
    requirements: z.string().optional(),
  }),
  supplementaryNotes: z.string().optional(),
  constraints: z.object({
    psWordLimit: z.string().optional(),
    language: z.string().optional(),
    cvType: z.string().optional(),
  }),
});

export type ApplicationProfile = z.infer<typeof applicationProfileSchema>;

export const saveProfileSchema = z.object({
  profile: applicationProfileSchema,
});

export const generateSchema = z.object({
  profileId: z.string().optional(),
  profile: applicationProfileSchema,
});
