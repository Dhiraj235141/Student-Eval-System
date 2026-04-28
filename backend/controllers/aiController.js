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
  if (isNotes) return '["Focus on basic principles.", "Review previous chapter.", "Practice related problems.", "Ask faculty for help.", "Use online resources.", "Summarize key concepts.", "Create a study schedule.", "Take practice quizzes."]';
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

// Generate exactly 10 MCQ test questions: 3 easy, 4 medium, 3 hard — strictly from syllabus
exports.generateTestQuestions = async (req, res) => {
  try {
    const { topics, subjectName, syllabusText } = req.body;
    if (!topics || topics.length === 0) {
      return res.status(400).json({ success: false, message: 'Topics are required' });
    }

    const TOTAL = 10;
    const easyCount = 3;
    const mediumCount = 4;
    const hardCount = 3;

    const syllabusContext = syllabusText
      ? `\n\nSubject Syllabus (ALL questions MUST be strictly based only on this content — do NOT go outside this scope):\n${syllabusText.substring(0, 2000)}`
      : '';

    const prompt = `You are an expert exam paper setter for the subject "${subjectName}".
Generate EXACTLY ${TOTAL} MCQ questions on the topic(s): "${topics}".${syllabusContext}

CRITICAL: Questions MUST be based only on the given topic and subject. Do NOT include questions from outside this scope.

Return ONLY a valid JSON array of exactly ${TOTAL} objects:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "difficulty": "easy",
    "topic": "${topics}"
  }
]

Difficulty split — STRICTLY follow this order:
- Questions 1 to ${easyCount} (difficulty "easy"):
  Basic knowledge and recall. Direct factual questions only.
  Examples: "What is X?" / "Which of the following defines Y?" / "What does Z stand for?"

- Questions ${easyCount + 1} to ${easyCount + mediumCount} (difficulty "medium"):
  Conceptual understanding. Explain, compare or identify relationships.
  Examples: "Why does X happen?" / "Which statement about Y is correct?" / "What is the difference between A and B?"

- Questions ${easyCount + mediumCount + 1} to ${TOTAL} (difficulty "hard"):
  Application-level ONLY. Present a real-world scenario; student must apply knowledge to solve it.
  Examples: "In a system where X and Y occur, what is the correct approach?" / "A developer does A — what will be the output?"
  Hard questions MUST describe a scenario — NOT a plain factual question.
  All 4 options must be plausible (no obviously wrong answers).

MANDATORY:
- Exactly ${TOTAL} questions total — no more, no less
- Each question has exactly 4 answer options
- correctAnswer is the 0-based index (0, 1, 2, or 3) of the correct option
- Return ONLY the JSON array — no markdown, no explanation, no extra text`;

    const raw = await callAI(prompt, 4000);
    let questions = parseJSON(raw);

    // Enforce maximum 10
    if (questions.length > TOTAL) questions = questions.slice(0, TOTAL);

    res.json({ success: true, questions });
  } catch (err) {
    console.error('AI Test Generation Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Failed to generate questions. Check your API key.' });
  }
};

