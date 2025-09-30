'use server';

/**
 * Server Actions for Onboarding Agent Chat
 *
 * Provides Next.js 15 Server Actions for the LangGraph onboarding agent.
 */

import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { chatWithOnboardingAgent, getOnboardingSuggestedQuestions } from "@/services/onboarding-agent";
import { analyzeQuestionnaireSession } from "./questionnaire-analysis";
import type { AgentChatResult, AgentMessage } from "@/types/questionnaire-analysis";

/**
 * Send a message to the onboarding agent
 */
export async function sendOnboardingMessage(
  sessionId: string,
  message: string,
  conversationHistory: AgentMessage[] = []
): Promise<AgentChatResult> {
  const startTime = Date.now();

  try {
    // Convert AgentMessage[] to BaseMessage[]
    const baseMessages: BaseMessage[] = conversationHistory.map(msg => {
      if (msg.role === 'user') {
        return new HumanMessage({ content: msg.content });
      } else if (msg.role === 'assistant') {
        return new AIMessage({ content: msg.content });
      }
      // Skip system messages for history
      return null;
    }).filter((m): m is BaseMessage => m !== null);

    // Call the agent
    const result = await chatWithOnboardingAgent(sessionId, message, baseMessages);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        metadata: {
          timestamp: Date.now(),
          duration: Date.now() - startTime
        }
      };
    }

    return {
      success: true,
      data: {
        message: result.message || '',
      },
      metadata: {
        timestamp: Date.now(),
        duration: Date.now() - startTime
      }
    };
  } catch (error) {
    console.error('[sendOnboardingMessage] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        timestamp: Date.now(),
        duration: Date.now() - startTime
      }
    };
  }
}

/**
 * Get suggested questions for the agent conversation
 */
export async function getSuggestedQuestions(sessionId: string): Promise<{
  success: boolean;
  questions?: string[];
  error?: string;
}> {
  try {
    // Load analysis to get context-specific suggestions
    const analysisResult = await analyzeQuestionnaireSession(sessionId);

    const questions = getOnboardingSuggestedQuestions(
      analysisResult.success ? analysisResult.data || null : null
    );

    return {
      success: true,
      questions
    };
  } catch (error) {
    console.error('[getSuggestedQuestions] Error:', error);

    // Return fallback suggestions
    return {
      success: true,
      questions: [
        "What should we build first?",
        "Show me the top pain points",
        "What breakthrough ideas were mentioned?",
        "Give me strategic recommendations"
      ]
    };
  }
}