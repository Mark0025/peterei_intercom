// Onboarding Data Service - Reads JSON with type safety
import { readFileSync } from 'fs';
import { join } from 'path';
import type { OnboardingData } from '@/types';

// Cache the data to avoid repeated file reads
let cachedData: OnboardingData | null = null;

export function getOnboardingData(): OnboardingData {
  if (cachedData) {
    return cachedData;
  }

  try {
    const dataPath = join(process.cwd(), 'src/data/onboarding-questions.json');
    const jsonData = readFileSync(dataPath, 'utf8');
    const parsedData = JSON.parse(jsonData) as OnboardingData;
    
    // Validate structure
    if (!parsedData.sections || !Array.isArray(parsedData.sections)) {
      throw new Error('Invalid onboarding data structure');
    }

    cachedData = parsedData;
    return cachedData;
  } catch (error) {
    console.error('Failed to load onboarding data:', error);
    throw new Error('Could not load onboarding questions');
  }
}

export function getAllQuestions() {
  const data = getOnboardingData();
  return data.sections.flatMap(section =>
    section.questions.map((q, index) => ({
      section: section.title,
      questionId: `${section.title.toLowerCase().replace(/\s+/g, '_')}_${index}`,
      ...q
    }))
  );
}

export function getQuestionByIndex(sectionIndex: number, questionIndex: number) {
  const data = getOnboardingData();
  const section = data.sections[sectionIndex];
  if (!section) return null;
  
  const question = section.questions[questionIndex];
  if (!question) return null;

  return {
    section: section.title,
    questionId: `${section.title.toLowerCase().replace(/\s+/g, '_')}_${questionIndex}`,
    sectionIndex,
    questionIndex,
    ...question
  };
}

export function getTotalQuestionCount(): number {
  return getAllQuestions().length;
}

// For admin editing - server action can write back to JSON
export async function updateOnboardingData(data: OnboardingData): Promise<boolean> {
  try {
    const dataPath = join(process.cwd(), 'src/data/onboarding-questions.json');
    const { writeFileSync } = await import('fs');
    
    writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    cachedData = null; // Clear cache to force reload
    return true;
  } catch (error) {
    console.error('Failed to update onboarding data:', error);
    return false;
  }
}