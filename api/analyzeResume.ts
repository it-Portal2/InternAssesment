import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

// Type definitions
interface ResumeAnalysis {
  skills: string[];
  experience: string;
  education: string;
  summary: string;
}

interface InterviewQuestion {
  id: string;
  question: string;
  answer: string;
}
interface AIQuestionResponse {
  id: string;
  question: string;
}

interface AIGenerationResponse {
  questions: AIQuestionResponse[];
}

// Initialize Gemini AI
const initializeGemini = (apiKey: string) => {
  return new GoogleGenAI({ apiKey });
};

// Resume analysis function
async function analyzeResumeWithAI(
  base64Data: string,
  mimeType: string,
  apiKey: string
): Promise<ResumeAnalysis> {
  try {
    const ai = initializeGemini(apiKey);

    const prompt = `You are an expert HR professional and resume analyzer. Analyze this resume document carefully and extract key information.

IMPORTANT: Extract ONLY information that is explicitly present in the resume. Do not infer or assume information.

EDGE CASE HANDLING:
- If NO work experience is found → Mark as "0 years, Fresher/Entry level"
- If NO skills are explicitly mentioned → Return ["General skills"] or skills inferred from education/projects
- If NO education is found → Mark as "Not specified"
- If NO clear summary can be formed → Create brief summary from available information

Extract the following data and return it in JSON format:
1. Technical and professional skills (array of specific skills mentioned or inferred from projects/education)
2. Years of experience and seniority level (calculate from work history or mark as fresher)
3. Educational background and qualifications (degrees, certifications, institutions)
4. Brief professional summary (2-3 sentences highlighting available strengths)

EXPERIENCE LEVEL CALCULATION:
- 0 years = "0 years, Fresher/Entry level"
- 0-2 years = "X years, Junior level" 
- 2-5 years = "X years, Mid level"
- 5-8 years = "X years, Senior level"  
- 8+ years = "X years, Lead/Principal level"

Return JSON in this exact format:
{
  "skills": ["specific_skill_1", "specific_skill_2", "specific_skill_3"],
  "experience": "X years, [Fresher/Junior/Mid/Senior/Lead] level",
  "education": "Degree, Institution, Year (or 'Not specified' if unavailable)",
  "summary": "Professional summary highlighting key strengths and expertise based on available information"
}

Be precise and handle missing information gracefully by using appropriate defaults.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const analysis = JSON.parse(response.text || "{}");

    // Validate and set defaults
    if (
      !analysis.skills ||
      !Array.isArray(analysis.skills) ||
      analysis.skills.length === 0
    ) {
      analysis.skills = ["General skills"];
    }

    if (!analysis.experience) {
      analysis.experience = "0 years, Fresher/Entry level";
    }

    if (!analysis.education) {
      analysis.education = "Not specified";
    }

    if (!analysis.summary) {
      analysis.summary =
        "Candidate with available qualifications seeking opportunities.";
    }

    return analysis as ResumeAnalysis;
  } catch (error) {
    throw new Error(
      `Failed to analyze resume: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

async function generateInterviewQuestions(
  resumeData: ResumeAnalysis,
  apiKey: string
): Promise<InterviewQuestion[]> {
  try {
    const ai = initializeGemini(apiKey);

    const prompt = `You are a senior HR director at a Fortune 500 company. Based on the candidate's resume analysis, YOU HAVE THE FREEDOM to decide how many interview questions to generate for this candidate.

CANDIDATE ANALYSIS:
- Skills: ${resumeData.skills.join(", ")}
- Experience: ${resumeData.experience}
- Education: ${resumeData.education}
- Summary: ${resumeData.summary}

QUESTION COUNT DECISION (YOUR CHOICE):
- Minimum: 6 questions
- Maximum: 12 questions
- YOU DECIDE based on the candidate's profile complexity, experience level, and skill diversity

QUESTION CATEGORIES TO INCLUDE:
1. BEHAVIORAL-FOCUSED: Use STAR method frameworks (Situation, Task, Action, Result)
2. COMPETENCY-BASED: Target specific skills and experiences from their background
3. SCENARIO-DRIVEN: Present realistic workplace challenges they might face
4. LEADERSHIP & PROBLEM-SOLVING: Assess critical thinking and decision-making abilities
5. COMPANY FIT: Evaluate cultural alignment and growth mindset
6. CORE TECHNICAL KNOWLEDGE: Deep technical questions on their specific skills

DISTRIBUTION STRATEGY:
- Include questions from multiple categories above
- Weight technical questions (30-40%) based on their skill set
- Balance behavioral and scenario questions based on experience level
- Adjust complexity based on their seniority (Fresher vs Senior)

STRICT REQUIREMENTS:
1. ALL questions must be based ONLY on information from their resume
2. NO generic questions - tailor to their specific background
3. Focus on their actual skills, not assumed skills
4. Use their actual experience level to determine question complexity

Technical Questions Must Focus ONLY On:
${resumeData.skills.join(", ")} (use ONLY these skills from their resume)

STRICT RULE: Do not ask about technologies, frameworks, or skills that are NOT mentioned in their resume.

EXAMPLES BY CATEGORY:

BEHAVIORAL-FOCUSED (STAR Method):
- "Tell me about a challenging project where you used [their specific skill]. Walk me through the situation, your task, the actions you took, and the results you achieved."

COMPETENCY-BASED:
- "Given your experience with [specific skill from resume], how would you approach [relevant scenario]?"

SCENARIO-DRIVEN:
- "You're working on a project using [their mentioned technology] and you encounter [realistic challenge]. How would you handle this situation?"

LEADERSHIP & PROBLEM-SOLVING:
- "Describe a time when you had to make a difficult decision involving [technology from their background]. What was your thought process?"

COMPANY FIT:
- "What interests you most about working with [technology from their resume] in a collaborative team environment?"

CORE TECHNICAL KNOWLEDGE:
- "Explain how you would [technical task] using [their specific skills]. What are the key considerations?"

Return JSON in this exact format (generate between 6-12 questions as YOU see fit):
{
  "questions": [
    {
      "id": "behavioral_q1",
      "question": "STAR method behavioral question based on their experience"
    },
    {
      "id": "competency_q1",
      "question": "Competency-based question targeting their skills"
    },
    {
      "id": "scenario_q1",
      "question": "Scenario-driven workplace challenge question"
    },
    {
      "id": "leadership_q1",
      "question": "Leadership and problem-solving question"
    },
    {
      "id": "cultural_q1",
      "question": "Company fit and cultural alignment question"
    },
    {
      "id": "technical_q1",
      "question": "Core technical knowledge question based on their skills"
    }
  ]
}

Generate the appropriate number of questions between 6-12 based on your assessment of this candidate's profile. Make them specific to their actual resume data and include questions from multiple categories listed above.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const data = JSON.parse(response.text || "{}") as AIGenerationResponse;

    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error("Invalid questions format in AI response");
    }

    const questions = data.questions.map(
      (q: AIQuestionResponse, index: number) => ({
        id: q.id || `question_${index + 1}_${Date.now()}`,
        question: q.question,
        answer: "",
      })
    );

    return questions.slice(0, Math.min(Math.max(questions.length, 6), 12));
  } catch (error) {
    throw new Error(
      `Failed to generate questions: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Main Vercel Function Handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { fileData, fileName, fileType, fileSize } = req.body;

    // Input validation
    if (!fileData) {
      return res.status(400).json({ error: "No file data provided" });
    }

    if (fileType !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are supported" });
    }

    if (fileSize > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "File too large (max 5MB)" });
    }

    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "AI service not configured" });
    }

    console.log(
      `Processing resume: ${fileName} (${Math.round(fileSize / 1024)} KB)`
    );

    // Step 1: Analyze resume
    const resumeAnalysis = await analyzeResumeWithAI(
      fileData,
      fileType,
      apiKey
    );
    console.log(
      "Resume analysis completed:",
      resumeAnalysis.skills.length,
      "skills found"
    );

    // Step 2: Generate questions
    const questions = await generateInterviewQuestions(resumeAnalysis, apiKey);
    console.log("Generated", questions.length, "questions");

    return res.status(200).json({
      success: true,
      resumeAnalysis,
      questions,
    });
  } catch (error) {
    console.error("Resume analysis failed:", error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to process resume",
    });
  }
}
