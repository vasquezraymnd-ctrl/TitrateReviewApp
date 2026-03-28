"use client"

import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Microscope, AlertCircle, Calendar, Clock, BookOpen, Activity, Shield, Info } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';
import { db, Schedule, LabModule, UserProfile, CORE_SUBJECTS } from '@/lib/db';
import { format, isAfter, parseISO, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

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
    window.addEventListener('schedule-updated', loadDashboardData);
    return () => {
      window.removeEventListener('profile-updated', loadDashboardData);
      window.removeEventListener('mastery-updated', loadDashboardData);
      window.removeEventListener('schedule-updated', loadDashboardData);
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
    <div className="flex h-screen bg-[#0d141d] overflow-hidden text-white flex-col md:flex-row">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto no-scrollbar relative pb-20 md:pb-0">
        <DashboardHeader />
        
        <section className="relative min-h-[450px] md:h-[60vh] lg:h-[75vh] xl:h-[85vh] w-full flex items-center px-6 md:px-10 lg:px-16 pt-24 md:pt-0">
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

          <div className="relative z-10 w-full max-w-7xl xl:max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 xl:gap-24 items-center">
            <div className="space-y-4 md:space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-left-12 duration-1000 max-w-full overflow-hidden">
              <div className="flex items-center gap-2">
                <Microscope className="text-primary animate-pulse" size={14} />
                <span className="text-primary font-black tracking-[0.4em] uppercase text-[10px]">Status: Active</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl md:text-4xl lg:text-5xl xl:text-8xl 2xl:text-[10rem] font-black italic uppercase tracking-tighter leading-[0.9] lg:leading-none">
                Welcome <br /> <span className="text-primary">{profile?.name || 'Future RMT'}</span>
              </h2>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button asChild className="riot-button h-12 md:h-14 lg:h-16 px-6 md:px-6 lg:px-8 bg-primary hover:bg-primary/80 text-black rounded-none font-black tracking-widest text-[10px] md:text-[11px]">
                  <Link href="/quiz">START ASSAY</Link>
                </Button>
                <Button asChild variant="outline" className="riot-button h-12 md:h-14 lg:h-16 px-6 md:px-6 lg:px-8 border-white/10 hover:bg-white/5 rounded-none uppercase font-black tracking-widest text-[10px] md:text-[11px]">
                  <Link href="/library">PROTOCOL ARCHIVES</Link>
                </Button>
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-right-12 duration-1000 delay-300">
              <div className="riot-card p-6 md:p-8 lg:p-10 xl:p-14 bg-white/[0.02] border border-white/10 backdrop-blur-sm relative overflow-hidden group">
                <div className="relative z-10 space-y-6 lg:space-y-8">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h3 className="text-xs lg:text-sm font-black italic uppercase tracking-[0.3em] flex items-center gap-2 text-primary">
                      <Clock size={16} />
                      Clinical Schedule
                    </h3>
                    <Link href="/scheduler" className="text-[10px] font-black text-primary/60 hover:text-primary uppercase tracking-widest">Manage Protocols</Link>
                  </div>

                  <div className="space-y-0">
                    {upcomingProtocols.length > 0 ? (
                      upcomingProtocols.map((protocol, index) => (
                        <div 
                          key={protocol.id} 
                          className={cn(
                            "flex items-center gap-4 lg:gap-6 xl:gap-8 group/item py-6 lg:py-8 xl:py-10 border-b border-white/5 last:border-0 transition-all duration-500",
                            index === 0 && "bg-primary/[0.05] shadow-[0_0_40px_rgba(0,255,127,0.05)] px-4 -mx-4"
                          )}
                        >
                          <div className={cn(
                            "w-2 transition-colors h-14 md:h-12 lg:h-16 xl:h-28",
                            index === 0 ? "bg-primary shadow-[0_0_20px_rgba(0,255,127,0.8)]" : "bg-primary/20 group-hover/item:bg-primary"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] md:text-[12px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                {protocol.type === 'exam' ? 'Exam Milestone' : protocol.type === 'class' ? 'Class Rotation' : 'Study Block'}
                              </p>
                              {index === 0 && (
                                <span className="text-[9px] md:text-[10px] xl:text-[14px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">Imminent</span>
                              )}
                            </div>
                            <h4 className="text-2xl md:text-xl lg:text-2xl xl:text-6xl font-black italic uppercase tracking-tighter text-white truncate">
                              {protocol.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-3">
                              <Calendar size={18} className="text-primary/60" />
                              <span className="text-[16px] md:sm lg:base xl:text-3xl font-bold text-muted-foreground uppercase tracking-tight">
                                {protocol.date ? format(parseISO(protocol.date), 'MMM dd, yyyy') : protocol.dayOfWeek} • {protocol.startTime} - {protocol.endTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center space-y-4 opacity-40">
                        <AlertCircle className="mx-auto" size={32} />
                        <p className="text-sm font-black uppercase tracking-widest">No Active Protocols</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="p-6 md:p-10 lg:p-16 space-y-12 lg:space-y-24 xl:space-y-32 max-w-[1800px] mx-auto">
          
          <section>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 lg:mb-12 border-b border-white/5 pb-6 gap-4">
              <div>
                <h3 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black italic tracking-tighter uppercase">Clinical Sectors</h3>
                <p className="text-[10px] lg:text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Select laboratory specialization</p>
              </div>
              <Link href="/library" className="text-[10px] lg:text-[11px] font-black text-primary hover:underline uppercase tracking-[0.3em]">All Archives</Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 lg:gap-8">
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
                          className="object-cover opacity-90 group-hover:opacity-100 transition-all duration-700"
                          data-ai-hint={placeholder.imageHint}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                      <div className="absolute bottom-4 lg:bottom-6 left-4 lg:text-6 right-4 lg:right-6 flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] lg:text-[11px] font-black text-primary uppercase tracking-[0.3em]">{subject}</p>
                          <h4 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-black italic uppercase text-white leading-tight truncate max-w-[180px] lg:max-w-none">
                            {latestModule ? `${latestModule}` : subject}
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black italic text-white/40 group-hover:text-white transition-colors">{mastery}%</p>
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
            <div className="bg-white/[0.02] p-10 md:p-14 lg:p-20 xl:p-32 flex flex-col items-center text-center space-y-4 hover:bg-white/[0.04] transition-colors group">
              <Activity className="text-primary/70 group-hover:text-primary mb-2" size={32} />
              <p className="text-4xl md:text-6xl lg:text-8xl xl:text-[10rem] font-black italic uppercase tracking-tighter">{profile?.currentStreak || 0} DAYS</p>
              <p className="text-[10px] lg:text-[14px] font-black text-muted-foreground uppercase tracking-widest">Clinical Persistence Streak</p>
            </div>
            <div className="bg-primary p-10 md:p-14 lg:p-20 xl:p-32 flex flex-col items-center text-center space-y-4 shadow-[0_0_50px_rgba(0,255,127,0.1)]">
              <BookOpen className="text-black mb-2" size={32} />
              <p className="text-4xl md:text-6xl lg:text-8xl xl:text-[10rem] font-black italic uppercase tracking-tighter text-black">ACTIVE</p>
              <p className="text-[10px] lg:text-[14px] font-black text-black/60 uppercase tracking-widest">Laboratory Protocol Status</p>
            </div>
          </section>

          {/* Laboratory Manifest (About Section) */}
          <section className="pt-12 border-t border-white/5 max-w-4xl mx-auto text-center space-y-8 animate-in fade-in duration-1000">
            <div className="flex flex-col items-center gap-4">
              <Shield className="text-primary/40" size={40} />
              <h3 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter">Laboratory Manifest</h3>
            </div>
            
            <div className="space-y-6">
              <p className="text-sm md:text-lg text-muted-foreground italic leading-relaxed">
                "TITRATE was engineered as a high-fidelity, all-in-one clinical workstation for the next generation of Medical Technologists. In an era where MedTech is a rapidly evolving and vital profession, precision in study is as critical as precision in the laboratory."
              </p>
              
              <div className="riot-card bg-white/[0.02] border border-white/5 p-6 md:p-10 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Lead Systems Architect</p>
                  <h4 className="text-xl md:text-2xl font-black italic uppercase text-white">Raymond Vasquez</h4>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Registered Medical Technologist</p>
                </div>
                <div className="h-px w-12 bg-white/10 md:h-12 md:w-px" />
                <Button asChild variant="link" className="text-primary font-black uppercase text-[10px] tracking-widest">
                  <Link href="/instrumentation">VIEW SYSTEM SPECS <Info className="ml-2 h-3 w-3" /></Link>
                </Button>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
