<?php
/**
 * PHP Backend API for InternAssessment
 * OpenRouter-only — no Gemini dependency.
 *
 * Environment variables (or set directly below):
 *   OPENROUTER_API_KEY     - Required
 *   PRIMARY_MODEL          - Default: "minimax/minimax-m2.5:free"
 *   FALLBACK_MODEL         - Default: "deepseek/deepseek-v4-flash:free"
 *   OPENROUTER_REFERER     - Optional
 *   OPENROUTER_TITLE       - Optional
 *   INTERVIEW_CUSTOM_INSTRUCTIONS - Optional custom prompt
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET,OPTIONS,PATCH,DELETE,POST,PUT');
header('Access-Control-Allow-Headers: X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Config ────────────────────────────────────────────────────────────────

$OPENROUTER_API_KEY = getenv('OPENROUTER_API_KEY');
if (!$OPENROUTER_API_KEY) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'OPENROUTER_API_KEY not configured', 'errorType' => 'api_auth_error']);
    exit;
}
$PRIMARY_MODEL   = 'minimax/minimax-m2.5:free';
$FALLBACK_MODEL  = 'deepseek/deepseek-v4-flash:free';
$CUSTOM_INSTRUCTIONS = null;

// Override from env if set
if (getenv('OPENROUTER_API_KEY')) $OPENROUTER_API_KEY = getenv('OPENROUTER_API_KEY');
if (getenv('PRIMARY_MODEL'))  $PRIMARY_MODEL  = getenv('PRIMARY_MODEL');
if (getenv('FALLBACK_MODEL')) $FALLBACK_MODEL = getenv('FALLBACK_MODEL');
if (getenv('INTERVIEW_CUSTOM_INSTRUCTIONS')) $CUSTOM_INSTRUCTIONS = getenv('INTERVIEW_CUSTOM_INSTRUCTIONS');

// ── Helpers ───────────────────────────────────────────────────────────────

function httpPostJson($url, $body, $headers = []) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($body),
        CURLOPT_HTTPHEADER     => array_merge(['Content-Type: application/json'], $headers),
        CURLOPT_TIMEOUT        => 180,
        CURLOPT_CONNECTTIMEOUT => 30,
    ]);
    $raw = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($err) throw new Exception("HTTP request failed: $err");
    return [$code, $raw];
}

function cleanJsonOutput($text): string {
    if ($text === '') return '{}';
    $cleaned = preg_replace('/```(?:json)?\n?/', '', $text);
    $cleaned = preg_replace('/```/', '', trim($cleaned));
    $firstObj = strpos($cleaned, '{');
    $firstArr = strpos($cleaned, '[');
    $useArray = $firstArr !== false && ($firstObj === false || $firstArr < $firstObj);
    if ($useArray) {
        $last = strrpos($cleaned, ']');
        if ($last !== false) return substr($cleaned, $firstArr, $last - $firstArr + 1);
    } elseif ($firstObj !== false) {
        $last = strrpos($cleaned, '}');
        if ($last !== false) return substr($cleaned, $firstObj, $last - $firstObj + 1);
    }
    return $cleaned;
}

// ── OpenRouter Call ───────────────────────────────────────────────────────

function callOpenRouter(string $model, array $opts): string {
    global $OPENROUTER_API_KEY;
    $content = [['type' => 'text', 'text' => $opts['userPrompt']]];
    if (!empty($opts['pdfBase64'])) {
        $content[] = [
            'type' => 'file',
            'file' => [
                'filename' => $opts['pdfFileName'] ?? 'resume.pdf',
                'file_data' => 'data:' . ($opts['pdfMimeType'] ?? 'application/pdf') . ';base64,' . $opts['pdfBase64'],
            ],
        ];
    }
    $body = [
        'model'    => $model,
        'messages' => [['role' => 'user', 'content' => $content]],
        'temperature' => $opts['temperature'] ?? 0.1,
        'max_tokens'  => $opts['maxTokens'] ?? 8192,
    ];
    // Note: response_format json_object is NOT used because minimax/minimax-m2.5:free
    // and several other free models don't support it and return empty content.
    // The prompt already instructs the model to return raw JSON.

    [$code, $raw] = httpPostJson('https://openrouter.ai/api/v1/chat/completions', $body, [
        'Authorization: Bearer ' . $OPENROUTER_API_KEY,
        'Content-Type: application/json',
        'HTTP-Referer: ' . (getenv('OPENROUTER_REFERER') ?: 'https://it-portal-aa1f7.web.app'),
        'X-Title: ' . (getenv('OPENROUTER_TITLE') ?: 'Intern Assessment'),
    ]);

    if ($code >= 400) {
        $err = json_decode($raw, true);
        throw new Exception('OpenRouter ' . $code . ': ' . ($err['error']['message'] ?? $raw));
    }

    $data = json_decode($raw, true);
    $msg = $data['choices'][0]['message'] ?? [];
    return $msg['content'] ?? $msg['reasoning_content'] ?? $msg['reasoning'] ?? '';
}

// ── Execute with model fallback ───────────────────────────────────────────

function runWithFallback(callable $fn, string $opName): string {
    global $PRIMARY_MODEL, $FALLBACK_MODEL;
    $errors = [];
    $models = [$PRIMARY_MODEL, $FALLBACK_MODEL];
    foreach ($models as $model) {
        try {
            $result = $fn($model);
            error_log("✓ $opName succeeded with $model");
            return $result;
        } catch (Exception $e) {
            $errors[] = "$model: " . $e->getMessage();
            error_log("✗ $opName failed with $model: " . $e->getMessage());
        }
    }
    throw new Exception("$opName: both models failed – " . implode(' | ', $errors));
}

// ── Resume Analysis ───────────────────────────────────────────────────────

function analyzeResume(string $base64Data, string $mimeType, string $fileName): array {
    $rawText = runWithFallback(function (string $model) use ($base64Data, $mimeType, $fileName): string {
        return callOpenRouter($model, [
            'userPrompt'  => <<<'PROMPT'
You are an expert HR professional and resume analyzer. Analyze this resume document carefully and extract key information.

IMPORTANT: Extract ONLY information explicitly present in the resume. Do not infer or assume.

EDGE CASE HANDLING:
- If NO work experience found → "0 years, Fresher/Entry level"
- If NO skills mentioned → ["General skills"]
- If NO education found → "Not specified"
- If NO clear summary → create brief summary from available info

Extract as JSON:
1. skills (array)
2. experience: "X years, [Fresher/Junior/Mid/Senior/Lead] level"
3. education
4. summary (2-3 sentences)

EXPERIENCE LEVELS: 0=Fresher, 0-2=Junior, 2-5=Mid, 5-8=Senior, 8+=Lead

Return ONLY raw JSON: {"skills":[],"experience":"","education":"","summary":""}
PROMPT,
            'temperature' => 0.1,
            'maxTokens'   => 8192,
            'pdfBase64'   => $base64Data,
            'pdfMimeType' => $mimeType,
            'pdfFileName' => $fileName,
        ]);
    }, 'Resume Analysis');

    $analysis = json_decode(cleanJsonOutput($rawText), true);
    if (!$analysis) throw new Exception('Failed to parse resume analysis from AI response');

    $analysis['skills']     = (is_array($analysis['skills'] ?? null) && count($analysis['skills'])) ? $analysis['skills'] : ['General skills'];
    $analysis['experience'] = $analysis['experience'] ?: '0 years, Fresher/Entry level';
    $analysis['education']  = $analysis['education'] ?: 'Not specified';
    $analysis['summary']    = $analysis['summary'] ?: 'Candidate with available qualifications seeking opportunities.';

    return $analysis;
}

// ── Question Generation ───────────────────────────────────────────────────

function generateQuestions(array $resumeData): array {
    global $CUSTOM_INSTRUCTIONS;
    $skillsStr = implode(', ', $resumeData['skills']);
    $customSection = ($CUSTOM_INSTRUCTIONS && trim($CUSTOM_INSTRUCTIONS) !== '')
        ? "\nCUSTOM INSTRUCTIONS:\n{$CUSTOM_INSTRUCTIONS}\n"
        : '';

    $rawText = runWithFallback(function (string $model) use ($resumeData, $skillsStr, $customSection): string {
        $prompt = <<<PROMPT
You are a senior HR director. Based on the candidate's resume, generate EXACTLY 10 interview questions.

CANDIDATE:
- Skills: {$skillsStr}
- Experience: {$resumeData['experience']}
- Education: {$resumeData['education']}
- Summary: {$resumeData['summary']}

{$customSection}
DISTRIBUTION:
- 4 TECHNICAL (based on their skills)
- 2 BEHAVIORAL (STAR framework, don't mention STAR)
- 2 SCENARIO-DRIVEN
- 2 LEADERSHIP & PROBLEM-SOLVING

STRICT: Only ask about skills mentioned in their resume.

Return ONLY raw JSON:
{"questions":[{"id":"technical_q1","question":"..."},{"id":"technical_q2","question":"..."},{"id":"technical_q3","question":"..."},{"id":"technical_q4","question":"..."},{"id":"behavioral_q1","question":"..."},{"id":"behavioral_q2","question":"..."},{"id":"scenario_q1","question":"..."},{"id":"scenario_q2","question":"..."},{"id":"leadership_q1","question":"..."},{"id":"leadership_q2","question":"..."}]}
PROMPT;
        return callOpenRouter($model, [
            'userPrompt'  => $prompt,
            'temperature' => 0.7,
            'maxTokens'   => 8192,
        ]);
    }, 'Question Generation');

    $data = json_decode(cleanJsonOutput($rawText), true);
    if (!$data) throw new Exception('Failed to parse questions from AI response');

    $rawQ = $data['questions'] ?? (isset($data[0]) ? $data : null);
    if (!$rawQ || !is_array($rawQ)) throw new Exception('Invalid questions format');

    $questions = [];
    foreach ($rawQ as $i => $q) {
        $questions[] = [
            'id'       => $q['id'] ?? 'question_' . ($i + 1) . '_' . time(),
            'question' => $q['question'] ?? '',
            'answer'   => '',
        ];
    }
    return array_slice($questions, 0, 10);
}

// ── Main Handler ──────────────────────────────────────────────────────────

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid request body', 'errorType' => 'file_processing_error']);
        exit;
    }

    $fileData = $input['fileData'] ?? '';
    $fileName = $input['fileName'] ?? '';
    $fileType = $input['fileType'] ?? '';
    $fileSize = $input['fileSize'] ?? 0;
    $startTime = round(microtime(true) * 1000);

    if (!$fileData || !$fileName || !$fileType) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing file data', 'errorType' => 'file_processing_error']);
        exit;
    }
    if ($fileType !== 'application/pdf') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Only PDF files supported', 'errorType' => 'file_processing_error']);
        exit;
    }
    if ($fileSize > 5 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'File too large (max 5MB)', 'errorType' => 'file_processing_error']);
        exit;
    }

    error_log("Processing: $fileName (" . round($fileSize / 1024) . " KB)");

    $resumeAnalysis = analyzeResume($fileData, $fileType, $fileName);
    error_log("✓ Analysis: " . count($resumeAnalysis['skills']) . " skills");

    $questions = generateQuestions($resumeAnalysis);
    error_log("✓ Generated " . count($questions) . " questions");

    $totalTime = round(microtime(true) * 1000 - $startTime);

    http_response_code(200);
    echo json_encode([
        'success'             => true,
        'resumeAnalysis'      => $resumeAnalysis,
        'questions'           => $questions,
        'customInstructionsUsed' => $CUSTOM_INSTRUCTIONS !== null && trim($CUSTOM_INSTRUCTIONS) !== '',
        'processingTimeMs'    => $totalTime,
        'provider'            => 'openrouter',
        'performance'         => ['totalTimeMs' => $totalTime],
    ]);

} catch (Exception $e) {
    error_log("Failed: " . $e->getMessage());
    $msg = $e->getMessage();
    $type = 'general_error';
    $code = 500;
    $user = 'Failed to process resume';

    if (str_contains($msg, 'both models failed')) {
        $type = 'rate_limit_error'; $code = 429;
        $user = 'All AI services busy. Try again in 10-15 minutes.';
    } elseif (str_contains($msg, 'quota') || str_contains($msg, 'rate limit') || str_contains($msg, '429')) {
        $type = 'rate_limit_error'; $code = 429;
        $user = 'High demand. Try again in a few minutes.';
    } elseif (str_contains($msg, '401') || str_contains($msg, '403') || str_contains($msg, 'API key')) {
        $type = 'api_auth_error'; $code = 401;
        $user = 'AI service auth failed. Contact support.';
    } elseif (str_contains($msg, 'network') || str_contains($msg, 'timeout') || str_contains($msg, 'curl')) {
        $type = 'network_error'; $code = 503;
        $user = 'Network issue. Check your internet.';
    } elseif (str_contains($msg, 'parse')) {
        $type = 'ai_processing_error'; $code = 502;
        $user = 'AI processing issue. Try again.';
    }

    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $user, 'errorType' => $type, 'technicalDetails' => $msg]);
}
