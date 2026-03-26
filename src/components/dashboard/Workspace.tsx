"use client"

import { useState, useEffect, useMemo } from 'react';
import { PdfViewer } from './PdfViewer';
import { NotebookPanel } from './NotebookPanel';
import { Button } from '@/components/ui/button';
import { 
  Columns, 
  Layout, 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  FileText,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LabModule, WorkspaceClip, db, Notebook } from '@/lib/db';

interface WorkspaceProps {
  module: LabModule;
  onClose: () => void;
}

export function Workspace({ module, onClose }: WorkspaceProps) {
  const [viewMode, setViewMode] = useState<'split' | 'pdf-only' | 'floating'>('split');
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null);
  const [pdfWidth, setPdfWidth] = useState(50); // Percentage for split view

  useEffect(() => {
    loadActiveNotebook();
  }, []);

  const loadActiveNotebook = async () => {
    const all = await db.getAll<Notebook>('notebooks');
    if (all.length > 0) {
      setActiveNotebook(all[0]);
    } else {
      const newNb: Notebook = {
        id: `nb-${Date.now()}`,
        title: 'Clinical Workspace',
        lastModified: Date.now()
      };
      await db.put('notebooks', newNb);
      setActiveNotebook(newNb);
    }
  };

  const handleClipCaptured = async (clip: WorkspaceClip) => {
    await db.put('clips', clip);
    // Notify notebook panel to refresh
    window.dispatchEvent(new CustomEvent('titrate:clip-captured', { detail: clip }));
  };

  // Create memoized URL to prevent re-generation on every render
  const pdfUrl = useMemo(() => {
    if (module.pdfBlob) {
      return URL.createObjectURL(module.pdfBlob);
    }
    return null;
  }, [module.pdfBlob]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#0b111a] flex flex-col animate-in fade-in duration-300">
      {/* Workspace Header */}
      <header className="h-16 bg-[#111a24] border-b border-white/5 flex items-center justify-between px-4 z-[210]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/50">
            <ChevronLeft size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="text-primary" size={16} />
            <h2 className="text-sm font-black italic uppercase tracking-widest text-white truncate max-w-[200px]">
              {module.name}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-black/40 border border-white/5 p-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('pdf-only')}
            className={cn("h-8 px-3 text-[9px] font-black uppercase tracking-widest", viewMode === 'pdf-only' ? "bg-primary text-black" : "text-white/40")}
          >
            <Maximize2 size={12} className="mr-2" /> Reader
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('split')}
            className={cn("h-8 px-3 text-[9px] font-black uppercase tracking-widest", viewMode === 'split' ? "bg-primary text-black" : "text-white/40")}
          >
            <Columns size={12} className="mr-2" /> Split
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('floating')}
            className={cn("h-8 px-3 text-[9px] font-black uppercase tracking-widest", viewMode === 'floating' ? "bg-primary text-black" : "text-white/40")}
          >
            <Layout size={12} className="mr-2" /> Notes
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 border-l border-white/5">
             <BookOpen className="text-primary/40" size={14} />
             <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
               {activeNotebook?.title || 'No Notebook'}
             </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-red-500 h-10 w-10">
            <X size={20} />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* PDF Panel */}
        <div 
          className={cn(
            "h-full border-r border-white/5 transition-all duration-300 relative",
            viewMode === 'pdf-only' ? "w-full" : viewMode === 'floating' ? "w-full" : ""
          )}
          style={{ width: viewMode === 'split' ? `${pdfWidth}%` : undefined }}
        >
          <PdfViewer 
            url={pdfUrl} 
            moduleId={module.id} 
            moduleName={module.name}
            activeNotebookId={activeNotebook?.id}
            onClipCaptured={handleClipCaptured}
          />
        </div>

        {/* Notebook Panel */}
        {viewMode !== 'pdf-only' && (
          <div 
            className={cn(
              "h-full bg-[#0d141d] z-20 overflow-hidden shadow-[-20px_0_50px_rgba(0,0,0,0.5)]",
              viewMode === 'floating' ? "fixed top-20 right-6 w-[400px] h-[80vh] rounded-none border border-primary/20" : "flex-1"
            )}
          >
            {activeNotebook && (
              <NotebookPanel notebookId={activeNotebook.id} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
