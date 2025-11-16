/*
  # Create topic_weightage table

  1. New Tables
    - `topic_weightage`
      - `id` (uuid, primary key)
      - `topic_id` (uuid, foreign key to topics)
      - `exam_id` (uuid, foreign key to exams)
      - `course_id` (uuid, foreign key to courses)
      - `slot_id` (uuid, nullable, foreign key to slots)
      - `part_id` (uuid, nullable, foreign key to parts)
      - `question_type` (text, MCQ/MSQ/NAT/SUB)
      - `weightage` (numeric, percentage weightage for this topic)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `topic_weightage` table
    - Add policy for authenticated users to read data
*/

CREATE TABLE IF NOT EXISTS topic_weightage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  slot_id uuid REFERENCES slots(id) ON DELETE CASCADE,
  part_id uuid REFERENCES parts(id) ON DELETE CASCADE,
  question_type text NOT NULL,
  weightage numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE topic_weightage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read topic weightage"
  ON topic_weightage
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert topic weightage"
  ON topic_weightage
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update topic weightage"
  ON topic_weightage
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
