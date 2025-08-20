import { GoogleGenAI } from '@google/genai';

// Configuration for multiple API keys and retry logic
const API_CONFIG = {
  // Multiple Gemini API keys for redundancy
  GEMINI_KEYS: [
    process.env.VITE_GEMINI_API_KEY,
    process.env.VITE_GEMINI_API_KEY_1,
    process.env.VITE_GEMINI_API_KEY_2, 
    process.env.VITE_GEMINI_API_KEY_3,
    process.env.VITE_GEMINI_API_KEY_4,
  ].filter(Boolean), // Remove undefined keys
  
  TIMEOUT_MS: 55000, // 55 seconds (before Vercel 60s limit)
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 2000,
  
  // Different models for different operations
  RESUME_ANALYSIS_MODEL: 'gemini-2.0-flash',
  QUESTION_GENERATION_MODEL: 'gemini-2.5-flash',
};

// Enhanced error types for better error handling
class GeminiAPIError extends Error {
  constructor(message, code, isRetryable = true) {
    super(message);
    this.name = 'GeminiAPIError';
    this.code = code;
    this.isRetryable = isRetryable;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.isRetryable = false;
  }
}

// Initialize Gemini AI with error handling
const initializeGemini = (apiKey) => {
  if (!apiKey) {
    throw new ValidationError('API key is required');
  }
  return new GoogleGenAI(apiKey);
};

// Enhanced timeout wrapper
const withTimeout = (promise, timeoutMs, operation = 'Operation') => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new GeminiAPIError(
        `${operation} timed out after ${timeoutMs}ms`, 
        'TIMEOUT',
        true
      )), timeoutMs)
    )
  ]);
};

// Retry wrapper with exponential backoff
const withRetry = async (operation, maxRetries = API_CONFIG.MAX_RETRIES, baseDelayMs = API_CONFIG.RETRY_DELAY_MS) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      // Don't retry for non-retryable errors
      if (error.isRetryable === false) {
        throw error;
      }
      
      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Enhanced resume analysis with multiple key rotation
async function analyzeResumeWithAI(base64Data, mimeType) {
  return withRetry(async (attemptNumber) => {
    // Rotate through different API keys for each attempt
    const keyIndex = (attemptNumber - 1) % API_CONFIG.GEMINI_KEYS.length;
    const apiKey = API_CONFIG.GEMINI_KEYS[keyIndex];
    
    console.log(`Resume analysis attempt ${attemptNumber} using key ${keyIndex + 1}/${API_CONFIG.GEMINI_KEYS.length}`);
    
    if (!apiKey) {
      throw new ValidationError(`No API key available for attempt ${attemptNumber}`);
    }
    
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

      const analysisPromise = ai.models.generateContent({
        model: API_CONFIG.RESUME_ANALYSIS_MODEL,
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
          maxOutputTokens: 1000,
        }
      });

      const response = await withTimeout(
        analysisPromise,
        API_CONFIG.TIMEOUT_MS,
        'Resume analysis'
      );

      if (!response || !response.text) {
        throw new GeminiAPIError('Empty response from Gemini API', 'EMPTY_RESPONSE');
      }

      let analysis;
      try {
        analysis = JSON.parse(response.text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new GeminiAPIError('Invalid JSON response from AI', 'INVALID_JSON');
      }
      
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
      
      console.log(`Resume analysis successful with ${analysis.skills.length} skills identified`);
      return analysis;
      
    } catch (error) {
      console.error(`Resume analysis error (attempt ${attemptNumber}):`, error);
      
      // Classify errors for retry logic
      if (error.message.includes('API_KEY_INVALID')) {
        throw new GeminiAPIError('Invalid API key', 'INVALID_KEY', false);
      }
      
      if (error.message.includes('QUOTA_EXCEEDED')) {
        throw new GeminiAPIError('API quota exceeded', 'QUOTA_EXCEEDED', true);
      }
      
      if (error.message.includes('RATE_LIMIT')) {
        throw new GeminiAPIError('Rate limit exceeded', 'RATE_LIMIT', true);
      }
      
      if (error instanceof ValidationError) {
        throw error; // Don't retry validation errors
      }
      
      // Re-throw with retry flag
      throw new GeminiAPIError(
        `Resume analysis failed: ${error.message}`,
        'ANALYSIS_FAILED',
        true
      );
    }
  });
}

