"use client"

import { useState } from 'react';
import { Question } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, Info, Zap } from 'lucide-react';

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
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
      <div className="bg-[#0F1923] border-l-4 border-primary p-8 shadow-2xl relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldCheck size={120} className="text-primary" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Zap className="text-primary" size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Tactical Question</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              {question.subject}
            </span>
          </div>

          <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-12 leading-none">
            {question.question}
          </h3>

          <div className="space-y-3">
            {question.choices.map((choice) => {
              const isSelected = selectedId === choice.id;
              const isCorrectChoice = choice.id === question.answerId;
              
              let stateClass = "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20";
              if (selectedId) {
                if (isCorrectChoice) stateClass = "bg-success/20 border-success text-success";
                else if (isSelected) stateClass = "bg-primary/20 border-primary text-primary";
                else stateClass = "bg-white/5 border-white/5 opacity-40";
              }

              return (
                <button
                  key={choice.id}
                  onClick={() => handleSelect(choice.id)}
                  disabled={!!selectedId}
                  className={cn(
                    "w-full flex items-center gap-6 p-6 transition-all duration-300 text-left font-bold uppercase tracking-wider border",
                    stateClass
                  )}
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 75%, 95% 100%, 0 100%)' }}
                >
                  <div className={cn(
                    "w-8 h-8 flex items-center justify-center shrink-0 border-2 font-black italic",
                    selectedId ? (isCorrectChoice ? "border-success text-success" : isSelected ? "border-primary text-primary" : "border-muted text-muted-foreground") : "border-white/20 text-white/50"
                  )}>
                    {choice.id}
                  </div>
                  <span className="text-lg italic">{choice.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showRationale && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4">
          <div className="bg-[#1A252E] p-8 border border-white/10 relative">
             <div className="flex items-center gap-2 mb-4">
               {isCorrect ? <ShieldCheck className="text-success" /> : <ShieldAlert className="text-primary" />}
               <h4 className="font-black italic uppercase tracking-widest text-sm">
                 {isCorrect ? "Protocol Success" : "Protocol Deviation"}
               </h4>
             </div>
             
             <p className="text-muted-foreground text-sm leading-relaxed mb-8">
               <span className="text-white font-bold block mb-2">INTELLIGENCE REPORT:</span>
               {question.rationale}
             </p>

             <div className="border-t border-white/10 pt-8 flex flex-col items-center">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6">Rate Performance</p>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map((q) => (
                    <button
                      key={q}
                      className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center font-black italic hover:bg-primary hover:text-white transition-colors"
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
