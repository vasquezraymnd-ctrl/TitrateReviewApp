
"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import { db, Annotation, WorkspaceClip } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { 
  Pencil, 
  Highlighter, 
  Eraser, 
  Trash2, 
  Download, 
  Share2,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotebookPanelProps {
  notebookId: string;
}

export function NotebookPanel({ notebookId }: NotebookPanelProps) {
  const [page, setPage] = useState(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [clips, setClips] = useState<WorkspaceClip[]>([]);
  const [activeTool, setActiveTool] = useState<'pencil' | 'highlighter' | 'eraser'>('pencil');
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[] | null>(null);
  
  const permanentCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    const annData = await db.getNotebookAnnotations(notebookId, page);
    const clipData = await db.getNotebookClips(notebookId);
    setAnnotations(annData);
    setClips(clipData.filter(c => c.notebookId === notebookId));
  }, [notebookId, page]);

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener('titrate:clip-captured', handleRefresh);
    return () => window.removeEventListener('titrate:clip-captured', handleRefresh);
  }, [loadData]);

  const drawPermanent = useCallback(() => {
    const canvas = permanentCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach(ann => {
      ctx.beginPath();
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = ann.tool === 'highlighter' ? 0.3 : 1;
      
      ann.points.forEach((p, i) => {
        const x = p.x * canvas.width;
        const y = p.y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }, [annotations]);

  const drawActive = useCallback(() => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentStroke) {
      ctx.beginPath();
      ctx.strokeStyle = activeTool === 'highlighter' ? '#ffff00' : '#00ff7f';
      ctx.lineWidth = activeTool === 'highlighter' ? 20 : 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = activeTool === 'highlighter' ? 0.3 : 1;
      
      currentStroke.forEach((p, i) => {
        const x = p.x * canvas.width;
        const y = p.y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [currentStroke, activeTool]);

  useEffect(() => {
    drawPermanent();
  }, [drawPermanent]);

  useEffect(() => {
    drawActive();
  }, [drawActive]);

  const handlePointerStart = (e: React.PointerEvent) => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (activeTool === 'eraser') {
      handleErase(x, y);
      return;
    }
    setCurrentStroke([{ x, y }]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!currentStroke) return;
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (activeTool === 'eraser') {
      handleErase(x, y);
      return;
    }
    setCurrentStroke(prev => prev ? [...prev, { x, y }] : null);
  };

  const handlePointerEnd = async () => {
    if (!currentStroke) return;
    const newAnn: Annotation = {
      id: `ann-nb-${Date.now()}`,
      notebookId,
      pageNumber: page,
      tool: activeTool === 'highlighter' ? 'highlighter' : 'pencil',
      color: activeTool === 'highlighter' ? '#ffff00' : '#00ff7f',
      width: activeTool === 'highlighter' ? 20 : 3,
      opacity: activeTool === 'highlighter' ? 0.3 : 1,
      points: currentStroke
    };
    await db.put('annotations', newAnn);
    setAnnotations(prev => [...prev, newAnn]);
    setCurrentStroke(null);
  };

  const handleErase = async (x: number, y: number) => {
    const toDelete = annotations.find(ann => 
      ann.points.some(p => Math.abs(p.x - x) < 0.05 && Math.abs(p.y - y) < 0.05)
    );
    if (toDelete) {
      await db.delete('annotations', toDelete.id);
      setAnnotations(prev => prev.filter(a => a.id !== toDelete.id));
    }
  };

  const deleteClip = async (id: string) => {
    await db.delete('clips', id);
    setClips(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-[#0d141d]">
      <div className="h-14 bg-[#16222d] border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTool('pencil')}
            className={cn("h-8 w-8", activeTool === 'pencil' ? "text-primary" : "text-white/20")}
          >
            <Pencil size={14} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTool('highlighter')}
            className={cn("h-8 w-8", activeTool === 'highlighter' ? "text-primary" : "text-white/20")}
          >
            <Highlighter size={14} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTool('eraser')}
            className={cn("h-8 w-8", activeTool === 'eraser' ? "text-primary" : "text-white/20")}
          >
            <Eraser size={14} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} className="h-8 w-8 text-white/40">
            <ChevronLeft size={16} />
          </Button>
          <span className="text-[10px] font-black text-white">PG {page}</span>
          <Button variant="ghost" size="icon" onClick={() => setPage(p => p + 1)} className="h-8 w-8 text-white/40">
            <ChevronRight size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white"><Download size={14} /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white"><Share2 size={14} /></Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 relative" ref={containerRef}>
        <div className="aspect-[1/1.414] bg-[#1a2430] shadow-2xl relative">
          {/* Clips Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {clips.map(clip => (
              <div 
                key={clip.id} 
                className="absolute bg-black/20 border border-white/5 group pointer-events-auto p-1"
                style={{ left: `${clip.x}%`, top: `${clip.y}%`, maxWidth: '80%' }}
              >
                <img src={clip.dataUrl} alt="Clip" className="max-w-full h-auto" />
                <div className="flex items-center justify-between mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[7px] font-black text-primary uppercase truncate max-w-[100px]">{clip.sourceModuleName}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-4 w-4 text-white/40 hover:text-white"><ExternalLink size={8} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteClip(clip.id)} className="h-4 w-4 text-red-500/40 hover:text-red-500"><Trash2 size={8} /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Static Annotations Layer */}
          <canvas
            ref={permanentCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            width={800}
            height={1131}
          />

          {/* Active Drawing Layer */}
          <canvas
            ref={activeCanvasRef}
            className="absolute inset-0 w-full h-full touch-none cursor-crosshair z-20"
            onPointerDown={handlePointerStart}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerLeave={handlePointerEnd}
            width={800}
            height={1131}
          />
        </div>
      </div>
    </div>
  );
}
