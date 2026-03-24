"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { db, Annotation } from '@/lib/db';

// CSS for text selection and link interaction
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up worker for PDF processing
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  moduleId?: string;
}

type Tool = 'view' | 'pencil' | 'highlighter' | 'eraser';

export function PdfViewer({ url, moduleId }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('view');
  const [currentColor, setCurrentColor] = useState('#00ff7f');
  
  // Thickness States
  const [pencilWidth, setPencilWidth] = useState(3);
  const [highlighterWidth, setHighlighterWidth] = useState(25);
  const [eraserWidth, setEraserWidth] = useState(40);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[] | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load annotations for current page
  const loadAnnotations = useCallback(async () => {
    if (!moduleId) return;
    const data = await db.getAnnotations(moduleId, pageNumber);
    setAnnotations(data);
  }, [moduleId, pageNumber]);

  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoaded(true);
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  
  const fitToWidth = () => {
    const container = document.getElementById('pdf-viewport');
    if (container) {
      setScale(container.clientWidth / 850);
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

  // Canvas Drawing Logic
  const drawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved annotations
    annotations.forEach(ann => {
      ctx.beginPath();
      ctx.strokeStyle = ann.color;
      ctx.lineWidth = ann.width * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (ann.tool === 'highlighter') {
        ctx.globalAlpha = 0.3;
        ctx.globalCompositeOperation = 'multiply';
      } else {
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

    // Draw current stroke (Preview)
    if (currentStroke) {
      ctx.beginPath();
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = getCurrentWidth() * scale;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      if (activeTool === 'highlighter') {
        ctx.globalAlpha = 0.3;
        ctx.globalCompositeOperation = 'multiply';
      } else {
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
      }

      currentStroke.forEach((p, index) => {
        const x = p.x * canvas.width;
        const y = p.y * canvas.height;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [annotations, currentStroke, scale, activeTool, currentColor, pencilWidth, highlighterWidth, eraserWidth]);

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (activeTool === 'view') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    if (activeTool === 'eraser') {
      handleErase(x, y);
      return;
    }

    setCurrentStroke([{ x, y }]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (activeTool === 'view') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    if (activeTool === 'eraser') {
        if (e.buttons === 1 || 'touches' in e) {
            handleErase(x, y);
        }
        return;
    }

    if (!currentStroke) return;
    setCurrentStroke(prev => prev ? [...prev, { x, y }] : null);
  };

  const handleEnd = async () => {
    if (activeTool === 'view' || !currentStroke || !moduleId) {
      setCurrentStroke(null);
      return;
    }

    const newAnnotation: Annotation = {
      id: `ann-${Date.now()}`,
      moduleId,
      pageNumber,
      tool: activeTool as 'pencil' | 'highlighter',
      color: currentColor,
      width: activeTool === 'highlighter' ? highlighterWidth : pencilWidth,
      points: currentStroke
    };

    await db.put('annotations', newAnnotation);
    setAnnotations(prev => [...prev, newAnnotation]);
    setCurrentStroke(null);
  };

  const handleErase = async (x: number, y: number) => {
    if (!moduleId) return;
    
    // Threshold is derived from eraser size
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

  return (
    <div className="flex flex-col h-full bg-[#050a0f] relative overflow-hidden">
      {/* Tactical Annotation & PDF Toolbar */}
      <div className="bg-[#111a24] border-b border-white/5 flex flex-col z-10 shrink-0">
        {/* Navigation & Zoom Row */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/40 hover:text-primary h-9 w-9"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber(prev => prev - 1)}
            >
              <ChevronLeft size={18} />
            </Button>
            <div className="bg-white/5 border border-white/10 px-3 py-1.5 min-w-[100px] text-center">
              <span className="text-[10px] font-black italic uppercase tracking-widest text-white">
                PAGE {pageNumber} <span className="text-muted-foreground mx-1">/</span> {numPages || '--'}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white/40 hover:text-primary h-9 w-9"
              disabled={numPages ? pageNumber >= numPages : true}
              onClick={() => setPageNumber(prev => prev + 1)}
            >
              <ChevronRight size={18} />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/5 border border-white/10 p-1">
               <Button variant="ghost" size="icon" onClick={zoomOut} className="h-8 w-8 text-white/60 hover:text-white">
                 <ZoomOut size={16} />
               </Button>
               <div className="w-16 text-center text-[10px] font-black text-primary uppercase tracking-widest">
                 {Math.round(scale * 100)}%
               </div>
               <Button variant="ghost" size="icon" onClick={zoomIn} className="h-8 w-8 text-white/60 hover:text-white">
                 <ZoomIn size={16} />
               </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={fitToWidth} title="Fit to Width" className="text-white/40 hover:text-primary">
              <Maximize size={16} />
            </Button>
          </div>
        </div>

        {/* Annotation & Tool Calibration Row */}
        <div className="h-14 lg:h-12 flex items-center px-6 gap-2 overflow-x-auto no-scrollbar border-b border-white/5 lg:border-0">
          <div className="flex items-center gap-1 shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTool('view')}
              className={cn("h-8 gap-2 font-black text-[9px] uppercase tracking-widest", activeTool === 'view' ? "bg-primary text-black" : "text-white/40")}
            >
              <MousePointer2 size={12} /> View
            </Button>
            
            <div className="w-px h-4 bg-white/10 mx-1" />
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTool('pencil')}
              className={cn("h-8 gap-2 font-black text-[9px] uppercase tracking-widest", activeTool === 'pencil' ? "bg-primary text-black" : "text-white/40")}
            >
              <Pencil size={12} /> Pencil
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTool('highlighter')}
              className={cn("h-8 gap-2 font-black text-[9px] uppercase tracking-widest", activeTool === 'highlighter' ? "bg-primary text-black" : "text-white/40")}
            >
              <Highlighter size={12} /> Marker
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTool('eraser')}
              className={cn("h-8 gap-2 font-black text-[9px] uppercase tracking-widest", activeTool === 'eraser' ? "bg-primary text-black" : "text-white/40")}
            >
              <Eraser size={12} /> Eraser
            </Button>
          </div>

          {activeTool !== 'view' && (
            <>
              <div className="w-px h-4 bg-white/10 mx-2" />
              
              {/* Thickness Calibration */}
              <div className="flex items-center gap-3 min-w-[120px] lg:min-w-[180px]">
                <Settings2 size={12} className="text-white/30" />
                <Slider 
                  value={[getCurrentWidth()]}
                  max={activeTool === 'pencil' ? 10 : activeTool === 'highlighter' ? 60 : 80}
                  min={1}
                  step={1}
                  onValueChange={(vals) => handleWidthChange(vals[0])}
                  className="w-20 lg:w-32"
                />
                <span className="text-[8px] font-black text-primary w-4">{getCurrentWidth()}</span>
              </div>

              {activeTool !== 'eraser' && (
                <>
                  <div className="w-px h-4 bg-white/10 mx-2" />
                  <div className="flex items-center gap-1.5 px-2">
                    {['#00ff7f', '#ff4d4d', '#3399ff', '#ffff00'].map(color => (
                      <button
                        key={color}
                        onClick={() => setCurrentColor(color)}
                        className={cn(
                          "w-5 h-5 rounded-full border border-white/20 transition-transform",
                          currentColor === color ? "scale-125 border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]" : "hover:scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={clearPage} className="h-8 w-8 text-red-500/50 hover:text-red-500" title="Clear All Page Annotations">
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* Assay Reading Zone */}
      <div id="pdf-viewport" className="flex-1 overflow-auto no-scrollbar flex justify-center bg-[#050a0f] relative p-4 md:p-10">
        <div className="max-w-full relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center py-40 space-y-4">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Titrating PDF Data</p>
              </div>
            }
            error={
              <div className="py-20 text-center space-y-4">
                <p className="text-red-500 font-black uppercase tracking-widest">Assay Read Error</p>
                <p className="text-xs text-muted-foreground uppercase italic">Failed to initialize protocol renderer.</p>
              </div>
            }
          >
            <div className="relative bg-white">
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                className="max-w-full"
                renderAnnotationLayer={true}
                renderTextLayer={true}
                onRenderSuccess={(page) => {
                  const canvas = canvasRef.current;
                  if (canvas) {
                    canvas.width = page.width;
                    canvas.height = page.height;
                    drawAll();
                  }
                }}
              />
              {/* Annotation Canvas Layer */}
              <canvas
                ref={canvasRef}
                className={cn(
                  "absolute inset-0 z-10 touch-none",
                  activeTool === 'view' ? "pointer-events-none" : "cursor-crosshair"
                )}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
              />
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
}