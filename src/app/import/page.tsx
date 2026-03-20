"use client"

import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
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

  const processCsv = async () => {
    if (!file) return;
    setImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const questions: Question[] = [];
      const subjects = new Set<string>();

      // Basic CSV Parser (assuming Anki export style: Question, Answer, Subject, Rational, Choices...)
      // For this demo, we assume a structured CSV or just generate dummy data from lines
      lines.slice(1).forEach((line, idx) => {
        const parts = line.split('\t'); // Anki often uses tabs
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
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar />
      <main className="flex-1 bg-[#121212] overflow-y-auto">
        <DashboardHeader />
        
        <div className="max-w-3xl mx-auto px-8 py-12">
          <h2 className="text-4xl font-headline font-bold mb-2">Import Your Library</h2>
          <p className="text-muted-foreground mb-8 text-lg">Upload your Anki exports (.txt or .csv) to TITRATE your board preparation.</p>

          <div className="bg-muted/30 border-2 border-dashed border-muted p-12 rounded-xl flex flex-col items-center justify-center mb-8 transition-colors hover:border-primary/50 group">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="text-primary" size={32} />
            </div>
            <p className="font-bold mb-2">Select your Anki Export File</p>
            <p className="text-xs text-muted-foreground mb-6">Accepted formats: .csv, .txt (Tab-separated)</p>
            
            <Input 
              type="file" 
              accept=".csv,.txt" 
              onChange={handleFileChange} 
              className="hidden" 
              id="anki-upload"
            />
            <Button asChild variant="secondary" className="font-bold">
              <label htmlFor="anki-upload" className="cursor-pointer">CHOOSE FILE</label>
            </Button>
            
            {file && (
              <div className="mt-4 flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold animate-in fade-in zoom-in">
                <CheckCircle2 size={16} />
                {file.name}
              </div>
            )}
          </div>

          <div className="bg-card border p-6 rounded-xl mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <AlertTriangle className="text-warning" size={20} />
              Import Instructions
            </h3>
            <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-5">
              <li>Export your Anki deck as "Notes in Plain Text".</li>
              <li>Ensure "Include tags" is unchecked for cleaner import.</li>
              <li>Structure should follow: Question [Tab] Answer [Tab] Subject [Tab] Rationale.</li>
            </ul>
          </div>

          <Button 
            className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 text-black rounded-full shadow-lg"
            disabled={!file || importing}
            onClick={processCsv}
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 animate-spin" />
                PROCESSING DATA...
              </>
            ) : 'START TITRATION'}
          </Button>

          {stats && (
            <div className="mt-12 p-8 bg-black/40 rounded-xl animate-in slide-in-from-bottom-4 duration-500">
              <h4 className="text-xl font-headline font-bold mb-4">Titration Complete</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Questions</p>
                  <p className="text-3xl font-bold text-primary">{stats.count}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Subjects Identified</p>
                  <p className="text-3xl font-bold text-secondary">{stats.subjects.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
