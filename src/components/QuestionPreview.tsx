import type { GeneratedQuestion } from '../types';

interface Props {
  question: GeneratedQuestion;
  questionNumber: number;
}

export default function QuestionPreview({ question, questionNumber }: Props) {
  const statusColor = question.status === 'completed' ? '#10b981' :
                      question.status === 'error' ? '#ef4444' : '#f59e0b';

  const statusText = question.status === 'completed' ? 'Generated' :
                     question.status === 'error' ? 'Error' : 'Generating';

  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#fafafa'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div>
          <span style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1a1a1a'
          }}>
            Question {questionNumber}
          </span>
          <span style={{
            marginLeft: '12px',
            fontSize: '13px',
            color: '#666'
          }}>
            Topic: {question.topicName}
          </span>
        </div>
        <span style={{
          padding: '4px 12px',
          backgroundColor: statusColor,
          color: 'white',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {statusText}
        </span>
      </div>

      {question.status === 'error' ? (
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          borderRadius: '6px',
          color: '#991b1b',
          fontSize: '14px'
        }}>
          {question.error || 'Failed to generate question'}
        </div>
      ) : question.status === 'completed' ? (
        <div>
          <div style={{
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Question:
            </div>
            <div style={{
              fontSize: '14px',
              color: '#1f2937',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {question.questionStatement}
            </div>
          </div>

          {question.options.length > 0 && (
            <div style={{
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Options:
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {question.options.map((option, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: option.startsWith(`(${question.answer})`) ? '#dcfce7' : 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: '#1f2937'
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            marginBottom: '16px'
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Correct Answer:
            </div>
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#dcfce7',
              border: '1px solid #86efac',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#166534',
              fontWeight: '500'
            }}>
              {question.answer}
            </div>
          </div>

          {question.solution && (
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Solution:
              </div>
              <div style={{
                padding: '12px',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#0c4a6e',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {question.solution}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
