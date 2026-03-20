"use client"

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { db, Question, UserProfile, LabModule, CORE_SUBJECTS } from '@/lib/db';
import { Archive, Search, FileText, User, UserCircle, Plus, Microscope, FilterX, X, ChevronLeft, Trash2, Edit2 } from 'lucide-react';
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
  
  // Module Dialog State
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectFilter || 'Microbiology');
  const [selectedImageKey, setSelectedImageKey] = useState('med-lab');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Profile Dialog State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editExamDate, setEditExamDate] = useState('');

  const [viewingPdf, setViewingPdf] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLibrary();
    return () => {
      if (viewingPdf) URL.revokeObjectURL(viewingPdf);
    };
  }, [subjectFilter]);

  const loadLibrary = async () => {
    setLoading(true);
    let storedModules = await db.getAll<LabModule>('modules');
    if (subjectFilter) {
      storedModules = storedModules.filter(m => m.subject === subjectFilter);
      setSelectedSubject(subjectFilter);
    }
    setModules(storedModules);

    const questions = await db.getAll<Question>('questions');
    const counts = new Map<string, number>();
    questions.forEach(q => {
      counts.set(q.subject, (counts.get(q.subject) || 0) + 1);
    });
    setSubjects(counts);

    const userProfile = await db.getById<UserProfile>('profile', 'current-user');
    if (userProfile) {
      setProfile(userProfile);
      setEditName(userProfile.name);
      setEditYear(userProfile.proficiencyRank);
      setEditExamDate(userProfile.examDate);
    } else {
      const defaultProfile: UserProfile = {
        id: 'current-user',
        name: 'Future RMT',
        proficiencyRank: 'Laboratory Grade 42',
        examDate: '2025-08-20',
        totalQuestionsAnswered: 1248,
      };
      await db.put('profile', defaultProfile);
      setProfile(defaultProfile);
      setEditName(defaultProfile.name);
      setEditYear(defaultProfile.proficiencyRank);
      setEditExamDate(defaultProfile.examDate);
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
      mastery: 0,
      pdfBlob: selectedFile || undefined
    };

    await db.put('modules', newModule);
    toast({ title: "Module Created", description: `${newModuleName} has been added to your local archive.` });
    resetForm();
    setIsAddModuleOpen(false);
    loadLibrary();
  };

  const saveProfile = async () => {
    if (!editName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Name cannot be empty." });
      return;
    }

    const updatedProfile: UserProfile = {
      ...profile!,
      name: editName,
      proficiencyRank: editYear,
      examDate: editExamDate,
    };

    await db.put('profile', updatedProfile);
    setProfile(updatedProfile);
    setIsEditProfileOpen(false);
    toast({ title: "Profile Updated", description: "Your clinical credentials have been synchronized." });
    // Trigger dashboard refresh if needed (usually handled by local state or refresh)
    window.dispatchEvent(new Event('profile-updated'));
  };

  const resetForm = () => {
    setNewModuleName('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deleteModule = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    await db.delete('modules', id);
    toast({ title: "Module Removed", description: "Protocol deleted from device storage." });
    loadLibrary();
  };

  const openPdf = (module: LabModule) => {
    if (module.pdfBlob) {
      const url = URL.createObjectURL(module.pdfBlob);
      setViewingPdf(url);
    } else {
      toast({ title: "No PDF attached", description: "This module only contains metadata." });
    }
  };

  const filteredModules = modules.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatTargetDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-[#050a0f] overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        <div className="px-8 lg:px-16 py-32 max-w-7xl mx-auto space-y-16">
          <section className="riot-card p-10 bg-white/[0.02] border border-white/5 relative overflow-hidden group/card">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <UserCircle className="text-primary" size={200} />
             </div>
             
             <button 
               onClick={() => setIsEditProfileOpen(true)}
               className="absolute top-6 right-6 p-2 bg-white/5 border border-white/10 hover:bg-primary hover:text-black transition-all opacity-0 group-hover/card:opacity-100 z-20"
             >
               <Edit2 size={16} />
             </button>

             <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
               <div className="flex items-center gap-6 md:col-span-2">
                 <div className="w-24 h-24 border-2 border-primary/50 p-1 rounded-none">
                   <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                     <User size={48} className="text-primary" />
                   </div>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Future RMT</p>
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
                   <p className="text-2xl font-black italic text-white">{profile?.examDate ? formatTargetDate(profile.examDate) : '---'}</p>
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
                Local clinical archives stored on your device. Only PDF protocols accepted.
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
                  placeholder="FILTER ARCHIVES..." 
                  className="w-full bg-white/5 border border-white/10 h-12 pl-10 pr-4 text-[10px] font-black tracking-widest uppercase focus:bg-white/10 focus:ring-1 focus:ring-primary outline-none transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsAddModuleOpen(true)} className="riot-button h-12 px-6 bg-primary text-black font-black text-[10px]">
                <Plus className="mr-2 h-4 w-4" /> UPLOAD PROTOCOL
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
              <FileText size={64} className="mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-black italic uppercase">No sub-modules recorded</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">
                Upload your PDF notes to begin device-local study.
              </p>
              <Button onClick={() => setIsAddModuleOpen(true)} className="riot-button h-12 px-8 bg-primary hover:bg-primary/80 text-black">
                UPLOAD FIRST PDF
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
              {filteredModules.map((module) => (
                <div key={module.id} className="group cursor-pointer" onClick={() => openPdf(module)}>
                  <div className="riot-card aspect-[16/10] relative group-hover:scale-[1.03] transition-all duration-500 ring-0 hover:ring-1 ring-primary/50">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    <button 
                      onClick={(e) => deleteModule(e, module.id)}
                      className="absolute top-4 right-4 z-20 p-2 text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{module.subject}</p>
                          <h4 className="text-2xl font-black italic uppercase">{module.name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                             <FileText size={12} className="text-primary" />
                             <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                               Local PDF Protocol
                             </span>
                          </div>
                        </div>
                        <div className="w-10 h-10 bg-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                          <FileText className="text-black" size={18} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Edit Dialog */}
        <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
          <DialogContent className="bg-[#0A1219] border-white/10 text-white rounded-none">
            <DialogHeader>
              <DialogTitle className="font-black italic uppercase tracking-tighter text-2xl flex items-center gap-2">
                <Edit2 className="text-primary" />
                Edit Clinical Credentials
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Analyst Name</Label>
                <Input 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Future RMT"
                  className="bg-white/5 border-white/10 rounded-none focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Year / Laboratory Grade</Label>
                <Input 
                  value={editYear} 
                  onChange={(e) => setEditYear(e.target.value)}
                  placeholder="e.g. 3rd Year Section A"
                  className="bg-white/5 border-white/10 rounded-none focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Academic Target (Exam Date)</Label>
                <Input 
                  type="date"
                  value={editExamDate} 
                  onChange={(e) => setEditExamDate(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-none focus:ring-primary"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsEditProfileOpen(false)} className="uppercase font-black text-[10px] tracking-widest">Cancel</Button>
              <Button onClick={saveProfile} className="bg-primary text-black rounded-none font-black text-[10px] tracking-widest px-8">SAVE CREDENTIALS</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Module Add Dialog */}
        <Dialog open={isAddModuleOpen} onOpenChange={setIsAddModuleOpen}>
          <DialogContent className="bg-[#0A1219] border-white/10 text-white rounded-none">
            <DialogHeader>
              <DialogTitle className="font-black italic uppercase tracking-tighter text-2xl flex items-center gap-2">
                <Microscope className="text-primary" />
                Upload Laboratory PDF
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Module Name</Label>
                <Input 
                  value={newModuleName} 
                  onChange={(e) => setNewModuleName(e.target.value)}
                  placeholder="e.g. Hematology Staining Guide"
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
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">PDF Protocol (Device Upload)</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    type="file" 
                    accept="application/pdf"
                    ref={fileInputRef}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <Button asChild variant="outline" className="w-full h-12 border-dashed border-white/20 hover:border-primary/50 text-muted-foreground">
                    <label htmlFor="pdf-upload" className="cursor-pointer flex items-center justify-center gap-2">
                      <Plus size={16} /> {selectedFile ? selectedFile.name : 'SELECT PDF FILE'}
                    </label>
                  </Button>
                </div>
              </div>
              
              <p className="text-[9px] font-bold text-muted-foreground uppercase italic leading-tight">
                PDFs are stored in your device's clinical archive (IndexedDB). No data is sent to external servers.
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAddModuleOpen(false)} className="uppercase font-black text-[10px] tracking-widest">Cancel</Button>
              <Button onClick={createModule} className="bg-primary text-black rounded-none font-black text-[10px] tracking-widest px-8">ACTIVATE MODULE</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Fullscreen PDF Viewer */}
        {viewingPdf && (
          <div className="fixed inset-0 z-[200] bg-[#050a0f] flex flex-col animate-in fade-in duration-300">
            <header className="h-16 bg-[#0A1219] border-b border-white/5 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setViewingPdf(null)} className="text-white/50 hover:text-white">
                  <ChevronLeft size={24} />
                </Button>
                <h2 className="text-sm font-black italic uppercase tracking-widest">Laboratory Protocol Viewer</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewingPdf(null)} className="text-red-500 hover:bg-red-500/10">
                <X size={20} />
              </Button>
            </header>
            <div className="flex-1 overflow-hidden">
               <iframe 
                 src={`${viewingPdf}#toolbar=0`} 
                 className="w-full h-full border-none"
                 title="PDF Viewer"
               />
            </div>
          </div>
        )}
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
