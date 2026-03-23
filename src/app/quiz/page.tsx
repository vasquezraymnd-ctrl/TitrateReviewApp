
"use client"

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { db, Question, Progress, LabModule, CORE_SUBJECTS } from '@/lib/db';
import { calculateSM2 } from '@/lib/sm2';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { Button } from '@/components/ui/button';
import { Progress as ProgressBar } from '@/components/ui/progress';
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
  Trash2
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  
  // Titration / Import State
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  // Reset States
  const [resetSubject, setResetSubject] = useState<string>('Hematology');
  const [resetModulesList, setResetModulesList] = useState<LabModule[]>([]);
  const [selectedResetModuleId, setSelectedResetModuleId] = useState<string | null>(null);

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
    
    // Check for PDF Modules
    const allModules = await db.getAll<LabModule>('modules');
    const filteredModules = allModules.filter(m => m.subject === subject);
    setModules(filteredModules);
    
    // Check for Anki Questions
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
      toast({ title: "Archive Empty", description: "No Anki cards found for this sector." });
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

  const processAnkiExport = async () => {
    if (!file) return;
    setImporting(true);
    setImportProgress(0);
    
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      const questionsToImport: Question[] = [];
      const total = lines.length;

      if (total === 0) {
        throw new Error("Archive is empty.");
      }

      for (let idx = 0; idx < total; idx++) {
        const line = lines[idx];
        const parts = line.split('\t'); 
        if (parts.length < 2) continue;

        const front = parts[0].trim().replace(/^"|"$/g, '');
        const back = parts[1].trim().replace(/^"|"$/g, '');
        const tagsRaw = (parts[2] || 'General').toLowerCase();
        
        let subjectMatch = 'General';
        if (tagsRaw.includes('hema')) subjectMatch = 'Hematology';
        else if (tagsRaw.includes('microbio') || tagsRaw.includes('micro')) subjectMatch = 'Microbiology';
        else if (tagsRaw.includes('chemistry') || tagsRaw.includes('chem')) subjectMatch = 'Clinical Chemistry';
        else if (tagsRaw.includes('immuno') || tagsRaw.includes('serology')) subjectMatch = 'Immuno-Serology';
        else if (tagsRaw.includes('microscopy')) subjectMatch = 'Clinical Microscopy';
        else if (tagsRaw.includes('histopath') || tagsRaw.includes('htmle')) subjectMatch = 'HTMLE';

        questionsToImport.push({
          id: `anki-${Date.now()}-${idx}`,
          subject: subjectMatch,
          question: front,
          choices: [{ id: 'A', text: 'REVEAL CLINICAL DATA' }],
          answerId: 'A',
          rationale: back,
          tags: tagsRaw.split(' '),
        });

        if (idx % 20 === 0 || idx === total - 1) {
          setImportProgress(Math.round(((idx + 1) / total) * 100));
        }
      }

      if (questionsToImport.length === 0) {
        throw new Error("No valid flashcards found. Ensure export is Tab-Separated.");
      }

      await db.bulkPut('questions', questionsToImport);
      await countTotalAnki();
      
      toast({
        title: "Titration Successful",
        description: `Recorded ${questionsToImport.length} clinical cards in laboratory.`,
      });
      
      setFile(null);
      const input = document.getElementById('anki-upload-quiz') as HTMLInputElement;
      if (input) input.value = '';

      if (selectedSubject) {
        handleSubjectSelect(selectedSubject);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Titration Failed",
        description: err instanceof Error ? err.message : "Error processing clinical archive.",
      });
    } finally {
      setTimeout(() => {
        setImporting(false);
        setImportProgress(0);
      }, 500);
    }
  };

  const resetModuleData = async () => {
    if (!selectedResetModuleId) return;
    
    const module = resetModulesList.find(m => m.id === selectedResetModuleId);
    if (!module) return;

    const allQuestions = await db.getAll<Question>('questions');
    const questionsToRemove = allQuestions.filter(q => q.tags?.includes(module.name));

    for (const q of questionsToRemove) {
      await db.delete('progress', q.id);
      await db.delete('questions', q.id);
    }

    toast({ title: "Assay Reset", description: `Cleared progress for ${module.name}.` });
    setSelectedResetModuleId(null);
    countTotalAnki();
  };

  const purgeAllRecords = async () => {
    const allQuestions = await db.getAll<Question>('questions');
    for (const q of allQuestions) {
      await db.delete('questions', q.id);
      await db.delete('progress', q.id);
    }
    await countTotalAnki();
    toast({ title: "Laboratory Purged", description: "All clinical records and progress have been deleted." });
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
                <div className="border-b border-white/5 pb-8 flex justify-between items-end">
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
                        <p className="text-xs xl:text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Choose a protocol or your imported archive.</p>
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
                      <h4 className="text-xl xl:text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-black">Anki Review Archive</h4>
                      <p className="text-[10px] xl:text-[12px] font-bold opacity-60 uppercase tracking-widest mt-2 group-hover:text-black">Practice Imported Cards</p>
                      <div className="mt-6 flex justify-end">
                         <div className="w-10 h-10 xl:w-14 xl:h-14 bg-black/20 group-hover:bg-black/40 flex items-center justify-center">
                            <ChevronRight />
                         </div>
                      </div>
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
                      <div className="mt-6 flex justify-end">
                         <div className="w-10 h-10 xl:w-14 xl:h-14 bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <ChevronRight className="text-black" />
                         </div>
                      </div>
                    </button>
                  ))}

                  {(!hasAnkiCards && modules.length === 0) && (
                    <div className="col-span-full text-center py-24 xl:py-40 riot-card border border-dashed border-white/10 bg-white/[0.02]">
                        <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4 xl:size-24" />
                        <h3 className="text-xl xl:text-4xl font-black italic uppercase text-white">No Protocols Found</h3>
                        <p className="text-xs xl:text-lg font-bold text-muted-foreground uppercase tracking-widest mb-8 px-6">
                          Import an Anki archive below or upload PDFs to the Protocol Archives.
                        </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 'quiz' && !completed && (
              <div className="animate-in fade-in duration-700 max-w-5xl mx-auto w-full">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex-1 mr-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] xl:text-[12px] font-black text-muted-foreground uppercase tracking-widest">Assay Precision</span>
                      <span className="text-[10px] xl:text-[12px] font-black text-primary uppercase tracking-widest">{currentIndex + 1} / {questions.length}</span>
                    </div>
                    <ProgressBar value={((currentIndex + 1) / questions.length) * 100} className="h-1 bg-white/5" />
                  </div>
                  <Button variant="ghost" className="text-red-500 font-black uppercase text-[10px] xl:text-[12px] tracking-widest" onClick={() => setCompleted(true)}>
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
              <div className="text-center py-20 xl:py-40 animate-in fade-in zoom-in duration-700">
                <div className="w-24 h-24 xl:w-32 xl:h-32 bg-primary/20 text-primary rounded-none flex items-center justify-center mx-auto mb-8 border border-primary/30">
                  <Trophy size={48} className="xl:size-20" />
                </div>
                <h2 className="text-5xl xl:text-8xl font-black italic uppercase tracking-tighter mb-4 text-white">Assay Finalized</h2>
                <p className="text-muted-foreground mb-12 text-lg xl:text-2xl italic max-w-2xl mx-auto leading-relaxed">
                  Your titration levels for this session have been recorded.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button asChild variant="outline" className="riot-button h-16 xl:h-20 px-10 xl:px-16 border-white/10 text-white font-black text-[10px]">
                    <Link href="/dashboard">BACK TO LABORATORY</Link>
                  </Button>
                  <Button onClick={() => window.location.reload()} className="riot-button h-16 xl:h-20 px-10 xl:px-16 bg-primary text-black font-black text-[10px]">
                    NEW ASSAY <ChevronRight className="ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-32 pt-12 border-t border-white/5 space-y-16 pb-20">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="text-primary/70" size={24} />
                  <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Laboratory Import Center</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Titrate your clinical library via Anki archives.</p>
                  </div>
                </div>
                <div className="bg-primary/10 border border-primary/30 px-6 py-3 flex flex-col items-end">
                   <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">TITRATED CARDS IN CACHE</p>
                   <p className="text-2xl font-black italic text-white leading-none mt-1">{totalAnkiInDb}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="riot-card bg-white/[0.02] border border-white/5 p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Upload className="text-primary" size={32} />
                      <h3 className="text-xl font-black italic uppercase text-white">Anki Titration</h3>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-widest">
                      Select your Tab-Separated .txt export from Anki.
                    </p>
                  </div>
                  
                  {importing && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-primary">
                        <span>Titrating Archive...</span>
                        <span>{importProgress}%</span>
                      </div>
                      <ProgressBar value={importProgress} className="h-1 bg-white/5" />
                    </div>
                  )}

                  <div className="space-y-4">
                    <Input 
                      type="file" 
                      accept=".txt,.csv" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)} 
                      className="hidden" 
                      id="anki-upload-quiz"
                    />
                    <Button asChild variant="outline" className="w-full h-12 border-dashed border-white/20 hover:border-primary/50 text-white font-black text-[10px]">
                      <label htmlFor="anki-upload-quiz" className="cursor-pointer flex items-center justify-center gap-2">
                        {file ? file.name : 'CHOOSE .TXT ARCHIVE'}
                      </label>
                    </Button>
                    <Button 
                      className="riot-button w-full h-12 bg-white/10 text-white font-black text-[10px] hover:bg-white/20"
                      disabled={!file || importing}
                      onClick={processAnkiExport}
                    >
                      {importing ? <Loader2 className="animate-spin" /> : 'TITRATE ARCHIVE'}
                    </Button>
                  </div>
                </div>

                <div className="riot-card bg-primary/5 border border-primary/20 p-8">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <AlertCircle className="text-primary" size={24} />
                         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Assay Protocol</h4>
                      </div>
                      <p className="text-[9px] font-medium text-white/60 uppercase tracking-widest leading-relaxed">
                        The lab filters cards by searching your Anki tags for keywords like <span className="text-white">"Hema", "Micro", "Chem"</span>. Unlabeled cards will be titrated into the <span className="text-white">"Uncategorized Archive"</span> found on the subject selection screen.
                      </p>
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <RefreshCw className="text-red-500/50" size={20} />
                <h3 className="text-sm font-black italic uppercase tracking-[0.3em] text-white/40">Reset Laboratory Assays</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-[9px] xl:text-[11px] font-black uppercase tracking-widest text-muted-foreground">Select Sector</label>
                  <Select value={resetSubject} onValueChange={setResetSubject}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-none h-12 xl:h-14 text-[10px] xl:text-[12px] font-black uppercase tracking-widest">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111a24] border-white/10 text-white rounded-none">
                      {[...CORE_SUBJECTS, 'General'].map(s => (
                        <SelectItem key={s} value={s} className="uppercase font-black text-[10px] tracking-widest">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 lg:col-span-1 xl:col-span-1">
                  <label className="text-[9px] xl:text-[11px] font-black uppercase tracking-widest text-muted-foreground">Select Protocol</label>
                  <Select value={selectedResetModuleId || ""} onValueChange={setSelectedResetModuleId}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-none h-12 xl:h-14 text-[10px] xl:text-[12px] font-black uppercase tracking-widest">
                      <SelectValue placeholder="SELECT MODULE" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111a24] border-white/10 text-white rounded-none">
                      {resetModulesList.map(m => (
                        <SelectItem key={m.id} value={m.id} className="uppercase font-black text-[10px] tracking-widest">{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={!selectedResetModuleId} className="riot-button flex-1 h-12 xl:h-14 bg-white/5 border border-white/10 text-white/40 hover:text-red-500 font-black text-[10px]">
                        RESET MODULE
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#111a24] border-white/10 text-white rounded-none">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-black italic uppercase tracking-tighter text-2xl">Confirm Data Purge</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground italic text-sm">
                          This will permanently delete all cached questions and progress for the selected protocol.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="uppercase font-black text-[10px] rounded-none">Abort</AlertDialogCancel>
                        <AlertDialogAction onClick={resetModuleData} className="bg-red-500 text-white hover:bg-red-600 uppercase font-black text-[10px] rounded-none">
                          PURGE MODULE
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="riot-button flex-1 h-12 xl:h-14 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-black text-[10px]">
                        <Trash2 className="mr-2 h-3 w-3" /> PURGE ALL
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#111a24] border-white/10 text-white rounded-none">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-black italic uppercase tracking-tighter text-2xl text-red-500">CRITICAL: TOTAL PURGE</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground italic text-sm">
                          This will permanently delete ALL imported Anki cards, synthesized questions, and study progress from the laboratory. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="uppercase font-black text-[10px] rounded-none">Abort</AlertDialogCancel>
                        <AlertDialogAction onClick={purgeAllRecords} className="bg-red-600 text-white hover:bg-red-700 uppercase font-black text-[10px] rounded-none">
                          CONFIRM TOTAL PURGE
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
