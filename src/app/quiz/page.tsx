
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
  ChevronRight, 
  Loader2, 
  Microscope, 
  BookOpen, 
  Zap, 
  AlertCircle, 
  RefreshCw,
  Database,
  Upload,
  ChevronLeft,
  Layers,
  Trash2,
  FileText
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
import { Input } from "@/components/ui/input";

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [step, setStep] = useState<'subject' | 'module' | 'quiz'>('subject');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [modules, setModules] = useState<LabModule[]>([]);
  const [hasAnkiCards, setHasAnkiCards] = useState(false);
  const [totalAnkiInDb, setTotalAnkiInDb] = useState(0);
  
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const [resetSubject, setResetSubject] = useState<string>('Hematology');
  const [resetModulesList, setResetModulesList] = useState<LabModule[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    loadResetModules();
    countTotalAnki();
  }, [resetSubject]);

  const countTotalAnki = async () => {
    const all = await db.getAll<Question>('questions');
    setTotalAnkiInDb(all.length);
  };

  const loadResetModules = async () => {
    const all = await db.getAll<LabModule>('modules');
    setResetModulesList(all.filter(m => m.subject === resetSubject));
  };

  const handleSubjectSelect = async (subject: string) => {
    setLoading(true);
    setSelectedSubject(subject);
    
    const allModules = await db.getAll<LabModule>('modules');
    const filteredModules = allModules.filter(m => m.subject === subject);
    setModules(filteredModules);
    
    const allQuestions = await db.getAll<Question>('questions');
    const filteredQuestions = allQuestions.filter(q => q.subject === subject);
    setHasAnkiCards(filteredQuestions.length > 0);
    
    setStep('module');
    setLoading(false);
  };

  const startAnkiReview = async () => {
    if (!selectedSubject) return;
    setLoading(true);
    const allQuestions = await db.getAll<Question>('questions');
    const filtered = allQuestions.filter(q => q.subject === selectedSubject);
    
    if (filtered.length > 0) {
      setQuestions(filtered);
      setStep('quiz');
    } else {
      toast({ title: "Archive Empty", description: "No titrated cards found for this sector." });
    }
    setLoading(false);
  };

  const startModuleAssay = async (module: LabModule) => {
    setLoading(true);
    try {
      if (!module.extractedText) {
        toast({ 
            variant: "destructive", 
            title: "Assay Failure", 
            description: "No clinical text found in this protocol." 
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
        description: "Laboratory AI failed to titrate the protocol." 
      });
    } finally {
      setLoading(false);
    }
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
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setStep('module');
    }
  };

  const processAnkiExport = async () => {
    if (!file) return;
    setImporting(true);
    setImportProgress(0);
    
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      const questionsToImport: Question[] = [];
      const total = lines.length;

      if (total === 0) throw new Error("Archive is empty.");

      const scrub = (str: string) => {
        if (!str) return "";
        let result = str
          .replace(/<[^>]*>?/gm, ' ') 
          .replace(/&nbsp;/g, ' ')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/Anki\s*ng\s*RMT/gi, '')
          .replace(/Lelouch/gi, '')
          .replace(/SHOW\s*ANSWERS\s*IMMEDIATELY/gi, '')
          .replace(/SUBMIT\s*AND\s*ESC/gi, '')
          .replace(/AUTO\s*SUBMIT/gi, '')
          .replace(/SHUFFLE\s*CHOICES/gi, '')
          .replace(/\s\s+/g, ' ')
          .trim();
        return result;
      };

      for (let idx = 0; idx < total; idx++) {
        const line = lines[idx];
        const parts = line.split('\t'); 
        
        // STRICT PARSING RULES:
        // Column 3 (parts[2]): Chapter/Path
        // Column 4 (parts[3]): Question
        // Columns 5-8 (parts[4-7]): Choices A, B, C, D
        // Columns 12-13 (parts[11-12]): Answer
        
        if (parts.length < 8) continue;

        const chapter = scrub(parts[2]);
        const qText = scrub(parts[3]);
        const cA = scrub(parts[4]);
        const cB = scrub(parts[5]);
        const cC = scrub(parts[6]);
        const cD = scrub(parts[7]);
        const ansRaw = scrub(parts[11] || parts[12] || "");

        const choices = [
          { id: 'A', text: cA },
          { id: 'B', text: cB },
          { id: 'C', text: cC },
          { id: 'D', text: cD },
        ];

        // Match answer text to choice ID
        let answerId = 'A';
        const match = choices.find(c => c.text.toLowerCase() === ansRaw.toLowerCase());
        if (match) {
          answerId = match.id;
        } else if (['A', 'B', 'C', 'D'].includes(ansRaw.toUpperCase())) {
          answerId = ansRaw.toUpperCase();
        }

        // Sector Mapping Logic
        let subjectMatch = 'General';
        const context = (chapter + ' ' + qText).toLowerCase();
        
        if (/hema|blood|rodak|keohane|harmening|coag|heme/.test(context)) subjectMatch = 'Hematology';
        else if (/micro|bact|mahon|bailey|scott|tille|myco|viro|para/.test(context)) subjectMatch = 'Microbiology';
        else if (/chem|bishop|henry|marshall|biochem|enzymes|lipids/.test(context)) subjectMatch = 'Clinical Chemistry';
        else if (/immuno|sero|stevens|turgeon|abbas|bloodbank|harmening_bb/.test(context)) subjectMatch = 'Immuno-Serology';
        else if (/microscopy|urine|strasinger|bodyfluid|analysis|clinmic/.test(context)) subjectMatch = 'Clinical Microscopy';
        else if (/histo|path|htmle|gregorio|bancroft|fixative|staining/.test(context)) subjectMatch = 'HTMLE';

        questionsToImport.push({
          id: `strict-${Date.now()}-${idx}`,
          subject: subjectMatch,
          question: qText,
          choices: choices,
          answerId: answerId,
          rationale: `Chapter: ${chapter}. Answer: ${ansRaw}`,
          tags: [chapter, 'Strict-Titration'],
        });

        if (idx % 20 === 0 || idx === total - 1) {
          setImportProgress(Math.round(((idx + 1) / total) * 100));
        }
      }

      await db.bulkPut('questions', questionsToImport);
      await countTotalAnki();
      
      toast({
        title: "Titration Successful",
        description: `Recorded ${questionsToImport.length} clinical cards following strict column alignment.`,
      });
      
      setFile(null);
      if (selectedSubject) handleSubjectSelect(selectedSubject);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Titration Failed",
        description: err instanceof Error ? err.message : "Error processing archive.",
      });
    } finally {
      setTimeout(() => {
        setImporting(false);
        setImportProgress(0);
      }, 500);
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
    await countTotalAnki();
    toast({ title: "Laboratory Purged", description: "All clinical cards and modules have been deleted." });
    setStep('subject');
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0b111a] items-center justify-center text-white flex-col gap-6">
        <Zap className="animate-pulse text-primary" size={64} />
        <div className="text-center">
            <h2 className="text-2xl xl:text-5xl font-black italic uppercase tracking-tighter text-white">Laboratory Protocol Sync</h2>
            <p className="text-[10px] xl:text-[14px] font-bold text-muted-foreground uppercase tracking-[0.4em] mt-2">Accessing local clinical archives...</p>
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
                <div className="border-b border-white/5 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-4xl xl:text-6xl font-black italic uppercase tracking-tighter text-white">Sector Selection</h2>
                    <p className="text-xs xl:text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Pick a clinical sector to begin titration.</p>
                  </div>
                  {totalAnkiInDb > 0 && (
                     <button onClick={() => handleSubjectSelect('General')} className="bg-primary/10 border border-primary/30 px-4 py-2 flex items-center gap-2 hover:bg-primary hover:text-black transition-all">
                       <Layers size={14} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Uncategorized Archive ({totalAnkiInDb})</span>
                     </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                  {CORE_SUBJECTS.map((subject) => (
                    <button 
                      key={subject} 
                      onClick={() => handleSubjectSelect(subject)}
                      className="riot-card p-10 xl:p-14 bg-white/[0.02] border border-white/5 hover:bg-primary hover:text-black transition-all group"
                    >
                      <Microscope size={32} className="mb-6 group-hover:scale-110 transition-transform xl:size-48 text-primary group-hover:text-black" />
                      <h3 className="text-2xl xl:text-4xl font-black italic uppercase tracking-tighter text-white group-hover:text-black">{subject}</h3>
                      <p className="text-[10px] xl:text-[12px] font-bold opacity-60 mt-2 uppercase tracking-widest group-hover:text-black">Initiate Assay</p>
                    </button>
                  ))}
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
                        <h2 className="text-4xl xl:text-6xl font-black italic uppercase tracking-tighter text-white">{selectedSubject} Assays</h2>
                        <p className="text-xs xl:text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Choose a protocol or your titrated archive.</p>
                      </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {hasAnkiCards && (
                    <button 
                      onClick={startAnkiReview}
                      className="riot-card p-8 xl:p-12 bg-primary/10 border border-primary/30 hover:bg-primary hover:text-black transition-all group"
                    >
                      <Layers size={24} className="mb-4 text-primary group-hover:text-black xl:size-32" />
                      <h4 className="text-xl xl:text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-black">Anki Archive</h4>
                      <p className="text-[10px] xl:text-[12px] font-bold opacity-60 uppercase tracking-widest mt-2 group-hover:text-black">Practice Imported Data</p>
                    </button>
                  )}

                  {modules.map((m) => (
                    <button 
                      key={m.id} 
                      onClick={() => startModuleAssay(m)}
                      className="riot-card p-8 xl:p-12 bg-white/[0.02] border border-white/5 hover:border-primary/50 text-left group"
                    >
                      <BookOpen size={24} className="mb-4 text-primary xl:size-32" />
                      <h4 className="text-xl xl:text-3xl font-black italic uppercase tracking-tighter text-white">{m.name}</h4>
                      <p className="text-[10px] xl:text-[12px] font-bold text-muted-foreground uppercase tracking-widest mt-2">AI Assay Synthesis</p>
                    </button>
                  ))}

                  {(!hasAnkiCards && modules.length === 0) && (
                    <div className="col-span-full text-center py-24 xl:py-40 riot-card border border-dashed border-white/10 bg-white/[0.02]">
                        <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4 xl:size-24" />
                        <h3 className="text-xl xl:text-4xl font-black italic uppercase text-white">No Protocols Found</h3>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 'quiz' && !completed && (
              <div className="animate-in fade-in duration-700 max-w-5xl mx-auto w-full">
                <QuestionCard 
                  key={questions[currentIndex].id}
                  question={questions[currentIndex]} 
                  onAnswer={handleAnswer}
                  onPrevious={handlePrevious}
                />
              </div>
            )}

            {completed && (
              <div className="text-center py-20 xl:py-40 animate-in fade-in zoom-in duration-700">
                <Trophy size={64} className="mx-auto text-primary mb-8" />
                <h2 className="text-5xl xl:text-8xl font-black italic uppercase tracking-tighter mb-4 text-white">Assay Finalized</h2>
                <div className="flex gap-4 justify-center">
                  <Button asChild variant="outline" className="riot-button h-16 px-10 border-white/10 text-white font-black text-[10px]">
                    <Link href="/dashboard">BACK TO LABORATORY</Link>
                  </Button>
                  <Button onClick={() => window.location.reload()} className="riot-button h-16 px-10 bg-primary text-black font-black text-[10px]">
                    NEW ASSAY
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-32 pt-12 border-t border-white/5 space-y-16 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="riot-card bg-white/[0.02] border border-white/5 p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <Upload className="text-primary" size={32} />
                  <h3 className="text-xl font-black italic uppercase text-white">Strict Titration Import</h3>
                </div>
                {importing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-primary">
                      <span>Titrating...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <div className="h-1 bg-white/5 w-full relative overflow-hidden">
                      <div className="absolute inset-0 bg-primary transition-all duration-300" style={{ width: `${importProgress}%` }} />
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <Input 
                    type="file" 
                    accept=".txt" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)} 
                    className="hidden" 
                    id="anki-upload-quiz"
                  />
                  <Button asChild variant="outline" className="w-full h-12 border-dashed border-white/20 text-white font-black text-[10px]">
                    <label htmlFor="anki-upload-quiz" className="cursor-pointer flex items-center justify-center gap-2">
                      {file ? file.name : 'CHOOSE .TXT (STRICT COLS)'}
                    </label>
                  </Button>
                  <Button 
                    className="riot-button w-full h-12 bg-white/10 text-white font-black text-[10px]"
                    disabled={!file || importing}
                    onClick={processAnkiExport}
                  >
                    {importing ? <Loader2 className="animate-spin" /> : 'TITRATE ARCHIVE'}
                  </Button>
                </div>
              </div>

              <div className="riot-card bg-red-500/5 border border-red-500/20 p-8 flex flex-col justify-center text-center">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="text-red-500 hover:bg-red-500/10 font-black text-[10px] uppercase tracking-widest h-12">
                        <Trash2 className="mr-2 h-4 w-4" /> PURGE ALL LABORATORY RECORDS
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#111a24] border-white/10 text-white rounded-none">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-black italic uppercase text-red-500">TOTAL PURGE REQUIRED?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground italic text-sm">
                          Permanently delete all clinical cards and modules.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="uppercase font-black text-[10px]">Abort</AlertDialogCancel>
                        <AlertDialogAction onClick={purgeAllRecords} className="bg-red-600 text-white font-black text-[10px]">CONFIRM</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
