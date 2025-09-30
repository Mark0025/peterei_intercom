/**
 * Loading Messages Utility
 *
 * Fun loading messages inspired by Claude Code's approach
 * Provides random, engaging messages while users wait
 */

export const loadingMessages = [
  "🚀 Talking to outer space...",
  "🤖 PeteAI is fetching info...",
  "📚 Reading the documentation...",
  "🎯 Searching the knowledge base...",
  "💡 Connecting the dots...",
  "🔍 Digging through the archives...",
  "⚡ Powering up the circuits...",
  "🧠 Activating neural networks...",
  "📡 Beaming data from satellites...",
  "🎨 Painting the picture...",
  "🔮 Consulting the crystal ball...",
  "🌟 Making magic happen...",
  "🎪 Filibustering in style...",
  "🎭 Preparing the grand reveal...",
  "🎸 Tuning the algorithms...",
  "🎯 Aiming for perfection...",
  "🚂 All aboard the info train...",
  "🌊 Surfing the data waves...",
  "🎲 Rolling the digital dice...",
  "🎪 Running the circus...",
  "🔧 Tightening the bolts...",
  "🎬 Lights, camera, action...",
  "🎨 Mixing the perfect blend...",
  "🔬 Analyzing the molecules...",
  "🎯 Targeting the solution...",
  "🌈 Following the rainbow...",
  "🎪 Juggling the data...",
  "🎭 Setting the stage...",
  "🎸 Hitting the right notes...",
  "🚀 Launching the query..."
];

/**
 * Get a random loading message
 */
export function getRandomLoadingMessage(): string {
  return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
}

/**
 * Get a sequential loading message based on elapsed time
 * Changes every 2 seconds
 */
export function getSequentialLoadingMessage(startTime: number): string {
  const elapsed = Date.now() - startTime;
  const index = Math.floor(elapsed / 2000) % loadingMessages.length;
  return loadingMessages[index];
}

/**
 * Loading message hook for React components
 */
export function useLoadingMessage(isLoading: boolean) {
  const [message, setMessage] = React.useState(getRandomLoadingMessage());
  const [startTime] = React.useState(Date.now());

  React.useEffect(() => {
    if (!isLoading) return;

    // Update message every 2 seconds
    const interval = setInterval(() => {
      setMessage(getSequentialLoadingMessage(startTime));
    }, 2000);

    return () => clearInterval(interval);
  }, [isLoading, startTime]);

  return message;
}

// For non-React usage
import React from 'react';
