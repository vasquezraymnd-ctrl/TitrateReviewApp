"use client"

import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const subjects = [
  { name: 'Microbiology', color: 'bg-emerald-500', id: 'micro', image: 'https://picsum.photos/seed/micro/600/600', mastery: 85 },
  { name: 'Hematology', color: 'bg-red-500', id: 'hemato', image: 'https://picsum.photos/seed/hemato/600/600', mastery: 62 },
  { name: 'ClinChem', color: 'bg-blue-500', id: 'chem', image: 'https://picsum.photos/seed/chem/600/600', mastery: 45 },
  { name: 'ImmunoSero', color: 'bg-purple-500', id: 'immuno', image: 'https://picsum.photos/seed/immuno/600/600', mastery: 78 },
];

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto no-scrollbar pt-4 lg:pt-0">
        <DashboardHeader />
        
        <div className="ig-feed-container py-20 px-4 space-y-8">
          
          {/* Stories Row */}
          <section className="flex gap-4 overflow-x-auto no-scrollbar pb-2 mb-4">
            <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted flex items-center justify-center p-0.5 relative">
                 <Avatar className="w-full h-full">
                  <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" />
                  <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-0.5 border-2 border-background">
                  <PlayCircle size={14} fill="currentColor" />
                </div>
              </div>
              <span className="text-[10px] text-white/70">Your Session</span>
            </div>
            
            {subjects.map((subject) => (
              <Link key={subject.id} href={`/quiz/${subject.id}`} className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-16 h-16 rounded-full ig-story-ring p-0.5">
                  <div className="w-full h-full rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                    <div className={cn("w-full h-full flex items-center justify-center text-white font-bold text-xs uppercase", subject.color)}>
                      {subject.name.substring(0, 2)}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-white/70 truncate w-16 text-center">{subject.name}</span>
              </Link>
            ))}
          </section>

          {/* Feed Posts */}
          <div className="space-y-6">
            {subjects.map((subject, idx) => (
              <article key={subject.id} className="bg-background border-b border-muted/50 pb-4">
                {/* Post Header */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full ig-story-ring p-0.5">
                      <div className="w-full h-full rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
                        {subject.name[0]}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-1">
                        {subject.name}
                        <span className="text-primary text-[10px]">• Follow</span>
                      </h4>
                      <p className="text-[10px] text-muted-foreground">Recommended Study Block</p>
                    </div>
                  </div>
                  <MoreHorizontal size={18} className="text-muted-foreground cursor-pointer" />
                </div>

                {/* Post Image/Content */}
                <div className="relative aspect-square w-full rounded-sm overflow-hidden bg-muted">
                  <Image 
                    src={subject.image}
                    alt={subject.name}
                    fill
                    className="object-cover"
                    data-ai-hint="medical laboratory"
                  />
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-bold text-white tracking-widest uppercase">{subject.mastery}% Mastery</span>
                  </div>
                </div>

                {/* Post Actions */}
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <Heart size={24} className="cursor-pointer hover:text-red-500 transition-colors" />
                      <MessageCircle size={24} className="cursor-pointer hover:text-white/70 transition-colors" />
                      <Send size={24} className="cursor-pointer hover:text-white/70 transition-colors" />
                    </div>
                    <Bookmark size={24} className="cursor-pointer hover:text-white/70 transition-colors" />
                  </div>

                  {/* Post Caption */}
                  <div className="space-y-1">
                    <p className="text-sm font-bold">{idx + 124} people practiced this today</p>
                    <p className="text-sm">
                      <span className="font-bold mr-2">titrate_bot</span>
                      Based on your last session, you have 15 weak spots in <span className="text-primary">#GramPositive</span> bacteria. Tap to review now.
                    </p>
                    <p className="text-xs text-muted-foreground uppercase mt-2 tracking-tighter">View all 12 rationales</p>
                    <p className="text-[10px] text-muted-foreground uppercase mt-1">2 hours ago</p>
                  </div>
                </div>
                
                <div className="px-3">
                   <Button asChild variant="outline" className="w-full rounded-lg border-muted/50 font-bold h-10">
                    <Link href={`/quiz/${subject.id}`}>Review Subject</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

import { cn } from '@/lib/utils';
