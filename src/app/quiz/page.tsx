
"use client"

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { db, Question, Progress, LabModule, CORE_SUBJECTS } from '@/lib/db';
import { calculateSM2 } from '@/lib/sm2';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Loader2, 
  Microscope, 
  BookOpen, 
  Zap, 
  AlertCircle, 
  RefreshCw,
  Database,
  ChevronLeft,
  Trash2,
  RotateCcw,
  Eraser
} from 'lucide-react';
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

// Direct import of system archives for offline PWA reliability
import systemArchives from '@/lib/archives.json';

interface SubjectStats {
  mastered: number;
  total: number;
  unanswered: number;
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [step, setStep] = useState<'subject' | 'module' | 'quiz'>('subject');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [modules, setModules] = useState<LabModule[]>([]);
  const [chapters, setChapters] = useState<{ name: string; mastered: number; total: number }[]>([]);
  const [subjectStats, setSubjectStats] = useState<Record<string, SubjectStats>>({});
  
  const [importing, setImporting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadGlobalStats();
    const handleArchivePurge = () => {
        loadGlobalStats();
        setStep('subject');
    };
    window.addEventListener('archives-purged', handleArchivePurge);
    return () => window.removeEventListener('archives-purged', handleArchivePurge);
  }, []);

  const loadGlobalStats = async () => {
    const allQuestions = await db.getAll<Question>('questions');
    const allProgress = await db.getAll<Progress>('progress');

    const stats: Record<string, SubjectStats> = {};
    
    CORE_SUBJECTS.forEach(subject => {
      const subjectQs = allQuestions.filter(q => q.subject === subject);
      const masteredCount = allProgress.filter(p => {
        const q = subjectQs.find(sq => sq.id === p.questionId);
        return q && (p.repetition || 0) > 0;
      }).length;

      stats[subject] = {
        total: subjectQs.length,
        mastered: masteredCount,
        unanswered: subjectQs.length - masteredCount
      };
    });

    setSubjectStats(stats);
  };

  const handleSubjectSelect = async (subject: string) => {
    setLoading(true);
    setSelectedSubject(subject);
    
    const allModules = await db.getAll<LabModule>('modules');
    const filteredModules = allModules.filter(m => m.subject === subject);
    setModules(filteredModules);

    const allQuestions = await db.getAll<Question>('questions');
    const subjectQuestions = allQuestions.filter(q => q.subject === subject);
    const allProgress = await db.getAll<Progress>('progress');
    
    const uniqueChapterNames = Array.from(new Set(subjectQuestions.map(q => q.tags[0] || 'Uncategorized')))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      
    const chaptersWithData = uniqueChapterNames.map(name => {
        const chapterQs = subjectQuestions.filter(q => q.tags[0] === name);
        const chapterProgress = allProgress.filter(p => chapterQs.some(q => q.id === p.questionId));
        const masteredCount = chapterProgress.filter(p => (p.repetition || 0) > 0).length;
        return { name, mastered: masteredCount, total: chapterQs.length };
    });

    setChapters(chaptersWithData);
    setStep('module');
    setLoading(false);
  };

  const startChapterAssay = async (chapterName: string) => {
    if (!selectedSubject) return;
    setLoading(true);
    const allQuestions = await db.getAll<Question>('questions');
    const filtered = allQuestions.filter(q => q.subject === selectedSubject && q.tags.includes(chapterName));
    
    if (filtered.length > 0) {
      setQuestions(filtered);
      setStep('quiz');
      setCurrentIndex(0);
      setCompleted(false);
    } else {
      toast({ title: "Chapter Empty", description: "No titrated data found for this chapter." });
    }
    setLoading(false);
  };

  const resetChapterProgress = async (chapterName: string) => {
    if (!selectedSubject) return;
    setLoading(true);
    try {
      const allQuestions = await db.getAll<Question>('questions');
      const chapterQs = allQuestions.filter(q => q.subject === selectedSubject && q.tags.includes(chapterName));
      for (const q of chapterQs) {
        await db.delete('progress', q.id);
      }
      toast({ title: "Chapter Calibrated", description: `Reset progress for ${chapterName}.` });
      handleSubjectSelect(selectedSubject);
      loadGlobalStats();
    } catch (err) {
      toast({ variant: "destructive", title: "Calibration Failed", description: "Could not reset progress." });
    } finally {
      setLoading(false);
    }
  };

  const resetSubjectProgress = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    try {
      const allQuestions = await db.getAll<Question>('questions');
      const subjectQs = allQuestions.filter(q => q.subject === selectedSubject);
      for (const q of subjectQs) {
        await db.delete('progress', q.id);
      }
      toast({ title: "Subject Calibrated", description: `Reset all progress for ${selectedSubject}.` });
      handleSubjectSelect(selectedSubject);
      loadGlobalStats();
    } catch (err) {
      toast({ variant: "destructive", title: "Calibration Failed", description: "Could not reset progress." });
    } finally {
      setLoading(false);
    }
  };

  const purgeSubjectRecords = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    try {
      const allQuestions = await db.getAll<Question>('questions');
      const subjectQs = allQuestions.filter(q => q.subject === selectedSubject);
      for (const q of subjectQs) {
        await db.delete('questions', q.id);
        await db.delete('progress', q.id);
      }
      toast({ title: "Subject Purged", description: `Permanently deleted all ${selectedSubject} archives.` });
      setStep('subject');
      loadGlobalStats();
    } catch (err) {
      toast({ variant: "destructive", title: "Purge Failed", description: "Could not delete subject data." });
    } finally {
      setLoading(false);
    }
  };

  const purgeAllRecords = async () => {
    const allQuestions = await db.getAll<Question>('questions');
    for (const q of allQuestions) {
      await db.delete('questions', q.id);
      await db.delete('progress', q.id);
    }
    const allModules = await db.getAll<LabModule>('modules');
    for (const m of allModules) {
      await db.delete('modules', m.id);
    }
    await loadGlobalStats();
    toast({ title: "Laboratory Purged", description: "All questions and modules deleted." });
    setStep('subject');
    window.dispatchEvent(new Event('archives-purged'));
  };

  const handleAnswer = async (quality: number) => {
    const question = questions[currentIndex];
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
      loadGlobalStats();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setStep('module');
    }
  };

  const handleExitAssay = () => {
    setStep('module');
    setCurrentIndex(0);
    setQuestions([]);
  };

  const returnToSubjectDirectory = () => {
    if (selectedSubject) {
      handleSubjectSelect(selectedSubject);
    }
    setCompleted(false);
    setStep('module');
  };

  const syncSystemArchives = async () => {
    setImporting(true);
    try {
      const questionsToImport: Question[] = systemArchives.map((item: any, idx: number) => {
        const filteredChoices = item.choices.map((text: string, i: number) => ({
          id: String.fromCharCode(65 + i),
          text: text
        }));

        const answerId = filteredChoices.find(c => c.text.trim() === item.answer.trim())?.id || 'A';

        return {
          id: `sys-${Date.now()}-${idx}`,
          subject: item.category,
          question: item.question,
          choices: filteredChoices,
          answerId: answerId,
          rationale: `Source: ${item.source}. Chapter: ${item.chapter}. Answer: ${item.answer}`,
          tags: [item.chapter]
        };
      });

      await db.bulkPut('questions', questionsToImport);
      await loadGlobalStats();
      
      if (selectedSubject) {
        handleSubjectSelect(selectedSubject);
      }
      
      toast({ title: "Sync Successful", description: `Synchronized ${questionsToImport.length} system protocols.` });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not access system archives." });
    } finally {
      setImporting(false);
    }
  };

  const startModuleAssay = async (module: LabModule) => {
    setLoading(true);
    try {
      if (!module.extractedText) {
        toast({ variant: "destructive", title: "Assay Failure", description: "No clinical text found." });
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
        setCurrentIndex(0);
        setCompleted(false);
      } else {
        throw new Error("AI failed synthesis.");
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Synthesis Error", description: "Lab AI failed titration." });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0b111a] items-center justify-center text-white flex-col gap-6">
        <Zap className="animate-pulse text-primary" size={64} />
        <div className="text-center">
            <h2 className="text-2xl xl:text-5xl font-black italic uppercase tracking-tighter text-white">Laboratory Protocol Sync</h2>
            <p className="text-[10px] xl:text-[14px] font-bold text-muted-foreground uppercase tracking-[0.4em] mt-2">Accessing local archives...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0b111a] overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        <div className="max-w-7xl xl:max-w-[1600px] mx-auto px-8 lg:px-16 py-32 flex flex-col min-h-full">
          <div className="flex-1">
            {step === 'subject' && (
              <div className="space-y-12 xl:space-y-20 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-8 gap-6">
                    <div>
                        <h2 className="text-4xl xl:text-6xl font-black italic uppercase tracking-tighter text-white">Sector Selection</h2>
                        <p className="text-xs xl:text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2 text-white/60">Pick a clinical sector folder to begin titration.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                  {CORE_SUBJECTS.map((subject) => {
                    const stats = subjectStats[subject] || { mastered: 0, total: 0, unanswered: 0 };
                    return (
                      <button 
                        key={subject} 
                        onClick={() => handleSubjectSelect(subject)}
                        className="riot-card p-8 xl:p-12 bg-white/[0.02] border border-white/5 hover:bg-primary hover:text-black transition-all group text-left flex flex-col justify-between"
                      >
                        <div>
                          <Microscope size={32} className="mb-6 group-hover:scale-110 transition-transform xl:size-40 text-primary group-hover:text-black" />
                          <h3 className="text-xl xl:text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-black">{subject}</h3>
                        </div>
                        <div className="mt-6 space-y-2 border-t border-white/5 pt-4 group-hover:border-black/10">
                           <div className="flex justify-between items-center text-[9px] xl:text-[11px] font-black uppercase tracking-widest opacity-60 group-hover:text-black">
                             <span>Answered</span>
                             <span>{stats.mastered}</span>
                           </div>
                           <div className="flex justify-between items-center text-[9px] xl:text-[11px] font-black uppercase tracking-widest opacity-60 group-hover:text-black">
                             <span>Unanswered</span>
                             <span>{stats.unanswered}</span>
                           </div>
                           <div className="flex justify-between items-center text-[9px] xl:text-[11px] font-black uppercase tracking-widest opacity-60 group-hover:text-black border-t border-white/5 pt-1 group-hover:border-black/10">
                             <span>Total Cards</span>
                             <span>{stats.total}</span>
                           </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 'module' && (
              <div className="space-y-12 xl:space-y-20 animate-in slide-in-from-right-12 duration-700">
                <div className="flex items-center justify-between border-b border-white/5 pb-8">
                  <div className="flex items-center gap-4">
                      <Button variant="ghost" onClick={() => setStep('subject')} className="p-0 hover:bg-transparent text-primary">
                        <ChevronLeft size={32} />
                      </Button>
                      <div>
                        <h2 className="text-4xl xl:text-6xl font-black italic uppercase tracking-tighter text-white">{selectedSubject} Archives</h2>
                        <p className="text-xs xl:text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2 text-white/60">Select a chapter archive or PDF protocol.</p>
                      </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {chapters.map((chapter) => (
                    <div key={chapter.name} className="relative group">
                      <button 
                        onClick={() => startChapterAssay(chapter.name)}
                        className="riot-card w-full p-8 xl:p-12 bg-primary/10 border border-primary/30 hover:bg-primary hover:text-black transition-all text-left"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <Database size={24} className="text-primary group-hover:text-black xl:size-32" />
                          <div className="text-right">
                             <span className="text-2xl xl:text-4xl font-black italic text-primary/50 group-hover:text-black/50">{chapter.mastered}/{chapter.total}</span>
                             <p className="text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:text-black">Score</p>
                          </div>
                        </div>
                        <h4 className="text-xl xl:text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-black truncate w-full">
                          {chapter.name}
                        </h4>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          resetChapterProgress(chapter.name);
                        }}
                        className="absolute bottom-4 right-4 p-2 bg-black/40 hover:bg-red-500/20 text-white/20 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 z-20"
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  ))}

                  {modules.map((m) => (
                    <button 
                      key={m.id} 
                      onClick={() => startModuleAssay(m)}
                      className="riot-card p-8 xl:p-12 bg-white/[0.02] border border-white/5 hover:border-primary/50 text-left group"
                    >
                      <BookOpen size={24} className="mb-4 text-primary xl:size-32" />
                      <h4 className="text-xl xl:text-3xl font-black italic uppercase tracking-tighter text-white truncate w-full">
                        {m.name}
                      </h4>
                      <p className="text-[10px] xl:text-[12px] font-bold text-muted-foreground uppercase tracking-widest mt-2 text-white/60">AI Assay Synthesis</p>
                    </button>
                  ))}
                  
                  {chapters.length === 0 && modules.length === 0 && (
                     <div className="col-span-full py-20 text-center opacity-30 border border-dashed border-white/10 riot-card">
                       <AlertCircle className="mx-auto mb-4" size={48} />
                       <h3 className="text-2xl font-black italic uppercase">No Titrated Data</h3>
                       <p className="text-xs font-bold uppercase tracking-widest mt-2">Initialize or upload a protocol below.</p>
                     </div>
                  )}
                </div>
              </div>
            )}

            {step === 'quiz' && questions.length > 0 && !completed && (
              <div className="animate-in fade-in duration-700 max-w-5xl mx-auto w-full">
                <QuestionCard 
                  key={questions[currentIndex].id}
                  question={questions[currentIndex]} 
                  onAnswer={handleAnswer}
                  onPrevious={handlePrevious}
                  onExit={handleExitAssay}
                />
              </div>
            )}

            {completed && (
              <div className="text-center py-20 xl:py-40 animate-in fade-in zoom-in duration-700">
                <Trophy size={64} className="mx-auto text-primary mb-8" />
                <h2 className="text-5xl xl:text-8xl font-black italic uppercase tracking-tighter mb-4 text-white">Assay Finalized</h2>
                <div className="flex gap-4 justify-center">
                  <Button onClick={returnToSubjectDirectory} className="riot-button h-16 px-10 bg-primary text-black font-black text-[10px]">
                    CONTINUE {selectedSubject?.toUpperCase()} TITRATION
                  </Button>
                  <Button asChild variant="outline" className="riot-button h-16 px-10 border-white/10 text-white font-black text-[10px]">
                    <Link href="/dashboard">BACK TO LABORATORY</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-32 pt-12 border-t border-white/5 space-y-16 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="riot-card bg-white/[0.02] border border-white/5 p-8 space-y-8 flex flex-col justify-center items-center text-center">
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Database className="text-primary" size={48} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black italic uppercase text-white">Clinical Instrumentation</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-sm">
                      Synchronize with the high-fidelity system archives to titrate built-in clinical protocols into your device.
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={syncSystemArchives} 
                  disabled={importing} 
                  className="riot-button w-full max-w-sm h-16 bg-primary text-black font-black text-[11px] tracking-[0.2em]"
                >
                  {importing ? (
                    <><Loader2 className="animate-spin mr-3" size={18} /> TITRATING ARCHIVES...</>
                  ) : (
                    <><RefreshCw className="mr-3" size={18} /> SYNC TITRATE ARCHIVES</>
                  )}
                </Button>
              </div>

              <div className="riot-card bg-red-500/5 border border-red-500/20 p-8 flex flex-col justify-center space-y-4">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="text-red-500 hover:bg-red-500/10 font-black text-[10px] uppercase tracking-widest h-12">
                        <Trash2 className="mr-2 h-4 w-4" /> TOTAL PURGE REQUIRED?
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#111a24] border-white/10 text-white rounded-none">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-black italic uppercase text-red-500">TOTAL PURGE REQUIRED?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground italic text-sm">
                          Permanently delete ALL clinical questions and modules from the entire laboratory database.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="uppercase font-black text-[10px]">Abort</AlertDialogCancel>
                        <AlertDialogAction onClick={purgeAllRecords} className="bg-red-600 text-white font-black text-[10px]">CONFIRM PURGE</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <div className="border-t border-red-500/10 pt-4 flex flex-col gap-2">
                    <p className="text-[8px] font-black uppercase text-red-500/60 tracking-widest text-center">Specific Protocol Calibration</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="ghost" className="text-white/40 hover:text-white font-black text-[10px] uppercase tracking-widest h-10 border border-white/5" onClick={resetSubjectProgress} disabled={!selectedSubject || step === 'subject'}>
                        <RotateCcw className="mr-2 h-3 w-3" /> RESET {selectedSubject ? selectedSubject.toUpperCase() : 'SECTOR'} PROGRESS
                      </Button>
                      <Button variant="ghost" className="text-red-500/50 hover:text-red-500 font-black text-[10px] uppercase tracking-widest h-10 border border-red-500/10" onClick={purgeSubjectRecords} disabled={!selectedSubject || step === 'subject'}>
                        <Eraser className="mr-2 h-3 w-3" /> PURGE {selectedSubject ? selectedSubject.toUpperCase() : 'SECTOR'} ARCHIVE
                      </Button>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