// Generate assignment questions from title + description
exports.generateAssignmentQuestions = async (req, res) => {
  try {
    const { title, subjectName, description } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    // The primary topic comes from description if provided, otherwise use title
    const topic = description && description.trim()
      ? description.trim()
      : title;

    const prompt = `You are an expert faculty member in "${subjectName}" subject.
A faculty has given this assignment topic/description: "${topic}"
Assignment title: "${title}"

Generate exactly 5 assignment questions strictly based on this topic.

Return ONLY a valid JSON array with exactly 5 objects:
[
  {
    "question": "Full question text here?",
    "type": "short",
    "options": [],
    "correctAnswer": null
  }
]

Rules:
- ALL 5 questions must have type "short" (descriptive/written answers, no MCQ)
- options must always be [] (empty array)
- correctAnswer must always be null
- Questions 1-2: Basic/recall level (e.g. "What is X?" or "Write a rule/code for Y")
- Questions 3-4: Conceptual/explain level (e.g. "Explain the difference between X and Y" or "Describe how X works")
- Question 5: Application level (e.g. "How would you use X to achieve Y in a real scenario?")
- Questions MUST be directly about the given topic — do NOT ask about unrelated things
- Return ONLY the JSON array, no markdown, no extra text`;

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

    // Strip syllabus codes (e.g. "3.4 ", "Unit 1 - ") for better AI matching
    const cleanTopic = topic.replace(/^([0-9\.]+|Unit\s*[0-9]+|Chapter\s*[0-9]+)[:\s\-]*/i, '').trim();

    const prompt = `You are a helpful tutor. A student is struggling with: "${cleanTopic}".
Generate exactly 8 clear, concise, and actionable study points to help them understand this topic better.
Return ONLY a valid JSON array of 8 strings (each string = one study point, 1-2 sentences max):

["Point 1 here.", "Point 2 here.", "Point 3 here.", "Point 4 here.", "Point 5 here.", "Point 6 here.", "Point 7 here.", "Point 8 here."]

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
exports.gradeAssignmentPDF = async (filePath, maxMarks = 10, questions = [], description = '') => {
  try {
    let content = '[PDF content could not be read]';
    try {
      const pdfParse = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      content = pdfData.text.substring(0, 3000);
    } catch (parseErr) {
      console.log('pdf-parse not available, using file-based grading');
      const stats = fs.statSync(filePath);
      content = `File size: ${stats.size} bytes. Student submitted a PDF assignment.`;
    }

    // Build question checklist for grading if available
    let questionContext = '';
    if (questions && questions.length > 0) {
      const questionList = questions.map((q, i) => `Q${i + 1}. ${q.question}`).join('\n');
      questionContext = `\n\nAssignment Questions (check if student answered these):\n${questionList}`;
    }
    const descContext = description ? `\n\nAssignment Topic/Description: ${description}` : '';

    const prompt = `You are an academic evaluator. Grade this student assignment submission out of ${maxMarks} marks.${descContext}${questionContext}

Student's submitted content:
${content}

Grading criteria:
- Relevance to the assignment questions/topic (40%)
- Content accuracy and depth (30%)
- Clarity, structure and completeness (30%)

Return ONLY a single number (the score) between 0 and ${maxMarks}. No text, just the number.`;

    const raw = await callAI(prompt, 100);
    const score = parseFloat(raw.trim());
    if (isNaN(score) || score < 0 || score > maxMarks) return Math.round(maxMarks * 0.6);
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

// @desc    AI Chatbot for Students and Faculty
// @route   POST /api/ai/chat
exports.chatbotChat = async (req, res) => {
  try {
    const { messages, role } = req.body;
    if (!messages || messages.length === 0) {
      return res.status(400).json({ success: false, message: 'Messages are required' });
    }

    const systemPrompt = role === 'faculty'
      ? `You are an advanced AI assistant designed specifically for faculty members in an academic institution.

Your role:
- Answer all academic, educational, and general knowledge questions with depth and accuracy
- Support subjects like programming, mathematics, science, engineering, and theory
- Help faculty create questions, notes, study materials, and lesson plans
- Assist with grading criteria, assignment design, and evaluation strategies

Core behavior:
- Always give correct, clear, and well-structured answers
- For simple questions → give a concise, direct answer
- For complex questions → explain step-by-step with proper headings
- Always include relevant examples and real-world applications
- Use professional but clear language

Response format (when applicable):
1. Direct Answer
2. Detailed Explanation
3. Example or Use Case
4. Additional Tips or Notes

Special abilities:
- Generate high-quality exam questions with answers
- Create assignment rubrics and marking schemes
- Write detailed explanations of complex topics
- Debug and explain code thoroughly
- Summarize academic content and research

Tone: Professional, knowledgeable, and helpful like an experienced academic mentor.
Restrictions: Stay focused on educational and professional topics only.`
      : `You are an advanced AI assistant designed specifically for students in an academic institution.

Your role:
- Answer all academic, educational, and general knowledge questions clearly
- Support subjects like programming, mathematics, science, engineering, and theory
- Help with assignments, explanations, coding, and problem-solving
- Make learning easy and engaging

Core behavior:
- Always give correct, clear, and structured answers
- For simple questions → give a concise, direct answer
- For complex questions → explain step-by-step with small chunks
- Always include examples that are easy to understand
- Use simple language first, then go deeper if needed
- Use real-life analogies to explain difficult concepts

Response format (when applicable):
1. Direct Answer
2. Simple Explanation (step-by-step if needed)
3. Example
4. Quick Tips or Summary

Special abilities:
- Solve math problems step-by-step
- Write and explain code clearly
- Summarize notes and textbook content
- Generate practice questions and answers
- Debug code and explain errors

Tone: Friendly, encouraging, and helpful like a good teacher or senior student.
Restrictions: Stay focused on educational and professional topics only. If a question is unclear, ask for clarification.`;

    // Build messages array with system prompt
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    // Call Groq API directly with conversation history
    let reply = null;
    let lastError = null;

    for (const model of GROQ_MODELS) {
      try {
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model,
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 1500,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
            }
          }
        );
        reply = response.data.choices[0].message.content;
        break;
      } catch (err) {
        lastError = err;
        console.warn(`Chatbot: Groq model ${model} failed, trying next...`);
      }
    }

    if (!reply) {
      throw lastError || new Error('All AI models failed');
    }

    res.json({ success: true, reply });
  } catch (err) {
    console.error('AI Chatbot Error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Chatbot failed to respond. Please try again.' });
  }
};

