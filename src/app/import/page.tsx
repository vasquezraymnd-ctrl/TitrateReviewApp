"use client"

import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  Loader2, 
  Zap,
  Trash2,
  AlertCircle,
  RotateCcw,
  Database
} from 'lucide-react';
import { db, Question, CORE_SUBJECTS, LabModule } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
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
  const [importSubject, setImportSubject] = useState<string>('Hematology');
  const { toast } = useToast();

  const scrub = (str: string) => {
    if (!str) return "";
    let clean = str
      .replace(/<[^>]*>?/gm, ' ') // Strip HTML
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s\s+/g, ' ')
      .trim();
    
    // Deduplication logic for messy lines where question/choice repeats
    const mid = Math.floor(clean.length / 2);
    const firstHalf = clean.substring(0, mid).trim();
    const secondHalf = clean.substring(clean.length - mid).trim();
    if (firstHalf === secondHalf && firstHalf.length > 10) {
      clean = firstHalf;
    }

    if (clean.includes('::')) {
      const parts = clean.split('::');
      return parts[parts.length - 1].trim();
    }
    return clean;
  };

  const categorizeContextually = (question: string, subject: string): string => {
    const q = question.toLowerCase();
    
    if (subject === 'Hematology') {
      if (q.includes('pt') || q.includes('aptt') || q.includes('platelet') || q.includes('clot') || q.includes('fibrin') || q.includes('hemostasis')) return 'Hemostasis & Coagulation';
      if (q.includes('rbc') || q.includes('anemia') || q.includes('hemoglobin') || q.includes('erythro')) return 'Erythrocytes & RBC Disorders';
      if (q.includes('wbc') || q.includes('leukemia') || q.includes('neutrophil') || q.includes('leuko')) return 'Leukocytes & WBC Disorders';
      if (q.includes('safety') || q.includes('biohazard') || q.includes('osha')) return 'Safety & Lab Operations';
      if (q.includes('microscope') || q.includes('automation') || q.includes('flow cytometry')) return 'Instrumentation';
    }

    if (subject === 'Clinical Chemistry') {
      if (q.includes('bilirubin') || q.includes('albumin') || q.includes('ast') || q.includes('alt')) return 'Liver Function';
      if (q.includes('creatinine') || q.includes('urea') || q.includes('bun') || q.includes('gfr')) return 'Renal Function';
      if (q.includes('glucose') || q.includes('hba1c') || q.includes('insulin')) return 'Carbohydrates';
      if (q.includes('sodium') || q.includes('potassium') || q.includes('ph') || q.includes('acid')) return 'Electrolytes & Acid-Base';
      if (q.includes('cholesterol') || q.includes('triglyceride') || q.includes('hdl')) return 'Lipids';
    }

    return 'General Titration';
  };

  const processArchiveExport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      const questionsToImport: Question[] = [];

      for (let idx = 0; idx < lines.length; idx++) {
        const parts = lines[idx].split('\t');
        if (parts.length < 5) continue;

        const startIdx = parts[0].length < 10 ? 1 : 0;
        const qText = scrub(parts[startIdx]);
        
        const choicesRaw = [
          parts[startIdx + 1], 
          parts[startIdx + 2], 
          parts[startIdx + 3], 
          parts[startIdx + 4]
        ];

        const filteredChoices = choicesRaw
          .map(c => scrub(c))
          .filter(c => c && c.trim() !== '')
          .map((text, i) => ({
            id: String.fromCharCode(65 + i),
            text: text
          }));

        const answerText = scrub(parts[11] || parts[12] || parts[parts.length - 1] || "");
        const metaChapter = scrub(parts[startIdx + 1]);
        const chapter = (metaChapter.length < 5 || /^\d+$/.test(metaChapter)) 
          ? categorizeContextually(qText, importSubject) 
          : metaChapter;

        let answerId = 'A';
        const match = filteredChoices.find(c => c.text.toLowerCase() === answerText.toLowerCase());
        if (match) answerId = match.id;

        questionsToImport.push({
          id: `imp-${Date.now()}-${idx}`,
          subject: importSubject,
          question: qText,
          choices: filteredChoices,
          answerId: answerId,
          rationale: `Chapter: ${chapter}. Answer: ${answerText}`,
          tags: [chapter],
        });
      }
      await db.bulkPut('questions', questionsToImport);
      toast({ title: "Titration Successful", description: `Imported ${questionsToImport.length} cards into ${importSubject}.` });
      setFile(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Titration Failed", description: "Error processing archive." });
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
                  <Trash2 className="mr-2 h-3 w-3" /> Purge all archives
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#111a24] border-white/10 text-white rounded-none">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-500 font-black uppercase">TOTAL PURGE REQUIRED?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground italic text-sm">
                    This will permanently delete ALL titrated questions and uploaded modules from the local database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-black text-[10px] uppercase">Abort</AlertDialogCancel>
                  <AlertDialogAction onClick={purgeAllRecords} className="bg-red-600 font-black text-[10px] uppercase">CONFIRM PURGE</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="riot-card bg-white/[0.02] border border-white/5 p-8 space-y-8">
              <div className="flex items-center gap-4">
                <Database className="text-primary" size={32} />
                <h3 className="text-xl font-black italic uppercase">External Protocol Titration</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Laboratory Sector Target</Label>
                  <Select value={importSubject} onValueChange={setImportSubject}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-none h-12 text-[10px] font-black uppercase text-white">
                      <SelectValue placeholder="Select Sector" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A1219] border-white/10 text-white rounded-none">
                      {CORE_SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s} className="uppercase font-black text-[10px]">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Select Tab-Delimited Archive</Label>
                  <Input type="file" accept=".txt" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="archive-upload-center" />
                  <Button asChild variant="outline" className="w-full h-12 border-dashed border-white/20 text-white font-black text-[10px]">
                    <label htmlFor="archive-upload-center" className="cursor-pointer flex items-center justify-center gap-2">
                      {file ? file.name : 'CHOOSE .TXT FILE'}
                    </label>
                  </Button>
                </div>
              </div>

              <Button className="riot-button w-full h-14 bg-primary text-black font-black text-[10px]" disabled={!file || importing} onClick={processArchiveExport}>
                {importing ? <Loader2 className="animate-spin" /> : 'TITRATE ARCHIVE'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
