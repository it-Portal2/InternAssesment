import type { AIQuestion } from "@/types/application"

// Static AI questions for testing without backend
export const staticAIQuestions: AIQuestion[] = [
  {
    id: "1",
    question:
      "Based on your experience, how would you approach learning a new technology stack that you haven't worked with before?",
  },
  {
    id: "2",
    question: "Describe a challenging project you've worked on and how you overcame the technical difficulties.",
  },
  {
    id: "3",
    question: "How do you stay updated with the latest trends and technologies in your field?",
  },
]

// Static resume analysis for testing
export const staticResumeAnalysis = {
  skills: ["React", "TypeScript", "Node.js", "Python", "SQL"],
  experience: "2+ years in full-stack development",
  education: "Bachelor's in Computer Science",
  summary: "Experienced developer with strong problem-solving skills",
}
