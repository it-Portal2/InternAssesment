import { z } from "zod";

const phoneRegex = /^[\+]?[0-9\s\-\(\)\.]{10,}$/;

export const resumeAnalysisSchema = z.object({
  skills: z.array(z.string()),
  experience: z.string(),
  education: z.string(),
  summary: z.string(),
});

export const aiQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string().optional(),
});

export const insertApplicationSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.email("Please enter a valid email address"),
  phone: z.string().regex(phoneRegex, "Please enter a valid phone number"),
  linkedin: z
    .string()
    .url("Please enter a valid LinkedIn URL")
    .optional()
    .or(z.literal("")),
  stipendExpectation: z.string().min(1, "Stipend expectation is required"),
  startDate: z.string().min(1, "Start date is required"),
  weeklyCommitment: z.string().min(1, "Please select your weekly commitment"),
  trialAccepted: z
    .string()
    .min(1, "Please indicate if you accept the trial period"),
  additionalComments: z.string().optional(),
  resumeAnalysis: resumeAnalysisSchema,
  responses: z.record(z.string(), z.string()),
  aiQuestions: z.array(aiQuestionSchema),
});

export type InsertApplicationForm = z.infer<typeof insertApplicationSchema>;
