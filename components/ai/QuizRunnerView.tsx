"use client";

import React, { useState, useTransition } from "react";
import { generateAIQuiz, submitQuizAttempt } from "@/lib/ai/quizzes";
import { QuizData, QuizAttempt, QuizQuestion } from "@/types/ai";
import { useLumi } from "@/components/mascot/LumiContext";
import {
  FileCheck,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Award,
  AlertCircle,
  Clock,
  ArrowRight,
  BookOpen,
} from "lucide-react";

interface QuizRunnerViewProps {
  initialAttempts?: QuizAttempt[];
  currentUserId: string | null;
  initialTopic?: string;
}

export function QuizRunnerView({
  initialAttempts = [],
  currentUserId,
  initialTopic = "",
}: QuizRunnerViewProps) {
  const { triggerMode } = useLumi();
  const [topic, setTopic] = useState(initialTopic);
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [attemptResult, setAttemptResult] = useState<QuizAttempt | null>(null);
  const [isEvaluating, startEvaluation] = useTransition();

  // Past Attempts
  const [pastAttempts, setPastAttempts] = useState<QuizAttempt[]>(initialAttempts);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setAttemptResult(null);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    triggerMode("thinking", 6000, "Crafting custom questions tailored to your learning...");

    const res = await generateAIQuiz({
      topic: topic.trim(),
      difficulty,
      questionCount,
    });

    setIsGenerating(false);

    if (res.error || !res.quiz) {
      setError(res.error || "Failed to generate quiz.");
      triggerMode("encouragement", 3500, "Let's try a different topic or check your connection.");
    } else {
      setActiveQuiz(res.quiz);
      triggerMode("explaining", 4000, "Quiz is ready! Take your time and do your best.");
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitQuiz = () => {
    if (!activeQuiz) return;

    startEvaluation(async () => {
      const res = await submitQuizAttempt({
        quizId: activeQuiz.id,
        topic: activeQuiz.topic,
        difficulty: activeQuiz.difficulty,
        questions: activeQuiz.questions,
        userAnswers,
      });

      if (res.attempt) {
        setAttemptResult(res.attempt);
        setPastAttempts((prev) => [res.attempt!, ...prev]);

        if (res.attempt.score === res.attempt.total_questions) {
          triggerMode("celebration", 6000, "Incredible! Perfect score on your quiz!");
        } else if (res.attempt.score >= Math.ceil(res.attempt.total_questions * 0.6)) {
          triggerMode("celebration", 4500, "Great job! You passed the quiz!");
        } else {
          triggerMode("encouragement", 4500, "That's okay! Review the suggestions and let's try again together.");
        }
      }
    });
  };

  const currentQuestion: QuizQuestion | undefined =
    activeQuiz?.questions[currentQuestionIndex];

  return (
    <div className="space-y-6">
      {/* Quiz Generator Configuration */}
      {!activeQuiz && !attemptResult && (
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-brand-600" />
              <span>AI Quiz Generator</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test your knowledge on skills learned during peer exchanges. AI will generate targeted Multiple Choice, True/False, and Short Answer questions, automatically grade them, identify weak topics, and suggest revision activities.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Topic or Skill
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 'React Hooks & State Management', 'Python Fast API', 'Docker'"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Questions
              </label>
              <div className="flex gap-2">
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-20 px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium"
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                </select>

                <button
                  type="submit"
                  disabled={isGenerating || !topic.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition shadow-md disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isGenerating ? "Building..." : "Generate Quiz"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-700 text-xs border border-red-200">
          {error}
        </div>
      )}

      {/* Active Quiz Runner */}
      {activeQuiz && !attemptResult && currentQuestion && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                {activeQuiz.topic} • {activeQuiz.difficulty}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
              </h3>
            </div>

            <div className="text-xs font-mono text-slate-400">
              {Object.keys(userAnswers).length} answered
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-4">
            <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQuestion.question}
            </p>

            {/* Multiple Choice & True/False Options */}
            {currentQuestion.options && currentQuestion.options.length > 0 ? (
              <div className="space-y-2.5">
                {currentQuestion.options.map((opt, oIdx) => {
                  const isSelected = userAnswers[currentQuestion.id] === opt;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleAnswerSelect(currentQuestion.id, opt)}
                      className={`w-full p-4 rounded-2xl text-left text-xs sm:text-sm font-medium border transition flex items-center justify-between ${
                        isSelected
                          ? "bg-brand-50/60 dark:bg-brand-950/40 border-brand-600 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500/30"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span>{opt}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Short Answer Input */
              <div className="space-y-2">
                <input
                  type="text"
                  value={userAnswers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                  placeholder="Type your concise answer here..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-40"
            >
              Previous
            </button>

            {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 transition shadow-sm"
              >
                Next Question
              </button>
            ) : (
              <button
                type="button"
                disabled={isEvaluating}
                onClick={handleSubmitQuiz}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-md disabled:opacity-50"
              >
                {isEvaluating ? "Evaluating..." : "Submit & Grade Quiz"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz Evaluation & Revision Results */}
      {attemptResult && activeQuiz && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-xl space-y-6 animate-in fade-in">
          {/* Result Score Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-brand-600 to-indigo-700 text-white shadow-lg">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm">
                <Award className="w-3.5 h-3.5 text-accent-amber" />
                <span>Quiz Results: {activeQuiz.topic}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold">
                Score: {attemptResult.score} / {attemptResult.total_questions} (
                {Math.round((attemptResult.score / attemptResult.total_questions) * 100)}%)
              </h3>
              <p className="text-indigo-100 text-xs">
                {attemptResult.score === attemptResult.total_questions
                  ? "Perfect score! You demonstrated thorough mastery."
                  : "Great effort! Review the weak topics below to reinforce your knowledge."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveQuiz(null);
                setAttemptResult(null);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-brand-700 text-xs font-bold hover:bg-slate-50 transition shadow"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Take Another Quiz</span>
            </button>
          </div>

          {/* Weak Topics & Revision Suggestions */}
          {attemptResult.weak_topics.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Identified Weak Topics to Revise:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {attemptResult.weak_topics.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-semibold"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 space-y-1">
                <span className="font-bold text-[11px] block">AI Revision Suggestions:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300">
                  {attemptResult.revision_suggestions.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Answers Breakdown with Explanations */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Detailed Question Explanations
            </h4>

            {activeQuiz.questions.map((q, idx) => {
              const uAns = attemptResult.user_answers[q.id] || "No answer provided";
              const isCorrect =
                uAns.trim().toLowerCase() === q.correct_answer.trim().toLowerCase();

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    isCorrect
                      ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/40"
                      : "bg-red-50/30 dark:bg-red-950/10 border-red-200 dark:border-red-800/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Q{idx + 1}: {q.question}
                    </p>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold shrink-0">
                        <CheckCircle2 className="w-4 h-4" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-bold shrink-0">
                        <XCircle className="w-4 h-4" /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                    <p>
                      <strong>Your answer:</strong> {uAns}
                    </p>
                    <p>
                      <strong>Correct answer:</strong> {q.correct_answer}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">
                    <strong>Explanation:</strong> {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Past Attempts History */}
      {!activeQuiz && pastAttempts.length > 0 && (
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Past Quiz Performance & Improvement Tracker
          </h4>

          <div className="space-y-2.5">
            {pastAttempts.slice(0, 5).map((att) => (
              <div
                key={att.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900 dark:text-white">
                    Score: {att.score} / {att.total_questions} ({Math.round((att.score / att.total_questions) * 100)}%)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(att.completed_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {att.weak_topics.length > 0 ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {att.weak_topics.length} topics to revise
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                      Mastered
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
