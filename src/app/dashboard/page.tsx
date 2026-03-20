"use client"

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Calendar, Trophy, Zap } from 'lucide-react';
import Link from 'next/link';

const subjects = [
  { name: 'Microbiology', color: 'bg-emerald-500', count: 124 },
  { name: 'Hematology', color: 'bg-red-500', count: 86 },
  { name: 'ClinChem', color: 'bg-blue-500', count: 210 },
  { name: 'ImmunoSero', color: 'bg-purple-500', count: 45 },
  { name: 'Histopathology', color: 'bg-amber-500', count: 32 },
  { name: 'ISBB', color: 'bg-pink-500', count: 77 },
];

export default function Dashboard() {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 bg-[#121212] overflow-y-auto relative spotify-gradient">
        <DashboardHeader />
        
        <div className="px-8 py-6 max-w-7xl mx-auto">
          <section className="mb-8">
            <h2 className="text-3xl font-headline font-bold mb-6">{greeting}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.slice(0, 6).map((subject) => (
                <Link key={subject.name} href={`/quiz/${subject.name.toLowerCase()}`}>
                  <div className="group flex items-center bg-white/10 rounded-md overflow-hidden hover:bg-white/20 transition-all cursor-pointer">
                    <div className={`w-20 h-20 ${subject.color} flex items-center justify-center shadow-lg`}>
                      <Zap className="text-white fill-current" size={32} />
                    </div>
                    <div className="flex-1 px-4 flex items-center justify-between">
                      <span className="font-bold">{subject.name}</span>
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-xl">
                        <Play className="fill-black text-black ml-1" size={20} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-headline font-bold">Your Weakest Subjects Mix</h3>
              <span className="text-xs font-bold text-muted-foreground hover:underline cursor-pointer">SHOW ALL</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-[#181818] p-4 rounded-lg card-hover-effect">
                  <div className="aspect-square bg-gradient-to-br from-secondary/50 to-primary/50 rounded-md mb-4 flex items-center justify-center shadow-2xl relative group">
                    <Trophy className="text-white/20" size={64} />
                    <div className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg scale-90 group-hover:scale-100">
                      <Play className="fill-black text-black ml-1" size={20} />
                    </div>
                  </div>
                  <h4 className="font-bold text-sm mb-1 truncate">Daily Mix {i}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">Focus on Microbiology and ClinChem today.</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-headline font-bold">Recommended for Board Prep</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#181818] p-4 rounded-lg card-hover-effect">
                  <div className="aspect-square bg-muted rounded-md mb-4 flex flex-col items-center justify-center p-6 text-center">
                    <Calendar className="text-primary mb-2" size={32} />
                    <p className="text-xs font-bold uppercase text-primary">High Yield</p>
                    <p className="text-xl font-bold font-headline mt-1">Review Session {i}</p>
                  </div>
                  <h4 className="font-bold text-sm mb-1">Board Exam Countdown</h4>
                  <p className="text-xs text-muted-foreground">42 Days remaining. Titrate your efforts.</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
