
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
  ChevronRight,
  Undo,
  Redo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface NotebookPanelProps {
  notebookId: string;
}

export function NotebookPanel({ notebookId }: NotebookPanelProps) {
  const [page, setPage] = useState(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[]>([]);
  const [clips, setClips] = useState<WorkspaceClip[]>([]);
  const [activeTool, setActiveTool] = useState<'pencil' | 'highlighter' | 'eraser'>('pencil');
  
  const permanentCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // High-responsiveness refs
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    const annData = await db.getNotebookAnnotations(notebookId, page);
    const clipData = await db.getNotebookClips(notebookId);
    setAnnotations(annData);
    setRedoStack([]);
    setClips(clipData.filter(c => c.notebookId === notebookId));
  }, [notebookId, page]);

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener('titrate:clip-captured', handleRefresh);
    return () => window.removeEventListener('titrate:clip-captured', handleRefresh);
  }, [loadData]);

  const drawPath = (ctx: CanvasRenderingContext2D, points: {x: number, y: number}[], width: number, canvas: HTMLCanvasElement) => {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.lineWidth = width;
    points.forEach((p, i) => {
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  const drawPermanent = useCallback(() => {
    const canvas = permanentCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use offscreen buffer to prevent blinking
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const oCtx = offscreen.getContext('2d');
    if (!oCtx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

    annotations.forEach(ann => {
      oCtx.save();
      if (ann.tool === 'eraser') {
        oCtx.globalCompositeOperation = 'destination-out';
        oCtx.strokeStyle = 'rgba(0,0,0,1)';
        oCtx.globalAlpha = 1.0;
      } else if (ann.tool === 'highlighter') {
        oCtx.globalCompositeOperation = 'source-over';
        oCtx.strokeStyle = ann.color;
        oCtx.globalAlpha = 0.3;
      } else {
        oCtx.globalCompositeOperation = 'source-over';
        oCtx.strokeStyle = ann.color;
        oCtx.globalAlpha = 1.0;
      }
      
      oCtx.lineCap = 'round';
      oCtx.lineJoin = 'round';
      drawPath(oCtx, ann.points, ann.width * dpr, offscreen);
      oCtx.restore();
    });

    // Atomic blit to visible canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreen, 0, 0);
  }, [annotations]);

  // Direct manual draw function for zero latency
  const drawActiveStrokeManually = useCallback(() => {
    const canvas = activeCanvasRef.current;
    const points = pointsRef.current;
    if (!canvas || points.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    if (activeTool === 'eraser') {
      const pCanvas = permanentCanvasRef.current;
      if (pCanvas) {
        const pCtx = pCanvas.getContext('2d');
        if (pCtx) {
          pCtx.save();
          pCtx.globalCompositeOperation = 'destination-out';
          pCtx.lineWidth = 40 * dpr;
          pCtx.lineCap = 'round';
          pCtx.lineJoin = 'round';
          
          const p1 = points[points.length - 2];
          const p2 = points[points.length - 1];
          pCtx.beginPath();
          pCtx.moveTo(p1.x * pCanvas.width, p1.y * pCanvas.height);
          pCtx.lineTo(p2.x * pCanvas.width, p2.y * pCanvas.height);
          pCtx.stroke();
          pCtx.restore();
        }
      }
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.strokeStyle = activeTool === 'highlighter' ? '#ffff00' : '#00ff7f';
      ctx.lineWidth = (activeTool === 'highlighter' ? 20 : 3) * dpr;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = activeTool === 'highlighter' ? 0.3 : 1;
      
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = p.x * canvas.width;
        const y = p.y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
    }
  }, [activeTool]);

  useEffect(() => {
    const resize = () => {
      const p = permanentCanvasRef.current;
      const a = activeCanvasRef.current;
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
      if (p && a && containerRef.current) {
        p.width = a.width = 1600 * dpr;
        p.height = a.height = 2262 * dpr;
        drawPermanent();
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [drawPermanent]);

  useEffect(() => {
    drawPermanent();
  }, [annotations, drawPermanent]);

  const handlePointerStart = (e: React.PointerEvent) => {
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    isDrawingRef.current = true;
    pointsRef.current = [{ x, y }];
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawingRef.current) return;
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Use coalesced events for smoothness
    const events = (e.nativeEvent as any).getCoalescedEvents 
      ? (e.nativeEvent as any).getCoalescedEvents() 
      : [e.nativeEvent];

    for (const ev of events) {
      const x = (ev.clientX - rect.left) / rect.width;
      const y = (ev.clientY - rect.top) / rect.height;
      pointsRef.current.push({ x, y });
    }

    drawActiveStrokeManually();
  };

  const handlePointerEnd = async () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    
    if (pointsRef.current.length < 2) {
      pointsRef.current = [];
      return;
    }

    const finalPoints = [...pointsRef.current];
    pointsRef.current = [];

    // Immediate commit to permanent canvas to prevent flicker
    const pCanvas = permanentCanvasRef.current;
    if (pCanvas && activeTool !== 'eraser') {
      const pCtx = pCanvas.getContext('2d');
      if (pCtx) {
        pCtx.save();
        const color = activeTool === 'highlighter' ? '#ffff00' : '#00ff7f';
        const width = activeTool === 'highlighter' ? 20 : 3;
        const alpha = activeTool === 'highlighter' ? 0.3 : 1;
        const dpr = window.devicePixelRatio || 1;
        
        pCtx.strokeStyle = color;
        pCtx.lineWidth = width * dpr;
        pCtx.globalAlpha = alpha;
        pCtx.lineCap = 'round';
        pCtx.lineJoin = 'round';
        
        drawPath(pCtx, finalPoints, width * dpr, pCanvas);
        pCtx.restore();
      }
    }

    // Clear active canvas preview
    const canvas = activeCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    const newAnn: Annotation = {
      id: `ann-nb-${Date.now()}`,
      notebookId,
      pageNumber: page,
      tool: activeTool,
      color: activeTool === 'highlighter' ? '#ffff00' : (activeTool === 'eraser' ? '#000000' : '#00ff7f'),
      width: activeTool === 'highlighter' ? 20 : (activeTool === 'eraser' ? 40 : 3),
      opacity: activeTool === 'highlighter' ? 0.3 : 1,
      points: finalPoints
    };

    await db.put('annotations', newAnn);
    setAnnotations(prev => [...prev, newAnn]);
    setRedoStack([]);
  };

  const handleUndo = async () => {
    if (annotations.length === 0) return;
    const last = annotations[annotations.length - 1];
    await db.delete('annotations', last.id);
    setAnnotations(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, last]);
  };

  const handleRedo = async () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    await db.put('annotations', last);
    setRedoStack(prev => prev.slice(0, -1));
    setAnnotations(prev => [...prev, last]);
  };

  const handleClearPage = async () => {
    if (annotations.length === 0) return;
    for (const ann of annotations) {
      await db.delete('annotations', ann.id);
    }
    setAnnotations([]);
    setRedoStack([]);
    toast({ title: "Workspace Cleared", description: "All notations removed from this page." });
  };

  const deleteClip = async (id: string) => {
    await db.delete('clips', id);
    setClips(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="flex flex-col h-full bg-[#0d141d]">
      <div className="h-12 bg-[#16222d] border-b border-white/5 flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-0.5">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTool('pencil')}
            className={cn("h-8 w-8", activeTool === 'pencil' ? "text-primary bg-white/5" : "text-white/20")}
          >
            <Pencil size={14} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTool('highlighter')}
            className={cn("h-8 w-8", activeTool === 'highlighter' ? "text-primary bg-white/5" : "text-white/20")}
          >
            <Highlighter size={14} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTool('eraser')}
            className={cn("h-8 w-8", activeTool === 'eraser' ? "text-primary bg-white/5" : "text-white/20")}
          >
            <Eraser size={14} />
          </Button>
        </div>

        <div className="flex items-center gap-0.5 border-l border-white/5 pl-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleUndo}
            disabled={annotations.length === 0}
            className="h-8 w-8 text-white/40 disabled:opacity-10"
            title="Undo"
          >
            <Undo size={14} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="h-8 w-8 text-white/40 disabled:opacity-10"
            title="Redo"
          >
            <Redo size={14} />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearPage}
            className="h-8 w-8 text-red-500/40 hover:text-red-500"
            title="Clear Page"
          >
            <Trash2 size={14} />
          </Button>
        </div>

        <div className="flex items-center gap-1 mx-auto">
          <Button variant="ghost" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} className="h-7 w-7 text-white/40">
            <ChevronLeft size={14} />
          </Button>
          <span className="text-[8px] font-black text-white px-1">PG {page}</span>
          <Button variant="ghost" size="icon" onClick={() => setPage(p => p + 1)} className="h-7 w-7 text-white/40">
            <ChevronRight size={14} />
          </Button>
        </div>

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white"><Download size={14} /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white"><Share2 size={14} /></Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 relative" ref={containerRef}>
        <div className="aspect-[1/1.414] bg-[#1a2430] shadow-2xl relative mx-auto max-w-[800px]">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
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

          <canvas ref={permanentCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
          <canvas
            ref={activeCanvasRef}
            className="absolute inset-0 w-full h-full touch-none cursor-crosshair z-20"
            onPointerDown={handlePointerStart}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerLeave={handlePointerEnd}
          />
        </div>
      </div>
    </div>
  );
}
