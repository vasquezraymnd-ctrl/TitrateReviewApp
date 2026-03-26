
"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  Pencil,
  Highlighter,
  Eraser,
  MousePointer2,
  Trash2,
  Plus,
  Scissors
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { db, Annotation, ToolPreset, WorkspaceClip } from '@/lib/db';

// CSS for text selection and link interaction
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up worker for PDF processing with explicit HTTPS protocol
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  file: Uint8Array | string | null;
  moduleId: string;
  moduleName?: string;
  onClipCaptured?: (clip: WorkspaceClip) => void;
  activeNotebookId?: string | null;
}

type Tool = 'view' | 'pencil' | 'highlighter' | 'eraser' | 'laser' | 'lasso';

export function PdfViewer({ file, moduleId, moduleName, onClipCaptured, activeNotebookId }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  
  // Transform States
  const [scale, setScale] = useState(1.0);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('view');
  const [currentColor, setCurrentColor] = useState('#00ff7f');
  
  // Interaction tracking
  const [isInteracting, setIsInteracting] = useState(false);
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const pinchStartDistance = useRef<number>(0);
  const pinchStartScale = useRef<number>(1.0);

  // Thickness States
  const [pencilWidth, setPencilWidth] = useState(3);
  const [highlighterWidth, setHighlighterWidth] = useState(25);
  const [eraserWidth, setEraserWidth] = useState(40);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[] | null>(null);
  const [presets, setPresets] = useState<ToolPreset[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // High-res rendering scale to ensure ink isn't pixelated when zooming
  const RENDER_QUALITY = 2.5;

  const documentFile = useMemo(() => {
    if (!file) return null;
    return typeof file === 'string' ? file : { data: file };
  }, [file, moduleId]);

  const loadInitialData = useCallback(async () => {
    if (!moduleId) return;
    const annData = await db.getAnnotations(moduleId, pageNumber);
    setAnnotations(annData);
    const presetData = await db.getAll<ToolPreset>('presets');
    setPresets(presetData);
  }, [moduleId, pageNumber]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoaded(true);
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 4.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.3));
  const fitToWidth = () => {
    const container = document.getElementById('pdf-viewport');
    if (container) {
      const newScale = (container.clientWidth - 80) / 850;
      setScale(newScale);
      setTranslateX(0);
      setTranslateY(0);
    }
  };

  const getCurrentWidth = () => {
    if (activeTool === 'pencil') return pencilWidth;
    if (activeTool === 'highlighter') return highlighterWidth;
    if (activeTool === 'eraser') return eraserWidth;
    return 3;
  };

  const handleWidthChange = (val: number) => {
    if (activeTool === 'pencil') setPencilWidth(val);
    if (activeTool === 'highlighter') setHighlighterWidth(val);
    if (activeTool === 'eraser') setEraserWidth(val);
  };

  const applyPreset = (preset: ToolPreset) => {
    setActiveTool(preset.type === 'pencil' ? 'pencil' : 'highlighter');
    setCurrentColor(preset.color);
    if (preset.type === 'pencil') setPencilWidth(preset.width);
    else setHighlighterWidth(preset.width);
  };

  const savePreset = async () => {
    if (activeTool !== 'pencil' && activeTool !== 'highlighter') return;
    const newPreset: ToolPreset = {
      id: `preset-${Date.now()}`,
      type: activeTool === 'pencil' ? 'pencil' : 'highlighter',
      color: currentColor,
      width: getCurrentWidth(),
      opacity: activeTool === 'highlighter' ? 0.3 : 1
    };
    await db.put('presets', newPreset);
    setPresets(prev => [...prev, newPreset]);
  };

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach(ann => {
      ctx.beginPath();
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.width * RENDER_QUALITY;
      
      if (ann.tool === 'highlighter') {
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
        ctx.globalAlpha = ann.opacity || 0.3;
        ctx.globalCompositeOperation = 'multiply';
      } else {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
      }

      ann.points.forEach((p, index) => {
        const x = p.x * canvas.width;
        const y = p.y * canvas.height;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    if (currentStroke) {
      ctx.beginPath();
      ctx.strokeStyle = activeTool === 'lasso' ? '#00ff7f' : currentColor;
      ctx.lineWidth = activeTool === 'lasso' ? 2 : getCurrentWidth() * RENDER_QUALITY;
      
      if (activeTool === 'highlighter') {
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
        ctx.globalAlpha = 0.3;
        ctx.globalCompositeOperation = 'multiply';
      } else {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
      }

      if (activeTool === 'lasso') ctx.setLineDash([5, 5]);
      else ctx.setLineDash([]);

      currentStroke.forEach((p, index) => {
        const x = p.x * canvas.width;
        const y = p.y * canvas.height;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [annotations, currentStroke, activeTool, currentColor, pencilWidth, highlighterWidth, eraserWidth]);

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsInteracting(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    lastTouchRef.current = { x: clientX, y: clientY };

    if ('touches' in e && e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      pinchStartDistance.current = dist;
      pinchStartScale.current = scale;
      setCurrentStroke(null);
      return;
    }

    if (activeTool === 'view') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    if (activeTool === 'eraser') {
      handleErase(x, y);
      return;
    }

    setCurrentStroke([{ x, y }]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isInteracting) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if ('touches' in e && e.touches.length === 2 && pinchStartDistance.current > 0) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const ratio = dist / pinchStartDistance.current;
      setScale(Math.min(Math.max(pinchStartScale.current * ratio, 0.3), 4.0));
      return;
    }

    if (activeTool === 'view') {
      const dx = clientX - lastTouchRef.current.x;
      const dy = clientY - lastTouchRef.current.y;
      setTranslateX(prev => prev + dx);
      setTranslateY(prev => prev + dy);
      lastTouchRef.current = { x: clientX, y: clientY };
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || !currentStroke) return;
    const rect = canvas.getBoundingClientRect();
    
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    if (activeTool === 'eraser') {
      handleErase(x, y);
      return;
    }

    setCurrentStroke(prev => prev ? [...prev, { x, y }] : null);
  };

  const handleEnd = async () => {
    setIsInteracting(false);
    pinchStartDistance.current = 0;

    if (activeTool === 'view' || !currentStroke || !moduleId) {
      setCurrentStroke(null);
      return;
    }

    if (activeTool === 'lasso') {
      handleLassoCapture();
      return;
    }

    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      moduleId,
      pageNumber,
      tool: activeTool === 'highlighter' ? 'highlighter' : 'pencil',
      color: currentColor,
      width: activeTool === 'highlighter' ? highlighterWidth : pencilWidth,
      opacity: activeTool === 'highlighter' ? 0.3 : 1,
      points: currentStroke
    };

    await db.put('annotations', newAnnotation);
    setAnnotations(prev => [...prev, newAnnotation]);
    setCurrentStroke(null);
  };

  const handleLassoCapture = () => {
    if (!currentStroke || !onClipCaptured || !activeNotebookId) {
      setCurrentStroke(null);
      return;
    }

    const xs = currentStroke.map(p => p.x);
    const ys = currentStroke.map(p => p.y);
    const minX = Math.max(0, Math.min(...xs));
    const maxX = Math.min(1, Math.max(...xs));
    const minY = Math.max(0, Math.min(...ys));
    const maxY = Math.min(1, Math.max(...ys));
    const width = maxX - minX;
    const height = maxY - minY;

    const sourceCanvas = document.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
    if (!sourceCanvas || width <= 0 || height <= 0) return;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = width * sourceCanvas.width;
    cropCanvas.height = height * sourceCanvas.height;
    const cropCtx = cropCanvas.getContext('2d');
    
    if (cropCtx) {
      cropCtx.drawImage(
        sourceCanvas,
        minX * sourceCanvas.width,
        minY * sourceCanvas.height,
        width * sourceCanvas.width,
        height * sourceCanvas.height,
        0, 0, cropCanvas.width, cropCanvas.height
      );

      const clip: WorkspaceClip = {
        id: `clip-${Date.now()}`,
        sourceModuleId: moduleId,
        sourceModuleName: moduleName || 'Unknown Protocol',
        pageNumber,
        rect: { x: minX, y: minY, w: width, h: height },
        dataUrl: cropCanvas.toDataURL('image/png'),
        notebookId: activeNotebookId,
        x: 50,
        y: 50
      };

      onClipCaptured(clip);
    }

    setCurrentStroke(null);
  };

  const handleErase = async (x: number, y: number) => {
    if (!moduleId) return;
    const threshold = (eraserWidth / 1000) + 0.01; 
    const toDelete = annotations.find(ann => 
      ann.points.some(p => Math.abs(p.x - x) < threshold && Math.abs(p.y - y) < threshold)
    );
    if (toDelete) {
      await db.delete('annotations', toDelete.id);
      setAnnotations(prev => prev.filter(a => a.id !== toDelete.id));
    }
  };

  const clearPage = async () => {
    if (!moduleId) return;
    for (const ann of annotations) {
      await db.delete('annotations', ann.id);
    }
    setAnnotations([]);
  };

  const isAnnotationActive = activeTool === 'pencil' || activeTool === 'highlighter' || activeTool === 'eraser';

  return (
    <div className="flex flex-col h-full bg-[#050a0f] relative overflow-hidden">
      <div className="bg-[#111a24] border-b border-white/5 flex flex-col z-[100] shrink-0">
        {/* Unified Pages, Calibration, and Zoom Tray */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 gap-2 md:gap-4 overflow-x-auto no-scrollbar">
          {/* Page Navigation Area */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/40 hover:text-primary h-8 w-8 md:h-9 md:w-9"
              disabled={pageNumber <= 1}
              onClick={() => { setPageNumber(prev => prev - 1); setIsLoaded(false); }}
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="bg-white/5 border border-white/10 px-2 md:px-3 py-1 md:py-1.5 min-w-[80px] md:min-w-[100px] text-center">
              <span className="text-[9px] md:text-[10px] font-black italic uppercase tracking-widest text-white">
                PG {pageNumber} <span className="text-muted-foreground mx-0.5 md:mx-1">/</span> {numPages || '--'}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/40 hover:text-primary h-8 w-8 md:h-9 md:w-9"
              disabled={numPages ? pageNumber >= numPages : true}
              onClick={() => { setPageNumber(prev => prev + 1); setIsLoaded(false); }}
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Tactical Calibration Area (Thickness & Colors) */}
          {/* Automatically appears when an annotation tool is active */}
          {isAnnotationActive && (
            <div className="flex items-center gap-2 md:gap-4 flex-1 justify-center animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 md:gap-3 bg-white/5 border border-white/10 p-1 px-2 md:px-3 h-10 shrink-0">
                <Slider 
                  value={[getCurrentWidth()]}
                  max={activeTool === 'pencil' ? 10 : activeTool === 'eraser' ? 100 : 60}
                  min={1}
                  step={1}
                  onValueChange={(vals) => handleWidthChange(vals[0])}
                  className="w-16 md:w-24 xl:w-32"
                />
                <span className="text-[8px] md:text-[9px] font-black text-primary min-w-[15px] md:min-w-[20px]">{getCurrentWidth()}</span>
              </div>

              {activeTool !== 'eraser' && (
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-1 px-1.5 md:px-2 h-10 shrink-0">
                  {['#000000', '#00ff7f', '#ff4d4d', '#3399ff', '#ffff00'].map(color => (
                    <button
                      key={color}
                      onClick={() => setCurrentColor(color)}
                      className={cn(
                        "w-5 h-5 md:w-6 md:h-6 rounded-none border transition-transform",
                        currentColor === color ? "scale-110 border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]" : "border-white/10 hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <Button variant="ghost" size="icon" onClick={savePreset} className="h-6 w-6 md:h-7 md:w-7 text-white/40 hover:text-primary">
                    <Plus size={12} />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Zoom and Display Area */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="flex items-center bg-white/5 border border-white/10 p-1">
               <Button variant="ghost" size="icon" onClick={zoomOut} className="h-7 w-7 md:h-8 md:w-8 text-white/60 hover:text-white">
                 <ZoomOut size={14} />
               </Button>
               <div className="w-12 md:w-16 text-center text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest">
                 {Math.round(scale * 100)}%
               </div>
               <Button variant="ghost" size="icon" onClick={zoomIn} className="h-7 w-7 md:h-8 md:w-8 text-white/60 hover:text-white">
                 <ZoomIn size={14} />
               </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={fitToWidth} title="Fit to Width" className="hidden sm:flex text-white/40 hover:text-primary">
              <Maximize size={16} />
            </Button>
          </div>
        </div>

        {/* Primary Tool Selection Bar */}
        <div className="h-14 flex items-center px-4 md:px-6 gap-2 overflow-x-auto no-scrollbar border-b border-white/5">
          <div className="flex items-center gap-1 shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTool('view')}
              className={cn("h-8 gap-2 font-black text-[9px] uppercase tracking-widest px-3 md:px-4", activeTool === 'view' ? "bg-primary text-black" : "text-white/40 hover:bg-white/5")}
            >
              <MousePointer2 size={12} /> View
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTool('pencil')}
              className={cn("h-8 gap-2 font-black text-[9px] uppercase tracking-widest px-3 md:px-4", activeTool === 'pencil' ? "bg-primary text-black" : "text-white/40 hover:bg-white/5")}
            >
              <Pencil size={12} /> Pen
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTool('highlighter')}
              className={cn("h-8 gap-2 font-black text-[9px] uppercase tracking-widest px-3 md:px-4", activeTool === 'highlighter' ? "bg-primary text-black" : "text-white/40 hover:bg-white/5")}
            >
              <Highlighter size={12} /> Marker
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTool('lasso')}
              className={cn("h-8 gap-2 font-black text-[9px] uppercase tracking-widest px-3 md:px-4", activeTool === 'lasso' ? "bg-primary text-black" : "text-white/40 hover:bg-white/5")}
            >
              <Scissors size={12} /> Lasso
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTool('eraser')}
              className={cn("h-8 gap-2 font-black text-[9px] uppercase tracking-widest px-3 md:px-4", activeTool === 'eraser' ? "bg-primary text-black" : "text-white/40 hover:bg-white/5")}
            >
              <Eraser size={12} /> Eraser
            </Button>
          </div>

          <div className="w-px h-4 bg-white/10 mx-1 md:mx-2 shrink-0" />

          {/* Quick Presets Area */}
          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {presets.map(p => (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className="w-7 h-7 md:w-8 md:h-8 border border-white/10 rounded-none flex items-center justify-center hover:bg-white/5 transition-all"
                style={{ color: p.color }}
              >
                {p.type === 'pencil' ? <Pencil size={12} /> : <Highlighter size={12} />}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon" onClick={clearPage} className="h-8 w-8 text-red-500/50 hover:text-red-500">
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div 
        id="pdf-viewport" 
        className="flex-1 overflow-hidden flex justify-center items-center bg-[#050a0f] relative touch-none select-none cursor-grab active:cursor-grabbing"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        <div 
          className="relative transition-transform duration-75 ease-out will-change-transform"
          style={{ 
            transform: `translate3d(${translateX}px, ${translateY}px, 0) scale3d(${scale}, ${scale}, 1)`,
          }}
        >
          {documentFile ? (
            <Document
              file={documentFile}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<div className="py-40 flex flex-col items-center gap-4"><Loader2 className="animate-spin text-primary" size={48} /><p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Decrypting Archive...</p></div>}
            >
              {isLoaded && (
                <div className="relative bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                  <Page 
                    pageNumber={pageNumber} 
                    scale={RENDER_QUALITY} 
                    className="max-w-none"
                    onRenderSuccess={(page) => {
                      const canvas = canvasRef.current;
                      if (canvas) {
                        canvas.width = page.width;
                        canvas.height = page.height;
                        drawAll();
                      }
                    }}
                  />
                  <canvas
                    ref={canvasRef}
                    className={cn(
                      "absolute inset-0 z-10 touch-none",
                      activeTool === 'view' ? "pointer-events-none" : "cursor-crosshair"
                    )}
                  />
                </div>
              )}
            </Document>
          ) : (
            <div className="py-40 flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-primary" size={48} />
              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Preparing Protocol Data...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
