
"use client"

import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, Database } from 'lucide-react';
import { db, Question } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
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
        id: 'sample-q1',
        subject: 'Microbiology',
        question: 'Which of the following is the primary stain used in the Gram staining technique?',
        choices: [
          { id: 'A', text: 'Safranin' },
          { id: 'B', text: 'Crystal Violet' },
          { id: 'C', text: 'Gram\'s Iodine' },
          { id: 'D', text: '95% Ethyl Alcohol' },
        ],
        answerId: 'B',
        rationale: 'Crystal Violet is the primary stain that colors all cells purple initially. Iodine acts as a mordant, Safranin is the counterstain, and Alcohol is the decolorizer.',
        tags: ['Gram Stain', 'Basic Micro'],
      },
      {
        id: 'sample-q2',
        subject: 'Hematology',
        question: 'What is the normal life span of a mature erythrocyte in circulation?',
        choices: [
          { id: 'A', text: '10-20 days' },
          { id: 'B', text: '120 days' },
          { id: 'C', text: '60 days' },
          { id: 'D', text: '8-10 days' },
        ],
        answerId: 'B',
        rationale: 'Red blood cells (erythrocytes) typically circulate for approximately 120 days before being removed by the spleen.',
        tags: ['RBC', 'Physiology'],
      },
      {
        id: 'sample-q3',
        subject: 'Clinical Chemistry',
        question: 'Which enzyme is most specific for acute pancreatitis diagnosis?',
        choices: [
          { id: 'A', text: 'Amylase' },
          { id: 'B', text: 'Lipase' },
          { id: 'C', text: 'AST' },
          { id: 'D', text: 'ALP' },
        ],
        answerId: 'B',
        rationale: 'While both amylase and lipase rise in pancreatitis, lipase remains elevated longer and is considered more specific to pancreatic tissue.',
        tags: ['Enzymology', 'Pancreas'],
      }
    ];

    try {
      await db.bulkPut('questions', samples);
      setStats({ count: samples.length, subjects: ['Microbiology', 'Hematology', 'Clinical Chemistry'] });
      toast({
        title: "Clinical Samples Loaded",
        description: "Standard MedTech assays have been synchronized with your device.",
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
        
        <div className="max-w-4xl mx-auto px-8 py-32 space-y-12">
          <div className="border-b border-white/5 pb-8">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Data Titration</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">
              Populate your clinical library via Anki exports or tactical seeding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="riot-card bg-white/[0.02] border border-white/5 p-8 flex flex-col justify-between">
              <div>
                <Database className="text-primary mb-6" size={32} />
                <h3 className="text-xl font-black italic uppercase mb-2">Tactical Seeding</h3>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed uppercase tracking-widest">
                  No data files? Synchronize your device with our core clinical sample set for immediate laboratory access.
                </p>
              </div>
              <Button 
                onClick={seedSampleQuestions}
                disabled={importing}
                className="riot-button h-12 mt-8 bg-primary text-black font-black text-[10px]"
              >
                {importing ? <Loader2 className="animate-spin" /> : 'SEED CLINICAL SAMPLES'}
              </Button>
            </div>

            <div className="riot-card bg-white/[0.02] border border-white/5 p-8 flex flex-col justify-between">
              <div>
                <Upload className="text-primary mb-6" size={32} />
                <h3 className="text-xl font-black italic uppercase mb-2">Protocol Upload</h3>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed uppercase tracking-widest">
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
                  className="riot-button w-full h-12 bg-primary text-black font-black text-[10px]"
                  disabled={!file || importing}
                  onClick={processCsv}
                >
                  {importing ? <Loader2 className="animate-spin" /> : 'START TITRATION'}
                </Button>
              </div>
            </div>
          </div>

          <div className="riot-card p-6 bg-white/[0.02] border border-white/5">
            <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-2 mb-4">
              <AlertTriangle className="text-warning" size={16} />
              Analyst Guidelines
            </h3>
            <ul className="text-[10px] font-bold space-y-2 text-muted-foreground uppercase tracking-widest list-disc pl-5">
              <li>Export your Anki deck as "Notes in Plain Text".</li>
              <li>Structure must follow: Question [Tab] Answer [Tab] Subject [Tab] Rationale.</li>
              <li>Data is stored in your local clinical archive (IndexedDB). No external sync occurs.</li>
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
