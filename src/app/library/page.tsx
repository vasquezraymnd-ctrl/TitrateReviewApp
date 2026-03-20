"use client"

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { db, Question } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Library, Search, Filter, Play } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function LibraryPage() {
  const [subjects, setSubjects] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    setLoading(false);
  };

  const filteredSubjects = Array.from(subjects.entries()).filter(([name]) => 
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <Sidebar />
      <main className="flex-1 bg-[#121212] overflow-y-auto">
        <DashboardHeader />
        
        <div className="px-8 py-12 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-5xl font-headline font-bold mb-2">Your Library</h2>
              <p className="text-muted-foreground">Manage your decks and track your subject mastery.</p>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  placeholder="Search subjects..." 
                  className="pl-10 h-12 bg-muted/30 border-muted rounded-full focus-visible:ring-primary"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-muted">
                <Filter size={18} />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="aspect-[4/5] bg-muted/20 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-20 bg-muted/10 rounded-3xl border border-dashed border-muted">
              <Library size={64} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold">Your library is empty</h3>
              <p className="text-muted-foreground mb-6">Import your Anki exports to start building your knowledge base.</p>
              <Button asChild className="rounded-full">
                <Link href="/import">IMPORT NOW</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredSubjects.map(([name, count], idx) => (
                <Link key={name} href={`/quiz/${name.toLowerCase()}`}>
                  <div className="bg-[#181818] rounded-2xl p-5 card-hover-effect group h-full flex flex-col">
                    <div className={cn(
                      "aspect-square rounded-xl mb-5 flex items-center justify-center shadow-2xl relative",
                      idx % 5 === 0 ? "bg-emerald-500" : idx % 5 === 1 ? "bg-blue-500" : idx % 5 === 2 ? "bg-purple-500" : idx % 5 === 3 ? "bg-amber-500" : "bg-red-500"
                    )}>
                      <Library className="text-white/30" size={80} />
                      <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl translate-y-2 group-hover:translate-y-0">
                        <Play className="fill-black text-black ml-1" size={20} />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-1 truncate">{name}</h3>
                    <p className="text-sm text-muted-foreground">{count} Questions • Ready to Review</p>
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
