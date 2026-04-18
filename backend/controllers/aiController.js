const axios = require('axios');
const fs = require('fs');

// Active 2025 Groq Models
const GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'gemma2-9b-it'
];

const callAI = async (prompt, maxTokens = 3000) => {
  let lastError = null;

  for (const model of GROQ_MODELS) {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          }
        }
      );
      
      const text = response.data.choices[0].message.content;
      return text;
    } catch (err) {
      console.warn(`Groq Model ${model} failed, trying next...`);
      lastError = err;
    }
  }

  // Final fallback (Local generic response if API is totally dead)
  console.error('All AI models failed, using hardcoded fallback.');
  const isNotes = prompt.includes('study points');
  if (isNotes) return '["Focus on basic principles.", "Review previous chapter.", "Practice related problems.", "Ask teacher for help.", "Use online resources."]';
  throw lastError;
};

const parseJSON = (text) => {
  // Step 1: Strip markdown code fences
  let cleaned = text.replace(/```json|```/g, '').trim();

  // Step 2: Try a direct parse first (happy path)
  try {
    return JSON.parse(cleaned);
  } catch (_) { /* fall through */ }

  // Step 3: Try to extract just the JSON array from surrounding text
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch (_) { /* fall through to recovery */ }

    // Step 4: Response may be truncated — recover all COMPLETE question objects
    const jsonStr = arrayMatch[0];
    const recovered = [];
    const objRegex = /\{[^{}]*"question"[^{}]*"options"[^{}]*"correctAnswer"[^{}]*\}/gs;
    let match;
    while ((match = objRegex.exec(jsonStr)) !== null) {
      try {
        recovered.push(JSON.parse(match[0]));
      } catch (_) { /* skip malformed object */ }
    }
    if (recovered.length > 0) {
      console.warn(`AI JSON was truncated — recovered ${recovered.length} complete questions.`);
      return recovered;
    }
  }

  // Step 5: Last resort — try trimming after the last '}'  and closing the array
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace !== -1) {
    try {
      const trimmed = cleaned.substring(cleaned.indexOf('['), lastBrace + 1) + ']';
      return JSON.parse(trimmed);
    } catch (_) { /* give up */ }
  }

  throw new SyntaxError('AI returned invalid JSON that could not be recovered.');
};

// Generate 10 MCQ test questions: 3 easy, 4 medium, 3 hard — ALL application-level
exports.generateTestQuestions = async (req, res) => {
  try {
    const { topics, subjectName, count = 10 } = req.body;
    if (!topics || topics.length === 0) {
      return res.status(400).json({ success: false, message: 'Topics are required' });
    }

    const easyCount = 3;
    const mediumCount = 4;
    const hardCount = count - easyCount - mediumCount; // 3

    const prompt = `You are an expert exam paper setter. Generate exactly ${count} MCQ questions for topic(s): "${topics}" in subject "${subjectName}".

Return ONLY a valid JSON array:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "difficulty": "easy",
    "topic": "specific topic"
  }
]

Difficulty rules — follow them strictly:
- First ${easyCount} questions: difficulty "easy"
  → Basic knowledge and recall. Ask direct factual questions. Example: "What is X?" or "Which of the following defines Y?"
- Next ${mediumCount} questions: difficulty "medium"
  → Conceptual understanding. Ask students to explain, compare or identify relationships. Example: "Why does X happen?" or "Which statement about Y is correct?"
- Last ${hardCount} questions: difficulty "hard"
  → Application-level only. Present a real-world scenario or problem and ask students to apply knowledge to solve it. Example: "In a system where X and Y occur, what is the correct approach to handle Z?" or "A developer does A — what will be the output/result and why?"

Additional rules:
- Hard questions MUST include a scenario or situation — not just a plain question
- Hard question options must all be plausible (no obviously wrong answers)
- Each question must have exactly 4 options
- correctAnswer is the index (0, 1, 2, or 3) of the correct option
- Return ONLY the JSON array, no extra text, no markdown, no explanation`;

    const raw = await callAI(prompt, 3000);
    const questions = parseJSON(raw);
    res.json({ success: true, questions });
  } catch (err) {
    console.error('AI Test Generation Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Failed to generate questions. Check your API key.' });
  }
};

