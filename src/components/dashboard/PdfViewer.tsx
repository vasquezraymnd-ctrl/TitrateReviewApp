
"use client"

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';

// CSS for text selection and link interaction
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up worker for PDF processing using a reliable CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoaded, setIsLoaded] = useState(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoaded(true);
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  
  const fitToWidth = () => {
    const container = document.getElementById('pdf-viewport');
    if (container) {
      // 750 is a standard PDF width for scale calculations
      setScale(container.clientWidth / 800);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050a0f] relative overflow-hidden">
      {/* Tactical PDF Toolbar */}
      <div className="h-14 bg-[#111a24] border-b border-white/5 flex items-center justify-between px-6 z-10 shrink-0">
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

      {/* Assay Reading Zone */}
      <div id="pdf-viewport" className="flex-1 overflow-auto no-scrollbar flex justify-center bg-[#050a0f] relative p-4 md:p-10">
        <div className="max-w-full">
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
            <div className="riot-card shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-white">
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                className="max-w-full"
                renderAnnotationLayer={true}
                renderTextLayer={true}
              />
            </div>
          </Document>
        </div>
      </div>
    </div>
  );
}
