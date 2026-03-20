"use client"

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { db, Question, Progress, UserProfile } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Archive, Search, Filter, Play, User, Target, Zap, Microscope } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ProtocolArchives() {
  const [subjects, setSubjects] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    setLoading(true);
    const questions = await db.getAll<Question>('questions');
    const counts = new Map<string, number>();
    questions.forEach(q => {
      counts.set(q.subject, (counts.get(q.subject) || 0) + 1);
    });
    setSubjects(counts);

    const userProfile = await db.getById<UserProfile>('profile', 'current-user');
    if (userProfile) {
      setProfile(userProfile);
    } else {
      const defaultProfile: UserProfile = {
        id: 'current-user',
        name: 'Analyst Doe',
        proficiencyRank: 'Laboratory Grade 42',
        examDate: '2025-08-20',
        totalQuestionsAnswered: 1248,
      };
      await db.put('profile', defaultProfile);
      setProfile(defaultProfile);
    }
    
    setLoading(false);
  };

  const filteredSubjects = Array.from(subjects.entries()).filter(([name]) => 
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#050a0f] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        <div className="px-8 lg:px-16 py-32 max-w-7xl mx-auto space-y-16">
          
          {/* Student Profile Overview */}
          <section className="riot-card p-10 bg-white/[0.02] border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Shield className="text-primary" size={200} />
             </div>
             
             <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
               <div className="flex items-center gap-6 md:col-span-2">
                 <div className="w-24 h-24 border-2 border-primary/50 p-1 rounded-none">
                   <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                     <User size={48} className="text-primary" />
                   </div>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Subject Analyst</p>
                   <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-1">{profile?.name}</h2>
                   <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{profile?.proficiencyRank}</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-black/40 p-4 border border-white/5">
                   <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Assays</p>
                   <p className="text-2xl font-black italic text-primary">{profile?.totalQuestionsAnswered}</p>
                 </div>
                 <div className="bg-black/40 p-4 border border-white/5">
                   <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Board Target</p>
                   <p className="text-2xl font-black italic text-white">AUG 25</p>
                 </div>
               </div>
             </div>
          </section>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h3 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                <Archive className="text-primary" size={28} />
                Protocol Inventory
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Calibrated subjects available for immediate review.</p>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input 
                  placeholder="FILTER SUBJECTS..." 
                  className="w-full bg-white/5 border border-white/10 h-12 pl-10 pr-4 text-[10px] font-black tracking-widest uppercase focus:bg-white/10 focus:ring-1 focus:ring-primary outline-none transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-[16/10] bg-white/[0.02] animate-pulse riot-card" />
              ))}
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-24 riot-card border border-dashed border-white/10 bg-white/[0.02]">
              <Archive size={64} className="mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-black italic uppercase">No protocols found</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">Data titration required to populate archives.</p>
              <Button asChild className="riot-button h-12 px-8 bg-primary hover:bg-primary/80 text-black">
                <Link href="/import">INITIATE TITRATION</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
              {filteredSubjects.map(([name, count], idx) => (
                <Link key={name} href={`/quiz/${name.toLowerCase()}`} className="group">
                  <div className="riot-card aspect-[16/10] relative group-hover:scale-[1.03] transition-all duration-500 ring-0 hover:ring-1 ring-primary/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Mastery Verified</p>
                          <h4 className="text-2xl font-black italic uppercase">{name}</h4>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{count} Questions</p>
                        </div>
                        <div className="w-10 h-10 bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                          <Play className="fill-black text-black ml-1" size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Shield(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  )
}
