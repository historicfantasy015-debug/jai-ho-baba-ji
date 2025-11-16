export interface QuestionConfig {
  examId: string;
  courseId: string;
  slotId: string | null;
  partId: string | null;
  questionType: string;
  numberOfQuestions: number;
  timeMinutes: number;
  correctMarks: number;
  incorrectMarks: number;
  skippedMarks: number;
  partialMarks: number;
}

export interface TopicAllocation {
  topicId: string;
  topicName: string;
  weightage: number;
  questionsToGenerate: number;
}

export interface GeneratedQuestion {
  topicId: string;
  topicName: string;
  questionStatement: string;
  options: string[];
  answer: string;
  solution: string;
  questionType: string;
  status: 'generating' | 'completed' | 'error';
  error?: string;
}
