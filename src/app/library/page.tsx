
"use client"

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { db, UserProfile, LabModule, CORE_SUBJECTS } from '@/lib/db';
import { 
  Archive, 
  Search, 
  FileText, 
  User, 
  UserCircle, 
  Plus, 
  Microscope, 
  ChevronLeft, 
  Trash2, 
  Edit2, 
  Database,
  FolderOpen,
  ArrowRight,
  BookOpen,
  AlertCircle,
  X,
  Loader2,
  Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import Link from 'next/link';
import Image from 'next/image';
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
import { PlaceHolderImages } from '@/app/lib/placeholder-images';

// Dynamically import the Workspace to handle client-side rendering requirements
const Workspace = dynamic(() => import('@/components/dashboard/Workspace').then(mod => mod.Workspace), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[200] bg-[#0b111a] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mt-4">Initializing Workspace</p>
    </div>
  )
});

function LibraryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subjectFilter = searchParams.get('subject');

  const [subjects, setSubjects] = useState<Map<string, number>>(new Map());
  const [modules, setModules] = useState<LabModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Module Dialog State
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectFilter || 'Microbiology');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Profile Dialog State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editExamDate, setEditExamDate] = useState('');

  // Multi-tab Workspace State
  const [activeModules, setActiveModules] = useState<LabModule[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLibrary();
  }, [subjectFilter]);

  const loadLibrary = async () => {
    setLoading(true);
    let storedModules = await db.getAll<LabModule>('modules');
    
    const counts = new Map<string, number>();
    storedModules.forEach(m => {
      counts.set(m.subject, (counts.get(m.subject) || 0) + 1);
    });
    setSubjects(counts);

    if (subjectFilter) {
      storedModules = storedModules.filter(m => m.subject === subjectFilter);
      setSelectedSubject(subjectFilter);
    }
    setModules(storedModules.sort((a, b) => b.id.localeCompare(a.id)));

    const userProfile = await db.getById<UserProfile>('profile', 'current-user');
    if (userProfile) {
      setProfile(userProfile);
      setEditName(userProfile.name);
      setEditYear(userProfile.proficiencyRank);
      setEditExamDate(userProfile.examDate);
    }
    setLoading(false);
  };

  const updateStreak = async () => {
    const userProfile = await db.getById<UserProfile>('profile', 'current-user');
    if (!userProfile) return;
    const today = new Date().toISOString().split('T')[0];
    if (userProfile.lastActivityDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    let newStreak = userProfile.currentStreak || 0;
    newStreak = userProfile.lastActivityDate === yesterdayStr ? newStreak + 1 : 1;
    const updatedProfile = { ...userProfile, currentStreak: newStreak, lastActivityDate: today };
    await db.put('profile', updatedProfile);
    setProfile(updatedProfile);
    window.dispatchEvent(new Event('profile-updated'));
  };

  const createModule = async () => {
    if (!newModuleName.trim() || !selectedFile) {
      toast({ variant: "destructive", title: "Missing Information" });
      return;
    }
    const newModule: LabModule = {
      id: `module-${Date.now()}`,
      name: newModuleName,
      subject: selectedSubject,
      imageKey: 'med-lab',
      mastery: 0,
      pdfBlob: selectedFile
    };
    await db.put('modules', newModule);
    toast({ title: "Module Created" });
    setIsAddModuleOpen(false);
    loadLibrary();
  };

  const saveProfile = async () => {
    if (!editName.trim()) return;
    const updatedProfile: UserProfile = { ...profile!, name: editName, proficiencyRank: editYear, examDate: editExamDate };
    await db.put('profile', updatedProfile);
    setProfile(updatedProfile);
    setIsEditProfileOpen(false);
    window.dispatchEvent(new Event('profile-updated'));
  };

  const openPdf = (module: LabModule) => {
    updateStreak();
    setActiveModules(prev => {
      // If already open, just keep current
      if (prev.find(m => m.id === module.id)) return prev;
      
      // FIFO Replacement Logic: Max 4 tabs
      if (prev.length >= 4) {
        toast({ title: "FIFO Rotation", description: "Archived oldest tab to make room for new protocol." });
        return [...prev.slice(1), module];
      }
      return [...prev, module];
    });
  };

  const handleCloseModule = (moduleId: string) => {
    setActiveModules(prev => prev.filter(m => m.id !== moduleId));
  };

  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="flex h-screen bg-[#0b111a] overflow-hidden text-white flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        <div className="px-6 md:px-10 lg:px-16 py-28 md:py-32 max-w-[1800px] mx-auto space-y-12">
          <section className="riot-card p-6 md:p-10 bg-white/[0.02] border border-white/5 relative overflow-hidden group/card">
             <div className="absolute top-0 right-0 p-8 opacity-5"><UserCircle className="text-primary" size={200} /></div>
             <button onClick={() => setIsEditProfileOpen(true)} className="absolute top-4 right-4 p-2 bg-white/5 border border-white/10 hover:bg-primary hover:text-black z-20"><Edit2 size={14} /></button>
             <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
               <div className="w-20 h-20 border border-primary/50 p-1">
                 <div className="w-full h-full bg-primary/20 flex items-center justify-center"><User size={32} className="text-primary" /></div>
               </div>
               <div>
                 <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-1">Future RMT</p>
                 <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">{profile?.name}</h2>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{profile?.proficiencyRank}</p>
               </div>
             </div>
          </section>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h3 className="text-2xl lg:text-3xl xl:text-5xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                <Archive className="text-primary" size={22} />
                {subjectFilter ? `${subjectFilter} Sector` : 'Archives'}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {subjectFilter && <Button onClick={() => router.push('/library')} variant="outline" className="h-10 border-white/10 text-white font-black text-[9px]">DIRECTORY</Button>}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                <input placeholder="SEARCH..." className="w-full bg-white/5 border border-white/10 h-10 pl-10 pr-4 text-[9px] font-black tracking-widest uppercase outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button onClick={() => setIsAddModuleOpen(true)} className="h-10 bg-primary text-black font-black text-[9px]">NEW PROTOCOL</Button>
            </div>
          </div>

          {!subjectFilter ? (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {CORE_SUBJECTS.map((subject) => {
                const imageKey = getSubjectImage(subject);
                const placeholder = PlaceHolderImages.find(img => img.id === imageKey);
                const count = subjects.get(subject) || 0;
                return (
                  <Link key={subject} href={`/library?subject=${encodeURIComponent(subject)}`} className="group">
                    <div className="riot-card aspect-[16/10] relative group-hover:scale-[1.02] transition-all bg-black overflow-hidden">
                      {placeholder && <Image src={placeholder.imageUrl} alt={subject} fill className="object-cover opacity-80 group-hover:opacity-100 transition-all" />}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                      <div className="absolute top-4 left-4"><FolderOpen size={24} className="text-primary group-hover:scale-110 transition-transform" /></div>
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Sector Folder</p>
                          <h4 className="text-lg md:text-xl font-black italic uppercase text-white leading-tight">{subject}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-xl md:text-2xl font-black italic text-white/40">{count}</p>
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Files</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </section>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredModules.map((module) => (
                <div key={module.id} className="group cursor-pointer" onClick={() => openPdf(module)}>
                  <div className="riot-card aspect-[16/10] relative group-hover:scale-[1.02] transition-all bg-black">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">{module.subject}</p>
                          <h4 className="text-xl font-black italic uppercase leading-tight text-white truncate">{module.name}</h4>
                          <div className="flex items-center gap-1.5 mt-1"><Layout size={10} className="text-primary" /><span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Workspace Ready</span></div>
                        </div>
                        <div className="w-8 h-8 bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"><ArrowRight className="text-black" size={14} /></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workspace Integration */}
        {activeModules.length > 0 && (
          <Workspace 
            modules={activeModules} 
            onCloseModule={handleCloseModule}
            onCloseAll={() => setActiveModules([])} 
          />
        )}

        <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
          <DialogContent className="bg-[#111a24] border-white/10 text-white rounded-none">
            <DialogHeader><DialogTitle className="font-black italic uppercase text-xl">Titrate Protocol</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest">Protocol Title</Label>
                <Input value={newModuleName} onChange={(e) => setNewModuleName(e.target.value)} placeholder="e.g. Coagulation Cascade" className="bg-white/5 border-white/10 rounded-none h-10 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest">PDF Protocol</Label>
                <Button asChild variant="outline" className="w-full h-12 border-dashed border-white/20 text-muted-foreground text-[9px]">
                  <label className="cursor-pointer flex items-center justify-center gap-2">
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    <Plus size={14} /> {selectedFile ? selectedFile.name : 'SELECT PDF'}
                  </label>
                </Button>
              </div>
            </div>
            <DialogFooter><Button onClick={createModule} className="bg-primary text-black rounded-none font-black text-[9px] tracking-widest px-8">ACTIVATE</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
          <DialogContent className="bg-[#111a24] border-white/10 text-white rounded-none">
            <DialogHeader><DialogTitle className="font-black italic uppercase text-xl">Edit Credentials</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest">Analyst Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-white/5 border-white/10 rounded-none h-10 text-sm" />
              </div>
            </div>
            <DialogFooter><Button onClick={saveProfile} className="bg-primary text-black rounded-none font-black text-[9px] tracking-widest px-8">SAVE</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default function ProtocolArchives() {
  return (
    <Suspense fallback={<div className="bg-[#0b111a] h-screen" />}>
      <LibraryContent />
    </Suspense>
  );
}
