"use client"

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { db, Question, Progress, UserProfile, LabModule, CORE_SUBJECTS } from '@/lib/db';
import { calculateSM2 } from '@/lib/sm2';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { Button } from '@/components/ui/button';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Trophy, ChevronRight, Loader2, Microscope, BookOpen, Zap, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { generateModuleQuiz } from '@/ai/flows/module-quiz-generator';
import { useToast } from '@/hooks/use-toast';

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [step, setStep] = useState<'subject' | 'module' | 'quiz'>('subject');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [modules, setModules] = useState<LabModule[]>([]);
  const { toast } = useToast();

  const handleSubjectSelect = async (subject: string) => {
    setSelectedSubject(subject);
    const allModules = await db.getAll<LabModule>('modules');
    const filtered = allModules.filter(m => m.subject === subject);
    setModules(filtered);
    setStep('module');
  };

  const startModuleAssay = async (module: LabModule) => {
    setLoading(true);
    try {
      // Use existing cached questions if any, or generate new ones from PDF titration
      if (!module.extractedText) {
        toast({ 
            variant: "destructive", 
            title: "Assay Failure", 
            description: "No clinical text found in this protocol. Please re-upload with clear selectable text." 
        });
        setLoading(false);
        return;
      }

      const result = await generateModuleQuiz({
        subject: module.subject,
        moduleName: module.name,
        moduleContent: module.extractedText,
        count: 5
      });

      if (result.questions && result.questions.length > 0) {
        setQuestions(result.questions);
        setStep('quiz');
      } else {
        throw new Error("AI failed to synthesize assay.");
      }
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Synthesis Error", 
        description: "Laboratory AI failed to titrate the protocol into questions." 
      });
    } finally {
      setLoading(false);
    }
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

    // Update User Profile Total Answered
    const profile = await db.getById<UserProfile>('profile', 'current-user');
    if (profile) {
      const updatedProfile = {
        ...profile,
        totalQuestionsAnswered: (profile.totalQuestionsAnswered || 0) + 1
      };
      await db.put('profile', updatedProfile);
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
      <div className="flex h-screen bg-[#050a0f] items-center justify-center text-white flex-col gap-6">
        <Zap className="animate-pulse text-primary" size={64} />
        <div className="text-center">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">AI TITRATION IN PROGRESS</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mt-2">Synthesizing clinical assays from protocol text...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#050a0f] overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        <div className="max-w-6xl mx-auto px-8 lg:px-16 py-32">
          {step === 'subject' && (
            <div className="space-y-12 animate-in fade-in duration-700">
               <div className="border-b border-white/5 pb-8">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter">Sector Selection</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Pick a clinical sector to begin titration.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {CORE_SUBJECTS.map((subject) => (
                  <button 
                    key={subject} 
                    onClick={() => handleSubjectSelect(subject)}
                    className="riot-card p-10 bg-white/[0.02] border border-white/5 hover:bg-primary hover:text-black transition-all group"
                  >
                    <Microscope size={32} className="mb-6 group-hover:scale-110 transition-transform" />
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">{subject}</h3>
                    <p className="text-[10px] font-bold opacity-60 mt-2 uppercase tracking-widest">Initiate Assay</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'module' && (
            <div className="space-y-12 animate-in slide-in-from-right-12 duration-700">
               <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">{selectedSubject} Assays</h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Select an uploaded protocol for AI-driven question synthesis.</p>
                </div>
                <Button variant="ghost" onClick={() => setStep('subject')} className="uppercase font-black text-[10px] tracking-widest">Back</Button>
              </div>

              {modules.length === 0 ? (
                <div className="text-center py-24 riot-card border border-dashed border-white/10 bg-white/[0.02]">
                    <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-black italic uppercase">No Protocols Found</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">You must upload modules to the Protocol Archives first.</p>
                    <Button asChild className="riot-button h-12 px-8 bg-primary text-black">
                        <Link href="/library">GO TO ARCHIVES</Link>
                    </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {modules.map((m) => (
                    <button 
                      key={m.id} 
                      onClick={() => startModuleAssay(m)}
                      className="riot-card p-8 bg-white/[0.02] border border-white/5 hover:border-primary/50 text-left group"
                    >
                      <BookOpen size={24} className="mb-4 text-primary" />
                      <h4 className="text-xl font-black italic uppercase tracking-tighter">{m.name}</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Generate Quiz from PDF</p>
                      <div className="mt-6 flex justify-end">
                         <div className="w-10 h-10 bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <ChevronRight className="text-black" />
                         </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'quiz' && !completed && (
            <div className="animate-in fade-in duration-700">
              <div className="flex items-center justify-between mb-12">
                <div className="flex-1 mr-8">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Assay Precision</span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{currentIndex + 1} / {questions.length}</span>
                  </div>
                  <ProgressBar value={((currentIndex + 1) / questions.length) * 100} className="h-1 bg-white/5" />
                </div>
                <Button variant="ghost" className="text-red-500 font-black uppercase text-[10px] tracking-widest" onClick={() => setCompleted(true)}>
                  Abort
                </Button>
              </div>

              <QuestionCard 
                key={questions[currentIndex].id}
                question={questions[currentIndex]} 
                onAnswer={handleAnswer} 
              />
            </div>
          )}

          {completed && (
            <div className="text-center py-20 animate-in fade-in zoom-in duration-700">
              <div className="w-24 h-24 bg-primary/20 text-primary rounded-none flex items-center justify-center mx-auto mb-8 border border-primary/30">
                <Trophy size={48} />
              </div>
              <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4 text-white">Assay Finalized</h2>
              <p className="text-muted-foreground mb-12 text-lg italic max-w-lg mx-auto leading-relaxed">
                Your titration levels for this module have been updated. The laboratory algorithm will schedule these protocols for future review.
              </p>
              
              <div className="flex gap-4 justify-center">
                <Button asChild variant="outline" className="riot-button h-16 px-10 border-white/10 text-white font-black text-[10px]">
                  <Link href="/dashboard">BACK TO LABORATORY</Link>
                </Button>
                <Button onClick={() => window.location.reload()} className="riot-button h-16 px-10 bg-primary text-black font-black text-[10px]">
                  NEW ASSAY <ChevronRight className="ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
