
"use client"

import { useState } from 'react';
import { Question } from '@/lib/db';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, Microscope, ChevronRight } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  onAnswer: (quality: number) => void;
}

export function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRationale, setShowRationale] = useState(false);

  const handleSelect = (choiceId: string) => {
    if (selectedId) return;
    setSelectedId(choiceId);
    setShowRationale(true);
  };

  const isCorrect = selectedId === question.answerId;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="riot-card bg-[#0A1219] border-l-4 border-primary p-12 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <ShieldCheck size={200} className="text-primary" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <Microscope className="text-primary" size={20} />
              <span className="text-[11px] font-black uppercase tracking-[0.5em] text-primary">Active Clinical Assessment</span>
            </div>
            <div className="px-4 py-1 bg-white/5 border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Sector: {question.subject}
              </span>
            </div>
          </div>

          <h3 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-16 leading-none text-white drop-shadow-sm">
            {question.question}
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {question.choices.map((choice) => {
              const isSelected = selectedId === choice.id;
              const isCorrectChoice = choice.id === question.answerId;
              
              let stateClass = "bg-white/[0.03] border-white/10 hover:bg-white/[0.08] hover:border-white/20";
              if (selectedId) {
                if (isCorrectChoice) stateClass = "bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(0,255,127,0.1)]";
                else if (isSelected) stateClass = "bg-red-500/20 border-red-500 text-red-500";
                else stateClass = "bg-white/[0.01] border-white/5 opacity-30";
              }

              return (
                <button
                  key={choice.id}
                  onClick={() => handleSelect(choice.id)}
                  disabled={!!selectedId}
                  className={cn(
                    "w-full flex items-center gap-6 p-7 transition-all duration-300 text-left font-black uppercase tracking-widest border group relative",
                    stateClass
                  )}
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 98% 100%, 0 100%)' }}
                >
                  {!selectedId && <div className="absolute top-0 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-500" />}
                  
                  <div className={cn(
                    "w-12 h-12 flex items-center justify-center shrink-0 border-2 font-black italic transition-colors text-xl",
                    selectedId ? (isCorrectChoice ? "border-primary text-primary" : isSelected ? "border-red-500 text-red-500" : "border-muted text-muted-foreground") : "border-white/10 text-white/40 group-hover:border-primary/50 group-hover:text-primary"
                  )}>
                    {choice.id}
                  </div>
                  <span className="text-xl italic group-hover:translate-x-2 transition-transform">{choice.text}</span>
                  {!selectedId && <ChevronRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showRationale && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
          <div className="riot-card bg-[#121b24] p-12 border border-white/10 relative">
             <div className="flex items-center gap-4 mb-8">
               <div className={cn("p-2 border rounded-none", isCorrect ? "border-primary/30 text-primary" : "border-red-500/30 text-red-500")}>
                 {isCorrect ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
               </div>
               <div>
                 <h4 className="font-black italic uppercase tracking-widest text-lg">
                   {isCorrect ? "Protocol Verified" : "Review Required"}
                 </h4>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Clinical Rationale Follows</p>
               </div>
             </div>
             
             <div className="space-y-6 mb-12 border-l-2 border-primary/20 pl-8">
               <span className="text-primary font-black text-[11px] tracking-[0.4em] uppercase block">Assay Diagnostic Report</span>
               <p className="text-white/80 text-lg leading-relaxed italic font-medium">
                 {question.rationale}
               </p>
             </div>

             <div className="border-t border-white/5 pt-12 flex flex-col items-center">
                <div className="flex flex-col items-center mb-10">
                  <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">Rate Response Precision</p>
                  <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest mt-1">Calibrate Spaced Repetition Algorithm</p>
                </div>
                
                <div className="flex gap-4">
                  {[0, 1, 2, 3, 4, 5].map((q) => (
                    <button
                      key={q}
                      className="w-16 h-16 bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center group hover:bg-primary hover:text-black transition-all duration-300 relative"
                      onClick={() => onAnswer(q)}
                    >
                      <span className="font-black italic text-2xl">{q}</span>
                      <div className="absolute inset-0 border border-transparent group-hover:border-black/20 m-1" />
                    </button>
                  ))}
                </div>
                <div className="flex justify-between w-full max-w-sm mt-4 px-2">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Blackout</span>
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">Flawless</span>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
