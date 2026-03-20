"use client"

import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Zap, Sparkles, Trophy, Target } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const subjects = [
  { name: 'Microbiology', id: 'micro', image: 'https://picsum.photos/seed/micro/800/450', mastery: 85, rank: 'Immortal' },
  { name: 'Hematology', id: 'hemato', image: 'https://picsum.photos/seed/hemato/800/450', mastery: 62, rank: 'Diamond' },
  { name: 'ClinChem', id: 'chem', image: 'https://picsum.photos/seed/chem/800/450', mastery: 45, rank: 'Platinum' },
  { name: 'ImmunoSero', id: 'immuno', image: 'https://picsum.photos/seed/immuno/800/450', mastery: 78, rank: 'Ascendant' },
];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#050a0f] overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        {/* Hero Section - Tactical Splash Art */}
        <section className="relative h-[65vh] min-h-[550px] w-full flex items-end">
          <div className="absolute inset-0 z-0">
            <Image 
              src="https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&q=80&w=1920&h=1080"
              alt="Hero"
              fill
              className="object-cover opacity-30 grayscale hover:grayscale-0 transition-all duration-1000"
              data-ai-hint="scientific laboratory"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050a0f] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050a0f] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 p-8 lg:p-16 w-full max-w-5xl space-y-8">
            <div className="flex items-center gap-2">
              <Target className="text-primary animate-pulse" size={24} />
              <span className="text-primary font-black tracking-[0.4em] uppercase text-xs">Mission Briefing</span>
            </div>
            <h2 className="text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none">
              Green <br /> <span className="text-primary">Protocol</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl font-medium uppercase tracking-wide leading-relaxed">
              Tactical analysis complete. Calibrate your knowledge in <span className="text-white">Clinical Chemistry</span> to reach the next tier.
            </p>
            <div className="flex gap-4 pt-4">
              <Button asChild className="riot-button h-16 px-12 bg-primary hover:bg-primary/80 text-black rounded-none">
                <Link href="/quiz">INITIATE TRAINING</Link>
              </Button>
              <Button asChild variant="outline" className="riot-button h-16 px-12 border-white/10 hover:bg-white/5 rounded-none uppercase">
                <Link href="/library">ARCHIVES</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="p-8 lg:p-16 space-y-20">
          
          {/* Agent Selection Style (Subjects) */}
          <section>
            <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
              <h3 className="text-3xl font-black italic tracking-tighter uppercase">Deployment Zones</h3>
              <Link href="/library" className="text-[10px] font-black text-primary hover:underline uppercase tracking-[0.3em]">View Full Map</Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
              {subjects.map((subject) => (
                <Link key={subject.id} href={`/quiz/${subject.id}`} className="group">
                  <div className="riot-card aspect-[16/10] relative group-hover:scale-[1.03] transition-all duration-500 ring-0 hover:ring-1 ring-primary/50">
                    <Image 
                      src={subject.image} 
                      alt={subject.name} 
                      fill 
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      data-ai-hint="medical biology"
                    />
                    <div className="absolute inset-0 bg-black/60 group-hover:bg-primary/10 transition-colors" />
                    <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{subject.rank}</p>
                        <h4 className="text-2xl font-black italic uppercase">{subject.name}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black italic text-white/40 group-hover:text-white transition-colors">{subject.mastery}%</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Tactical Stats Bar */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-white/10 divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="bg-white/[0.02] p-10 flex flex-col items-center text-center space-y-3 hover:bg-white/[0.04] transition-colors">
              <Trophy className="text-primary/70" size={32} />
              <p className="text-5xl font-black italic uppercase tracking-tighter">1,248</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Combat Rating</p>
            </div>
            <div className="bg-white/[0.02] p-10 flex flex-col items-center text-center space-y-3 hover:bg-white/[0.04] transition-colors">
              <Zap className="text-primary/70" size={32} />
              <p className="text-5xl font-black italic uppercase tracking-tighter">5 DAYS</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Streak</p>
            </div>
            <div className="bg-primary p-10 flex flex-col items-center text-center space-y-3">
              <Sparkles className="text-black" size={32} />
              <p className="text-5xl font-black italic uppercase tracking-tighter text-black">CALIBRATED</p>
              <p className="text-[10px] font-black text-black/60 uppercase tracking-widest">AI Strategist</p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
