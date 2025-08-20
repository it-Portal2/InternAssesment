import { GoogleGenAI } from '@google/genai';

// Initialize Gemini AI with specific API key
const initializeGemini = (apiKey) => {
  return new GoogleGenAI({ apiKey });
};

// Resume analysis function - EXACT PROMPT UNCHANGED
async function analyzeResumeWithAI(base64Data, mimeType, apiKey) {
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
      model: 'gemini-2.0-flash-lite',  // OPTIMIZED MODEL
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 1000
      }
    });

    const analysis = JSON.parse(response.text || '{}');
    
    // Validate and set defaults
    if (!analysis.skills || !Array.isArray(analysis.skills) || analysis.skills.length === 0) {
      analysis.skills = ["General skills"];
    }
    
    if (!analysis.experience) {
      analysis.experience = "0 years, Fresher/Entry level";
    }
    
    if (!analysis.education) {
      analysis.education = "Not specified";
    }
    
    if (!analysis.summary) {
      analysis.summary = "Candidate with available qualifications seeking opportunities.";
    }
    
    return analysis;
    
  } catch (error) {
    throw new Error(`Failed to analyze resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Question generation function - OPTIMIZED FOR EXACTLY 10 QUESTIONS
async function generateInterviewQuestions(resumeData, apiKey) {
  try {
    const ai = initializeGemini(apiKey);

    const prompt = `You are a senior HR director at a Fortune 500 company. Based on the candidate's resume analysis, generate EXACTLY 10 interview questions for this candidate.

CANDIDATE ANALYSIS:
- Skills: ${resumeData.skills.join(", ")}
- Experience: ${resumeData.experience}
- Education: ${resumeData.education}
- Summary: ${resumeData.summary}

GENERATE EXACTLY 10 QUESTIONS WITH THIS DISTRIBUTION:
- 4 TECHNICAL QUESTIONS: Core technical knowledge questions based on their specific skills
- 2 BEHAVIORAL-FOCUSED: Use STAR method frameworks (Situation, Task, Action, Result)
- 2 SCENARIO-DRIVEN: Present realistic workplace challenges they might face
- 2 LEADERSHIP & PROBLEM-SOLVING: Assess critical thinking and decision-making abilities based on their background

Technical Questions Must Focus ONLY On:
${resumeData.skills.join(", ")} (use ONLY these skills from their resume)

STRICT RULE: Do not ask about technologies, frameworks, or skills that are NOT mentioned in their resume.

Return JSON in this exact format with EXACTLY 10 questions:
{
  "questions": [
    {
      "id": "technical_q1",
      "question": "Technical question 1 based on their skills"
    },
    {
      "id": "technical_q2",
      "question": "Technical question 2 based on their skills"
    },
    {
      "id": "technical_q3",
      "question": "Technical question 3 based on their skills"
    },
    {
      "id": "technical_q4",
      "question": "Technical question 4 based on their skills"
    },
    {
      "id": "behavioral_q1",
      "question": "STAR method behavioral question based on their experience"
    },
    {
      "id": "behavioral_q2",
      "question": "STAR method behavioral question based on their experience"
    },
    {
      "id": "scenario_q1",
      "question": "Scenario-driven workplace challenge question"
    },
    {
      "id": "scenario_q2",
      "question": "Scenario-driven workplace challenge question"
    },
    {
      "id": "leadership_q1",
      "question": "Leadership and problem-solving question"
    },
    {
      "id": "leadership_q2",
      "question": "Leadership and problem-solving question"
    }
  ]
}

Generate exactly 10 questions following this distribution. Make them specific to their actual resume data.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',  // OPTIMIZED MODEL
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 2000
      }
    });
    
    const data = JSON.parse(response.text || '{}');
    
    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error("Invalid questions format in AI response");
    }
    
    const questions = data.questions.map((q, index) => ({
      id: q.id || `question_${index + 1}_${Date.now()}`,
      question: q.question,
      answer: ""
    }));
    
    // Ensure exactly 10 questions
    return questions.slice(0, 10);
    
  } catch (error) {
    throw new Error(`Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Main handler function - OPTIMIZED FOR FLASH-LITE SPEED
export default async function handler(req, res) {
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fileData, fileName, fileType, fileSize } = req.body;

    console.log('Processing request for file:', fileName);
    const startTime = Date.now();

    // Input validation
    if (!fileData) {
      return res.status(400).json({ error: 'No file data provided' });
    }

    if (fileType !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are supported' });
    }

    if (fileSize > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (max 5MB)' });
    }

    // Get API keys from environment variables
    const apiKey1 = process.env.GEMINI_API_KEY_1;
    const apiKey2 = process.env.GEMINI_API_KEY_2;
    
    if (!apiKey1 || !apiKey2) {
      console.error('GEMINI_API_KEY_1 or GEMINI_API_KEY_2 not found in environment variables');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    console.log(`Processing resume: ${fileName} (${Math.round(fileSize / 1024)} KB)`);

    // Step 1: Resume analysis (Flash-Lite: ~200-400ms)
    const resumeAnalysis = await analyzeResumeWithAI(fileData, fileType, apiKey1);
    console.log('Resume analysis completed:', resumeAnalysis.skills.length, 'skills found');
    console.log('Analysis time:', Date.now() - startTime, 'ms');

    // Step 2: Question generation (Flash-Lite: ~300-500ms)
    const questionStartTime = Date.now();
    const questions = await generateInterviewQuestions(resumeAnalysis, apiKey2);
    console.log('Generated exactly', questions.length, 'questions');
    console.log('Question generation time:', Date.now() - questionStartTime, 'ms');
    
    const totalProcessingTime = Date.now() - startTime;
    console.log('Total processing time:', totalProcessingTime, 'ms');

    return res.status(200).json({
      success: true,
      resumeAnalysis,
      questions,
      processingTimeMs: totalProcessingTime,
      model: 'gemini-2.0-flash-lite',
      performance: {
        analysisTimeMs: Date.now() - startTime - (Date.now() - questionStartTime),
        questionGenTimeMs: Date.now() - questionStartTime,
        totalTimeMs: totalProcessingTime
      }
    });

  } catch (error) {
    console.error('Resume analysis failed:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to process resume',
      model: 'gemini-2.0-flash-lite'
    });
  }
}
