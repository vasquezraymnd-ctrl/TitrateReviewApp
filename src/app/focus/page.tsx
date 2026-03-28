
"use client"

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Pause, 
  Play, 
  X, 
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const STUDY_METHOD_TIPS = [
  "Active Recall: Instead of re-reading your notes, quiz yourself on core concepts like biochemical pathways.",
  "Spaced Repetition: Review high-yield topics at increasing intervals to move info to long-term memory.",
  "Feynman Technique: Try explaining a complex process in simple terms as if teaching a peer.",
  "Concept Mapping: Draw connections between subjects, such as Clinical Chemistry and Microscopy.",
  "Pomodoro Protocol: Use 25-minute focused 'assays' followed by 5-minute breaks."
];

export default function FocusPage() {
  const [timerActive, setTimerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [randomTip, setRandomTip] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setRandomTip(STUDY_METHOD_TIPS[Math.floor(Math.random() * STUDY_METHOD_TIPS.length)]);
  }, []);

  useEffect(() => {
    let interval: any;
    if (timerActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      setIsPaused(false);
      toast({ title: "Assay Complete", description: "Study window has closed." });
    }
    return () => clearInterval(interval);
  }, [timerActive, isPaused, timeLeft, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInitiate = () => {
    setTimerActive(true);
    setIsPaused(false);
  };

  const handleAbort = () => {
    setTimerActive(false);
    setIsPaused(false);
    setTimeLeft(1800);
  };

  if (timerActive) {
    return (
      <div className="fixed inset-0 z-[1000] bg-[#0b111a] flex flex-col items-center justify-center text-white overflow-hidden animate-in fade-in duration-500 p-6 md:p-10 lg:p-12">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
          <Zap size={800} className="text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative z-10 text-center space-y-6 md:space-y-6 lg:space-y-8 w-full max-w-5xl flex flex-col items-center">
          <div className="flex flex-col items-center gap-2 md:gap-3">
            <Zap className={cn("text-primary size-8 md:size-8 lg:size-10", !isPaused && "animate-pulse")} />
            <span className="text-primary font-black uppercase tracking-[0.6em] text-[10px] md:text-[10px] lg:text-xs">
              {isPaused ? 'Assay Suspended' : 'Titrating Deep Focus'}
            </span>
          </div>
          
          <div className="riot-card p-8 md:p-12 lg:p-16 xl:p-24 bg-white/[0.02] border border-primary/20 backdrop-blur-xl shadow-[0_0_100px_rgba(0,255,127,0.05)] mx-auto w-fit">
             <div className={cn(
               "text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] xl:text-[15rem] font-black italic tracking-tighter tabular-nums leading-none transition-all duration-700",
               isPaused ? "text-white/10 scale-95 blur-sm" : "text-white scale-100"
             )}>
               {formatTime(timeLeft)}
             </div>
          </div>

          <div className="space-y-4 md:space-y-6 lg:space-y-8 w-full">
            <p className="text-muted-foreground font-medium italic text-sm md:text-base lg:text-lg max-w-md mx-auto px-6">
              {isPaused 
                ? "Assay interrupted. Resume when laboratory silence is restored."
                : "Focus locked. Maintain analytical precision until protocol completion."
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-6">
              <Button 
                onClick={() => setIsPaused(!isPaused)}
                className="riot-button h-14 md:h-14 lg:h-16 xl:h-20 px-12 md:px-12 lg:px-16 bg-primary text-black font-black text-xs md:text-xs lg:text-sm tracking-widest"
              >
                {isPaused ? (
                  <><Play className="mr-3 h-5 w-5" /> RESUME</>
                ) : (
                  <><Pause className="mr-3 h-5 w-5" /> PAUSE</>
                )}
              </Button>
              <Button 
                onClick={handleAbort}
                variant="outline"
                className="riot-button h-14 md:h-14 lg:h-16 xl:h-20 px-12 md:px-12 lg:px-16 border-red-500/50 text-red-500 hover:bg-red-500/10 font-black text-xs md:text-xs lg:text-sm tracking-widest"
              >
                <X className="mr-3 h-5 w-5" /> ABORT
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#111a24] overflow-hidden text-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-16 py-28 lg:py-32 flex flex-col items-center justify-center min-h-full">
          <div className="w-full max-w-2xl space-y-12 animate-in fade-in duration-700">
            <div className="text-center space-y-4">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-none animate-pulse">
                  <Zap size={40} className="text-primary" />
                </div>
              </div>
              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">Active Focus</h2>
              <p className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-[0.4em]">Initialize high-yield study assay</p>
            </div>

            <div className="riot-card p-10 bg-white/[0.02] border border-white/5 text-center space-y-8">
              <div className="text-7xl md:text-9xl font-black italic tracking-tighter text-white/90">
                30:00
              </div>
              <Button 
                onClick={handleInitiate}
                className="riot-button h-16 w-full max-w-sm bg-primary text-black font-black text-xs tracking-widest"
              >
                START ASSAY
              </Button>
            </div>

            <div className="riot-card p-8 bg-primary/5 border border-primary/20 relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                  <Info size={14} /> Clinical Insight
                </h4>
                <p className="text-sm md:text-base italic text-white/80 leading-relaxed">
                  {randomTip}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
