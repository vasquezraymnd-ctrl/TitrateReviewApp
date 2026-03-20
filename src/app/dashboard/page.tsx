"use client"

import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Play, Clock, Sparkles, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const subjects = [
  { name: 'Microbiology', color: 'bg-emerald-500', id: 'micro', image: 'https://picsum.photos/seed/micro/400/400', mastery: 85 },
  { name: 'Hematology', color: 'bg-red-500', id: 'hemato', image: 'https://picsum.photos/seed/hemato/400/400', mastery: 62 },
  { name: 'ClinChem', color: 'bg-blue-500', id: 'chem', image: 'https://picsum.photos/seed/chem/400/400', mastery: 45 },
  { name: 'ImmunoSero', color: 'bg-purple-500', id: 'immuno', image: 'https://picsum.photos/seed/immuno/400/400', mastery: 78 },
  { name: 'Histopath', color: 'bg-amber-500', id: 'histo', image: 'https://picsum.photos/seed/histo/400/400', mastery: 30 },
  { name: 'MTLaws', color: 'bg-slate-500', id: 'law', image: 'https://picsum.photos/seed/law/400/400', mastery: 92 },
];

export default function Dashboard() {
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else if (hour >= 17) setGreeting('Good evening');
  }, []);

  return (
    <div className="flex h-screen bg-black overflow-hidden font-body">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto no-scrollbar spotify-gradient relative">
        <DashboardHeader />
        
        <div className="pt-20 pb-24 px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          
          {/* Top Grid (Quick Picks) */}
          <section>
            <h2 className="text-3xl font-black mb-6 tracking-tight">{greeting}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.slice(0, 6).map((subject) => (
                <Link 
                  key={subject.id} 
                  href={`/quiz/${subject.id}`}
                  className="group flex items-center bg-white/5 hover:bg-white/10 transition-colors rounded-md overflow-hidden relative"
                >
                  <div className="w-20 h-20 shrink-0 relative">
                    <Image 
                      src={subject.image} 
                      alt={subject.name} 
                      fill 
                      className="object-cover"
                      data-ai-hint="medical laboratory"
                    />
                  </div>
                  <span className="px-4 font-bold text-base truncate">{subject.name}</span>
                  <div className="ml-auto mr-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center play-shadow">
                      <Play className="fill-black text-black ml-1" size={20} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Recently Studied Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold hover:underline cursor-pointer">Jump back in</h3>
              <Link href="/library" className="text-xs font-bold text-muted-foreground hover:underline uppercase tracking-widest">Show all</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {subjects.map((subject) => (
                <div key={subject.id} className="bg-[#181818] p-4 rounded-lg card-hover-effect group">
                  <div className="relative aspect-square mb-4 rounded-md overflow-hidden shadow-2xl">
                    <Image 
                      src={subject.image} 
                      alt={subject.name} 
                      fill 
                      className="object-cover"
                      data-ai-hint="laboratory equipment"
                    />
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center play-shadow shadow-lg">
                        <Play className="fill-black text-black ml-1" size={24} />
                      </div>
                    </div>
                  </div>
                  <h4 className="font-bold text-base mb-1 truncate">{subject.name}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {subject.mastery}% Mastery • Last practiced {Math.floor(Math.random() * 5) + 1} days ago
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* AI Suggestions Row */}
          <section className="bg-gradient-to-r from-primary/10 to-transparent p-8 rounded-xl border border-white/5">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 shrink-0 bg-primary/20 rounded-lg flex items-center justify-center">
                <Sparkles size={64} className="text-primary animate-pulse" />
              </div>
              <div className="space-y-3 text-center md:text-left">
                <h3 className="text-3xl font-black">Ready for Titration?</h3>
                <p className="text-muted-foreground max-w-xl">
                  Our AI algorithm detected a drop in your <span className="text-primary font-bold">Microbiology</span> retention. 
                  Start a high-yield 30-minute block tailored to your weak spots.
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-black font-bold px-8 h-12">
                    <Link href="/quiz">START AI SESSION</Link>
                  </Button>
                  <Button asChild variant="ghost" className="rounded-full font-bold hover:bg-white/10 px-8 h-12">
                    <Link href="/scheduler">OPEN SCHEDULER</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Stats Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
             <div className="bg-[#181818] p-6 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Weekly Streak</p>
                  <p className="text-3xl font-black">5 DAYS</p>
                </div>
                <Clock className="text-primary" size={32} />
             </div>
             <div className="bg-[#181818] p-6 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Questions Mastered</p>
                  <p className="text-3xl font-black">1,248</p>
                </div>
                <PlusCircle className="text-primary" size={32} />
             </div>
          </section>

        </div>
      </main>
    </div>
  );
}