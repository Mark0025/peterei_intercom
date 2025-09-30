'use client';

/**
 * 7-Levels Deep Onboarding Questionnaire
 *
 * EOS-style questioning form to understand why onboarding works or fails
 * Beautiful Pete-branded UI for Jon and Mark to complete discovery
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  Target,
  Lightbulb,
  FileText,
  Download,
  Upload
} from 'lucide-react';
import {
  saveQuestionnaireResponse,
  completeQuestionnaireSession,
  getQuestionnaireSession,
  exportSessionToMarkdown
} from '@/actions/questionnaire';
import type { QuestionnaireSession } from '@/actions/questionnaire';
import questionnaireData from '@/data/onboarding-questionnaire.json';
import FileUpload from '@/components/file-upload';
import DataStructureReport from '@/components/data-structure-report';
import { analyzeUploadedData } from '@/actions/analyze-upload';
import type { ParsedData } from '@/utils/file-parser';
import type { DataStructureAnalysis } from '@/types/nlp-analysis';

type QuestionData = {
  id: string;
  level: number;
  question: string;
  context: string;
  expectedAnswerType: string;
};

type SectionData = {
  id: string;
  title: string;
  shortDescription: string;
  questions: QuestionData[];
};

export default function OnboardingQuestionnairePage() {
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [respondent, setRespondent] = useState('');
  const [started, setStarted] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [resolutionCategory, setResolutionCategory] = useState<string>('');
  const [notes, setNotes] = useState('');

  // New state for file upload and analysis
  const [showUpload, setShowUpload] = useState(true);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [analysis, setAnalysis] = useState<DataStructureAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const sections = questionnaireData.sections as SectionData[];
  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
  const answeredQuestions = answers.size;
  const progress = (answeredQuestions / totalQuestions) * 100;

  // Load existing session on mount
  useEffect(() => {
    const loadSession = async () => {
      const result = await getQuestionnaireSession(sessionId);
      if (result.success && result.data) {
        const session = result.data;
        setRespondent(session.respondent);
        setStarted(true);

        // Load answers
        const loadedAnswers = new Map<string, string>();
        session.responses.forEach(r => {
          loadedAnswers.set(r.questionId, r.answer);
        });
        setAnswers(loadedAnswers);

        // Set current answer if exists
        if (currentQuestion && loadedAnswers.has(currentQuestion.id)) {
          setCurrentAnswer(loadedAnswers.get(currentQuestion.id) || '');
        }
      }
    };

    if (started) {
      loadSession();
    }
  }, [sessionId, started]);

  // Update current answer when question changes
  useEffect(() => {
    if (currentQuestion) {
      setCurrentAnswer(answers.get(currentQuestion.id) || '');
    }
  }, [currentQuestion, answers]);

  async function handleStart() {
    if (!respondent.trim()) return;
    setStarted(true);
  }

  async function handleSaveAnswer() {
    if (!currentAnswer.trim() || !currentQuestion) return;

    setLoading(true);
    try {
      await saveQuestionnaireResponse(sessionId, respondent, {
        questionId: currentQuestion.id,
        sectionId: currentSection.id,
        level: currentQuestion.level,
        question: currentQuestion.question,
        answer: currentAnswer
      });

      // Update local state
      setAnswers(new Map(answers.set(currentQuestion.id, currentAnswer)));

      // Move to next question
      handleNext();
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      // All questions completed
      setCompleted(true);
    }
  }

  function handlePrevious() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentQuestionIndex(sections[currentSectionIndex - 1].questions.length - 1);
    }
  }

  async function handleComplete() {
    setLoading(true);
    try {
      await completeQuestionnaireSession(sessionId, resolutionCategory, notes);

      // Download markdown export
      const result = await exportSessionToMarkdown(sessionId);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `onboarding-discovery-${respondent}-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleFileProcessed(data: ParsedData) {
    setParsedData(data);
    setAnalyzing(true);

    try {
      const result = await analyzeUploadedData(data);
      if (result.success && result.data) {
        setAnalysis(result.data);
        setShowUpload(false);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  }

  function handleStartQuestionnaire() {
    setShowUpload(false);
  }

  // Upload & Analysis screen
  if (!started && showUpload) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="mb-8 text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Upload Client Data
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload your client&apos;s onboarding data to begin NLP-powered analysis
          </p>
        </div>

        {analyzing ? (
          <Card className="border-2 border-purple-200">
            <CardContent className="py-16 text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-600" />
              <p className="text-lg font-medium">Analyzing data structure...</p>
              <p className="text-sm text-muted-foreground">
                Running NLP analysis on fields, quality metrics, and patterns
              </p>
            </CardContent>
          </Card>
        ) : (
          <FileUpload onFileProcessed={handleFileProcessed} />
        )}

        <div className="mt-8 bg-slate-50 dark:bg-slate-900 p-6 rounded-lg">
          <p className="font-semibold flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-yellow-600" />
            What Happens Next
          </p>
          <ul className="space-y-2 ml-6 text-sm text-muted-foreground">
            <li>• NLP engine analyzes field types, quality, and patterns</li>
            <li>• View comprehensive data structure report</li>
            <li>• Receive dynamic questions tailored to your data</li>
            <li>• 7-levels deep EOS-style questioning</li>
            <li>• Export insights and action items</li>
          </ul>
        </div>
      </div>
    );
  }

  // Analysis Report screen
  if (!started && !showUpload && analysis) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <DataStructureReport
          analysis={analysis}
          onStartQuestionnaire={() => setStarted(true)}
        />
      </div>
    );
  }

  // Start screen (name input)
  if (!started) {
    return (
      <div className="container mx-auto py-16 max-w-2xl">
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <Target className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              7-Levels Deep Onboarding Discovery
            </CardTitle>
            <CardDescription className="text-base">
              EOS-style questioning to understand why our onboarding works or fails.
              This deep discovery helps us extract Jon&apos;s mental model and identify root causes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="respondent">Your Name</Label>
              <Input
                id="respondent"
                placeholder="Jon or Mark"
                value={respondent}
                onChange={(e) => setRespondent(e.target.value)}
                className="text-lg"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-2 text-sm">
              <p className="font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                What to Expect
              </p>
              <ul className="space-y-1 ml-6 text-muted-foreground">
                <li>• {sections.length} sections covering key onboarding topics</li>
                <li>• {totalQuestions} questions total (7 levels deep per section)</li>
                <li>• Each level digs deeper into WHY things work or fail</li>
                <li>• Your answers will be saved automatically</li>
                <li>• Export to Markdown when complete</li>
              </ul>
            </div>

            <Button
              onClick={handleStart}
              disabled={!respondent.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              Begin Discovery
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completion screen
  if (completed) {
    return (
      <div className="container mx-auto py-16 max-w-2xl">
        <Card className="border-2 border-green-200 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Discovery Complete!
            </CardTitle>
            <CardDescription className="text-base">
              You&apos;ve completed all {totalQuestions} questions across {sections.length} sections.
              Let&apos;s categorize the insights and export your responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Primary Resolution Category</Label>
              <RadioGroup value={resolutionCategory} onValueChange={setResolutionCategory}>
                {['Education', 'Coding', 'Expectations', 'Process', 'Data Validation'].map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <RadioGroupItem value={category} id={category} />
                    <Label htmlFor={category} className="cursor-pointer">{category}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional insights, patterns, or action items..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              size="lg"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                <><Download className="mr-2 h-4 w-4" /> Export & Complete</>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setCompleted(false)}
              className="w-full"
            >
              Review Answers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Question screen
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Progress Header */}
      <div className="mb-6 space-y-2">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{respondent} • Session {sessionId.slice(-8)}</span>
          <span>{answeredQuestions} / {totalQuestions} questions</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Section Badge */}
      <div className="mb-6">
        <Badge variant="outline" className="text-sm px-4 py-1 bg-purple-50 dark:bg-purple-900/20">
          Section {currentSectionIndex + 1} of {sections.length}: {currentSection.title}
        </Badge>
      </div>

      {/* Question Card */}
      <Card className="border-2 border-purple-100 shadow-lg mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">
                Level {currentQuestion.level} Question
              </CardTitle>
              <CardDescription className="text-base">
                {currentQuestion.context}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="ml-4">
              {currentQuestion.expectedAnswerType}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg">
            <p className="text-lg font-semibold">{currentQuestion.question}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer" className="text-base">Your Answer</Label>
            <Textarea
              id="answer"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Share your thoughts, experiences, and insights..."
              rows={8}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Be specific and honest. The goal is to extract deep understanding, not perfect answers.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentSectionIndex === 0 && currentQuestionIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <Button
              onClick={handleSaveAnswer}
              disabled={!currentAnswer.trim() || loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <>Save & Continue<ChevronRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Section Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {currentSection.questions.map((q, index) => {
              const isAnswered = answers.has(q.id);
              const isCurrent = index === currentQuestionIndex;

              return (
                <div
                  key={q.id}
                  className={`
                    h-12 rounded flex items-center justify-center text-sm font-semibold
                    ${isCurrent ? 'ring-2 ring-purple-600 bg-purple-100 dark:bg-purple-900/40' : ''}
                    ${isAnswered && !isCurrent ? 'bg-green-100 dark:bg-green-900/40 text-green-700' : ''}
                    ${!isAnswered && !isCurrent ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : ''}
                  `}
                >
                  {isAnswered ? <Check className="h-4 w-4" /> : q.level}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}