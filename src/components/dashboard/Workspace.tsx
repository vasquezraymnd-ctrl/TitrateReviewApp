
"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { PdfViewer } from './PdfViewer';
import { NotebookPanel } from './NotebookPanel';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  BookOpen,
  FileText,
  X,
  Loader2,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LabModule, WorkspaceClip, db, Notebook } from '@/lib/db';

interface WorkspaceProps {
  modules: LabModule[];
  onCloseModule: (id: string) => void;
  onCloseAll: () => void;
  onMinimize?: () => void;
}

export function Workspace({ modules, onCloseModule, onCloseAll, onMinimize }: WorkspaceProps) {
  // Calibration: Set 'pdf-only' (Reader) as the default opening state
  const [activeModuleId, setActiveModuleId] = useState<string | null>(modules[0]?.id || null);
  const [viewMode, setViewMode] = useState<'split' | 'pdf-only' | 'floating'>('pdf-only');
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null);
  const [pdfWidth] = useState(50); // Percentage for split view
  
  // Track multiple PDF data streams
  const [pdfDataMap, setPdfDataStreamMap] = useState<Record<string, Uint8Array>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  // Auto-select newly added module or first available
  useEffect(() => {
    if (modules.length > 0) {
      const latestModule = modules[modules.length - 1];
      if (!activeModuleId || !modules.find(m => m.id === activeModuleId)) {
        setActiveModuleId(latestModule.id);
      }
    } else {
      setActiveModuleId(null);
    }
  }, [modules, activeModuleId]);

  // Memory Cleanup: Remove binary data for closed modules
  useEffect(() => {
    setPdfDataStreamMap(prev => {
      const nextMap = { ...prev };
      let changed = false;
      Object.keys(nextMap).forEach(id => {
        if (!modules.find(m => m.id === id)) {
          delete nextMap[id];
          changed = true;
        }
      });
      return changed ? nextMap : prev;
    });
  }, [modules]);

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

  const preparePdfData = useCallback(async (module: LabModule) => {
    if (!module.pdfBlob || pdfDataMap[module.id]) return;
    
    setLoadingMap(prev => ({ ...prev, [module.id]: true }));
    try {
      const buffer = await module.pdfBlob.arrayBuffer();
      const data = new Uint8Array(buffer);
      setPdfDataStreamMap(prev => ({ ...prev, [module.id]: data }));
    } catch (err) {
      console.error(`Failed to process PDF protocol ${module.name}:`, err);
    } finally {
      setLoadingMap(prev => ({ ...prev, [module.id]: false }));
    }
  }, [pdfDataMap]);

  useEffect(() => {
    loadActiveNotebook();
    modules.forEach(m => preparePdfData(m));
  }, [modules, preparePdfData]);

  const handleClipCaptured = useCallback(async (clip: WorkspaceClip) => {
    await db.put('clips', clip);
    window.dispatchEvent(new CustomEvent('titrate:clip-captured', { detail: clip }));
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-[#0b111a] flex flex-col animate-in fade-in duration-300">
      {/* Workspace Header - Unified h-12 */}
      <header className="h-12 bg-[#111a24] border-b border-white/5 flex items-center justify-between px-4 z-[210] shrink-0 gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon" onClick={onMinimize} className="text-white/50 h-8 w-8" title="Minimize Workspace">
            <ChevronLeft size={18} />
          </Button>
          <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3">
            <Layers className="text-primary/40" size={14} />
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Assay Tabs</span>
          </div>
        </div>

        {/* Clinical Tabs Area */}
        <div className="flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar justify-start">
          {modules.map((m) => (
            <div 
              key={m.id}
              onClick={() => setActiveModuleId(m.id)}
              className={cn(
                "h-8 px-3 flex items-center gap-2 cursor-pointer transition-all border-b-2 relative group min-w-[90px] max-w-[160px]",
                activeModuleId === m.id 
                  ? "border-primary bg-primary/5 text-white" 
                  : "border-transparent text-white/30 hover:text-white/60"
              )}
            >
              <FileText size={12} className={activeModuleId === m.id ? "text-primary" : ""} />
              <span className="text-[9px] font-black uppercase tracking-widest truncate">{m.name}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseModule(m.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-0.5"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-black/40 border border-white/5 p-0.5 shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('pdf-only')}
            className={cn("h-7 px-2 text-[8px] font-black uppercase tracking-widest", viewMode === 'pdf-only' ? "bg-primary text-black" : "text-white/40")}
          >
            Reader
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('split')}
            className={cn("h-7 px-2 text-[8px] font-black uppercase tracking-widest", viewMode === 'split' ? "bg-primary text-black" : "text-white/40")}
          >
            Split
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode('floating')}
            className={cn("h-7 px-2 text-[8px] font-black uppercase tracking-widest", viewMode === 'floating' ? "bg-primary text-black" : "text-white/40")}
          >
            Notes
          </Button>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="ghost" size="icon" onClick={onCloseAll} className="text-red-500 h-8 w-8 hover:bg-red-500/10" title="Close All Tabs">
            <X size={18} />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div 
          className={cn(
            "h-full border-r border-white/5 transition-all duration-300 relative",
            viewMode === 'pdf-only' ? "w-full" : viewMode === 'floating' ? "w-full" : ""
          )}
          style={{ width: viewMode === 'split' ? `${pdfWidth}%` : undefined }}
        >
          {modules.map((m) => {
            const isVisible = activeModuleId === m.id;
            const data = pdfDataMap[m.id];
            const isLoading = loadingMap[m.id];

            return (
              <div 
                key={`viewer-${m.id}`} 
                className={cn("absolute inset-0", isVisible ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none")}
              >
                {data ? (
                  <PdfViewer 
                    file={data} 
                    moduleId={m.id} 
                    moduleName={m.name}
                    activeNotebookId={activeNotebook?.id}
                    onClipCaptured={handleClipCaptured}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-[#050a0f]">
                     <Loader2 className="animate-spin text-primary" size={40} />
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mt-4">
                       {isLoading ? `Initializing ${m.name}` : 'Missing Protocol Data'}
                     </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {viewMode !== 'pdf-only' && (
          <div 
            className={cn(
              "h-full bg-[#0d141d] z-20 overflow-hidden shadow-[-20px_0_50px_rgba(0,0,0,0.5)]",
              viewMode === 'floating' ? "fixed top-16 right-6 w-[380px] h-[75vh] border border-primary/20" : "flex-1"
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
