"use client"

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { db, Question, Progress, UserProfile, LabModule, CORE_SUBJECTS } from '@/lib/db';
import { calculateSM2 } from '@/lib/sm2';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { Button } from '@/components/ui/button';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { Trophy, ChevronRight, Loader2, Microscope, BookOpen, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { generateModuleQuiz } from '@/ai/flows/module-quiz-generator';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [step, setStep] = useState<'subject' | 'module' | 'quiz'>('subject');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [modules, setModules] = useState<LabModule[]>([]);
  
  // Reset States
  const [resetSubject, setResetSubject] = useState<string>('Hematology');
  const [resetModulesList, setResetModulesList] = useState<LabModule[]>([]);
  const [selectedResetModuleId, setSelectedResetModuleId] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadResetModules();
  }, [resetSubject]);

  const loadResetModules = async () => {
    const all = await db.getAll<LabModule>('modules');
    setResetModulesList(all.filter(m => m.subject === resetSubject));
  };

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

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCompleted(true);
    }
  };

  const resetModuleData = async () => {
    if (!selectedResetModuleId) return;
    
    const module = resetModulesList.find(m => m.id === selectedResetModuleId);
    if (!module) return;

    // 1. Get all questions
    const allQuestions = await db.getAll<Question>('questions');
    const questionsToRemove = allQuestions.filter(q => q.tags?.includes(module.name));

    // 2. Delete progress and questions
    for (const q of questionsToRemove) {
      await db.delete('progress', q.id);
      await db.delete('questions', q.id);
    }

    toast({
      title: "Assay Reset Successful",
      description: `All cached questions and progress for ${module.name} have been cleared.`,
    });
    
    setSelectedResetModuleId(null);
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
        
        <div className="max-w-6xl mx-auto px-8 lg:px-16 py-32 flex flex-col min-h-full">
          <div className="flex-1">
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

          {/* Reset Quizzes Section */}
          {(step === 'subject' || step === 'module') && !loading && (
            <div className="mt-32 pt-12 border-t border-white/5 space-y-8">
              <div className="flex items-center gap-3">
                <RefreshCw className="text-red-500/50" size={20} />
                <h3 className="text-sm font-black italic uppercase tracking-[0.3em] text-white/40">Reset Laboratory Assays</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Select Sector</label>
                  <Select value={resetSubject} onValueChange={setResetSubject}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-none h-12 text-[10px] font-black uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A1219] border-white/10 text-white rounded-none">
                      {CORE_SUBJECTS.map(s => (
                        <SelectItem key={s} value={s} className="uppercase font-black text-[10px] tracking-widest">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Select Protocol</label>
                  <Select value={selectedResetModuleId || ""} onValueChange={setSelectedResetModuleId}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-none h-12 text-[10px] font-black uppercase tracking-widest">
                      <SelectValue placeholder="SELECT MODULE" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A1219] border-white/10 text-white rounded-none">
                      {resetModulesList.map(m => (
                        <SelectItem key={m.id} value={m.id} className="uppercase font-black text-[10px] tracking-widest">{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      disabled={!selectedResetModuleId}
                      className="riot-button h-12 bg-white/5 border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/5 font-black text-[10px]"
                    >
                      RESET ASSAY DATA
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#0A1219] border-white/10 text-white rounded-none">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-black italic uppercase tracking-tighter text-2xl">Confirm Data Purge</AlertDialogTitle>
                      <AlertDialogDescription className="text-muted-foreground italic text-sm">
                        This action will permanently delete all cached questions and spaced repetition progress for the selected protocol. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="uppercase font-black text-[10px] rounded-none">Abort</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={resetModuleData}
                        className="bg-red-500 text-white hover:bg-red-600 uppercase font-black text-[10px] rounded-none"
                      >
                        PURGE ASSAY DATA
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
