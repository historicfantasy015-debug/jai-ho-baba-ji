import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Exam, Course, Slot, Part } from '../lib/supabase';
import type { QuestionConfig, TopicAllocation } from '../types';
import { calculateTopicAllocations } from '../services/topicAllocationService';
import ConfigurationForm from './ConfigurationForm';
import QuestionGenerator from './QuestionGenerator';

export default function QuestionMaker() {
  const [geminiKey, setGeminiKey] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [parts, setParts] = useState<Part[]>([]);

  const [selectedExam, setSelectedExam] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedPart, setSelectedPart] = useState('');

  const [config, setConfig] = useState<QuestionConfig | null>(null);
  const [topicAllocations, setTopicAllocations] = useState<TopicAllocation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      loadCourses(selectedExam);
    }
  }, [selectedExam]);

  useEffect(() => {
    if (selectedCourse) {
      loadSlots(selectedCourse);
      loadParts(selectedCourse, null);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedCourse && selectedSlot) {
      loadParts(selectedCourse, selectedSlot);
    }
  }, [selectedSlot]);

  const loadExams = async () => {
    const { data, error } = await supabase
      .from('exams')
      .select('id, name, description')
      .order('name');

    if (data && !error) {
      setExams(data);
    }
  };

  const loadCourses = async (examId: string) => {
    const { data, error } = await supabase
      .from('courses')
      .select('id, exam_id, name, description')
      .eq('exam_id', examId)
      .order('name');

    if (data && !error) {
      setCourses(data);
    }
  };

  const loadSlots = async (courseId: string) => {
    const { data, error } = await supabase
      .from('slots')
      .select('id, slot_name, course_id')
      .eq('course_id', courseId)
      .order('slot_name');

    if (data && !error) {
      setSlots(data);
    }
  };

  const loadParts = async (courseId: string, slotId: string | null) => {
    let query = supabase
      .from('parts')
      .select('id, part_name, course_id, slot_id')
      .eq('course_id', courseId);

    if (slotId) {
      query = query.eq('slot_id', slotId);
    } else {
      query = query.is('slot_id', null);
    }

    const { data, error } = await query.order('part_name');

    if (data && !error) {
      setParts(data);
    }
  };


  const handleStartGeneration = async (questionConfig: QuestionConfig) => {
    if (!geminiKey.trim()) {
      alert('Please enter your Gemini API key');
      return;
    }

    const allocations = await calculateTopicAllocations(questionConfig);

    if (allocations.length === 0) {
      alert('No topics found with questions for the selected configuration. Please check:\n\n1. Topics exist in the database linked to this course\n2. Questions exist for those topics with the selected question type\n3. The course hierarchy (course -> subjects -> units -> chapters -> topics) is properly set up');
      return;
    }

    setConfig(questionConfig);
    setTopicAllocations(allocations);
    setIsGenerating(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '600',
          marginBottom: '32px',
          color: '#1a1a1a'
        }}>
          Question Maker - Gemini 2.0 Pro
        </h1>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#333'
          }}>
            Gemini API Key
          </label>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="Enter your Gemini 2.0 Pro API key"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          />
        </div>

        {!isGenerating ? (
          <ConfigurationForm
            exams={exams}
            courses={courses}
            slots={slots}
            parts={parts}
            selectedExam={selectedExam}
            selectedCourse={selectedCourse}
            selectedSlot={selectedSlot}
            selectedPart={selectedPart}
            onExamChange={setSelectedExam}
            onCourseChange={setSelectedCourse}
            onSlotChange={setSelectedSlot}
            onPartChange={setSelectedPart}
            onStartGeneration={handleStartGeneration}
          />
        ) : (
          <QuestionGenerator
            geminiKey={geminiKey}
            config={config!}
            topicAllocations={topicAllocations}
            onComplete={() => setIsGenerating(false)}
          />
        )}
      </div>
    </div>
  );
}
