"use client"

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, Sparkles, Plus, Trash2 } from 'lucide-react';
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
      toast({ title: "AI Error", description: "Failed to generate study blocks." });
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
              <h2 className="text-4xl font-headline font-bold">Smart Titration</h2>
              <p className="text-muted-foreground">Sync your duties and let AI find your high-yield windows.</p>
            </div>
            <Button onClick={generatePlan} className="bg-primary hover:bg-primary/90 text-black font-bold rounded-full px-8 py-6 h-auto" disabled={loading}>
              <Sparkles className="mr-2 h-5 w-5" />
              {loading ? "CALCULATING..." : "GENERATE STUDY PLAN"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card border p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Class Schedule</h3>
                  <Button variant="ghost" size="icon" onClick={addClass}><Plus size={20}/></Button>
                </div>
                <div className="space-y-3">
                  {schedules.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No classes added yet.</p>
                  ) : schedules.map(s => (
                    <div key={s.id} className="bg-muted/30 p-3 rounded-lg flex items-center justify-between group">
                      <div className="text-sm">
                        <p className="font-bold">{s.dayOfWeek}</p>
                        <p className="text-xs text-muted-foreground">{s.startTime} - {s.endTime}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteClass(s.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-4">Exam Countdown</h3>
                <div className="p-4 bg-primary/10 rounded-lg text-center border border-primary/20">
                  <p className="text-sm text-primary font-bold mb-1 uppercase tracking-widest">Board Exam</p>
                  <p className="text-3xl font-black font-headline">AUG 20, 2025</p>
                  {suggestions?.countdownToExam && (
                    <p className="text-xs mt-2 text-muted-foreground font-medium">{suggestions.countdownToExam}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-card border rounded-xl overflow-hidden">
                <div className="bg-muted/50 p-6 border-b">
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <CalendarIcon className="text-primary" />
                    Suggested Study Blocks
                  </h3>
                </div>
                <div className="p-6">
                  {!suggestions ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                      <Clock size={64} className="mb-4 text-muted-foreground" />
                      <p className="text-lg font-bold">No plan generated yet</p>
                      <p className="text-sm">Enter your schedule and click Generate.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {suggestions.suggestedBlocks.map((block, idx) => (
                        <div key={idx} className="flex gap-4 p-4 bg-muted/20 hover:bg-muted/40 transition-colors border-l-4 border-primary rounded-r-lg group">
                          <div className="w-24 shrink-0 flex flex-col justify-center border-r pr-4">
                            <p className="text-xs font-bold text-muted-foreground uppercase">{format(new Date(block.startTime), 'eee')}</p>
                            <p className="text-sm font-bold text-primary">{format(new Date(block.startTime), 'HH:mm')}</p>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{block.subject}</h4>
                            <p className="text-sm text-muted-foreground italic mb-1">{block.reason}</p>
                            <p className="text-xs font-medium text-secondary flex items-center gap-1">
                              <Clock size={12} />
                              30 Min High-Yield Session
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
