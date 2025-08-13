export interface ResumeAnalysis {
  skills: string[];
  experience: string;
  education: string;
  summary: string;
}

export interface AIQuestion {
  id: string;
  question: string;
  answer?: string;
}

export interface InsertApplication {
  fullName: string;
  email: string;
  phone: string;
  linkedin?: string;
  stipendExpectation: string;
  startDate: string;
  weeklyCommitment: string;
  trialAccepted: string;
  additionalComments?: string;
  resumeAnalysis: ResumeAnalysis;
  responses: Record<string, string>;
  aiQuestions: AIQuestion[];
}