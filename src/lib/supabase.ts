import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Exam {
  id: string;
  name: string;
  description: string;
}

export interface Course {
  id: string;
  exam_id: string;
  name: string;
  description: string;
}

export interface Slot {
  id: string;
  slot_name: string;
  course_id: string;
}

export interface Part {
  id: string;
  part_name: string;
  course_id: string;
  slot_id: string | null;
}

export interface Topic {
  id: string;
  name: string;
  notes: string;
  chapter_id: string;
}

export interface TopicWeightage {
  id: string;
  topic_id: string;
  exam_id: string;
  course_id: string;
  slot_id: string | null;
  part_id: string | null;
  question_type: string;
  weightage: number;
}

export interface QuestionTopicWise {
  id: string;
  topic_id: string;
  question_statement: string;
  question_type: string;
  options: string[];
  answer: string;
  solution: string;
  slot_id: string | null;
  part_id: string | null;
  diagram_json: any;
  options_diagrams: any;
  answer_diagram: any;
  solution_diagram: any;
}

export interface NewQuestion {
  id: string;
  topic_id: string;
  question_statement: string;
  question_type: string;
  options: string[];
  answer: string;
  solution: string;
  slot_id: string | null;
  part_id: string | null;
  diagram_json: any[];
  options_diagrams: any[];
  answer_diagram: any;
  solution_diagram: any;
}
