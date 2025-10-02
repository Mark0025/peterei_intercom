'use server';

// Canvas Kit Server Actions - React 19 compatible
import type {
  CanvasKitResponse,
  CanvasKitFormData,
  ActionResult,
  CanvasKitComponent
} from '@/types';
import { getQuestionByIndex } from '@/services/onboarding-data';
import { logInfo, logError } from '@/services/logger';

// Helper to build Canvas Kit components
function createTextComponent(id: string, text: string, style?: 'header' | 'error' | 'muted'): CanvasKitComponent {
  const component: CanvasKitComponent = {
    type: 'text',
    id,
    text,
    align: 'center',
    ...(style && { style })
  };
  return component;
}

function createInputComponent(id: string, label: string, required = false): CanvasKitComponent {
  return {
    type: 'input',
    id,
    label,
    input_type: 'text',
    required
  };
}

function createButtonComponent(id: string, label: string, style: 'primary' | 'secondary' = 'primary'): CanvasKitComponent {
  return {
    type: 'button',
    id,
    label,
    style,
    action: { type: 'submit' }
  };
}

// Server Action: Initialize Canvas Kit
export async function initializeCanvasKit(): Promise<ActionResult<CanvasKitResponse>> {
  try {
    logInfo('Canvas Kit initialization requested');

    const response: CanvasKitResponse = {
      canvas: {
        content: {
          components: [
            createTextComponent('welcome', 'Welcome to Pete! Access the app or update your training topic:', 'header'),
            {
              type: 'button',
              id: 'open_pete_app',
              label: '🚀 Open Pete App',
              style: 'primary',
              action: {
                type: 'url',
                url: 'https://app.thepete.io'
              }
            },
            {
              type: 'button',
              id: 'open_pete_intercom',
              label: '🔗 Open Pete-Intercom App',
              style: 'primary',
              action: {
                type: 'url',
                url: 'https://peterei-intercom.onrender.com'
              }
            },
            createButtonComponent('start_new_onboarding', '🎯 Start Onboarding Process', 'secondary'),
            createButtonComponent('pete_user_training', '⚙️ Change Training Topic', 'secondary')
          ]
        }
      }
    };

    logInfo('Canvas Kit initialized successfully');
    return { success: true, data: response };
  } catch (error) {
    logError(`Canvas Kit Initialize error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      error: 'Failed to initialize Canvas Kit'
    };
  }
}

// Server Action: Handle Canvas Kit form submissions
export async function handleCanvasKitSubmit(formData: CanvasKitFormData): Promise<ActionResult<CanvasKitResponse>> {
  try {
    const { componentId, inputValues, storedData, userId } = formData;

    switch (componentId) {
      case 'start_new_onboarding': {
        // New Canvas Kit onboarding module - Coming Soon
        const response: CanvasKitResponse = {
          canvas: {
            content: {
              components: [
                createTextComponent('coming_soon_header', '🎯 Canvas Kit Onboarding', 'header'),
                createTextComponent('coming_soon_body', 'Our new interactive onboarding experience is coming soon! This will guide you through Pete setup step-by-step, right here in Intercom.'),
                createTextComponent('features_header', 'What to expect:', 'muted'),
                createTextComponent('feature_1', '✨ Interactive step-by-step guidance'),
                createTextComponent('feature_2', '📊 Real-time progress tracking'),
                createTextComponent('feature_3', '🤖 AI-powered recommendations'),
                createTextComponent('feature_4', '🔔 Smart notifications and reminders'),
                createButtonComponent('back_to_menu', 'Back to Main Menu', 'secondary')
              ]
            },
            stored_data: { ...storedData, userId }
          }
        };

        return { success: true, data: response };
      }

      case 'start_onboarding': {
        // Start the onboarding questionnaire
        const firstQuestion = getQuestionByIndex(0, 0);
        if (!firstQuestion) {
          throw new Error('No onboarding questions available');
        }

        const response: CanvasKitResponse = {
          canvas: {
            content: {
              components: [
                createTextComponent('section_header', `Section: ${firstQuestion.section}`, 'header'),
                createTextComponent('question_text', firstQuestion.detailed),
                createInputComponent('answer', firstQuestion.shorthand, true),
                createButtonComponent('submit_answer', 'Next Question')
              ]
            },
            stored_data: {
              ...storedData,
              sectionIndex: 0,
              questionIndex: 0,
              userId
            }
          }
        };

        return { success: true, data: response };
      }

      case 'submit_answer': {
        const sectionIndex = Number(storedData?.sectionIndex ?? 0);
        const questionIndex = Number(storedData?.questionIndex ?? 0);
        const answer = inputValues.answer;

        console.log(`[Canvas Kit] submit_answer: sectionIndex=${sectionIndex}, questionIndex=${questionIndex}, answer="${answer}"`);
        console.log(`[Canvas Kit] storedData:`, JSON.stringify(storedData, null, 2));

        if (!answer?.trim()) {
          const response: CanvasKitResponse = storedData
            ? {
                canvas: {
                  content: {
                    components: [
                      createTextComponent('error', 'Please provide an answer before continuing.', 'error'),
                      createButtonComponent('try_again', 'Try Again')
                    ]
                  },
                  stored_data: storedData
                }
              }
            : {
                canvas: {
                  content: {
                    components: [
                      createTextComponent('error', 'Please provide an answer before continuing.', 'error'),
                      createButtonComponent('try_again', 'Try Again')
                    ]
                  }
                }
              };
          return { success: false, data: response, error: 'Answer required' };
        }

        // TODO: Store answer in Intercom or database
        console.log(`Answer stored: Section ${sectionIndex}, Question ${questionIndex}: ${answer}`);

        // Get next question
        let nextSectionIndex = sectionIndex;
        let nextQuestionIndex = questionIndex + 1;

        console.log(`[Canvas Kit] Looking for next question: section=${nextSectionIndex}, question=${nextQuestionIndex}`);
        let nextQuestion = getQuestionByIndex(nextSectionIndex, nextQuestionIndex);

        // If no more questions in current section, move to next section
        if (!nextQuestion) {
          nextSectionIndex = sectionIndex + 1;
          nextQuestionIndex = 0;
          console.log(`[Canvas Kit] No more questions in section, moving to section=${nextSectionIndex}, question=${nextQuestionIndex}`);
          nextQuestion = getQuestionByIndex(nextSectionIndex, nextQuestionIndex);
        }

        console.log(`[Canvas Kit] Next question found:`, nextQuestion ? `"${nextQuestion.shorthand}"` : 'NONE');

        // If no more questions at all, show completion
        if (!nextQuestion) {
          const response: CanvasKitResponse = {
            canvas: {
              content: {
                components: [
                  createTextComponent('completion', 'Thank you for completing the onboarding!', 'header'),
                  createButtonComponent('start_over', 'Start Another Session', 'secondary')
                ]
              }
            }
          };
          return { success: true, data: response };
        }

        // Show next question
        const response: CanvasKitResponse = {
          canvas: {
            content: {
              components: [
                createTextComponent('section_header', `Section: ${nextQuestion.section}`, 'header'),
                createTextComponent('question_text', nextQuestion.detailed),
                createInputComponent('answer', nextQuestion.shorthand, true),
                createButtonComponent('submit_answer', 'Next Question')
              ]
            },
            stored_data: {
              ...storedData,
              sectionIndex: nextSectionIndex,
              questionIndex: nextQuestionIndex,
              userId
            }
          }
        };

        return { success: true, data: response };
      }

      case 'pete_user_training': {
        const response: CanvasKitResponse = {
          canvas: {
            content: {
              components: [
                createTextComponent('training_header', 'Pete User Training Topic', 'header'),
                createInputComponent('training_topic', 'Enter training topic', true),
                createButtonComponent('save_training', 'Save Training Topic')
              ]
            },
            stored_data: { ...storedData, userId }
          }
        };

        return { success: true, data: response };
      }

      case 'save_training': {
        const topic = inputValues.training_topic;
        if (!topic?.trim()) {
          const response: CanvasKitResponse = storedData
            ? {
                canvas: {
                  content: {
                    components: [
                      createTextComponent('error', 'Training topic is required.', 'error'),
                      createButtonComponent('try_again', 'Try Again')
                    ]
                  },
                  stored_data: storedData
                }
              }
            : {
                canvas: {
                  content: {
                    components: [
                      createTextComponent('error', 'Training topic is required.', 'error'),
                      createButtonComponent('try_again', 'Try Again')
                    ]
                  }
                }
              };
          return { success: false, data: response, error: 'Training topic required' };
        }

        // TODO: Update user training topic via Intercom API
        console.log(`Training topic updated for user ${userId}: ${topic}`);

        const response: CanvasKitResponse = {
          canvas: {
            content: {
              components: [
                createTextComponent('success', `Training topic updated: "${topic}"`, 'header'),
                createButtonComponent('back_to_menu', 'Back to Main Menu', 'secondary')
              ]
            }
          }
        };

        return { success: true, data: response };
      }

      default: {
        // Return to main menu
        return initializeCanvasKit();
      }
    }

  } catch (error) {
    console.error('[Canvas Kit] Submit error:', error);
    
    const errorResponse: CanvasKitResponse = {
      canvas: {
        content: {
          components: [
            createTextComponent('error', 'Something went wrong. Please try again.', 'error'),
            createButtonComponent('back_to_menu', 'Back to Main Menu')
          ]
        }
      }
    };

    return { 
      success: false, 
      data: errorResponse,
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}