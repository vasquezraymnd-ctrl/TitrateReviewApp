"use client"

import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Play, Zap, Sparkles, ChevronRight, Trophy } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
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
    <div className="flex h-screen bg-[#0F1923] overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        {/* Hero Section - Splash Art Style */}
        <section className="relative h-[60vh] min-h-[500px] w-full flex items-end">
          <div className="absolute inset-0 z-0">
            <Image 
              src="https://images.unsplash.com/photo-1579154273821-3a914c818318?auto=format&fit=crop&q=80&w=1920&h=1080"
              alt="Hero"
              fill
              className="object-cover opacity-40 grayscale hover:grayscale-0 transition-all duration-700"
              data-ai-hint="medical laboratory"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F1923] via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F1923] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 p-8 lg:p-16 w-full max-w-4xl space-y-6">
            <div className="flex items-center gap-2">
              <Zap className="text-primary animate-pulse" size={24} />
              <span className="text-primary font-black tracking-[0.3em] uppercase text-sm">Active Mission</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none">
              Titration <br /> <span className="text-primary">Protocol</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl font-medium uppercase tracking-wide">
              Level up your board rating. 300+ Microbiology questions are ready for review.
            </p>
            <div className="flex gap-4 pt-4">
              <Button asChild className="riot-button h-16 px-12 bg-primary hover:bg-primary/90 text-white rounded-none">
                <Link href="/quiz">ENTER TRAINING</Link>
              </Button>
              <Button asChild variant="outline" className="riot-button h-16 px-12 border-white/20 hover:bg-white/5 rounded-none uppercase">
                <Link href="/library">COLLECTION</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="p-8 lg:p-16 space-y-16">
          
          {/* Agent Selection Style (Subjects) */}
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
              <h3 className="text-2xl font-black italic tracking-tighter uppercase">Subject Selection</h3>
              <Link href="/library" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">View All Agents</Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {subjects.map((subject) => (
                <Link key={subject.id} href={`/quiz/${subject.id}`} className="group">
                  <div className="riot-card aspect-[16/9] relative group-hover:scale-[1.02] transition-transform">
                    <Image 
                      src={subject.image} 
                      alt={subject.name} 
                      fill 
                      className="object-cover grayscale group-hover:grayscale-0 transition-all"
                      data-ai-hint="microbiology research"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-primary/20 transition-colors" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{subject.rank}</p>
                        <h4 className="text-xl font-black italic uppercase">{subject.name}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black italic text-white/50">{subject.mastery}%</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Stats Bar */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 border border-white/10 p-8 flex flex-col items-center text-center space-y-2">
              <Trophy className="text-primary mb-2" size={32} />
              <p className="text-4xl font-black italic uppercase tracking-tighter">1,248</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Experience Points</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-8 flex flex-col items-center text-center space-y-2">
              <Zap className="text-primary mb-2" size={32} />
              <p className="text-4xl font-black italic uppercase tracking-tighter">5 DAYS</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Active Streak</p>
            </div>
            <div className="bg-primary p-8 flex flex-col items-center text-center space-y-2">
              <Sparkles className="text-white mb-2" size={32} />
              <p className="text-4xl font-black italic uppercase tracking-tighter text-white">READY</p>
              <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">AI Protocol</p>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