// Generate assignment questions
exports.generateAssignmentQuestions = async (req, res) => {
  try {
    const { title, subjectName } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const prompt = `Generate 5 assignment questions for topic: "${title}" in subject "${subjectName}".

Return ONLY a valid JSON array:
[
  {
    "question": "Question text?",
    "type": "mcq",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0
  }
]

Rules:
- First 3 questions: type "mcq" with 4 options and correctAnswer index (0-3)
- Last 2 questions: type "short" with empty options [] and correctAnswer null
- Return ONLY valid JSON array, no extra text`;

    const raw = await callAI(prompt);
    const questions = parseJSON(raw);
    res.json({ success: true, questions });
  } catch (err) {
    console.error('AI Assignment Generation Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to generate assignment.' });
  }
};

// Generate study notes for a weak topic
exports.getStudyNotes = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: 'Topic is required' });

    const prompt = `You are a helpful tutor. A student is struggling with: "${topic}".

Generate 5 clear, concise study points to help them understand this topic better.
Return ONLY a valid JSON array of strings (each string = one study point, 1-2 sentences max):

["Point 1 here.", "Point 2 here.", "Point 3 here.", "Point 4 here.", "Point 5 here."]

No extra text, no markdown, just the JSON array.`;

    const raw = await callAI(prompt, 500);
    const notes = parseJSON(raw);
    res.json({ success: true, notes });
  } catch (err) {
    console.error('AI Study Notes Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to generate study notes.' });
  }
};

// AI-grade a PDF assignment (reads file text content)
exports.gradeAssignmentPDF = async (filePath, maxMarks = 10) => {
  try {
    // For a real implementation, use a PDF parsing library. 
    // Here we use the filename/size as a proxy since PDF text extraction
    // requires pdf-parse (install separately). We'll attempt it if available.
    let content = '[PDF content could not be read]';
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      content = pdfData.text.substring(0, 3000); // limit to 3000 chars
    } catch (parseErr) {
      console.log('pdf-parse not available, using file-based grading');
      const stats = fs.statSync(filePath);
      content = `File size: ${stats.size} bytes. Student submitted a PDF assignment.`;
    }

    const prompt = `You are an academic evaluator. Grade this student assignment out of ${maxMarks} marks.

Assignment content:
${content}

Grading criteria:
- Content relevance and accuracy (40%)
- Clarity and organization (30%)
- Completeness (30%)

Return ONLY a single number (the score) between 0 and ${maxMarks}. No text, just the number.`;

    const raw = await callAI(prompt, 100);
    const score = parseFloat(raw.trim());
    if (isNaN(score) || score < 0 || score > maxMarks) return Math.round(maxMarks * 0.6); // default 60%
    return Math.round(score);
  } catch (err) {
    console.error('AI PDF Grading Error:', err.message);
    return null;
  }
};

// Generate weak topic study suggestions (original endpoint)
exports.generateWeakTopicSuggestions = async (req, res) => {
  try {
    const { weakTopics, avgScore } = req.body;
    if (!weakTopics || weakTopics.length === 0) {
      return res.status(400).json({ success: false, message: 'Weak topics required' });
    }

    const topicList = weakTopics.slice(0, 5).map(t => t.topic).join(', ');
    const prompt = `A student struggles with: "${topicList}". Their average score is ${avgScore}/10.

Generate personalized study suggestions. Return ONLY a valid JSON array:
[
  {
    "topic": "topic name",
    "suggestion": "Specific actionable study tip (2-3 sentences)",
    "priority": "high",
    "studyTime": "2 hours"
  }
]

Rules:
- priority must be "high", "medium", or "low"
- studyTime should be realistic e.g. "1 hour", "3 hours"
- suggestion must be specific and actionable
- Return ONLY valid JSON array, no extra text`;

    const raw = await callAI(prompt);
    const suggestions = parseJSON(raw);
    res.json({ success: true, suggestions });
  } catch (err) {
    console.error('AI Suggestions Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to generate suggestions.' });
  }
};
