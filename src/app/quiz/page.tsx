"use client"

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { db, Question, Progress, UserProfile } from '@/lib/db';
import { calculateSM2 } from '@/lib/sm2';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { Button } from '@/components/ui/button';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Trophy, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    const all = await db.getAll<Question>('questions');
    // Basic implementation: take first 10 for session
    setQuestions(all.sort(() => 0.5 - Math.random()).slice(0, 10));
    setLoading(false);
  };

  const handleAnswer = async (quality: number) => {
    const question = questions[currentIndex];
    
    // Update Spaced Repetition Progress
    const prevProgress = await db.getById<Progress>('progress', question.id);
    const newProgress = calculateSM2(quality, prevProgress);
    
    await db.put('progress', {
      questionId: question.id,
      ...newProgress
    });

    // Update User Profile Total Answered (Regardless of quality)
    const profile = await db.getById<UserProfile>('profile', 'current-user');
    if (profile) {
      const updatedProfile = {
        ...profile,
        totalQuestionsAnswered: (profile.totalQuestionsAnswered || 0) + 1
      };
      await db.put('profile', updatedProfile);
      // Notify other components (like Sidebar or Dashboard) to refresh stats
      window.dispatchEvent(new Event('profile-updated'));
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex h-screen bg-black">
        <Sidebar />
        <main className="flex-1 bg-[#121212] flex items-center justify-center">
          <div className="text-center p-8 bg-card border rounded-2xl max-w-md">
            <h2 className="text-2xl font-headline font-bold mb-4">No questions found</h2>
            <p className="text-muted-foreground mb-6">Please import some Anki files to start practicing.</p>
            <Button asChild className="rounded-full font-bold">
              <Link href="/import">GO TO IMPORT</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar />
      <main className="flex-1 bg-[#121212] overflow-y-auto">
        <DashboardHeader />
        
        <div className="max-w-4xl mx-auto px-8 py-12">
          {!completed ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <div className="flex-1 mr-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-muted-foreground">SESSION PROGRESS</span>
                    <span className="text-xs font-bold text-primary">{currentIndex + 1} / {questions.length}</span>
                  </div>
                  <ProgressBar value={((currentIndex + 1) / questions.length) * 100} className="h-2 bg-muted" />
                </div>
                <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={() => setCompleted(true)}>
                  END SESSION
                </Button>
              </div>

              <QuestionCard 
                key={questions[currentIndex].id}
                question={questions[currentIndex]} 
                onAnswer={handleAnswer} 
              />
            </>
          ) : (
            <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-8">
              <div className="w-24 h-24 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-success/30 shadow-[0_0_30px_rgba(161,48,247,0.2)]">
                <Trophy size={48} />
              </div>
              <h2 className="text-4xl font-headline font-bold mb-4">Session Complete!</h2>
              <p className="text-muted-foreground mb-8 text-lg">Your titration levels have been updated. Spaced repetition algorithm will schedule these next reviews.</p>
              
              <div className="flex gap-4 justify-center">
                <Button asChild variant="outline" className="rounded-full px-8 py-6 h-auto font-bold border-muted">
                  <Link href="/dashboard">BACK TO DASHBOARD</Link>
                </Button>
                <Button asChild className="rounded-full px-8 py-6 h-auto font-bold bg-primary text-black">
                  <Link href="/quiz" onClick={() => window.location.reload()}>
                    NEW SESSION <ChevronRight className="ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
