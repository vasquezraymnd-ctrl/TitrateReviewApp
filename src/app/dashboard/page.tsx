"use client"

import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Microscope, AlertCircle, Calendar, Clock, BookOpen, Activity, Target } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { db, Schedule, LabModule, UserProfile, CORE_SUBJECTS } from '@/lib/db';
import { format, isAfter, parseISO, startOfDay } from 'date-fns';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [upcomingProtocols, setUpcomingProtocols] = useState<Schedule[]>([]);
  const [subjectMastery, setSubjectMastery] = useState<Record<string, number>>({});
  const [latestModules, setLatestModules] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setMounted(true);
    loadDashboardData();
    
    // Listen for updates
    window.addEventListener('profile-updated', loadDashboardData);
    window.addEventListener('mastery-updated', loadDashboardData);
    return () => {
      window.removeEventListener('profile-updated', loadDashboardData);
      window.removeEventListener('mastery-updated', loadDashboardData);
    };
  }, []);

  const loadDashboardData = async () => {
    // Load Profile
    const userProfile = await db.getById<UserProfile>('profile', 'current-user');
    if (userProfile) {
      setProfile(userProfile);
    }

    // Load Upcoming Protocols
    const schedules = await db.getAll<Schedule>('schedules');
    const now = new Date();
    const today = startOfDay(now);
    
    const sorted = schedules
      .filter(s => {
        if (s.date) return isAfter(parseISO(s.date), today);
        return true;
      })
      .sort((a, b) => {
        if (a.date && b.date) return parseISO(a.date).getTime() - parseISO(b.date).getTime();
        if (a.date) return -1;
        if (b.date) return 1;
        return 0;
      })
      .slice(0, 3);

    setUpcomingProtocols(sorted);

    // Calculate mastery as average of "pages read" across all modules in sector
    const modules = await db.getAll<LabModule>('modules');
    const masteryMap: Record<string, number> = {};
    const latestMap: Record<string, string> = {};
    
    CORE_SUBJECTS.forEach(subject => {
      const subjectModules = modules.filter(m => m.subject === subject);
      
      if (subjectModules.length > 0) {
        // Average the mastery (representing total sector pages read completion)
        const total = subjectModules.reduce((acc, m) => acc + (m.mastery || 0), 0);
        masteryMap[subject] = Math.round(total / subjectModules.length);
        
        // Find latest based on ID
        const sortedModules = [...subjectModules].sort((a, b) => b.id.localeCompare(a.id));
        latestMap[subject] = sortedModules[0].name;
      } else {
        masteryMap[subject] = 0;
      }
    });
    
    setSubjectMastery(masteryMap);
    setLatestModules(latestMap);
  };

  const getSubjectImage = (subject: string) => {
    switch (subject) {
      case 'Microbiology': return 'micro-bacteria';
      case 'Hematology': return 'blood-cells';
      case 'Clinical Chemistry': return 'chemistry-lab';
      case 'Immuno-Serology': return 'immunology-test';
      case 'Clinical Microscopy': return 'clin-microscopy';
      case 'HTMLE': return 'histopath';
      default: return 'med-lab';
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#050a0f] overflow-hidden text-white">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        <section className="relative h-[85vh] min-h-[700px] w-full flex items-center px-8 lg:px-16">
          <div className="absolute inset-0 z-0">
            <Image 
              src="https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=1920&h=1080"
              alt="Clinical Lab"
              fill
              className="object-cover opacity-20 grayscale hover:grayscale-0 transition-all duration-1000"
              data-ai-hint="medical laboratory"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050a0f] via-[#050a0f]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050a0f] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-in fade-in slide-in-from-left-12 duration-1000">
              <div className="flex items-center gap-2">
                <Microscope className="text-primary animate-pulse" size={20} />
                <span className="text-primary font-black tracking-[0.4em] uppercase text-xs">Good Day</span>
              </div>
              
              <h2 className="text-7xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
                Welcome <br /> <span className="text-primary">{profile?.name || 'Future RMT'}</span>
              </h2>

              <div className="flex gap-4 pt-4">
                <Button asChild className="riot-button h-16 px-12 bg-primary hover:bg-primary/80 text-black rounded-none font-black tracking-widest">
                  <Link href="/quiz">START ASSAY</Link>
                </Button>
                <Button asChild variant="outline" className="riot-button h-16 px-12 border-white/10 hover:bg-white/5 rounded-none uppercase font-black tracking-widest">
                  <Link href="/library">PROTOCOL ARCHIVES</Link>
                </Button>
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-right-12 duration-1000 delay-300">
              <div className="riot-card p-8 bg-white/[0.02] border border-white/10 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-100 transition-opacity">
                  <Target size={120} className="text-primary" />
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-sm font-black italic uppercase tracking-[0.3em] flex items-center gap-2">
                      <Clock className="text-primary" size={16} />
                      Clinical Schedule
                    </h3>
                    <Link href="/scheduler" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">Manage Protocols</Link>
                  </div>

                  <div className="space-y-4">
                    {upcomingProtocols.length > 0 ? (
                      upcomingProtocols.map((protocol) => (
                        <div key={protocol.id} className="flex items-center gap-4 group/item">
                          <div className="w-1 bg-primary/20 group-hover/item:bg-primary transition-colors h-12" />
                          <div className="flex-1">
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                              {protocol.type === 'exam' ? 'Exam Milestone' : protocol.type === 'class' ? 'Class Rotation' : 'Study Block'}
                            </p>
                            <h4 className="text-md font-black italic uppercase tracking-tight text-white/90 group-hover/item:text-white transition-colors">
                              {protocol.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar size={10} className="text-primary/60" />
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                                {protocol.date ? format(parseISO(protocol.date), 'MMM dd') : protocol.dayOfWeek} • {protocol.startTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center space-y-3 opacity-40">
                        <AlertCircle className="mx-auto" size={24} />
                        <p className="text-[10px] font-black uppercase tracking-widest">No Active Protocols</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="p-8 lg:p-16 space-y-24">
          
          <section>
            <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-6">
              <div>
                <h3 className="text-3xl font-black italic tracking-tighter uppercase">Clinical Sectors</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Select a laboratory specialization to view sub-modules</p>
              </div>
              <Link href="/library" className="text-[10px] font-black text-primary hover:underline uppercase tracking-[0.3em]">All Archives</Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {CORE_SUBJECTS.map((subject) => {
                const imageKey = getSubjectImage(subject);
                const placeholder = PlaceHolderImages.find(img => img.id === imageKey);
                const mastery = subjectMastery[subject] || 0;
                const latestModule = latestModules[subject];
                
                return (
                  <Link key={subject} href={`/library?subject=${encodeURIComponent(subject)}`} className="group">
                    <div className="riot-card aspect-[16/10] relative group-hover:scale-[1.03] transition-all duration-500 ring-0 hover:ring-1 ring-primary/50 bg-black">
                      {placeholder && (
                        <Image 
                          src={placeholder.imageUrl} 
                          alt={subject} 
                          fill 
                          className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 opacity-80 group-hover:opacity-100"
                          data-ai-hint={placeholder.imageHint}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors" />
                      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{subject}</p>
                          <h4 className="text-2xl font-black italic uppercase text-white drop-shadow-lg leading-tight">
                            {latestModule ? `${latestModule}` : subject}
                          </h4>
                          {latestModule && (
                             <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Latest Titration</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black italic text-white/40 group-hover:text-white transition-colors">{mastery}%</p>
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Mastery</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="bg-white/[0.02] p-12 flex flex-col items-center text-center space-y-4 hover:bg-white/[0.04] transition-colors group">
              <Activity className="text-primary/70 group-hover:text-primary transition-colors" size={36} />
              <p className="text-6xl font-black italic uppercase tracking-tighter">{profile?.totalQuestionsAnswered || 0}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Questions Cleared</p>
            </div>
            <div className="bg-white/[0.02] p-12 flex flex-col items-center text-center space-y-4 hover:bg-white/[0.04] transition-colors group">
              <Clock className="text-primary/70 group-hover:text-primary transition-colors" size={36} />
              <p className="text-6xl font-black italic uppercase tracking-tighter">{profile?.currentStreak || 0} DAYS</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Streak</p>
            </div>
            <div className="bg-primary p-12 flex flex-col items-center text-center space-y-4 shadow-[0_0_50px_rgba(0,255,127,0.2)]">
              <BookOpen className="text-black" size={36} />
              <p className="text-6xl font-black italic uppercase tracking-tighter text-black">ACTIVE</p>
              <p className="text-[10px] font-black text-black/60 uppercase tracking-widest">Protocol Status</p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}