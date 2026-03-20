"use client"

import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Database, 
  Zap,
  Microscope,
  BookOpen
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

  const seedSampleQuestions = async () => {
    setImporting(true);
    const samples: Question[] = [
      {
        id: 'rodaks-hema-1',
        subject: 'Hematology',
        question: 'A 24-year-old female presents with a microcytic, hypochromic anemia. Laboratory results show a decreased serum iron, increased TIBC, and decreased ferritin. Which of the following is the most likely diagnosis?',
        choices: [
          { id: 'A', text: 'Sideroblastic Anemia' },
          { id: 'B', text: 'Anemia of Chronic Disease' },
          { id: 'C', text: 'Iron Deficiency Anemia' },
          { id: 'D', text: 'Thalassemia Minor' },
        ],
        answerId: 'C',
        rationale: 'In Iron Deficiency Anemia (IDA), the body\'s iron stores (ferritin) are depleted, leading to a compensatory increase in Total Iron Binding Capacity (TIBC) and a decrease in serum iron. Sideroblastic anemia and Thalassemia would typically show normal or increased ferritin.',
        tags: ['Rodaks', 'Anemia', 'Iron Studies'],
      },
      {
        id: 'rodaks-hema-2',
        subject: 'Hematology',
        question: 'Which of the following coagulation factors is the first to decrease in a patient with severe Vitamin K deficiency or early Warfarin therapy?',
        choices: [
          { id: 'A', text: 'Factor II' },
          { id: 'B', text: 'Factor VII' },
          { id: 'C', text: 'Factor IX' },
          { id: 'D', text: 'Factor X' },
        ],
        answerId: 'B',
        rationale: 'Factor VII has the shortest half-life (approximately 6 hours) of all the Vitamin K-dependent factors (II, VII, IX, X, Protein C, and Protein S). Therefore, it is the first to show a significant decrease in deficiency or inhibition.',
        tags: ['Rodaks', 'Coagulation', 'Vitamin K'],
      },
      {
        id: 'stevens-immuno-1',
        subject: 'Immuno-Serology',
        question: 'A patient experiences immediate bronchoconstriction and hives after a bee sting. This reaction is mediated by which of the following mechanisms?',
        choices: [
          { id: 'A', text: 'Type I Hypersensitivity (IgE)' },
          { id: 'B', text: 'Type II Hypersensitivity (Cytotoxic)' },
          { id: 'C', text: 'Type III Hypersensitivity (Immune Complex)' },
          { id: 'D', text: 'Type IV Hypersensitivity (Delayed)' },
        ],
        answerId: 'A',
        rationale: 'Type I hypersensitivity involves IgE antibodies binding to mast cells and basophils. Upon re-exposure to the allergen, degranulation occurs, releasing histamine and leukotrienes, causing immediate symptoms like anaphylaxis or urticaria.',
        tags: ['Stevens', 'Hypersensitivity', 'IgE'],
      },
      {
        id: 'stevens-immuno-2',
        subject: 'Immuno-Serology',
        question: 'In an Antinuclear Antibody (ANA) test, a "Speckled" pattern is most commonly associated with antibodies against which of the following?',
        choices: [
          { id: 'A', text: 'Double-stranded DNA' },
          { id: 'B', text: 'Histones' },
          { id: 'C', text: 'Extractable Nuclear Antigens (ENA)' },
          { id: 'D', text: 'Centromeres' },
        ],
        answerId: 'C',
        rationale: 'A speckled ANA pattern is associated with antibodies to non-histone proteins or Extractable Nuclear Antigens (ENAs), such as Smith (Sm), RNP, SS-A, and SS-B. Homogeneous is dsDNA/Histones, and Nucleolar is associated with scleroderma.',
        tags: ['Stevens', 'ANA', 'Autoimmunity'],
      },
      {
        id: 'bishop-chem-1',
        subject: 'Clinical Chemistry',
        question: 'Which of the following biochemical markers is considered the "gold standard" for the early diagnosis of myocardial infarction due to its high cardiac specificity?',
        choices: [
          { id: 'A', text: 'CK-MB' },
          { id: 'B', text: 'Myoglobin' },
          { id: 'C', text: 'Cardiac Troponin I (cTnI)' },
          { id: 'D', text: 'LDH-1/LDH-2 Flip' },
        ],
        answerId: 'C',
        rationale: 'Cardiac Troponins (I and T) are highly specific for cardiac muscle injury. While CK-MB is also used, Troponin remains elevated longer and is more specific. Myoglobin rises earliest but lacks specificity.',
        tags: ['Bishop', 'Cardiac Markers', 'Troponin'],
      }
    ];

    try {
      await db.bulkPut('questions', samples);
      setStats({ count: samples.length, subjects: ['Hematology', 'Immuno-Serology', 'Clinical Chemistry'] });
      toast({
        title: "High-Yield Samples Loaded",
        description: "Standard MedTech assays (Rodaks/Stevens/Bishop) have been synchronized.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Seeding Failed",
        description: "Could not populate sample data.",
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

  const processCsv = async () => {
    if (!file) return;
    setImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const questions: Question[] = [];
      const subjects = new Set<string>();

      lines.slice(1).forEach((line, idx) => {
        const parts = line.split('\t'); 
        if (parts.length < 3) return;

        const subject = parts[2] || 'General';
        subjects.add(subject);

        questions.push({
          id: `q-${Date.now()}-${idx}`,
          subject: subject,
          question: parts[0],
          choices: [
            { id: 'A', text: parts[4] || 'Choice A' },
            { id: 'B', text: parts[5] || 'Choice B' },
            { id: 'C', text: parts[6] || 'Choice C' },
            { id: 'D', text: parts[7] || 'Choice D' },
          ],
          answerId: parts[1] || 'A',
          rationale: parts[3] || 'No rationale provided.',
          tags: [],
        });
      });

      await db.bulkPut('questions', questions);
      setStats({ count: questions.length, subjects: Array.from(subjects) });
      toast({
        title: "Import Successful",
        description: `Imported ${questions.length} questions across ${subjects.size} subjects.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "There was an error processing the file.",
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
                  Generate ASCP-style high-yield questions mimicking authoritative review sources like Stevens and Rodak's.
                </p>
                <div className="space-y-4">
                   <Label className="text-[9px] font-black uppercase tracking-widest">Target Clinical Sector</Label>
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
                {generating ? <Loader2 className="animate-spin" /> : 'SYNTHESIZE CLINICAL QUESTIONS'}
              </Button>
            </div>

            {/* Tactical Seeding Card */}
            <div className="riot-card bg-white/[0.02] border border-white/5 p-8 flex flex-col justify-between">
              <div>
                <Database className="text-primary mb-6" size={32} />
                <h3 className="text-xl font-black italic uppercase mb-2">High-Yield Seeding</h3>
                <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-widest">
                  Synchronize your device with professional board samples from Rodak's, Stevens, and Bishop for immediate access.
                </p>
              </div>
              <Button 
                onClick={seedSampleQuestions}
                disabled={importing}
                className="riot-button h-12 mt-8 bg-white/10 text-white font-black text-[10px] hover:bg-white/20"
              >
                {importing ? <Loader2 className="animate-spin" /> : 'SEED CORE SAMPLES'}
              </Button>
            </div>

            {/* Manual Upload Card */}
            <div className="riot-card bg-white/[0.02] border border-white/5 p-8 flex flex-col justify-between">
              <div>
                <Upload className="text-primary mb-6" size={32} />
                <h3 className="text-xl font-black italic uppercase mb-2">Protocol Upload</h3>
                <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-widest">
                  Import your personal Anki archives (.csv or .txt). Precision titration ensures your library stays local.
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
                    {file ? file.name : 'CHOOSE ARCHIVE FILE'}
                  </label>
                </Button>
                <Button 
                  className="riot-button w-full h-12 bg-white/10 text-white font-black text-[10px] hover:bg-white/20"
                  disabled={!file || importing}
                  onClick={processCsv}
                >
                  {importing ? <Loader2 className="animate-spin" /> : 'START TITRATION'}
                </Button>
              </div>
            </div>
          </div>

          <div className="riot-card p-6 bg-white/[0.02] border border-white/5">
            <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-2 mb-4 text-primary">
              <Microscope size={16} />
              Analyst Guidelines
            </h3>
            <ul className="text-[10px] font-bold space-y-2 text-muted-foreground uppercase tracking-widest list-disc pl-5">
              <li>High-Yield Seeding uses questions mimicking authoritative review books for board-level preparation.</li>
              <li>Anki Exports must be "Notes in Plain Text" with [Tab] separation.</li>
              <li>All synthesized and imported data is stored in your device's local clinical archive (IndexedDB).</li>
            </ul>
          </div>

          {stats && (
            <div className="riot-card p-8 bg-primary/5 border border-primary/20 animate-in slide-in-from-bottom-4 duration-500">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-6 text-primary">Titration Successful</h4>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Assays Recorded</p>
                  <p className="text-4xl font-black italic text-white tracking-tighter">{stats.count}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Clinical Sectors Identified</p>
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

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
    {children}
  </label>
);
