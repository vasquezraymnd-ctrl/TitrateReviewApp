"use client"

import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  GraduationCap, 
  BookOpen, 
  AlarmClock,
  CalendarDays,
  Database,
  Clock,
} from 'lucide-react';
import { db, Schedule, ScheduleType } from '@/lib/db';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SchedulerPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    const data = await db.getAll<Schedule>('schedules');
    setSchedules(data);
    setLoading(false);
    window.dispatchEvent(new Event('schedule-updated'));
  };

  const saveScheduleItem = async () => {
    if (!newItem.title) {
      toast({ variant: "destructive", title: "Error", description: "Title is required." });
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
    toast({ title: "Protocol Saved", description: "Entry added to your schedule." });
  };

  const deleteScheduleItem = async (id: string) => {
    await db.delete('schedules', id);
    loadSchedules();
    toast({ title: "Entry Removed", description: "Schedule updated." });
  };

  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => s.type === activeTab);
  }, [schedules, activeTab]);

  return (
    <div className="flex h-screen bg-[#111a24] overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        <div className="max-w-[1600px] mx-auto px-6 md:px-8 lg:px-16 py-28 lg:py-32 space-y-12 xl:space-y-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-8 gap-6">
            <div>
              <h2 className="text-3xl md:text-5xl xl:text-7xl font-black italic uppercase tracking-tighter">Study Calibration</h2>
              <p className="text-[10px] md:text-xs xl:text-sm font-bold text-muted-foreground uppercase tracking-widest mt-2">Manage course rotations and exam milestones.</p>
            </div>
          </div>

          <Tabs defaultValue="class" className="w-full" onValueChange={(v) => setActiveTab(v as ScheduleType)}>
            <TabsList className="bg-white/[0.02] border border-white/5 p-1 rounded-none h-14 md:h-16 xl:h-20 mb-8 w-full max-w-4xl flex overflow-x-auto no-scrollbar">
              <TabsTrigger value="class" className="flex-1 rounded-none data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase text-[9px] md:text-xs xl:text-sm tracking-widest">
                <GraduationCap className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> <span className="hidden sm:inline">Class</span> Schedule
              </TabsTrigger>
              <TabsTrigger value="exam" className="flex-1 rounded-none data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase text-[9px] md:text-xs xl:text-sm tracking-widest">
                <CalendarDays className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> <span className="hidden sm:inline">Academic</span> Exams
              </TabsTrigger>
              <TabsTrigger value="study" className="flex-1 rounded-none data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase text-[9px] md:text-xs xl:text-sm tracking-widest">
                <BookOpen className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> Study Blocks
              </TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-12 xl:gap-20">
              <div className="lg:col-span-2 xl:col-span-3 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl xl:text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                    {activeTab === 'class' ? "Course Rotations" : activeTab === 'exam' ? "Exam Milestones" : "Study Sessions"}
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setIsAddOpen(true)} className="border-white/10 hover:bg-white/5 rounded-none uppercase text-[10px] xl:text-[12px] font-black h-10 xl:h-12 px-4 xl:px-8">
                    <Plus className="mr-2 h-4 w-4" /> RECORD
                  </Button>
                </div>

                <div className="space-y-4 pb-24 md:pb-0">
                  {loading ? (
                    <div className="riot-card p-12 bg-white/[0.02] border border-dashed border-white/10 text-center opacity-40">
                      <Clock className="mx-auto mb-4 animate-pulse" size={32} />
                      <p className="font-black italic uppercase text-xs">Accessing Archives...</p>
                    </div>
                  ) : filteredSchedules.length === 0 ? (
                    <div className="riot-card p-12 bg-white/[0.02] border border-dashed border-white/10 text-center opacity-40">
                      <Clock className="mx-auto mb-4" size={32} />
                      <p className="font-black italic uppercase text-xs">No entries recorded.</p>
                    </div>
                  ) : filteredSchedules.map((s) => (
                    <div key={s.id} className="riot-card bg-white/[0.02] hover:bg-white/[0.04] transition-all p-5 md:p-6 xl:p-10 border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-4 md:gap-6 xl:gap-10">
                        <div className="w-12 h-12 md:w-14 md:h-14 xl:w-20 xl:h-20 bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                          {s.type === 'class' ? <GraduationCap className="text-primary size-5 md:size-6 xl:size-10" /> : s.type === 'exam' ? <CalendarDays className="text-primary size-5 md:size-6 xl:size-10" /> : <BookOpen className="text-primary size-5 md:size-6 xl:size-10" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-base md:text-lg xl:text-3xl font-black italic uppercase tracking-tighter text-white truncate">{s.title}</h4>
                          <p className="text-[9px] md:text-[10px] xl:text-[14px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            {s.type === 'class' ? s.dayOfWeek : s.date ? format(new Date(s.date), 'MMM dd, yyyy') : 'N/A'} • {s.startTime} - {s.endTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2">
                         <Button variant="ghost" size="icon" onClick={() => deleteScheduleItem(s.id)} className="text-red-500 hover:bg-red-500/10 h-10 w-10 xl:h-14 xl:w-14">
                           <Trash2 size={24} />
                         </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8 hidden lg:block">
                <div className="riot-card p-8 xl:p-12 bg-white/[0.02] border border-white/5">
                  <h4 className="text-[10px] xl:text-[12px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-6 border-b border-white/5 pb-4">Calibration Metrics</h4>
                  <div className="space-y-4 xl:space-y-6">
                     <div className="flex items-center justify-between text-[10px] xl:text-[13px] font-bold uppercase tracking-widest">
                       <span className="text-muted-foreground">Class Load</span>
                       <span className="text-white">{schedules.filter(s => s.type === 'class').length} Folders</span>
                     </div>
                     <div className="flex items-center justify-between text-[10px] xl:text-[13px] font-bold uppercase tracking-widest">
                       <span className="text-muted-foreground">Exam Targets</span>
                       <span className="text-white">{schedules.filter(s => s.type === 'exam').length} Dates</span>
                     </div>
                     <div className="flex items-center justify-between text-[10px] xl:text-[13px] font-bold uppercase tracking-widest">
                       <span className="text-muted-foreground">Protocol Intensity</span>
                       <span className="text-primary">Operational</span>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </Tabs>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="bg-[#111a24] border-white/10 text-white rounded-none max-w-[95%] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-black italic uppercase tracking-tighter text-2xl">New {activeTab} Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entry Title</Label>
                <Input 
                  value={newItem.title} 
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                  placeholder="e.g. Hematology Lab"
                  className="bg-white/5 border-white/10 rounded-none h-12 text-sm focus:ring-primary"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Start Time</Label>
                  <Input 
                    type="time"
                    value={newItem.startTime} 
                    onChange={(e) => setNewItem({...newItem, startTime: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-none h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">End Time</Label>
                  <Input 
                    type="time"
                    value={newItem.endTime} 
                    onChange={(e) => setNewItem({...newItem, endTime: e.target.value})}
                    className="bg-white/5 border-white/10 rounded-none h-12"
                  />
                </div>
              </div>

              {activeTab === 'class' ? (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Day of Week</Label>
                  <select 
                    value={newItem.dayOfWeek}
                    onChange={(e) => setNewItem({...newItem, dayOfWeek: e.target.value})}
                    className="w-full bg-[#111a24] border border-white/10 h-12 px-3 text-sm rounded-none outline-none focus:ring-1 focus:ring-primary"
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
                    className="bg-white/5 border-white/10 rounded-none h-12"
                  />
                </div>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-3">
              <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="uppercase font-black text-xs tracking-widest w-full sm:w-auto">Cancel</Button>
              <Button onClick={saveScheduleItem} className="bg-primary text-black rounded-none font-black text-xs tracking-widest px-8 w-full sm:w-auto h-12">SAVE ENTRY</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
