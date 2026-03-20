"use client"

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, Sparkles, Plus, Trash2, Microscope } from 'lucide-react';
import { suggestStudyBlocks, SmartStudyBlockSuggesterOutput } from '@/ai/flows/smart-study-block-suggester';
import { db, Schedule } from '@/lib/db';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function SchedulerPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [suggestions, setSuggestions] = useState<SmartStudyBlockSuggesterOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [examDate, setExamDate] = useState("2025-08-20T08:00:00Z");

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    const data = await db.getAll<Schedule>('schedules');
    setSchedules(data);
  };

  const addClass = async () => {
    const newClass: Schedule = {
      id: Math.random().toString(36).substr(2, 9),
      dayOfWeek: "Monday",
      startTime: "08:00",
      endTime: "17:00",
    };
    await db.put('schedules', newClass);
    loadSchedules();
  };

  const deleteClass = async (id: string) => {
    const database = await db.init();
    const transaction = database.transaction('schedules', 'readwrite');
    transaction.objectStore('schedules').delete(id);
    transaction.oncomplete = () => loadSchedules();
  };

  const generatePlan = async () => {
    setLoading(true);
    try {
      const result = await suggestStudyBlocks({
        classSchedule: schedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime
        })),
        performanceData: [
          { subjectName: "Microbiology", averageScore: 65, lastReviewDate: new Date(Date.now() - 7*24*60*60*1000).toISOString() },
          { subjectName: "Hematology", averageScore: 82, lastReviewDate: new Date().toISOString() },
        ],
        examDate: examDate,
        currentDateTime: new Date().toISOString()
      });
      setSuggestions(result);
    } catch (err) {
      toast({ title: "AI Calibration Error", description: "Failed to generate assay blocks." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar />
      <main className="flex-1 bg-[#121212] overflow-y-auto">
        <DashboardHeader />
        
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-headline font-bold uppercase italic tracking-tighter">Clinical Titration</h2>
              <p className="text-muted-foreground">Coordinate your lab shifts and let AI identify your high-yield windows.</p>
            </div>
            <Button onClick={generatePlan} className="bg-primary hover:bg-primary/90 text-black font-bold rounded-none px-8 py-6 h-auto riot-button" disabled={loading}>
              <Sparkles className="mr-2 h-5 w-5" />
              {loading ? "CALIBRATING..." : "GENERATE ASSAY PLAN"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card border p-6 rounded-none riot-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black italic uppercase tracking-widest text-sm">Laboratory Rotation</h3>
                  <Button variant="ghost" size="icon" onClick={addClass}><Plus size={20}/></Button>
                </div>
                <div className="space-y-3">
                  {schedules.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No lab shifts recorded.</p>
                  ) : schedules.map(s => (
                    <div key={s.id} className="bg-white/[0.03] p-3 rounded-none flex items-center justify-between group border border-white/5">
                      <div className="text-sm">
                        <p className="font-black uppercase italic tracking-tighter">{s.dayOfWeek}</p>
                        <p className="text-xs text-muted-foreground">{s.startTime} - {s.endTime}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteClass(s.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border p-6 rounded-none riot-card">
                <h3 className="font-black italic uppercase tracking-widest text-sm mb-4">Licensure Countdown</h3>
                <div className="p-4 bg-primary/10 rounded-none text-center border border-primary/20">
                  <p className="text-[10px] text-primary font-black mb-1 uppercase tracking-[0.3em]">Board Exam</p>
                  <p className="text-3xl font-black italic tracking-tighter">AUG 20, 2025</p>
                  {suggestions?.countdownToExam && (
                    <p className="text-[10px] mt-2 text-muted-foreground font-bold uppercase tracking-widest">{suggestions.countdownToExam}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-card border rounded-none overflow-hidden riot-card">
                <div className="bg-white/[0.03] p-6 border-b border-white/10">
                  <h3 className="font-black italic text-xl flex items-center gap-2 uppercase tracking-tighter">
                    <Microscope className="text-primary" size={24} />
                    Suggested Assay Blocks
                  </h3>
                </div>
                <div className="p-6">
                  {!suggestions ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                      <Clock size={64} className="mb-4 text-muted-foreground" />
                      <p className="text-lg font-black uppercase italic">No analysis generated</p>
                      <p className="text-xs font-bold uppercase tracking-widest">Input your rotation schedule to begin.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {suggestions.suggestedBlocks.map((block, idx) => (
                        <div key={idx} className="flex gap-4 p-4 bg-white/[0.02] hover:bg-white/[0.05] transition-colors border-l-4 border-primary rounded-none group">
                          <div className="w-24 shrink-0 flex flex-col justify-center border-r border-white/10 pr-4">
                            <p className="text-[10px] font-black text-muted-foreground uppercase">{format(new Date(block.startTime), 'eee')}</p>
                            <p className="text-sm font-black text-primary">{format(new Date(block.startTime), 'HH:mm')}</p>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black italic text-lg text-white group-hover:text-primary transition-colors uppercase tracking-tighter">{block.subject}</h4>
                            <p className="text-xs text-muted-foreground italic mb-1">{block.reason}</p>
                            <p className="text-[10px] font-black text-secondary flex items-center gap-1 uppercase tracking-widest">
                              <Clock size={12} />
                              30 Min High-Yield Assay
                            </p>
                          </div>
                          <Button size="icon" variant="ghost" className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={20} className="text-primary" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
