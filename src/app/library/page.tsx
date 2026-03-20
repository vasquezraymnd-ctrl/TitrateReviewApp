"use client"

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { db, Question, UserProfile, LabModule, CORE_SUBJECTS } from '@/lib/db';
import { Archive, Search, Play, User, UserCircle, Plus, Microscope, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function LibraryContent() {
  const searchParams = useSearchParams();
  const subjectFilter = searchParams.get('subject');

  const [subjects, setSubjects] = useState<Map<string, number>>(new Map());
  const [modules, setModules] = useState<LabModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectFilter || 'Microbiology');
  const [selectedImageKey, setSelectedImageKey] = useState('med-lab');
  const { toast } = useToast();

  useEffect(() => {
    loadLibrary();
  }, [subjectFilter]);

  const loadLibrary = async () => {
    setLoading(true);
    
    // Load Modules
    let storedModules = await db.getAll<LabModule>('modules');
    
    // If filtering by subject
    if (subjectFilter) {
      storedModules = storedModules.filter(m => m.subject === subjectFilter);
      setSelectedSubject(subjectFilter);
    }
    
    setModules(storedModules);

    // Load Question counts
    const questions = await db.getAll<Question>('questions');
    const counts = new Map<string, number>();
    questions.forEach(q => {
      counts.set(q.subject, (counts.get(q.subject) || 0) + 1);
    });
    setSubjects(counts);

    // Load Profile
    const userProfile = await db.getById<UserProfile>('profile', 'current-user');
    if (userProfile) {
      setProfile(userProfile);
    } else {
      const defaultProfile: UserProfile = {
        id: 'current-user',
        name: 'Student Analyst',
        proficiencyRank: 'Laboratory Grade 42',
        examDate: '2025-08-20',
        totalQuestionsAnswered: 1248,
      };
      await db.put('profile', defaultProfile);
      setProfile(defaultProfile);
    }
    
    setLoading(false);
  };

  const createModule = async () => {
    if (!newModuleName.trim()) {
      toast({ variant: "destructive", title: "Missing Information", description: "Module name is required." });
      return;
    }

    const newModule: LabModule = {
      id: `module-${Date.now()}`,
      name: newModuleName,
      subject: selectedSubject,
      imageKey: selectedImageKey,
      mastery: 0
    };

    await db.put('modules', newModule);
    toast({ title: "Module Created", description: `${newModuleName} has been added to your ${selectedSubject} sector.` });
    setNewModuleName('');
    setIsAddModuleOpen(false);
    loadLibrary();
  };

  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#050a0f] overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        <div className="px-8 lg:px-16 py-32 max-w-7xl mx-auto space-y-16">
          
          <section className="riot-card p-10 bg-white/[0.02] border border-white/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <UserCircle className="text-primary" size={200} />
             </div>
             
             <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
               <div className="flex items-center gap-6 md:col-span-2">
                 <div className="w-24 h-24 border-2 border-primary/50 p-1 rounded-none">
                   <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                     <User size={48} className="text-primary" />
                   </div>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Student Analyst</p>
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
                   <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Academic Target</p>
                   <p className="text-2xl font-black italic text-white">AUG 25</p>
                 </div>
               </div>
             </div>
          </section>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h3 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                <Archive className="text-primary" size={28} />
                {subjectFilter ? `${subjectFilter} Modules` : 'Protocol Inventory'}
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                {subjectFilter 
                  ? `Viewing specialized sub-modules for the ${subjectFilter} laboratory.`
                  : 'Calibrated modules for device-local clinical study.'}
              </p>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              {subjectFilter && (
                <Button asChild variant="outline" className="riot-button h-12 px-6 border-white/10 text-white font-black text-[10px]">
                  <Link href="/library"><FilterX className="mr-2 h-4 w-4" /> CLEAR FILTER</Link>
                </Button>
              )}
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input 
                  placeholder="FILTER MODULES..." 
                  className="w-full bg-white/5 border border-white/10 h-12 pl-10 pr-4 text-[10px] font-black tracking-widest uppercase focus:bg-white/10 focus:ring-1 focus:ring-primary outline-none transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsAddModuleOpen(true)} className="riot-button h-12 px-6 bg-primary text-black font-black text-[10px]">
                <Plus className="mr-2 h-4 w-4" /> NEW MODULE
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-[16/10] bg-white/[0.02] animate-pulse riot-card" />
              ))}
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="text-center py-24 riot-card border border-dashed border-white/10 bg-white/[0.02]">
              <Archive size={64} className="mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-black italic uppercase">No sub-modules recorded</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">
                {subjectFilter 
                  ? `Initiate titration to define new sub-modules for ${subjectFilter}.`
                  : 'Data titration required to populate archives.'}
              </p>
              <Button onClick={() => setIsAddModuleOpen(true)} className="riot-button h-12 px-8 bg-primary hover:bg-primary/80 text-black">
                DEFINE FIRST MODULE
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
              {filteredModules.map((module) => (
                <Link key={module.id} href={`/quiz/${module.id}`} className="group">
                  <div className="riot-card aspect-[16/10] relative group-hover:scale-[1.03] transition-all duration-500 ring-0 hover:ring-1 ring-primary/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{module.subject}</p>
                          <h4 className="text-2xl font-black italic uppercase">{module.name}</h4>
                          <div className="flex items-center justify-between gap-4 mt-2">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              {subjects.get(module.name) || 0} Questions
                            </span>
                            <span className="text-[10px] font-black text-primary uppercase">Mastery {module.mastery}%</span>
                          </div>
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

        <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
          <DialogContent className="bg-[#0A1219] border-white/10 text-white rounded-none">
            <DialogHeader>
              <DialogTitle className="font-black italic uppercase tracking-tighter text-2xl flex items-center gap-2">
                <Microscope className="text-primary" />
                Define Lab Module
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Module Name</Label>
                <Input 
                  value={newModuleName} 
                  onChange={(e) => setNewModuleName(e.target.value)}
                  placeholder="e.g. Gram Staining Protocol"
                  className="bg-white/5 border-white/10 rounded-none focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clinical Sector</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-none focus:ring-primary text-xs uppercase font-black">
                    <SelectValue placeholder="Select Sector" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A1219] border-white/10 text-white rounded-none">
                    {CORE_SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject} className="uppercase font-black text-[10px] tracking-widest focus:bg-primary focus:text-black">
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Visual Asset</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PlaceHolderImages.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImageKey(img.id)}
                      className={`relative aspect-video border transition-all ${selectedImageKey === img.id ? 'border-primary ring-1 ring-primary' : 'border-white/5 grayscale'}`}
                    >
                      <img src={img.imageUrl} alt={img.description} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
              
              <p className="text-[9px] font-bold text-muted-foreground uppercase italic leading-tight">
                Sub-modules are localized to your selected clinical sector and stored in your device's clinical archive.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddModuleOpen(false)} className="uppercase font-black text-[10px] tracking-widest">Cancel</Button>
              <Button onClick={createModule} className="bg-primary text-black rounded-none font-black text-[10px] tracking-widest px-8">ACTIVATE MODULE</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default function ProtocolArchives() {
  return (
    <Suspense fallback={<div className="bg-[#050a0f] h-screen" />}>
      <LibraryContent />
    </Suspense>
  );
}
