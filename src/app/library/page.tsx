
"use client"

import { useState, useEffect, Suspense, useRef, useCallback } from 'react';
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
  Layout,
  Play,
  Shield,
  Activity,
  Target,
  Zap
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/app/lib/placeholder-images';
import { cn } from '@/lib/utils';

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
  
  // UI Modes
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState<LabModule | null>(null);

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
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const STORAGE_KEY = 'TITRATE_PERSISTENT_TABS';

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

    // Re-hydrate persistent tabs
    const savedIds = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (savedIds.length > 0) {
      const allModules = await db.getAll<LabModule>('modules');
      const hydrated = savedIds
        .map((id: string) => allModules.find(m => m.id === id))
        .filter(Boolean) as LabModule[];
      setActiveModules(hydrated);
    }

    const userProfile = await db.getById<UserProfile>('profile', 'current-user');
    if (userProfile) {
      setProfile(userProfile);
      setEditName(userProfile.name);
      setEditYear(userProfile.proficiencyRank);
      setEditExamDate(userProfile.examDate || '');
    }
    setLoading(false);
  };

  const persistTabs = (modules: LabModule[]) => {
    const ids = modules.map(m => m.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
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
    const updatedProfile: UserProfile = { 
      ...userProfile, 
      id: 'current-user',
      currentStreak: newStreak, 
      lastActivityDate: today 
    };
    await db.put('profile', updatedProfile);
    setProfile(updatedProfile);
    window.dispatchEvent(new Event('profile-updated'));
  };

  const createModule = async () => {
    if (!newModuleName.trim() || !selectedSubject) {
      toast({ variant: "destructive", title: "Missing Information" });
      return;
    }
    const newModule: LabModule = {
      id: `module-${Date.now()}`,
      name: newModuleName,
      subject: selectedSubject,
      imageKey: 'med-lab',
      mastery: 0,
      pdfBlob: selectedFile || undefined
    };
    await db.put('modules', newModule);
    toast({ title: "Module Created" });
    setIsAddModuleOpen(false);
    loadLibrary();
  };

  const deleteModule = async () => {
    if (!moduleToDelete) return;
    await db.delete('modules', moduleToDelete.id);
    
    // Cleanup active tabs
    setActiveModules(prev => {
      const next = prev.filter(m => m.id !== moduleToDelete.id);
      persistTabs(next);
      if (next.length === 0) setIsWorkspaceOpen(false);
      return next;
    });

    setModuleToDelete(null);
    toast({ title: "Protocol Archived", description: "Document has been permanently removed." });
    loadLibrary();
  };

  const saveProfile = async () => {
    if (!editName.trim()) return;
    // Ensure the ID is explicitly set to 'current-user' to match the database keyPath
    const updatedProfile: UserProfile = { 
      id: 'current-user',
      name: editName, 
      proficiencyRank: editYear || 'Future RMT', 
      examDate: editExamDate || '',
      currentStreak: profile?.currentStreak || 0,
      lastActivityDate: profile?.lastActivityDate || ''
    };
    await db.put('profile', updatedProfile);
    setProfile(updatedProfile);
    setIsEditProfileOpen(false);
    window.dispatchEvent(new Event('profile-updated'));
  };

  const openPdf = (module: LabModule) => {
    if (isDeleteMode) return;
    updateStreak();
    setIsWorkspaceOpen(true);
    
    setActiveModules(prev => {
      // If already open, just keep current
      if (prev.find(m => m.id === module.id)) {
        return prev;
      }
      
      // FIFO Replacement Logic: Max 4 tabs
      let nextList = [...prev, module];
      if (nextList.length > 4) {
        toast({ title: "FIFO Rotation", description: "Archived oldest tab to make room for new protocol." });
        nextList = nextList.slice(1);
      }
      persistTabs(nextList);
      return nextList;
    });
  };

  const handleCloseModule = (moduleId: string) => {
    setActiveModules(prev => {
      const next = prev.filter(m => m.id !== moduleId);
      persistTabs(next);
      if (next.length === 0) setIsWorkspaceOpen(false);
      return next;
    });
  };

  const handleClearAll = () => {
    setActiveModules([]);
    persistTabs([]);
    setIsWorkspaceOpen(false);
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
          {/* Tactical Identification Card Section */}
          <section className="relative max-w-3xl">
            <div className="riot-card bg-[#111a24] border border-white/10 p-0 relative overflow-hidden group/id shadow-2xl">
              {/* ID Card Background Texture */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.5) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              </div>
              
              {/* Top Banner - ID Badge Style */}
              <div className="bg-primary/10 border-b border-primary/20 px-6 py-2.5 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                  <Shield size={12} className="text-primary" />
                  <span className="text-[8px] font-black text-primary uppercase tracking-[0.4em]">Titrate Clinical Identification</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[8px] font-black text-primary/60 uppercase tracking-widest italic whitespace-nowrap">Authorized Analyst</span>
                </div>
              </div>

              <div className="p-6 md:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start relative z-10">
                {/* Photo Area */}
                <div className="relative shrink-0">
                  <div className="w-36 h-36 border-2 border-primary/30 p-1.5 bg-black/40 relative">
                    <div className="w-full h-full bg-primary/5 flex items-center justify-center relative overflow-hidden">
                      <UserCircle size={120} className="text-primary/5 absolute -bottom-4 -right-4" />
                      <User size={64} className="text-primary" />
                      
                      {/* Scanning Line Effect */}
                      <div className="absolute inset-x-0 h-[2px] bg-primary/40 shadow-[0_0_15px_rgba(0,255,127,0.8)] opacity-50 animate-pulse top-1/2 -translate-y-1/2" />
                    </div>
                    {/* Corner Brackets for "Scanner" look */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-primary" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-primary" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-primary" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary" />
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-[7px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">Clearance Level</p>
                    <div className="px-2 py-0.5 border border-primary/30 bg-primary/5 inline-block">
                      <span className="text-[9px] font-black text-primary uppercase tracking-widest">Level 4 Analyst</span>
                    </div>
                  </div>
                </div>

                {/* Info Area */}
                <div className="flex-1 space-y-8 w-full">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-1 text-center md:text-left">
                      <p className="text-[8px] font-black text-primary uppercase tracking-[0.4em]">Analyst Name / Full Designation</p>
                      <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-[0.85] border-b border-white/5 pb-2 truncate">
                        {profile?.name || 'Future RMT'}
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1 text-left">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.4em]">Proficiency Rank</p>
                        <p className="text-base md:text-lg font-black text-white uppercase tracking-widest italic flex items-center gap-2 truncate">
                          <Activity size={14} className="text-primary shrink-0" />
                          {profile?.proficiencyRank || 'Rank Unassigned'}
                        </p>
                      </div>
                      <div className="space-y-1 text-left md:text-left border-l border-white/5 pl-4">
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.4em]">Board Target</p>
                        <p className="text-base md:text-lg font-black text-white uppercase tracking-widest italic flex items-center gap-2 truncate">
                          <Target size={14} className="text-primary shrink-0" />
                          {profile?.examDate ? new Date(profile.examDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'UNSET'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Security Footer Barcode Area */}
                  <div className="pt-6 flex items-end justify-between">
                    <div className="flex flex-col gap-1.5 opacity-40 group-hover/id:opacity-100 transition-opacity duration-700">
                      <div className="flex gap-0.5 h-6">
                        {[4, 8, 2, 6, 10, 3, 7, 5, 9, 2, 8, 4, 6, 3, 10, 5, 7, 2, 8, 4].map((h, i) => (
                          <div key={i} className="bg-white w-[1.5px]" style={{ height: `${h * 2}px` }} />
                        ))}
                      </div>
                      <span className="text-[6px] font-mono text-white tracking-[0.5em] uppercase">ID-{(profile?.id || 'USR').substring(0,12)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 border-l border-white/10 pl-4">
                       <div className="text-right hidden sm:block">
                         <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] leading-tight">MedTech Board</p>
                         <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] leading-tight">Review Protocol</p>
                       </div>
                       <div className="w-10 h-10 border border-white/10 flex items-center justify-center bg-white/5">
                         <Zap size={20} className="text-primary/20" />
                       </div>
                    </div>
                  </div>
                </div>

                {/* Edit Button - Floating Action within the card */}
                <button 
                  onClick={() => setIsEditProfileOpen(true)} 
                  className="absolute top-2 right-2 p-3 text-white/20 hover:text-primary transition-all z-20 group/edit"
                  title="Modify Credentials"
                >
                  <Edit2 size={16} className="group-hover/edit:scale-110" />
                </button>
              </div>
              
              {/* Card Accent Lines */}
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
              <div className="absolute top-0 right-0 w-[1px] h-full bg-white/5" />
            </div>
          </section>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl lg:text-3xl xl:text-5xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                <Archive className="text-primary" size={22} />
                {subjectFilter ? `${subjectFilter} Sector` : 'Archives'}
              </h3>
              {activeModules.length > 0 && !isWorkspaceOpen && (
                <Button 
                  onClick={() => setIsWorkspaceOpen(true)}
                  className="bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-black h-10 px-4 text-[9px] font-black tracking-widest animate-pulse"
                >
                  <Play size={12} className="mr-2" /> RESUME SESSION ({activeModules.length})
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Button 
                onClick={() => setIsDeleteMode(!isDeleteMode)} 
                variant="outline" 
                className={cn(
                  "h-10 border-white/10 font-black text-[9px] uppercase tracking-widest",
                  isDeleteMode ? "bg-red-500/20 border-red-500/50 text-red-500 hover:bg-red-500/30" : "text-white/60 hover:text-white"
                )}
              >
                <Trash2 size={12} className="mr-2" />
                {isDeleteMode ? 'Exit Delete' : 'Delete Mode'}
              </Button>
              
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
                <div key={module.id} className="group relative">
                  <div className="cursor-pointer" onClick={() => openPdf(module)}>
                    <div className="riot-card aspect-[16/10] relative group-hover:scale-[1.02] transition-all bg-black">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">{module.subject}</p>
                            <h4 className="text-xl font-black italic uppercase leading-tight text-white truncate">{module.name}</h4>
                            <div className="flex items-center gap-1.5 mt-1"><Layout size={10} className="text-primary" /><span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Workspace Ready</span></div>
                          </div>
                          {!isDeleteMode && (
                            <div className="w-8 h-8 bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"><ArrowRight className="text-black" size={14} /></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {isDeleteMode && (
                    <button 
                      onClick={() => setModuleToDelete(module)}
                      className="absolute top-3 right-3 z-30 w-8 h-8 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-2xl transition-transform active:scale-90"
                      title="Delete Protocol"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workspace Integration - Persistent overlay */}
        {activeModules.length > 0 && isWorkspaceOpen && (
          <Workspace 
            modules={activeModules} 
            onCloseModule={handleCloseModule}
            onCloseAll={handleClearAll} 
            onMinimize={() => setIsWorkspaceOpen(false)}
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
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest">Proficiency Rank</Label>
                <Input value={editYear} onChange={(e) => setEditYear(e.target.value)} placeholder="e.g. 4th Year / Intern" className="bg-white/5 border-white/10 rounded-none h-10 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest">Board Exam Target Date</Label>
                <Input type="date" value={editExamDate} onChange={(e) => setEditExamDate(e.target.value)} className="bg-white/5 border-white/10 rounded-none h-10 text-sm" />
              </div>
            </div>
            <DialogFooter><Button onClick={saveProfile} className="bg-primary text-black rounded-none font-black text-[9px] tracking-widest px-8">SAVE</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!moduleToDelete} onOpenChange={(open) => !open && setModuleToDelete(null)}>
          <AlertDialogContent className="bg-[#111a24] border-white/10 text-white rounded-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-black italic uppercase text-red-500">Archive Confirmation</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground italic text-sm">
                Permanently delete <span className="text-white font-bold">"{moduleToDelete?.name}"</span>? All annotations and linked data will be purged from the local laboratory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="uppercase font-black text-[9px] border-white/10 text-white hover:bg-white/5">Abort</AlertDialogCancel>
              <AlertDialogAction onClick={deleteModule} className="bg-red-600 hover:bg-red-700 text-white font-black text-[9px] uppercase">Confirm Purge</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
