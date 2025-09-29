// Onboarding Types - 7-Level Questionnaire System

export interface OnboardingQuestion {
  shorthand: string;
  detailed: string;
}

export interface OnboardingSection {
  title: string;
  questions: OnboardingQuestion[];
}

export interface OnboardingData {
  sections: OnboardingSection[];
}

export interface OnboardingResponse {
  questionId: string;
  sectionTitle: string;
  shorthand: string;
  detailed: string;
  answer: string;
  answeredAt: Date;
}

export interface OnboardingSession {
  id: string;
  userId: string;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  responses: OnboardingResponse[];
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'abandoned';
}

// For server actions
export interface OnboardingFormData {
  sessionId?: string;
  userId?: string;
  answer: string;
  questionId: string;
  sectionIndex: number;
  questionIndex: number;
}

export interface OnboardingActionResult {
  success: boolean;
  error?: string;
  nextQuestion?: {
    sectionIndex: number;
    questionIndex: number;
    question: OnboardingQuestion;
    section: string;
  };
  isComplete?: boolean;
  sessionId?: string;
}

// Training topic types
export interface UserTrainingTopic {
  userId: string;
  topic: string;
  updatedAt: Date;
  updatedBy: string; // admin id
}

export interface TrainingTopicUpdate {
  userId: string;
  topic: string;
  audience?: 'admin' | 'user' | 'lead' | 'everyone';
}

export interface BulkTrainingTopicResult {
  successes: Array<{
    id: string;
    topic: string;
  }>;
  failures: Array<{
    id: string;
    error: string;
  }>;
}