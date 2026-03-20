"use client"

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Play, Info, Zap, Trophy, Flame } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const subjects = [
  { name: 'Microbiology', color: 'from-emerald-900', count: 124, id: 'micro' },
  { name: 'Hematology', color: 'from-red-900', count: 86, id: 'hemato' },
  { name: 'ClinChem', color: 'from-blue-900', count: 210, id: 'chem' },
  { name: 'ImmunoSero', color: 'from-purple-900', count: 45, id: 'immuno' },
  { name: 'Histopathology', color: 'from-amber-900', count: 32, id: 'histo' },
  { name: 'ISBB', color: 'from-pink-900', count: 77, id: 'isbb' },
];

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <DashboardHeader />
        
        {/* Cinematic Hero Section */}
        <section className="relative h-[80vh] w-full">
          <div className="absolute inset-0">
            <Image 
              src="https://images.unsplash.com/photo-1579154273821-3a914c818318?auto=format&fit=crop&q=80&w=1920&h=1080"
              alt="Hero Backdrop"
              fill
              className="object-cover opacity-60"
              priority
            />
            <div className="absolute inset-0 hero-gradient" />
          </div>

          <div className="relative h-full flex flex-col justify-end px-12 pb-24 max-w-4xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary text-white p-1 rounded-sm">
                <Flame size={16} fill="white" />
              </div>
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/90">TOP RATED FOR YOU</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black font-headline mb-4 text-shadow-md">
              MICROBIOLOGY <br />
              <span className="text-primary italic">WARFARE</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl line-clamp-3 text-shadow-md">
              Master the complexities of pathogenic organisms. This week's high-yield session focuses on Gram-positive cocci and antibiotic resistance mechanisms.
            </p>
            
            <div className="flex gap-4">
              <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 font-bold px-8 py-7 text-xl rounded-sm">
                <Link href="/quiz/microbiology">
                  <Play size={24} fill="black" className="mr-2" /> Play
                </Link>
              </Button>
              <Button size="lg" variant="secondary" className="bg-white/20 text-white hover:bg-white/30 font-bold px-8 py-7 text-xl rounded-sm backdrop-blur-md border-none">
                <Info size={24} className="mr-2" /> More Info
              </Button>
            </div>
          </div>
        </section>

        {/* Rows - Horizontal Scrolling */}
        <div className="px-12 -mt-20 relative z-20 pb-20 space-y-12">
          
          <Row title="Trending Today: Weakest Subjects" items={subjects} />
          
          <Row title="Continue Reviewing" items={subjects.slice().reverse()} />

          <section>
            <h2 className="text-2xl font-bold mb-4 px-1 text-white/90">Curated Board Prep Collections</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="group relative aspect-video rounded-md overflow-hidden bg-muted transition-transform hover:scale-[1.02] cursor-pointer">
                   <Image 
                    src={`https://picsum.photos/seed/med${i}/800/450`}
                    alt="Collection"
                    fill
                    className="object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                    data-ai-hint="medical research"
                  />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-primary font-bold text-xs uppercase tracking-widest mb-1">Volume {i}</p>
                    <h3 className="text-2xl font-black italic">CLINICAL MASTERY</h3>
                    <p className="text-sm text-white/60">High-yield case studies for Board Exams</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Row({ title, items }: { title: string, items: any[] }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4 px-1 text-white/90">{title}</h2>
      <div className="flex gap-2 overflow-x-auto row-container pb-4">
        {items.map((subject, idx) => (
          <Link key={subject.id} href={`/quiz/${subject.name.toLowerCase()}`} className="shrink-0 w-[280px] md:w-[320px]">
            <div className="netflix-card aspect-video bg-[#181818]">
              <div className={`absolute inset-0 bg-gradient-to-br ${subject.color} to-black/80 flex flex-col justify-center items-center p-6 text-center`}>
                <Zap size={48} className="text-white mb-2 opacity-50" />
                <h3 className="text-xl font-bold">{subject.name}</h3>
                <p className="text-xs text-white/60 mt-2">{subject.count} Questions</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}