
"use client"

import { useState } from 'react';
import { Question } from '@/lib/db';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, Microscope, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface QuestionCardProps {
  question: Question;
  onAnswer: (quality: number) => void;
}

export function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showRationale, setShowRationale] = useState(false);
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);

  const handleSelect = (choiceId: string) => {
    if (selectedId) return;
    setSelectedId(choiceId);
    setShowRationale(true);
  };

  const isCorrect = selectedId === question.answerId;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 md:space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-4 mb-2">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-primary" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Flashcard Mode</span>
        </div>
        <Switch 
          checked={isFlashcardMode} 
          onCheckedChange={(val) => {
            setIsFlashcardMode(val);
            setSelectedId(null);
            setShowRationale(false);
            setShowFlashcardAnswer(false);
          }} 
        />
      </div>

      <div className="riot-card bg-[#111a24] border-l-4 border-primary p-6 md:p-12 shadow-2xl relative overflow-hidden ring-1 ring-white/5">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <ShieldCheck size={150} className="text-primary md:size-[200px]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <div className="flex items-center gap-2 md:gap-3">
              <Microscope className="text-primary" size={16} />
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] text-primary">
                {isFlashcardMode ? 'Flashcard Titration' : 'Active Assessment'}
              </span>
            </div>
            <div className="px-3 py-1 bg-white/5 border border-white/10">
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate max-w-[100px]">
                {question.subject}
              </span>
            </div>
          </div>

          <h3 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter mb-8 md:mb-16 leading-tight text-white drop-shadow-sm">
            {question.question}
          </h3>

          {!isFlashcardMode ? (
            <div className="grid grid-cols-1 gap-3 md:gap-4">
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
                      "w-full flex items-center gap-4 md:gap-6 p-4 md:p-7 transition-all duration-300 text-left font-black uppercase tracking-widest border group relative",
                      stateClass
                    )}
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 98% 100%, 0 100%)' }}
                  >
                    {!selectedId && <div className="absolute top-0 left-0 w-0 h-[2px] bg-primary group-hover:w-full transition-all duration-500" />}
                    
                    <div className={cn(
                      "w-8 h-8 md:w-12 md:h-12 flex items-center justify-center shrink-0 border-2 font-black italic transition-colors text-sm md:text-xl",
                      selectedId ? (isCorrectChoice ? "border-primary text-primary" : isSelected ? "border-red-500 text-red-500" : "border-muted text-muted-foreground") : "border-white/10 text-white/40 group-hover:border-primary/50 group-hover:text-primary"
                    )}>
                      {choice.id}
                    </div>
                    <span className="text-sm md:text-xl italic group-hover:translate-x-2 transition-transform line-clamp-2">{choice.text}</span>
                    {!selectedId && <ChevronRight className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary hidden md:block" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
               {!showFlashcardAnswer ? (
                 <Button 
                   onClick={() => {
                     setShowFlashcardAnswer(true);
                     setShowRationale(true);
                   }}
                   className="riot-button w-full h-16 md:h-20 bg-primary text-black font-black tracking-[0.2em] text-xs md:text-sm"
                 >
                   REVEAL CLINICAL DATA
                 </Button>
               ) : (
                 <div className="p-6 md:p-10 bg-primary/10 border border-primary/30 animate-in zoom-in duration-300">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-4">Correct Protocol</p>
                    <p className="text-2xl md:text-4xl font-black italic text-white uppercase tracking-tight">
                      {question.choices.find(c => c.id === question.answerId)?.text}
                    </p>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      {showRationale && (
        <div className="space-y-4 md:space-y-6 animate-in slide-in-from-bottom-8 duration-700 pb-20 lg:pb-0">
          <div className="riot-card bg-[#1a2430] p-6 md:p-12 border border-white/10 relative">
             <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
               <div className={cn("p-1.5 md:p-2 border rounded-none", (isCorrect || isFlashcardMode) ? "border-primary/30 text-primary" : "border-red-500/30 text-red-500")}>
                 {(isCorrect || isFlashcardMode) ? <ShieldCheck size={20} className="md:size-7" /> : <ShieldAlert size={20} className="md:size-7" />}
               </div>
               <div>
                 <h4 className="font-black italic uppercase tracking-widest text-sm md:text-lg">
                   {(isCorrect || isFlashcardMode) ? "Protocol Verified" : "Review Required"}
                 </h4>
                 <p className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Clinical Rationale</p>
               </div>
             </div>
             
             <div className="space-y-4 mb-8 md:mb-12 border-l-2 border-primary/20 pl-4 md:pl-8">
               <span className="text-primary font-black text-[9px] md:text-[11px] tracking-[0.4em] uppercase block">Assay Report</span>
               <p className="text-white/80 text-sm md:text-lg leading-relaxed italic font-medium">
                 {question.rationale}
               </p>
             </div>

             <div className="border-t border-white/5 pt-8 md:pt-12 flex flex-col items-center">
                <div className="flex flex-col items-center mb-6 md:mb-10 text-center">
                  <p className="text-[9px] md:text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em]">Rate Precision</p>
                  <p className="text-[8px] font-bold text-primary/40 uppercase tracking-widest mt-1">Calibrate SR Algorithm</p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                  {[0, 1, 2, 3, 4, 5].map((q) => (
                    <button
                      key={q}
                      className="w-10 h-10 md:w-16 md:h-16 bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center group hover:bg-primary hover:text-black transition-all duration-300 relative"
                      onClick={() => onAnswer(q)}
                    >
                      <span className="font-black italic text-sm md:text-2xl">{q}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between w-full max-w-[280px] md:max-w-sm mt-3 px-1">
                  <span className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-widest">Blackout</span>
                  <span className="text-[8px] md:text-[9px] font-black text-primary uppercase tracking-widest">Flawless</span>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
