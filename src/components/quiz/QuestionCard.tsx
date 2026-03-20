"use client"

import { useState } from 'react';
import { Question } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Info } from 'lucide-react';

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
    <div className="w-full max-w-2xl mx-auto bg-card border rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
            {question.subject}
          </span>
          {selectedId && (
            <div className={cn(
              "flex items-center gap-2 font-bold animate-in slide-in-from-top-2",
              isCorrect ? "text-success" : "text-destructive"
            )}>
              {isCorrect ? (
                <><CheckCircle2 size={20} /> CORRECT</>
              ) : (
                <><XCircle size={20} /> INCORRECT</>
              )}
            </div>
          )}
        </div>

        <h3 className="text-2xl font-headline font-bold mb-8 leading-tight">
          {question.question}
        </h3>

        <div className="space-y-4 mb-8">
          {question.choices.map((choice) => {
            const isSelected = selectedId === choice.id;
            const isCorrectChoice = choice.id === question.answerId;
            
            let stateClass = "bg-muted/50 border-transparent hover:bg-muted";
            if (selectedId) {
              if (isCorrectChoice) stateClass = "bg-success/20 border-success text-success shadow-[0_0_15px_rgba(161,48,247,0.2)]";
              else if (isSelected) stateClass = "bg-destructive/20 border-destructive text-destructive shadow-[0_0_15px_rgba(255,128,0,0.2)] opacity-100";
              else stateClass = "bg-muted/20 border-transparent opacity-50";
            }

            return (
              <button
                key={choice.id}
                onClick={() => handleSelect(choice.id)}
                disabled={!!selectedId}
                className={cn(
                  "w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-300 text-left font-medium",
                  stateClass
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 font-bold",
                  selectedId ? (isCorrectChoice ? "border-success bg-success text-black" : isSelected ? "border-destructive bg-destructive text-black" : "border-muted text-muted-foreground") : "border-muted-foreground/30 text-muted-foreground group-hover:border-primary"
                )}>
                  {choice.id}
                </div>
                <span className="text-lg">{choice.text}</span>
              </button>
            );
          })}
        </div>

        {showRationale && (
          <div className="bg-muted/30 p-6 rounded-xl animate-in slide-in-from-bottom-4">
            <h4 className="flex items-center gap-2 font-bold text-primary mb-2 uppercase text-xs tracking-wider">
              <Info size={14} /> Rationale
            </h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {question.rationale}
            </p>
            
            <div className="mt-8 flex flex-col items-center">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-4">How well did you know this?</p>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    className="w-12 h-12 rounded-lg font-bold hover:bg-primary hover:text-black hover:border-primary"
                    onClick={() => onAnswer(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
              <div className="flex justify-between w-full mt-2 px-1 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                <span>Blackout</span>
                <span>Perfect</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
