
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
      .replace(/Anki\s*ng\s*RMT/gi, '')
      .replace(/Lelouch/gi, '')
      .replace(/Auto\s*submit/gi, '')
      .replace(/Shuffle\s*choices/gi, '')
      .replace(/Made\s*by\s*[^🧪]*/gi, '')
      .replace(/🧪\s*Answer:/gi, '')
      .replace(/\s\s+/g, ' ')
      .trim();
    
    // Deduplicate logic for messy lines
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

  const processAnkiExport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      const questionsToImport: Question[] = [];

      for (let idx = 0; idx < lines.length; idx++) {
        const parts = lines[idx].split('\t');
        if (parts.length < 5) continue;

        // Unified Titration Rules
        // Col 2 (parts[1]): Question
        // Col 3 (parts[2]): Chapter Path / Choice 1
        // Col 4-6 (parts[3-5]): Choices 2-4
        // Col 12 (parts[11]): Answer Text
        
        const qText = scrub(parts[1]);
        const chapter = scrub(parts[2] || "General Titration");
        const choicesRaw = [parts[2], parts[3], parts[4], parts[5]];
        const answerText = scrub(parts[11] || parts[12] || "");

        const filteredChoices = choicesRaw
          .map(c => scrub(c))
          .filter(c => c && c.trim() !== '')
          .map((text, i) => ({
            id: String.fromCharCode(65 + i),
            text: text
          }));

        let answerId = 'A';
        const match = filteredChoices.find(c => c.text.toLowerCase() === answerText.toLowerCase());
        if (match) answerId = match.id;

        questionsToImport.push({
          id: `imp-${Date.now()}-${idx}`,
          subject: importSubject,
          question: qText,
          choices: filteredChoices,
          answerId: answerId,
          rationale: `Source: ${chapter}. Answer: ${answerText}`,
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
                    This will permanently delete ALL titrated questions, anki cards, and uploaded modules.
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
                <h3 className="text-xl font-black italic uppercase">Titration Protocol</h3>
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
                  <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Select TXT Archive</Label>
                  <Input type="file" accept=".txt" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" id="anki-upload-center" />
                  <Button asChild variant="outline" className="w-full h-12 border-dashed border-white/20 text-white font-black text-[10px]">
                    <label htmlFor="anki-upload-center" className="cursor-pointer flex items-center justify-center gap-2">
                      {file ? file.name : 'CHOOSE .TXT FILE'}
                    </label>
                  </Button>
                </div>
              </div>

              <Button className="riot-button w-full h-14 bg-primary text-black font-black text-[10px]" disabled={!file || importing} onClick={processAnkiExport}>
                {importing ? <Loader2 className="animate-spin" /> : 'TITRATE ARCHIVE'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