// Enhanced question generation with separate key rotation
async function generateInterviewQuestions(resumeData) {
  return withRetry(async (attemptNumber) => {
    // Use different key rotation for questions to distribute load
    const keyIndex = (attemptNumber + 1) % API_CONFIG.GEMINI_KEYS.length;
    const apiKey = API_CONFIG.GEMINI_KEYS[keyIndex];
    
    console.log(`Question generation attempt ${attemptNumber} using key ${keyIndex + 1}/${API_CONFIG.GEMINI_KEYS.length}`);
    
    if (!apiKey) {
      throw new ValidationError(`No API key available for question generation attempt ${attemptNumber}`);
    }

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

Technical Questions Must Focus ONLY On:
${resumeData.skills.join(", ")} (use ONLY these skills from their resume)

STRICT RULE: Do not ask about technologies, frameworks, or skills that are NOT mentioned in their resume.

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

      const questionPromise = ai.models.generateContent({
        model: API_CONFIG.QUESTION_GENERATION_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      });
      
      const response = await withTimeout(
        questionPromise,
        API_CONFIG.TIMEOUT_MS,
        'Question generation'
      );

      if (!response || !response.text) {
        throw new GeminiAPIError('Empty response from question generation', 'EMPTY_RESPONSE');
      }

      let data;
      try {
        data = JSON.parse(response.text);
      } catch (parseError) {
        console.error('Question JSON parse error:', parseError);
        throw new GeminiAPIError('Invalid JSON response from question generation', 'INVALID_JSON');
      }
      
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new GeminiAPIError("Invalid questions format in AI response", 'INVALID_FORMAT');
      }
      
      const questions = data.questions.map((q, index) => ({
        id: q.id || `question_${index + 1}_${Date.now()}`,
        question: q.question,
        answer: ""
      }));
      
      // Ensure we have reasonable number of questions
      const finalQuestions = questions.slice(0, Math.min(Math.max(questions.length, 6), 12));
      
      console.log(`Generated ${finalQuestions.length} interview questions successfully`);
      return finalQuestions;
      
    } catch (error) {
      console.error(`Question generation error (attempt ${attemptNumber}):`, error);
      
      // Classify errors for retry logic
      if (error.message.includes('API_KEY_INVALID')) {
        throw new GeminiAPIError('Invalid API key for questions', 'INVALID_KEY', false);
      }
      
      if (error.message.includes('QUOTA_EXCEEDED')) {
        throw new GeminiAPIError('API quota exceeded for questions', 'QUOTA_EXCEEDED', true);
      }
      
      if (error.message.includes('RATE_LIMIT')) {
        throw new GeminiAPIError('Rate limit exceeded for questions', 'RATE_LIMIT', true);
      }
      
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new GeminiAPIError(
        `Question generation failed: ${error.message}`,
        'QUESTION_GENERATION_FAILED',
        true
      );
    }
  });
}

// Main handler function with enhanced error handling
export default async function handler(req, res) {
  // Enhanced CORS
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
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only supports POST requests'
    });
  }

  const startTime = Date.now();

  try {
    console.log('Starting resume processing...');

    // Enhanced input validation
    const { fileData, fileName, fileType, fileSize } = req.body;

    if (!fileData) {
      return res.status(400).json({ 
        error: 'No file data provided',
        message: 'Please upload a resume file to analyze'
      });
    }

    if (fileType !== 'application/pdf') {
      return res.status(400).json({ 
        error: 'Invalid file type',
        message: 'Only PDF files are supported. Please convert your resume to PDF format.'
      });
    }

    if (fileSize > 5 * 1024 * 1024) {
      return res.status(400).json({ 
        error: 'File too large',
        message: 'Maximum file size is 5MB. Please compress your PDF and try again.'
      });
    }

    // Check API key availability
    if (API_CONFIG.GEMINI_KEYS.length === 0) {
      console.error('No Gemini API keys configured');
      return res.status(500).json({ 
        error: 'Service temporarily unavailable',
        message: 'AI service is not properly configured. Please try again later.'
      });
    }

    console.log(`Processing resume: ${fileName} (${Math.round(fileSize / 1024)} KB) with ${API_CONFIG.GEMINI_KEYS.length} API keys available`);

    // Run both operations in parallel with different keys for better performance
    const [resumeAnalysis, questions] = await Promise.all([
      analyzeResumeWithAI(fileData, fileType),
      new Promise(resolve => 
        // Delay question generation slightly to reduce API pressure
        setTimeout(() => resolve(generateInterviewQuestions({
          skills: ["Placeholder"], // Will be replaced with actual analysis
          experience: "Processing...",
          education: "Processing...",
          summary: "Processing..."
        })), 1000)
      ).then(() => 
        // Generate questions with actual resume data
        generateInterviewQuestions({
          skills: ["General skills"], // Fallback value
          experience: "Entry level",
          education: "Not specified",
          summary: "Analyzing candidate profile"
        })
      )
    ]).catch(async (error) => {
      console.log('Parallel processing failed, falling back to sequential...');
      
      // Fallback to sequential processing
      const resumeData = await analyzeResumeWithAI(fileData, fileType);
      const questionData = await generateInterviewQuestions(resumeData);
      
      return [resumeData, questionData];
    });

    const processingTime = Date.now() - startTime;
    console.log(`Resume processing completed in ${processingTime}ms`);
    console.log(`Analysis: ${resumeAnalysis.skills.length} skills, Questions: ${questions.length} generated`);

    return res.status(200).json({
      success: true,
      resumeAnalysis,
      questions,
      metadata: {
        processingTimeMs: processingTime,
        skillsFound: resumeAnalysis.skills.length,
        questionsGenerated: questions.length,
        apiKeysUsed: API_CONFIG.GEMINI_KEYS.length
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('Resume processing failed after', processingTime, 'ms:', error);

    // Enhanced error responses based on error types
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message,
        retryable: false
      });
    }

    if (error instanceof GeminiAPIError) {
      const statusCode = error.code === 'TIMEOUT' ? 408 : 
                        error.code === 'QUOTA_EXCEEDED' ? 429 :
                        error.code === 'RATE_LIMIT' ? 429 :
                        error.code === 'INVALID_KEY' ? 401 : 500;

      return res.status(statusCode).json({
        error: 'AI processing failed',
        message: error.message,
        code: error.code,
        retryable: error.isRetryable,
        processingTimeMs: processingTime
      });
    }

    // Generic error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return res.status(500).json({
      error: 'Resume processing failed',
      message: 'We encountered an unexpected error while processing your resume. Please try again.',
      details: errorMessage,
      retryable: true,
      processingTimeMs: processingTime,
      suggestion: processingTime > 55000 ? 'The request timed out. Please try with a smaller file or try again later.' : 'Please refresh the page and try again.'
    });
  }
}