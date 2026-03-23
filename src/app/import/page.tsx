
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
  FileJson,
  Database
} from 'lucide-react';
import { db, Question, CORE_SUBJECTS } from '@/lib/db';
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

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('Hematology');
  const [stats, setStats] = useState<{ count: number; subjects: string[] } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const seedHighYieldDeck = async () => {
    setImporting(true);
    const medTechDeck: Question[] = [
      {
        id: 'anki-hema-1',
        subject: 'Hematology',
        question: 'What is the hallmark cell found in Hodgkin\'s Lymphoma, described as having an "Owl-Eye" appearance?',
        choices: [
          { id: 'A', text: 'Pappenheimer Cell' },
          { id: 'B', text: 'Reed-Sternberg Cell' },
          { id: 'C', text: 'Sézary Cell' },
          { id: 'D', text: 'Pelger-Huet Cell' },
        ],
        answerId: 'B',
        rationale: 'Reed-Sternberg cells are large, binucleated or multinucleated cells (typically with prominent nucleoli) essential for the diagnosis of Hodgkin\'s Lymphoma.',
        tags: ['Anki', 'Lymphoma', 'Morphology'],
      }
    ];

    try {
      await db.bulkPut('questions', medTechDeck);
      setStats({ count: medTechDeck.length, subjects: ['Hematology'] });
      toast({
        title: "MedTech Board Deck Titrated",
        description: "High-yield flashcards have been synchronized.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Titration Failed",
        description: "Could not populate sample deck.",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleAiGeneration = async () => {
    setGenerating(true);
    try {
      const result = await generateQuestions({ subject: selectedSubject, count: 5 });
      if (result.questions && result.questions.length > 0) {
        await db.bulkPut('questions', result.questions);
        setStats({ count: result.questions.length, subjects: [selectedSubject] });
        toast({
          title: "AI Synthesis Complete",
          description: `Generated 5 high-yield ${selectedSubject} board-style questions.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Synthesis Error",
        description: "Laboratory AI failed to generate clinical content.",
      });
    } finally {
      setGenerating(false);
    }
  };

  const processAnkiExport = async () => {
    if (!file) return;
    setImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim().length > 0);
      const questions: Question[] = [];
      const subjects = new Set<string>();

      lines.forEach((line, idx) => {
        // Anki plain text export is Tab-Separated
        const parts = line.split('\t'); 
        if (parts.length < 2) return; // Need at least Front and Back

        const front = parts[0].trim().replace(/^"|"$/g, '');
        const back = parts[1].trim().replace(/^"|"$/g, '');
        const tagsRaw = parts[2] || 'Anki-Import';
        const tags = tagsRaw.split(' ').filter(t => t.length > 0);
        
        // Search tags for a core subject match
        const subjectMatch = CORE_SUBJECTS.find(s => 
          tagsRaw.toLowerCase().includes(s.toLowerCase())
        ) || 'General';

        subjects.add(subjectMatch);

        questions.push({
          id: `anki-${Date.now()}-${idx}`,
          subject: subjectMatch,
          question: front,
          choices: [
            { id: 'A', text: 'REVEAL CLINICAL DATA' },
            { id: 'B', text: '---' },
            { id: 'C', text: '---' },
            { id: 'D', text: '---' },
          ],
          answerId: 'A',
          rationale: back,
          tags: tags,
        });
      });

      if (questions.length === 0) {
        throw new Error("No valid flashcards found in the archive.");
      }

      await db.bulkPut('questions', questions);
      setStats({ count: questions.length, subjects: Array.from(subjects) });
      toast({
        title: "Titration Successful",
        description: `Imported ${questions.length} cards from Anki archive.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Titration Failed",
        description: err instanceof Error ? err.message : "Error processing Anki file.",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#050a0f] overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        <div className="max-w-6xl mx-auto px-8 py-32 space-y-12">
          <div className="border-b border-white/5 pb-8">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Data Titration</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
              Populate your clinical library via AI synthesis, Anki exports, or high-yield seeding.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* AI Generation Card */}
            <div className="riot-card bg-primary/5 border border-primary/20 p-8 flex flex-col justify-between">
              <div>
                <Zap className="text-primary mb-6 animate-pulse" size={32} />
                <h3 className="text-xl font-black italic uppercase mb-2">AI Synthesis</h3>
                <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-widest mb-6">
                  Generate ASCP-style questions mimicking review books like Stevens and Rodak's.
                </p>
                <div className="space-y-4">
                   <Label className="text-[9px] font-black uppercase tracking-widest">Clinical Sector</Label>
                   <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-none h-12 text-[10px] font-black uppercase tracking-widest">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A1219] border-white/10 text-white rounded-none">
                      {CORE_SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s} className="uppercase font-black text-[10px] tracking-widest">{s}</SelectItem>
                      ))}
                    </SelectContent>
                   </Select>
                </div>
              </div>
              <Button 
                onClick={handleAiGeneration}
                disabled={generating}
                className="riot-button h-12 mt-8 bg-primary text-black font-black text-[10px]"
              >
                {generating ? <Loader2 className="animate-spin" /> : 'SYNTHESIZE ASSAY'}
              </Button>
            </div>

            {/* Trial MedTech Deck Card */}
            <div className="riot-card bg-white/[0.02] border border-white/5 p-8 flex flex-col justify-between">
              <div>
                <FileJson className="text-primary mb-6" size={32} />
                <h3 className="text-xl font-black italic uppercase mb-2">Trial MedTech Deck</h3>
                <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-widest">
                  Quick-load high-yield clinical cards from core sectors to test the laboratory interface.
                </p>
              </div>
              <Button 
                onClick={seedHighYieldDeck}
                disabled={importing}
                className="riot-button h-12 mt-8 bg-white/10 text-white font-black text-[10px] hover:bg-white/20"
              >
                {importing ? <Loader2 className="animate-spin" /> : 'SEED TRIAL DECK'}
              </Button>
            </div>

            {/* Anki Protocol Upload */}
            <div className="riot-card bg-white/[0.02] border border-white/5 p-8 flex flex-col justify-between">
              <div>
                <Database className="text-primary mb-6" size={32} />
                <h3 className="text-xl font-black italic uppercase mb-2">Anki Titration</h3>
                <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-widest">
                  Import Anki archives. Use "Notes in Plain Text" export with [Tab] separation for perfect titration.
                </p>
              </div>
              
              <div className="mt-8 space-y-4">
                <Input 
                  type="file" 
                  accept=".csv,.txt" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  id="anki-upload"
                />
                <Button asChild variant="outline" className="w-full h-12 border-dashed border-white/20 hover:border-primary/50 text-white font-black text-[10px]">
                  <label htmlFor="anki-upload" className="cursor-pointer flex items-center justify-center gap-2">
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
          </div>

          {stats && (
            <div className="riot-card p-8 bg-primary/5 border border-primary/20 animate-in slide-in-from-bottom-4 duration-500">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 text-primary">Titration Complete</h4>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Cards Recorded</p>
                  <p className="text-4xl font-black italic text-white tracking-tighter">{stats.count}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Sectors Identified</p>
                  <p className="text-4xl font-black italic text-white tracking-tighter">{stats.subjects.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
