
"use client"

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  Sparkles, 
  Plus, 
  Trash2, 
  Microscope, 
  GraduationCap, 
  BookOpen, 
  AlarmClock,
  CalendarDays
} from 'lucide-react';
import { db, Schedule, ScheduleType } from '@/lib/db';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StudyPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ScheduleType>('class');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<Schedule>>({
    title: '',
    startTime: '08:00',
    endTime: '09:00',
    dayOfWeek: 'Monday',
    date: new Date().toISOString().split('T')[0]
  });
  
  const { toast } = useToast();

  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
      toast({ title: "Assay Complete", description: "Study window has closed." });
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, toast]);

  const loadSchedules = async () => {
    const data = await db.getAll<Schedule>('schedules');
    setSchedules(data);
  };

  const saveScheduleItem = async () => {
    if (!newItem.title) {
      toast({ variant: "destructive", title: "Missing Information", description: "Protocol title is required." });
      return;
    }

    const item: Schedule = {
      id: Math.random().toString(36).substr(2, 9),
      type: activeTab,
      title: newItem.title,
      dayOfWeek: activeTab === 'class' ? newItem.dayOfWeek : undefined,
      date: activeTab !== 'class' ? newItem.date : undefined,
      startTime: newItem.startTime || "08:00",
      endTime: newItem.endTime || "09:00",
    };
    
    await db.put('schedules', item);
    loadSchedules();
    setIsAddOpen(false);
    setNewItem({ title: '', startTime: '08:00', endTime: '09:00', dayOfWeek: 'Monday', date: new Date().toISOString().split('T')[0] });
    toast({ title: "Protocol Recorded", description: "Schedule updated in local archive." });
  };

  const deleteScheduleItem = async (id: string) => {
    await db.delete('schedules', id);
    loadSchedules();
    toast({ title: "Protocol Removed", description: "Schedule entry deleted." });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredSchedules = schedules.filter(s => s.type === activeTab);

  return (
    <div className="flex h-screen bg-[#050a0f] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        <div className="max-w-6xl mx-auto px-8 lg:px-16 py-32 space-y-12">
          <div className="flex items-center justify-between border-b border-white/5 pb-8">
            <div>
              <h2 className="text-5xl font-black italic uppercase tracking-tighter">Study Calibration</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Manage course rotations, exam milestones, and high-yield blocks.</p>
            </div>
            <div className="riot-card p-4 bg-primary/5 border border-primary/20 flex items-center gap-6">
               <div className="text-center">
                 <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Focus Window</p>
                 <p className="text-3xl font-black italic text-white tracking-tighter">{formatTime(timeLeft)}</p>
               </div>
               <Button 
                onClick={() => setTimerActive(!timerActive)}
                className={cn(
                  "riot-button h-10 px-6 rounded-none font-black text-[10px]",
                  timerActive ? "bg-red-500 text-white" : "bg-primary text-black"
                )}
               >
                 {timerActive ? "ABORT" : "INITIATE"}
               </Button>
            </div>
          </div>

          <Tabs defaultValue="class" className="w-full" onValueChange={(v) => setActiveTab(v as ScheduleType)}>
            <TabsList className="bg-white/[0.02] border border-white/5 p-1 rounded-none h-14 mb-10 w-full max-w-2xl">
              <TabsTrigger value="class" className="flex-1 rounded-none data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase text-[10px] tracking-widest">
                <GraduationCap className="mr-2 h-4 w-4" /> Class Schedule
              </TabsTrigger>
              <TabsTrigger value="exam" className="flex-1 rounded-none data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase text-[10px] tracking-widest">
                <CalendarDays className="mr-2 h-4 w-4" /> Academic Exams
              </TabsTrigger>
              <TabsTrigger value="study" className="flex-1 rounded-none data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase text-[10px] tracking-widest">
                <BookOpen className="mr-2 h-4 w-4" /> Study Blocks
              </TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                    {activeTab === 'class' ? "Course Schedule" : activeTab === 'exam' ? "Exam Milestones" : "High-Yield Sessions"}
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)} className="border-white/10 hover:bg-white/5 rounded-none uppercase text-[10px] font-black">
                    <Plus className="mr-2 h-4 w-4" /> Record Entry
                  </Button>
                </div>

                <div className="space-y-4">
                  {filteredSchedules.length === 0 ? (
                    <div className="riot-card p-12 bg-white/[0.02] border border-dashed border-white/10 text-center opacity-40">
                      <Clock className="mx-auto mb-4" size={32} />
                      <p className="font-black italic uppercase">No entries recorded in this sector.</p>
                    </div>
                  ) : filteredSchedules.map((s) => (
                    <div key={s.id} className="riot-card bg-white/[0.02] hover:bg-white/[0.04] transition-all p-6 border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-primary/10 flex items-center justify-center border border-primary/20">
                          {s.type === 'class' ? <GraduationCap className="text-primary" /> : s.type === 'exam' ? <CalendarDays className="text-primary" /> : <BookOpen className="text-primary" />}
                        </div>
                        <div>
                          <h4 className="text-lg font-black italic uppercase tracking-tighter text-white">{s.title}</h4>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {s.type === 'class' ? s.dayOfWeek : format(new Date(s.date!), 'MMMM dd, yyyy')} • {s.startTime} - {s.endTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                           <AlarmClock size={18} />
                         </Button>
                         <Button variant="ghost" size="icon" onClick={() => deleteScheduleItem(s.id)} className="text-destructive hover:bg-destructive/10">
                           <Trash2 size={18} />
                         </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div className="riot-card p-8 bg-primary/5 border border-primary/20 relative overflow-hidden">
                   <div className="relative z-10">
                     <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Analyst Insights</h4>
                     <p className="text-sm italic text-white/80 leading-relaxed">
                       AI Assistant suggests prioritizing <span className="text-primary">Microbiology</span> review before your Wednesday rotation.
                     </p>
                   </div>
                   <Sparkles className="absolute -bottom-4 -right-4 text-primary opacity-20" size={80} />
                </div>

                <div className="riot-card p-8 border border-white/5 bg-white/[0.02]">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-6 border-b border-white/5 pb-4">Calibration Log</h4>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                       <span className="text-muted-foreground">Class Load</span>
                       <span className="text-white">{schedules.filter(s => s.type === 'class').length} Subjects</span>
                     </div>
                     <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                       <span className="text-muted-foreground">Exams Pending</span>
                       <span className="text-white">{schedules.filter(s => s.type === 'exam').length} Dates</span>
                     </div>
                     <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                       <span className="text-muted-foreground">Study Intensity</span>
                       <span className="text-primary">Operational</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </Tabs>
        </div>

        {/* Add Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="bg-[#0A1219] border-white/10 text-white rounded-none">
            <DialogHeader>
              <DialogTitle className="font-black italic uppercase tracking-tighter text-2xl">New {activeTab} Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entry Title</Label>
                <Input 
                  value={newItem.title} 
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  placeholder="e.g. Hematology Lab 101"
                  className="bg-white/5 border-white/10 rounded-none focus:ring-primary"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Start Time</Label>
                  <Input 
                    type="time"
                    value={newItem.startTime} 
                    onChange={(e) => setNewItem({...newItem, startTime: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">End Time</Label>
                  <Input 
                    type="time"
                    value={newItem.endTime} 
                    onChange={(e) => setNewItem({...newItem, endTime: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-none"
                  />
                </div>
              </div>

              {activeTab === 'class' ? (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Day of Week</Label>
                  <select 
                    value={newItem.dayOfWeek}
                    onChange={(e) => setNewItem({...newItem, dayOfWeek: e.target.value})}
                    className="w-full bg-[#121b24] border border-white/10 h-10 px-3 text-sm rounded-none outline-none focus:ring-1 focus:ring-primary"
                  >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Date</Label>
                  <Input 
                    type="date"
                    value={newItem.date} 
                    onChange={(e) => setNewItem({...newItem, date: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-none"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="uppercase font-black text-[10px] tracking-widest">Cancel</Button>
              <Button onClick={saveScheduleItem} className="bg-primary text-black rounded-none font-black text-[10px] tracking-widest px-8">SAVE PROTOCOL</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
