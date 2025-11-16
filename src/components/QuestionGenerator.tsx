import { useState, useEffect } from 'react';
import type { QuestionConfig, TopicAllocation, GeneratedQuestion } from '../types';
import { generateQuestionsForTopic } from '../services/geminiService';
import QuestionPreview from './QuestionPreview';

interface Props {
  geminiKey: string;
  config: QuestionConfig;
  topicAllocations: TopicAllocation[];
  onComplete: () => void;
}

export default function QuestionGenerator({
  geminiKey,
  config,
  topicAllocations,
  onComplete
}: Props) {
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [currentQuestionInTopic, setCurrentQuestionInTopic] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalQuestions = topicAllocations.reduce((sum, t) => sum + t.questionsToGenerate, 0);
  const completedQuestions = generatedQuestions.length;
  const progress = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;

  useEffect(() => {
    generateAllQuestions();
  }, []);

  const generateAllQuestions = async () => {
    try {
      for (let topicIdx = 0; topicIdx < topicAllocations.length; topicIdx++) {
        const topic = topicAllocations[topicIdx];
        setCurrentTopicIndex(topicIdx);

        for (let qIdx = 0; qIdx < topic.questionsToGenerate; qIdx++) {
          setCurrentQuestionInTopic(qIdx);

          const questions = await generateQuestionsForTopic(
            geminiKey,
            config,
            topic,
            1
          );

          setGeneratedQuestions(prev => [...prev, ...questions]);

          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setIsGenerating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setIsGenerating(false);
    }
  };

  const currentTopic = topicAllocations[currentTopicIndex];

  return (
    <div style={{ display: 'flex', gap: '24px' }}>
      <div style={{ flex: '0 0 400px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#1a1a1a'
          }}>
            Generation Progress
          </h2>

          <div style={{
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '14px',
              color: '#666'
            }}>
              <span>Overall Progress</span>
              <span>{completedQuestions} / {totalQuestions}</span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#10b981',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {isGenerating && currentTopic && (
            <div style={{
              padding: '16px',
              backgroundColor: '#f0f9ff',
              borderRadius: '6px',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#0369a1',
                marginBottom: '4px'
              }}>
                Generating...
              </div>
              <div style={{
                fontSize: '13px',
                color: '#075985'
              }}>
                Topic: {currentTopic.topicName}
              </div>
              <div style={{
                fontSize: '13px',
                color: '#075985'
              }}>
                Question {currentQuestionInTopic + 1} of {currentTopic.questionsToGenerate}
              </div>
            </div>
          )}

          {error && (
            <div style={{
              padding: '16px',
              backgroundColor: '#fef2f2',
              borderRadius: '6px',
              marginBottom: '16px',
              color: '#991b1b',
              fontSize: '14px'
            }}>
              Error: {error}
            </div>
          )}

          <div style={{
            marginTop: '24px'
          }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1a1a1a'
            }}>
              Topic Breakdown
            </h3>
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {topicAllocations.map((topic, idx) => {
                const topicQuestions = generatedQuestions.filter(q => q.topicId === topic.topicId);
                const isComplete = topicQuestions.length >= topic.questionsToGenerate;
                const isCurrent = idx === currentTopicIndex && isGenerating;

                return (
                  <div
                    key={topic.topicId}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: isCurrent ? '#f0f9ff' : isComplete ? '#f0fdf4' : '#f9fafb',
                      borderRadius: '6px',
                      border: isCurrent ? '1px solid #0ea5e9' : '1px solid #e5e7eb'
                    }}
                  >
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1a1a1a',
                      marginBottom: '4px'
                    }}>
                      {topic.topicName}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#666'
                    }}>
                      {topicQuestions.length} / {topic.questionsToGenerate} questions
                      {isComplete && ' ✓'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isGenerating && (
            <button
              onClick={onComplete}
              style={{
                marginTop: '24px',
                width: '100%',
                padding: '12px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Generate More Questions
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1 }}>
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
            Generated Questions Preview
          </h2>

          {generatedQuestions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px',
              color: '#666'
            }}>
              Waiting for questions to be generated...
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              {generatedQuestions.slice().reverse().map((question, idx) => (
                <QuestionPreview
                  key={idx}
                  question={question}
                  questionNumber={generatedQuestions.length - idx}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
