
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
  FileText,
  Archive
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [step, setStep] = useState<'subject' | 'module' | 'quiz'>('subject');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [importSubject, setImportSubject] = useState<string>('Clinical Microscopy');
  const [modules, setModules] = useState<LabModule[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);
  const [totalAnkiInDb, setTotalAnkiInDb] = useState(0);
  
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    countTotalAnki();
    window.addEventListener('archives-purged', () => {
        countTotalAnki();
        setStep('subject');
    });
  }, []);

  const countTotalAnki = async () => {
    const all = await db.getAll<Question>('questions');
    setTotalAnkiInDb(all.length);
  };

  const handleSubjectSelect = async (subject: string) => {
    setLoading(true);
    setSelectedSubject(subject);
    
    // Load PDF Modules
    const allModules = await db.getAll<LabModule>('modules');
    const filteredModules = allModules.filter(m => m.subject === subject);
    setModules(filteredModules);

    // Load Anki Chapters
    const allQuestions = await db.getAll<Question>('questions');
    const subjectQuestions = allQuestions.filter(q => q.subject === subject);
    
    // NATURAL SORT: Chapter 2 comes before Chapter 10
    const uniqueChapters = Array.from(new Set(subjectQuestions.map(q => q.tags[0] || 'Uncategorized')))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      
    setChapters(uniqueChapters);
    setStep('module');
    setLoading(false);
  };

  const startChapterAssay = async (chapter: string) => {
    if (!selectedSubject) return;
    setLoading(true);
    const allQuestions = await db.getAll<Question>('questions');
    const filtered = allQuestions.filter(q => q.subject === selectedSubject && q.tags.includes(chapter));
    
    if (filtered.length > 0) {
      setQuestions(filtered);
      setStep('quiz');
    } else {
      toast({ title: "Chapter Empty", description: "No titrated data found for this chapter." });
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

      const scrub = (str: string) => {
        if (!str) return "";
        let clean = str
          .replace(/<[^>]*>?/gm, ' ') 
          .replace(/&nbsp;/g, ' ')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/Anki\s*ng\s*RMT/gi, '')
          .replace(/Lelouch/gi, '')
          .replace(/\s\s+/g, ' ')
          .trim();
        
        if (clean.includes('::')) {
          const p = clean.split('::');
          return p[p.length - 1].trim();
        }
        return clean;
      };

      for (let idx = 0; idx < total; idx++) {
        const parts = lines[idx].split('\t'); 
        if (parts.length < 8) continue;

        // STRICT COLUMN MAPPING
        // Col 3 (Index 2): Chapter
        const chapterRaw = parts[2] || "";
        const chapter = scrub(chapterRaw) || "Uncategorized";
        // Col 4 (Index 3): Question
        const qText = scrub(parts[3]);
        // Col 5-8 (Index 4-7): Choices
        const cA = scrub(parts[4]);
        const cB = scrub(parts[5]);
        const cC = scrub(parts[6]);
        const cD = scrub(parts[7]);
        // Col 12-13 (Index 11-12): Answer
        const ansRaw = scrub(parts[11] || parts[12] || "");

        const choices = [
          { id: 'A', text: cA },
          { id: 'B', text: cB },
          { id: 'C', text: cC },
          { id: 'D', text: cD },
        ];

        let answerId = 'A';
        const match = choices.find(c => c.text.toLowerCase() === ansRaw.toLowerCase());
        if (match) answerId = match.id;
        else if (['A', 'B', 'C', 'D'].includes(ansRaw.toUpperCase())) answerId = ansRaw.toUpperCase();

        questionsToImport.push({
          id: `strict-${Date.now()}-${idx}`,
          subject: importSubject,
          question: qText,
          choices: choices,
          answerId: answerId,
          rationale: `Source: ${chapter}. Reference: ${ansRaw}`,
          tags: [chapter, 'Strict-Titration'],
        });

        if (idx % 20 === 0 || idx === total - 1) {
          setImportProgress(Math.round(((idx + 1) / total) * 100));
        }
      }

      await db.bulkPut('questions', questionsToImport);
      await countTotalAnki();
      toast({ title: "Titration Successful", description: `Recorded ${questionsToImport.length} cards into ${importSubject}.` });
      setFile(null);
      
      if (selectedSubject === importSubject) {
        handleSubjectSelect(importSubject);
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Titration Failed", description: "Error processing archive." });
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
    toast({ title: "Laboratory Purged", description: "All questions and modules deleted." });
    setStep('subject');
    window.dispatchEvent(new Event('archives-purged'));
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0b111a] items-center justify-center text-white flex-col gap-6">
        <Zap className="animate-pulse text-primary" size={64} />
        <div className="text-center">
            <h2 className="text-2xl xl:text-5xl font-black italic uppercase tracking-tighter">Laboratory Protocol Sync</h2>
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
                <div className="border-b border-white/5 pb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h2 className="text-4xl xl:text-6xl font-black italic uppercase tracking-tighter">Sector Selection</h2>
                    <p className="text-xs xl:text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Pick a clinical sector to begin titration.</p>
                  </div>
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
                        <h2 className="text-4xl xl:text-6xl font-black italic uppercase tracking-tighter">{selectedSubject} Protocols</h2>
                        <p className="text-xs xl:text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Select a chapter archive or PDF protocol.</p>
                      </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {/* Each Chapter is its own archive, sorted ascendingly */}
                  {chapters.map((chapter) => (
                    <button 
                      key={chapter}
                      onClick={() => startChapterAssay(chapter)}
                      className="riot-card p-8 xl:p-12 bg-primary/10 border border-primary/30 hover:bg-primary hover:text-black transition-all group text-left"
                    >
                      <Archive size={24} className="mb-4 text-primary group-hover:text-black xl:size-32" />
                      <h4 className="text-xl xl:text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-black truncate w-full">
                        {chapter}
                      </h4>
                      <p className="text-[10px] xl:text-[12px] font-bold opacity-60 uppercase tracking-widest mt-2 group-hover:text-black">Chapter Archive</p>
                    </button>
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
                      <p className="text-[10px] xl:text-[12px] font-bold text-muted-foreground uppercase tracking-widest mt-2">AI Assay Synthesis</p>
                    </button>
                  ))}
                  
                  {chapters.length === 0 && modules.length === 0 && (
                     <div className="col-span-full py-20 text-center opacity-30 border border-dashed border-white/10 riot-card">
                       <AlertCircle className="mx-auto mb-4" size={48} />
                       <h3 className="text-2xl font-black italic uppercase">No Titrated Data</h3>
                       <p className="text-xs font-bold uppercase tracking-widest mt-2">Upload a PDF or Anki file below.</p>
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
                  <h3 className="text-xl font-black italic uppercase">Strict Titration Import</h3>
                </div>
                
                <div className="space-y-4">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Laboratory Sector</Label>
                  <Select value={importSubject} onValueChange={setImportSubject}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-none h-12 text-[10px] font-black uppercase">
                      <SelectValue placeholder="Select Sector" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A1219] border-white/10 text-white rounded-none">
                      {CORE_SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s} className="uppercase font-black text-[10px]">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      {file ? file.name : 'CHOOSE .TXT (STRICT)'}
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
