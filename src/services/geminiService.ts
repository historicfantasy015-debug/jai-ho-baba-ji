import { supabase } from '../lib/supabase';
import type { QuestionConfig, TopicAllocation, GeneratedQuestion } from '../types';

interface PYQ {
  question_statement: string;
  options: string[];
  answer: string;
  solution: string;
  diagram_json: any;
  options_diagrams: any;
}

interface GeneratedQuestionData {
  questionStatement: string;
  options: string[];
  answer: string;
  solution: string;
}

export async function generateQuestionsForTopic(
  geminiKey: string,
  config: QuestionConfig,
  topic: TopicAllocation,
  questionsToGenerate: number
): Promise<GeneratedQuestion[]> {
  const pyqs = await fetchPYQs(config, topic.topicId);
  const existingNewQuestions = await fetchExistingNewQuestions(config, topic.topicId);
  const topicNotes = await fetchTopicNotes(topic.topicId);

  const results: GeneratedQuestion[] = [];

  for (let i = 0; i < questionsToGenerate; i++) {
    try {
      const prompt = buildPrompt(
        config,
        topic,
        topicNotes,
        pyqs,
        existingNewQuestions,
        results
      );

      const generatedData = await callGeminiAPI(geminiKey, prompt);

      const question: GeneratedQuestion = {
        topicId: topic.topicId,
        topicName: topic.topicName,
        questionStatement: generatedData.questionStatement,
        options: generatedData.options,
        answer: generatedData.answer,
        solution: generatedData.solution,
        questionType: config.questionType,
        status: 'completed'
      };

      await saveQuestionToDatabase(question, config);
      results.push(question);

    } catch (error) {
      results.push({
        topicId: topic.topicId,
        topicName: topic.topicName,
        questionStatement: '',
        options: [],
        answer: '',
        solution: '',
        questionType: config.questionType,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

async function fetchPYQs(config: QuestionConfig, topicId: string): Promise<PYQ[]> {
  let query = supabase
    .from('questions_topic_wise')
    .select('question_statement, options, answer, solution, diagram_json, options_diagrams')
    .eq('topic_id', topicId)
    .eq('question_type', config.questionType);

  if (config.slotId) {
    query = query.eq('slot_id', config.slotId);
  }
  if (config.partId) {
    query = query.eq('part_id', config.partId);
  }

  const { data } = await query;
  return data || [];
}

async function fetchExistingNewQuestions(config: QuestionConfig, topicId: string): Promise<PYQ[]> {
  let query = supabase
    .from('new_questions')
    .select('question_statement, options, answer, solution, diagram_json, options_diagrams')
    .eq('topic_id', topicId)
    .eq('question_type', config.questionType);

  if (config.slotId) {
    query = query.eq('slot_id', config.slotId);
  }
  if (config.partId) {
    query = query.eq('part_id', config.partId);
  }

  const { data } = await query;
  return data || [];
}

async function fetchTopicNotes(topicId: string): Promise<string> {
  const { data } = await supabase
    .from('topics')
    .select('notes')
    .eq('id', topicId)
    .maybeSingle();

  return data?.notes || '';
}

function buildPrompt(
  config: QuestionConfig,
  topic: TopicAllocation,
  topicNotes: string,
  pyqs: PYQ[],
  existingNewQuestions: PYQ[],
  alreadyGeneratedInSession: GeneratedQuestion[]
): string {
  const isSUB = config.questionType === 'SUB';
  const isMSQ = config.questionType === 'MSQ';
  const isNAT = config.questionType === 'NAT';

  let prompt = `You are an expert question generator for competitive exams. Generate a high-quality, challenging ${config.questionType} question that tests deep understanding.

TOPIC: ${topic.topicName}

TOPIC NOTES (Study this thoroughly to generate contextually accurate questions):
${topicNotes || 'No notes available - use your expertise on this topic'}

---

PREVIOUS YEAR QUESTIONS (PYQs) - Study these carefully for style, difficulty, and topic coverage:
`;

  pyqs.slice(0, 15).forEach((pyq, idx) => {
    prompt += `\n\nPYQ ${idx + 1}:
Question: ${pyq.question_statement}`;

    if (pyq.options && pyq.options.length > 0) {
      prompt += `\nOptions: ${JSON.stringify(pyq.options)}`;
    }

    prompt += `\nAnswer: ${pyq.answer}`;

    if (pyq.solution) {
      prompt += `\nSolution: ${pyq.solution}`;
    }

    if (pyq.diagram_json) {
      prompt += `\n[Note: This question has a diagram - DO NOT copy it, instead create a fresh question inspired by the underlying concept]`;
    }
  });

  if (existingNewQuestions.length > 0) {
    prompt += `\n\n---\n\nALREADY GENERATED QUESTIONS (DO NOT repeat these concepts or similar wording):`;
    existingNewQuestions.slice(-8).forEach((q, idx) => {
      prompt += `\n\nGenerated ${idx + 1}:
Question: ${q.question_statement}`;
    });
  }

  if (alreadyGeneratedInSession.length > 0) {
    prompt += `\n\n---\n\nQUESTIONS GENERATED IN THIS SESSION (DO NOT repeat):`;
    alreadyGeneratedInSession.forEach((q, idx) => {
      prompt += `\n\nSession ${idx + 1}:
Question: ${q.questionStatement}`;
    });
  }

  prompt += `\n\n---

CRITICAL REQUIREMENTS:
1. DIFFICULTY LEVEL: Generate a question that is of SIMILAR OR HIGHER difficulty than the PYQs shown above
2. FRESHNESS: The question MUST be significantly different from all PYQs and previously generated questions
   - Use different numerical values, scenarios, or problem contexts
   - Apply the same concepts but in novel situations
   - DO NOT copy or slightly modify existing questions
3. CONCEPT DEPTH: Test deeper understanding, not just formula application
4. FORMAT: Use KaTeX for all mathematical expressions:
   - Inline math: $expression$
   - Block math: $$expression$$
   - Greek letters: $\\alpha$, $\\beta$, etc.
   - Fractions: $\\frac{a}{b}$
   - Subscripts/Superscripts: $x_1$, $x^2$
5. QUESTION TYPE SPECIFIC:`;

  if (isSUB) {
    prompt += `
   - SUB (Subjective): Generate an open-ended question requiring detailed written explanation
   - Question should test analytical thinking and conceptual understanding
   - No options needed
   - Answer should be a comprehensive explanation
   - Solution should guide through the reasoning process`;
  } else if (isMSQ) {
    prompt += `
   - MSQ (Multiple Select): Provide exactly 4 options labeled (A), (B), (C), (D)
   - Multiple options can be correct
   - Answer format: "A,C" or "B,D" or "A,B,C" etc. (comma-separated letters)
   - Each option should be a plausible choice`;
  } else if (isNAT) {
    prompt += `
   - NAT (Numerical Answer Type): No options needed
   - Answer must be a specific number (integer or decimal)
   - Answer format: Just the number (e.g., "42" or "3.14")
   - Solution should show detailed calculation steps`;
  } else {
    prompt += `
   - MCQ (Single Correct): Provide exactly 4 options labeled (A), (B), (C), (D)
   - Only ONE option is correct
   - Answer format: Single letter (A, B, C, or D)
   - Distractors should be plausible but clearly wrong upon analysis`;
  }

  prompt += `
6. SOLUTION: Provide a detailed, step-by-step solution with clear reasoning
   - Explain WHY the answer is correct
   - Show all calculation steps with KaTeX formatting
   - Address common misconceptions if applicable

RESPONSE FORMAT (JSON):`;

  if (isSUB || isNAT) {
    prompt += `
{
  "questionStatement": "Question text with KaTeX formatting",
  "options": [],
  "answer": "${isSUB ? 'Comprehensive answer explanation' : 'Numerical answer'}",
  "solution": "Detailed solution with step-by-step reasoning in KaTeX format"
}`;
  } else {
    prompt += `
{
  "questionStatement": "Question text with KaTeX formatting",
  "options": ["(A) option 1", "(B) option 2", "(C) option 3", "(D) option 4"],
  "answer": "${isMSQ ? 'Comma-separated letters (e.g., A,C)' : 'Single letter (A, B, C, or D)'}",
  "solution": "Detailed solution with step-by-step reasoning in KaTeX format"
}`;
  }

  prompt += `

Generate the question now:`;

  return prompt;
}

async function callGeminiAPI(geminiKey: string, prompt: string): Promise<GeneratedQuestionData> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini API');
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from Gemini response');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    questionStatement: parsed.questionStatement || '',
    options: parsed.options || [],
    answer: parsed.answer || '',
    solution: parsed.solution || ''
  };
}

async function saveQuestionToDatabase(
  question: GeneratedQuestion,
  config: QuestionConfig
): Promise<void> {
  await supabase.from('new_questions').insert({
    topic_id: question.topicId,
    topic_name: question.topicName,
    question_statement: question.questionStatement,
    question_type: question.questionType,
    options: question.options,
    answer: question.answer,
    solution: question.solution,
    slot_id: config.slotId,
    part_id: config.partId,
    correct_marks: config.correctMarks,
    incorrect_marks: config.incorrectMarks,
    skipped_marks: config.skippedMarks,
    partial_marks: config.partialMarks,
    time_minutes: config.timeMinutes,
    answer_done: true,
    solution_done: true
  });
}
