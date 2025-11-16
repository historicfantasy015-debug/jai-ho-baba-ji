import { useState } from 'react';
import type { Exam, Course, Slot, Part } from '../lib/supabase';
import type { QuestionConfig } from '../types';

interface Props {
  exams: Exam[];
  courses: Course[];
  slots: Slot[];
  parts: Part[];
  selectedExam: string;
  selectedCourse: string;
  selectedSlot: string;
  selectedPart: string;
  onExamChange: (examId: string) => void;
  onCourseChange: (courseId: string) => void;
  onSlotChange: (slotId: string) => void;
  onPartChange: (partId: string) => void;
  onStartGeneration: (config: QuestionConfig) => void;
}

export default function ConfigurationForm({
  exams,
  courses,
  slots,
  parts,
  selectedExam,
  selectedCourse,
  selectedSlot,
  selectedPart,
  onExamChange,
  onCourseChange,
  onSlotChange,
  onPartChange,
  onStartGeneration
}: Props) {
  const [questionType, setQuestionType] = useState('MCQ');
  const [numberOfQuestions, setNumberOfQuestions] = useState(500);
  const [timeMinutes, setTimeMinutes] = useState(3);
  const [correctMarks, setCorrectMarks] = useState(4);
  const [incorrectMarks, setIncorrectMarks] = useState(-1);
  const [skippedMarks, setSkippedMarks] = useState(0);
  const [partialMarks, setPartialMarks] = useState(0);

  const handleSubmit = () => {
    if (!selectedExam || !selectedCourse || !selectedPart) {
      alert('Please select exam, course, and part');
      return;
    }

    const config: QuestionConfig = {
      examId: selectedExam,
      courseId: selectedCourse,
      slotId: selectedSlot || null,
      partId: selectedPart,
      questionType,
      numberOfQuestions,
      timeMinutes,
      correctMarks,
      incorrectMarks,
      skippedMarks,
      partialMarks
    };

    onStartGeneration(config);
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '24px',
        color: '#1a1a1a'
      }}>
        Question Generation Configuration
      </h2>

      <div style={{ display: 'grid', gap: '20px' }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#333'
          }}>
            Select Exam
          </label>
          <select
            value={selectedExam}
            onChange={(e) => onExamChange(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value="">Choose an exam...</option>
            {exams.map(exam => (
              <option key={exam.id} value={exam.id}>{exam.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#333'
          }}>
            Select Course
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => onCourseChange(e.target.value)}
            disabled={!selectedExam}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              opacity: selectedExam ? 1 : 0.5
            }}
          >
            <option value="">Choose a course...</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>

        {slots.length > 0 && (
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '8px',
              color: '#333'
            }}>
              Slot (Optional)
            </label>
            <select
              value={selectedSlot}
              onChange={(e) => onSlotChange(e.target.value)}
              disabled={!selectedCourse}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                opacity: selectedCourse ? 1 : 0.5
              }}
            >
              <option value="">Select a slot (optional)</option>
              {slots.map(slot => (
                <option key={slot.id} value={slot.id}>{slot.slot_name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '8px',
            color: '#333'
          }}>
            Part
          </label>
          <select
            value={selectedPart}
            onChange={(e) => onPartChange(e.target.value)}
            disabled={!selectedCourse}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              opacity: selectedCourse ? 1 : 0.5
            }}
          >
            <option value="">Choose a part...</option>
            {parts.map(part => (
              <option key={part.id} value={part.id}>{part.part_name}</option>
            ))}
          </select>
        </div>

        <div style={{
          borderTop: '1px solid #eee',
          paddingTop: '20px',
          marginTop: '8px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#1a1a1a'
          }}>
            Question Configuration
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#333'
              }}>
                Question Type
              </label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                <option value="MCQ">MCQ (Single Correct)</option>
                <option value="MSQ">MSQ (Multiple Correct)</option>
                <option value="NAT">NAT (Numerical Answer Type)</option>
                <option value="SUB">SUB (Subjective)</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#333'
              }}>
                Number of Questions
              </label>
              <input
                type="number"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                min={1}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#333'
              }}>
                Time (minutes)
              </label>
              <input
                type="number"
                value={timeMinutes}
                onChange={(e) => setTimeMinutes(Number(e.target.value))}
                min={0}
                step={0.5}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#333'
              }}>
                Correct Marks
              </label>
              <input
                type="number"
                value={correctMarks}
                onChange={(e) => setCorrectMarks(Number(e.target.value))}
                step={0.5}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#333'
              }}>
                Incorrect Marks
              </label>
              <input
                type="number"
                value={incorrectMarks}
                onChange={(e) => setIncorrectMarks(Number(e.target.value))}
                step={0.5}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#333'
              }}>
                Skipped Marks
              </label>
              <input
                type="number"
                value={skippedMarks}
                onChange={(e) => setSkippedMarks(Number(e.target.value))}
                step={0.5}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px',
                color: '#333'
              }}>
                Partial Marks
              </label>
              <input
                type="number"
                value={partialMarks}
                onChange={(e) => setPartialMarks(Number(e.target.value))}
                step={0.5}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          style={{
            marginTop: '8px',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
        >
          Generate Questions
        </button>
      </div>
    </div>
  );
}
