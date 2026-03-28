
"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Document, Page, Outline, pdfjs } from 'react-pdf';
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Pencil,
  Highlighter,
  Eraser,
  MousePointer2,
  Trash2,
  List,
  Check,
  Undo,
  Redo
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { db, Annotation, WorkspaceClip } from '@/lib/db';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  file: Uint8Array | string | null;
  moduleId: string;
  moduleName?: string;
  onClipCaptured?: (clip: WorkspaceClip) => void;
  activeNotebookId?: string | null;
}

type Tool = 'view' | 'pencil' | 'highlighter' | 'eraser';

export function PdfViewer({ file, moduleId, moduleName, onClipCaptured, activeNotebookId }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [jumpPage, setJumpPage] = useState("");
  
  const transformLayerRef = useRef<HTMLDivElement>(null);
  const transformState = useRef({ x: 0, y: 0, scale: 1.0 });
  const [uiScale, setUiScale] = useState(1.0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('view');
  const [currentColor, setCurrentColor] = useState('#00ff7f');
  const [isDragging, setIsDragging] = useState(false);
  
  const pointerCache = useRef<PointerEvent[]>([]);
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const pinchStartDistance = useRef<number>(0);
  const pinchStartScale = useRef<number>(1.0);
  const pinchStartCenter = useRef({ x: 0, y: 0 });
  const pinchStartTranslation = useRef({ x: 0, y: 0 });
  const rafRequestRef = useRef<number | null>(null);

  // High responsiveness drawing refs
  const isDrawingRef = useRef(false);
  const pointsRef = useRef<{ x: number; y: number }[]>([]);

  const [pencilWidth, setPencilWidth] = useState(3);
  const [highlighterWidth, setHighlighterWidth] = useState(25);
  const [eraserWidth, setEraserWidth] = useState(40);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[]>([]);
  
  const permanentCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);

  const RENDER_QUALITY = 3.5;

  const documentFile = useMemo(() => {
    if (!file) return null;
    return typeof file === 'string' ? file : { data: file };
  }, [file]);

  const loadInitialData = useCallback(async () => {
    if (!moduleId) return;
    const annData = await db.getAnnotations(moduleId, pageNumber);
    setAnnotations(annData);
  }, [moduleId, pageNumber]);

  useEffect(() => {
    loadInitialData();
    setRedoStack([]);
  }, [loadInitialData]);

  const applyTransform = useCallback((hasTransition = false) => {
    if (transformLayerRef.current) {
      const { x, y, scale } = transformState.current;
      transformLayerRef.current.style.transition = hasTransition ? 'transform 150ms ease-out' : 'none';
      transformLayerRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale3d(${scale}, ${scale}, 1)`;
    }
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoaded(true);
    requestAnimationFrame(() => applyTransform());
  }, [applyTransform]);

  const handleJumpPage = () => {
    const p = parseInt(jumpPage, 10);
    if (!isNaN(p) && numPages && p >= 1 && p <= numPages) {
      setPageNumber(p);
      setJumpPage("");
    }
  };

  const zoomIn = () => {
    transformState.current.scale = Math.min(transformState.current.scale + 0.2, 4.0);
    setUiScale(transformState.current.scale);
    applyTransform(true);
  };

  const zoomOut = () => {
    transformState.current.scale = Math.max(transformState.current.scale - 0.2, 0.3);
    setUiScale(transformState.current.scale);
    applyTransform(true);
  };
  
  const getCurrentWidth = useCallback(() => {
    if (activeTool === 'pencil') return pencilWidth;
    if (activeTool === 'highlighter') return highlighterWidth;
    if (activeTool === 'eraser') return eraserWidth;
    return 3;
  }, [activeTool, pencilWidth, highlighterWidth, eraserWidth]);

  const handleWidthChange = (val: number) => {
    if (activeTool === 'pencil') setPencilWidth(val);
    if (activeTool === 'highlighter') setHighlighterWidth(val);
    if (activeTool === 'eraser') setEraserWidth(val);
  };

  const drawPath = (ctx: CanvasRenderingContext2D, points: {x: number, y: number}[], width: number, canvas: HTMLCanvasElement) => {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.lineWidth = width;
    points.forEach((p, index) => {
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  const drawPermanent = useCallback(() => {
    const canvas = permanentCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

    annotations.forEach(ann => {
      ctx.save();
      if (ann.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else if (ann.tool === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = ann.color;
        ctx.globalAlpha = ann.opacity || 0.3;
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = ann.color;
        ctx.globalAlpha = 1.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      drawPath(ctx, ann.points, ann.width * RENDER_QUALITY * dpr, canvas);
      ctx.restore();
    });
  }, [annotations]);

  const drawActiveStrokeManually = useCallback(() => {
    const canvas = activeCanvasRef.current;
    const points = pointsRef.current;
    if (!canvas || points.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

    if (activeTool === 'eraser') {
      const pCanvas = permanentCanvasRef.current;
      if (pCanvas) {
        const pCtx = pCanvas.getContext('2d');
        if (pCtx) {
          pCtx.save();
          pCtx.globalCompositeOperation = 'destination-out';
          pCtx.lineWidth = eraserWidth * RENDER_QUALITY * dpr;
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
      if (activeTool === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = currentColor;
        ctx.globalAlpha = 0.3;
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
        ctx.globalAlpha = 1.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
      drawPath(ctx, points, getCurrentWidth() * RENDER_QUALITY * dpr, canvas);
      ctx.restore();
    }
  }, [activeTool, currentColor, eraserWidth, getCurrentWidth]);

  useEffect(() => { drawPermanent(); }, [drawPermanent]);

  const handlePointerStart = (e: React.PointerEvent) => {
    pointerCache.current.push(e.nativeEvent);
    lastTouchRef.current = { x: e.clientX, y: e.clientY };

    if (pointerCache.current.length === 2) {
      const p1 = pointerCache.current[0];
      const p2 = pointerCache.current[1];
      pinchStartDistance.current = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      pinchStartScale.current = transformState.current.scale;
      
      pinchStartCenter.current = {
        x: (p1.clientX + p2.clientX) / 2,
        y: (p1.clientY + p2.clientY) / 2
      };
      pinchStartTranslation.current = { x: transformState.current.x, y: transformState.current.y };
      
      isDrawingRef.current = false;
      pointsRef.current = [];
      setIsDragging(true);
      return;
    }

    if (activeTool === 'view') {
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    
    // Start drawing
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const canvas = activeCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    isDrawingRef.current = true;
    pointsRef.current = [{ x, y }];
  };

  const performMoveUpdates = useCallback(() => {
    if (pointerCache.current.length === 2) {
      const p1 = pointerCache.current[0];
      const p2 = pointerCache.current[1];
      const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
      
      const viewport = document.getElementById('pdf-viewport');
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const vCenterX = rect.left + rect.width / 2;
      const vCenterY = rect.top + rect.height / 2;

      if (pinchStartDistance.current > 0) {
        const ratio = dist / pinchStartDistance.current;
        const newScale = Math.min(Math.max(pinchStartScale.current * ratio, 0.3), 4.0);
        
        const currentCenterX = ((p1.clientX + p2.clientX) / 2) - vCenterX;
        const currentCenterY = ((p1.clientY + p2.clientY) / 2) - vCenterY;

        const originX = pinchStartCenter.current.x - vCenterX;
        const originY = pinchStartCenter.current.y - vCenterY;
        const startTx = pinchStartTranslation.current.x;
        const startTy = pinchStartTranslation.current.y;

        const nextTx = originX - (originX - startTx) * (newScale / pinchStartScale.current);
        const nextTy = originY - (originY - startTy) * (newScale / pinchStartScale.current);

        const dx = currentCenterX - originX;
        const dy = currentCenterY - originY;

        transformState.current.scale = newScale;
        transformState.current.x = nextTx + dx;
        transformState.current.y = nextTy + dy;
        setUiScale(newScale);
        applyTransform();
      }
      return;
    }

    if (pointerCache.current.length === 1) {
      const p = pointerCache.current[0];
      if (activeTool === 'view' && isDragging) {
        const dx = p.clientX - lastTouchRef.current.x;
        const dy = p.clientY - lastTouchRef.current.y;
        transformState.current.x += dx;
        transformState.current.y += dy;
        applyTransform();
        lastTouchRef.current = { x: p.clientX, y: p.clientY };
      } else if (isDrawingRef.current) {
        const canvas = activeCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        
        // Coalesced events check
        const events = (p as any).getCoalescedEvents ? (p as any).getCoalescedEvents() : [p];
        for (const ev of events) {
          const x = (ev.clientX - rect.left) / rect.width;
          const y = (ev.clientY - rect.top) / rect.height;
          pointsRef.current.push({ x, y });
        }
        
        drawActiveStrokeManually();
      }
    }
  }, [activeTool, isDragging, applyTransform, drawActiveStrokeManually]);

  const handlePointerMove = (e: React.PointerEvent) => {
    const index = pointerCache.current.findIndex(p => p.pointerId === e.pointerId);
    if (index !== -1) {
      pointerCache.current[index] = e.nativeEvent;
    }

    if (!rafRequestRef.current) {
      rafRequestRef.current = requestAnimationFrame(() => {
        performMoveUpdates();
        rafRequestRef.current = null;
      });
    }
  };

  const handlePointerEnd = async (e: React.PointerEvent) => {
    pointerCache.current = pointerCache.current.filter(p => p.pointerId !== e.pointerId);
    if (pointerCache.current.length < 2) {
      pinchStartDistance.current = 0;
    }
    setIsDragging(false);

    if (activeTool === 'view' || !isDrawingRef.current || !moduleId) {
      isDrawingRef.current = false;
      pointsRef.current = [];
      return;
    }

    isDrawingRef.current = false;
    const finalPoints = [...pointsRef.current];
    pointsRef.current = [];

    // Clear active preview
    const canvas = activeCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      moduleId,
      pageNumber,
      tool: activeTool === 'eraser' ? 'eraser' : (activeTool === 'highlighter' ? 'highlighter' : 'pencil'),
      color: activeTool === 'eraser' ? '#000000' : currentColor,
      width: getCurrentWidth(),
      opacity: activeTool === 'highlighter' ? 0.3 : 1,
      points: finalPoints
    };

    await db.put('annotations', newAnnotation);
    setAnnotations(prev => [...prev, newAnnotation]);
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

  const clearPage = async () => {
    if (!moduleId) return;
    for (const ann of annotations) {
      await db.delete('annotations', ann.id);
    }
    setAnnotations([]);
    setRedoStack([]);
  };

  if (!documentFile) return null;

  return (
    <Document 
      file={documentFile} 
      onLoadSuccess={onDocumentLoadSuccess}
      loading={<div className="py-20 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={32} /><p className="text-[8px] font-black uppercase tracking-widest text-primary/60">Decrypting Archive...</p></div>}
    >
      <div className="flex flex-col h-full bg-[#050a0f] relative overflow-hidden">
        <div className="h-12 bg-[#111a24] border-b border-white/5 flex items-center justify-between px-2 z-[100] shrink-0 gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 shrink-0">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white/40 hover:text-primary h-8 w-8" title="Index">
                  <List size={16} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#0b111a] border-white/10 text-white w-80 p-0 flex flex-col">
                <SheetHeader className="p-6 border-b border-white/5 shrink-0">
                  <SheetTitle className="text-white font-black italic uppercase tracking-tighter flex items-center gap-2">
                    <List className="text-primary" size={18} /> Protocol Index
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                  <Outline onItemClick={({ pageNumber }: any) => setPageNumber(parseInt(pageNumber, 10))} className="protocol-outline" />
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 p-0.5">
              <Button variant="ghost" size="icon" className="text-white/40 h-7 w-7" disabled={pageNumber <= 1} onClick={() => setPageNumber(prev => prev - 1)}>
                <ChevronLeft size={14} />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="px-2 h-7 min-w-[50px] text-center hover:bg-white/5 transition-colors">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white">{pageNumber} / {numPages || '--'}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="bg-[#111a24] border-white/10 p-3 w-40 rounded-none">
                  <div className="flex gap-2">
                    <Input value={jumpPage} onChange={(e) => setJumpPage(e.target.value)} placeholder="PG #" className="h-7 bg-white/5 border-white/10 text-[10px] rounded-none" onKeyDown={(e) => e.key === 'Enter' && handleJumpPage()} />
                    <Button onClick={handleJumpPage} size="sm" className="h-7 bg-primary text-black rounded-none text-[8px]">GO</Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" className="text-white/40 h-7 w-7" disabled={numPages ? pageNumber >= numPages : true} onClick={() => setPageNumber(prev => prev + 1)}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-black/20 p-1 border border-white/5 flex-1 max-w-2xl justify-center">
            <div className="flex items-center gap-0.5 border-r border-white/10 pr-2 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setActiveTool('view')} className={cn("h-8 w-8", activeTool === 'view' ? "bg-primary text-black" : "text-white/40")}>
                <MousePointer2 size={14} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setActiveTool('pencil')} className={cn("h-8 w-8", activeTool === 'pencil' ? "bg-primary text-black" : "text-white/40")}>
                <Pencil size={14} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setActiveTool('highlighter')} className={cn("h-8 w-8", activeTool === 'highlighter' ? "bg-primary text-black" : "text-white/40")}>
                <Highlighter size={14} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setActiveTool('eraser')} className={cn("h-8 w-8", activeTool === 'eraser' ? "bg-primary text-black" : "text-white/40")}>
                <Eraser size={14} />
              </Button>
            </div>

            {activeTool !== 'view' && (
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-300 overflow-hidden">
                <div className="flex flex-col w-20 md:w-32 gap-1 shrink-0">
                  <p className="text-[7px] font-black text-primary uppercase tracking-widest text-center truncate">Size: {getCurrentWidth()}</p>
                  <Slider value={[getCurrentWidth()]} max={activeTool === 'pencil' ? 15 : activeTool === 'eraser' ? 100 : 60} min={1} onValueChange={(v) => handleWidthChange(v[0])} />
                </div>
                {activeTool !== 'eraser' && (
                  <div className="flex items-center gap-1.5 border-l border-white/10 pl-3 shrink-0">
                    {['#000000', '#00ff7f', '#ff4d4d', '#3399ff', '#ffff00'].map(c => (
                      <button 
                        key={c} 
                        onClick={() => setCurrentColor(c)} 
                        className={cn("w-5 h-5 rounded-full border border-white/10 transition-transform active:scale-90 flex items-center justify-center", currentColor === c && "ring-1 ring-white ring-offset-1 ring-offset-[#111a24] scale-110")} 
                        style={{ backgroundColor: c }}
                      >
                        {currentColor === c && <Check size={8} className={c === '#ffff00' || c === '#00ff7f' ? "text-black" : "text-white"} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <div className="flex items-center bg-white/5 border border-white/10 p-0.5">
               <Button variant="ghost" size="icon" onClick={zoomOut} className="h-7 w-7 text-white/40"><ZoomOut size={12} /></Button>
               <span className="text-[8px] font-black text-primary w-10 text-center">{Math.round(uiScale * 100)}%</span>
               <Button variant="ghost" size="icon" onClick={zoomIn} className="h-7 w-7 text-white/40"><ZoomIn size={12} /></Button>
            </div>
            
            <div className="flex items-center gap-0.5 border-l border-white/10 pl-2">
              <Button variant="ghost" size="icon" onClick={handleUndo} disabled={annotations.length === 0} className="h-8 w-8 text-white/40 hover:text-white disabled:opacity-10" title="Undo"><Undo size={14} /></Button>
              <Button variant="ghost" size="icon" onClick={handleRedo} disabled={redoStack.length === 0} className="h-8 w-8 text-white/40 hover:text-white disabled:opacity-10" title="Redo"><Redo size={14} /></Button>
              <Button variant="ghost" size="icon" onClick={clearPage} className="h-8 w-8 text-red-500/40 hover:text-red-500" title="Clear Page"><Trash2 size={14} /></Button>
            </div>
          </div>
        </div>

        <div 
          id="pdf-viewport" 
          className={cn(
            "flex-1 overflow-hidden flex justify-center items-center bg-[#050a0f] relative touch-none select-none",
            activeTool === 'view' && (isDragging ? "cursor-grabbing" : "cursor-grab")
          )}
          onPointerDown={handlePointerStart}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
        >
          <div 
            ref={transformLayerRef}
            className="relative will-change-transform"
          >
            {isLoaded && (
              <div className="relative bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <Page 
                  key={`page-${pageNumber}`}
                  pageNumber={pageNumber} 
                  scale={RENDER_QUALITY} 
                  className="max-w-none"
                  onRenderSuccess={(page) => {
                    const permCanvas = permanentCanvasRef.current;
                    const activeCanvas = activeCanvasRef.current;
                    if (permCanvas && activeCanvas) {
                      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
                      permCanvas.width = activeCanvas.width = page.width * dpr;
                      permCanvas.height = activeCanvas.height = page.height * dpr;
                      permCanvas.style.width = activeCanvas.style.width = `${page.width}px`;
                      permCanvas.style.height = activeCanvas.style.height = `${page.height}px`;
                      drawPermanent();
                    }
                  }}
                />
                <canvas ref={permanentCanvasRef} className="absolute inset-0 z-10 pointer-events-none" style={{ imageRendering: 'auto' }} />
                <canvas ref={activeCanvasRef} className={cn("absolute inset-0 z-20 touch-none", activeTool === 'view' ? "pointer-events-none" : "cursor-crosshair")} style={{ imageRendering: 'auto' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Document>
  );
}
