"use client"

import { useState } from 'react';
import { Question } from '@/lib/db';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, Microscope, Zap } from 'lucide-react';

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
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="bg-[#0A1219] border-l-4 border-primary p-10 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <ShieldCheck size={180} className="text-primary" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <Microscope className="text-primary" size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Clinical Assessment</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
              Sector: {question.subject}
            </span>
          </div>

          <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-14 leading-none text-white">
            {question.question}
          </h3>

          <div className="space-y-4">
            {question.choices.map((choice) => {
              const isSelected = selectedId === choice.id;
              const isCorrectChoice = choice.id === question.answerId;
              
              let stateClass = "bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/20";
              if (selectedId) {
                if (isCorrectChoice) stateClass = "bg-primary/20 border-primary text-primary";
                else if (isSelected) stateClass = "bg-red-500/20 border-red-500 text-red-500";
                else stateClass = "bg-white/[0.01] border-white/5 opacity-30";
              }

              return (
                <button
                  key={choice.id}
                  onClick={() => handleSelect(choice.id)}
                  disabled={!!selectedId}
                  className={cn(
                    "w-full flex items-center gap-6 p-7 transition-all duration-300 text-left font-black uppercase tracking-widest border",
                    stateClass
                  )}
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 75%, 97% 100%, 0 100%)' }}
                >
                  <div className={cn(
                    "w-10 h-10 flex items-center justify-center shrink-0 border-2 font-black italic transition-colors",
                    selectedId ? (isCorrectChoice ? "border-primary text-primary" : isSelected ? "border-red-500 text-red-500" : "border-muted text-muted-foreground") : "border-white/10 text-white/40"
                  )}>
                    {choice.id}
                  </div>
                  <span className="text-lg italic group-hover:translate-x-1 transition-transform">{choice.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showRationale && (
        <div className="space-y-4 animate-in slide-in-from-bottom-6 duration-500">
          <div className="bg-[#121b24] p-10 border border-white/5 relative">
             <div className="flex items-center gap-3 mb-6">
               {isCorrect ? <ShieldCheck className="text-primary" size={24} /> : <ShieldAlert className="text-red-500" size={24} />}
               <h4 className="font-black italic uppercase tracking-widest text-sm">
                 {isCorrect ? "Protocol Verified" : "Calibration Required"}
               </h4>
             </div>
             
             <div className="space-y-4 mb-10">
               <span className="text-primary font-black text-[10px] tracking-widest uppercase block border-b border-primary/20 pb-2">Full Assay Report</span>
               <p className="text-muted-foreground text-base leading-relaxed italic">
                 {question.rationale}
               </p>
             </div>

             <div className="border-t border-white/5 pt-10 flex flex-col items-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-8">Subject Response Quality</p>
                <div className="flex gap-3">
                  {[0, 1, 2, 3, 4, 5].map((q) => (
                    <button
                      key={q}
                      className="w-14 h-14 bg-white/[0.03] border border-white/10 flex items-center justify-center font-black italic hover:bg-primary hover:text-black transition-all duration-300"
                      onClick={() => onAnswer(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
