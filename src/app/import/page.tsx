
"use client"

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  Loader2, 
  Zap,
  FileJson,
  Database,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { db, Question, LabModule, CORE_SUBJECTS } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { generateQuestions } from '@/ai/flows/question-generator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedSubjectAi, setSelectedSubjectAi] = useState<string>('Hematology');
  const [selectedSubjectAnki, setSelectedSubjectAnki] = useState<string>('Clinical Microscopy');
  const [stats, setStats] = useState<{ count: number; subjects: string[] } | null>(null);
  const { toast } = useToast();

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
      const parts = clean.split('::');
      return parts[parts.length - 1].trim();
    }
    return clean;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAiGeneration = async () => {
    setGenerating(true);
    try {
      const result = await generateQuestions({ subject: selectedSubjectAi, count: 5 });
      if (result.questions && result.questions.length > 0) {
        await db.bulkPut('questions', result.questions);
        setStats({ count: result.questions.length, subjects: [selectedSubjectAi] });
        toast({ title: "AI Synthesis Complete", description: `Generated 5 high-yield ${selectedSubjectAi} questions.` });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Synthesis Error", description: "AI titration failed." });
    } finally {
      setGenerating(false);
    }
  };

  const processAnkiExport = async () => {
    if (!file) return;
    setImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      const questions: Question[] = [];

      for (let idx = 0; idx < lines.length; idx++) {
        const parts = lines[idx].split('\t');
        if (parts.length < 8) continue;

        // STRICT COLUMN MAPPING
        const chapterRaw = parts[2] || "";
        const chapter = scrub(chapterRaw) || "Uncategorized";
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

        let answerId = 'A';
        const match = choices.find(c => c.text.toLowerCase() === ansRaw.toLowerCase());
        if (match) answerId = match.id;
        else if (['A', 'B', 'C', 'D'].includes(ansRaw.toUpperCase())) answerId = ansRaw.toUpperCase();

        questions.push({
          id: `strict-${Date.now()}-${idx}`,
          subject: selectedSubjectAnki, // STICK TO USER CHOICE
          question: qText,
          choices: choices,
          answerId: answerId,
          rationale: `Chapter: ${chapter}. Answer: ${ansRaw}`,
          tags: [chapter, 'Strict-Import'],
        });
      }

      await db.bulkPut('questions', questions);
      toast({ title: "Titration Successful", description: `Imported ${questions.length} cards into ${selectedSubjectAnki}.` });
      setFile(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Titration Failed", description: "Error processing columns." });
    } finally {
      setImporting(false);
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
    toast({ title: "Laboratory Purged", description: "All archives have been deleted." });
    window.dispatchEvent(new Event('archives-purged'));
  };

  return (
    <div className="flex h-screen bg-[#050a0f] overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        <div className="max-w-6xl mx-auto px-8 py-32 space-y-12">
          <div className="border-b border-white/5 pb-8 flex items-center justify-between">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Data Titration Center</h2>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-red-500/20 text-red-500 font-black text-[10px] uppercase">
                  <Trash2 className="mr-2 h-3 w-3" /> Purge archives
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#111a24] border-white/10 text-white rounded-none">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-500 font-black uppercase">TOTAL PURGE REQUIRED?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground italic text-sm">
                    This will permanently delete all quiz questions, anki cards, and uploaded modules.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-black text-[10px] uppercase">Abort</AlertDialogCancel>
                  <AlertDialogAction onClick={purgeAllRecords} className="bg-red-600 font-black text-[10px] uppercase">CONFIRM PURGE</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="riot-card bg-primary/5 border border-primary/20 p-8 flex flex-col justify-between">
              <div>
                <Zap className="text-primary mb-6 animate-pulse" size={32} />
                <h3 className="text-xl font-black italic uppercase mb-2">AI Synthesis</h3>
                <div className="space-y-4">
                   <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Target Sector</Label>
                   <Select value={selectedSubjectAi} onValueChange={setSelectedSubjectAi}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-none h-12 text-[10px] font-black uppercase">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A1219] border-white/10 text-white rounded-none">
                      {CORE_SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s} className="uppercase font-black text-[10px]">{s}</SelectItem>
                      ))}
                    </SelectContent>
                   </Select>
                </div>
              </div>
              <Button onClick={handleAiGeneration} disabled={generating} className="riot-button h-12 mt-8 bg-primary text-black font-black text-[10px]">
                {generating ? <Loader2 className="animate-spin" /> : 'SYNTHESIZE ASSAY'}
              </Button>
            </div>

            <div className="riot-card bg-white/[0.02] border border-white/5 p-8 flex flex-col justify-between">
              <div>
                <Database className="text-primary mb-6" size={32} />
                <h3 className="text-xl font-black italic uppercase mb-2">Strict Anki Titration</h3>
                <div className="space-y-4 mt-6">
                   <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Calibration Sector</Label>
                   <Select value={selectedSubjectAnki} onValueChange={setSelectedSubjectAnki}>
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
              </div>
              <div className="mt-8 space-y-4">
                <Input type="file" accept=".txt" onChange={handleFileChange} className="hidden" id="anki-upload" />
                <Button asChild variant="outline" className="w-full h-12 border-dashed border-white/20 text-white font-black text-[10px]">
                  <label htmlFor="anki-upload" className="cursor-pointer flex items-center justify-center gap-2">
                    {file ? file.name : 'CHOOSE .TXT ARCHIVE'}
                  </label>
                </Button>
                <Button className="riot-button w-full h-12 bg-white/10 text-white font-black text-[10px]" disabled={!file || importing} onClick={processAnkiExport}>
                  {importing ? <Loader2 className="animate-spin" /> : 'TITRATE ARCHIVE'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
