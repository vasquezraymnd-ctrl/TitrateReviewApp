
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

    // Calculate mastery and latest modules
    const modules = await db.getAll<LabModule>('modules');
    const masteryMap: Record<string, number> = {};
    const latestMap: Record<string, string> = {};
    
    CORE_SUBJECTS.forEach(subject => {
      const subjectModules = modules.filter(m => m.subject === subject);
      
      if (subjectModules.length > 0) {
        const total = subjectModules.reduce((acc, m) => acc + (m.mastery || 0), 0);
        masteryMap[subject] = Math.round(total / subjectModules.length);
        
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
    <div className="flex h-screen bg-[#0d141d] overflow-hidden text-white flex-col lg:flex-row">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto no-scrollbar relative pb-20 lg:pb-0">
        <DashboardHeader />
        
        <section className="relative min-h-[450px] lg:h-[75vh] w-full flex items-center px-6 md:px-8 lg:px-16 pt-24 lg:pt-0">
          <div className="absolute inset-0 z-0">
            <Image 
              src="https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=1920&h=1080"
              alt="Clinical Lab"
              fill
              className="object-cover opacity-10 grayscale"
              data-ai-hint="medical laboratory"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d141d] via-[#0d141d]/80 to-transparent" />
          </div>

          <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-4 lg:space-y-8 animate-in fade-in slide-in-from-left-12 duration-1000">
              <div className="flex items-center gap-2">
                <Microscope className="text-primary animate-pulse" size={14} />
                <span className="text-primary font-black tracking-[0.4em] uppercase text-[10px]">Status: Active</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter leading-none">
                Welcome <br /> <span className="text-primary">{profile?.name || 'Future RMT'}</span>
              </h2>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button asChild className="riot-button h-12 lg:h-16 px-6 lg:px-12 bg-primary hover:bg-primary/80 text-black rounded-none font-black tracking-widest text-[10px] lg:text-[11px]">
                  <Link href="/quiz">START ASSAY</Link>
                </Button>
                <Button asChild variant="outline" className="riot-button h-12 lg:h-16 px-6 lg:px-12 border-white/10 hover:bg-white/5 rounded-none uppercase font-black tracking-widest text-[10px] lg:text-[11px]">
                  <Link href="/library">PROTOCOL ARCHIVES</Link>
                </Button>
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-right-12 duration-1000 delay-300">
              <div className="riot-card p-6 lg:p-10 bg-white/[0.02] border border-white/10 backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-100 transition-opacity hidden lg:block">
                  <Target size={120} className="text-primary" />
                </div>
                
                <div className="relative z-10 space-y-6 lg:space-y-8">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-xs lg:text-sm font-black italic uppercase tracking-[0.3em] flex items-center gap-2 text-primary">
                      <Clock size={16} />
                      Clinical Schedule
                    </h3>
                    <Link href="/scheduler" className="text-[10px] font-black text-primary/60 hover:text-primary uppercase tracking-widest">Manage Protocols</Link>
                  </div>

                  <div className="space-y-5 lg:space-y-6">
                    {upcomingProtocols.length > 0 ? (
                      upcomingProtocols.map((protocol) => (
                        <div key={protocol.id} className="flex items-center gap-4 lg:gap-6 group/item">
                          <div className="w-1.5 bg-primary/20 group-hover/item:bg-primary transition-colors h-12 lg:h-16" />
                          <div className="flex-1">
                            <p className="text-[10px] md:text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
                              {protocol.type === 'exam' ? 'Exam Milestone' : protocol.type === 'class' ? 'Class Rotation' : 'Study Block'}
                            </p>
                            <h4 className="text-base md:text-xl lg:text-2xl font-black italic uppercase tracking-tight text-white/90 truncate max-w-[200px] sm:max-w-none">
                              {protocol.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Calendar size={12} className="text-primary/60" />
                              <span className="text-[12px] md:text-base font-bold text-muted-foreground uppercase tracking-tighter">
                                {protocol.date ? format(parseISO(protocol.date), 'MMM dd') : protocol.dayOfWeek} • {protocol.startTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center space-y-4 opacity-40">
                        <AlertCircle className="mx-auto" size={24} />
                        <p className="text-xs font-black uppercase tracking-widest">No Active Protocols</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="p-6 md:p-8 lg:p-16 space-y-12 lg:space-y-24">
          
          <section>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 lg:mb-12 border-b border-white/5 pb-6 gap-4">
              <div>
                <h3 className="text-2xl lg:text-4xl font-black italic tracking-tighter uppercase">Clinical Sectors</h3>
                <p className="text-[10px] lg:text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Select laboratory specialization</p>
              </div>
              <Link href="/library" className="text-[10px] lg:text-[11px] font-black text-primary hover:underline uppercase tracking-[0.3em]">All Archives</Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {CORE_SUBJECTS.map((subject) => {
                const imageKey = getSubjectImage(subject);
                const placeholder = PlaceHolderImages.find(img => img.id === imageKey);
                const mastery = subjectMastery[subject] || 0;
                const latestModule = latestModules[subject];
                
                return (
                  <Link key={subject} href={`/library?subject=${encodeURIComponent(subject)}`} className="group">
                    <div className="riot-card aspect-[16/9] relative group-hover:scale-[1.02] transition-all duration-500 ring-0 hover:ring-1 ring-primary/50 bg-black overflow-hidden">
                      {placeholder && (
                        <Image 
                          src={placeholder.imageUrl} 
                          alt={subject} 
                          fill 
                          className="object-cover grayscale group-hover:grayscale-0 opacity-40 group-hover:opacity-60 transition-all duration-700"
                          data-ai-hint={placeholder.imageHint}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="absolute bottom-4 lg:bottom-6 left-4 lg:left-6 right-4 lg:left-6 flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] lg:text-[11px] font-black text-primary uppercase tracking-[0.3em]">{subject}</p>
                          <h4 className="text-lg md:text-2xl xl:text-3xl font-black italic uppercase text-white leading-tight truncate max-w-[180px] lg:max-w-none">
                            {latestModule ? `${subject}: ${latestModule}` : subject}
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl lg:text-4xl font-black italic text-white/40 group-hover:text-white transition-colors">{mastery}%</p>
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Mastery</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="bg-white/[0.02] p-10 lg:p-20 flex flex-col items-center text-center space-y-4 hover:bg-white/[0.04] transition-colors group">
              <Activity className="text-primary/70 group-hover:text-primary mb-2" size={24} />
              <p className="text-4xl lg:text-8xl font-black italic uppercase tracking-tighter">{profile?.currentStreak || 0} DAYS</p>
              <p className="text-[10px] lg:text-[12px] font-black text-muted-foreground uppercase tracking-widest">Clinical Persistence Streak</p>
            </div>
            <div className="bg-primary p-10 lg:p-20 flex flex-col items-center text-center space-y-4 shadow-[0_0_50px_rgba(0,255,127,0.1)]">
              <BookOpen className="text-black mb-2" size={24} />
              <p className="text-4xl lg:text-8xl font-black italic uppercase tracking-tighter text-black">ACTIVE</p>
              <p className="text-[10px] lg:text-[12px] font-black text-black/60 uppercase tracking-widest">Laboratory Protocol Status</p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
