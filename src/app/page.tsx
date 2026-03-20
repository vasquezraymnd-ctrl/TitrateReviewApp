
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, UserProfile } from '@/lib/db';
import { Shield, ArrowRight, Microscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [stage, setStage] = useState<'animating' | 'onboarding' | 'redirecting'>('animating');

  useEffect(() => {
    const startupSequence = async () => {
      // 1. Duration for the Titration Animation (4s)
      const animationPromise = new Promise(resolve => setTimeout(resolve, 4000));
      
      // 2. Check profile status
      const profilePromise = db.getById<UserProfile>('profile', 'current-user');
      
      const [_, userProfile] = await Promise.all([animationPromise, profilePromise]);
      
      // 3. Determine if user is initialized
      const isInitialized = userProfile && userProfile.name && userProfile.name !== 'Future RMT';

      if (isInitialized) {
        setStage('redirecting');
        router.push('/dashboard');
      } else {
        setStage('onboarding');
      }
    };

    startupSequence();
  }, [router]);

  if (stage === 'animating' || stage === 'redirecting') {
    return (
      <div className="fixed inset-0 bg-[#050a0f] flex flex-col items-center justify-center z-[500] overflow-hidden">
        <div className="relative flex flex-col items-center w-full max-w-lg">
          
          {/* Test Tube Pouring Animation */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 flex flex-col items-center">
            {/* Test Tube SVG */}
            <svg 
              width="60" 
              height="120" 
              viewBox="0 0 60 120" 
              className="animate-[tilt_2s_ease-in-out_infinite] origin-bottom"
            >
              <path 
                d="M10 10 Q10 5 15 5 L45 5 Q50 5 50 10 L50 100 Q50 115 30 115 Q10 115 10 100 Z" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className="text-white/20"
              />
              <path 
                d="M10 60 L50 60 L50 100 Q50 115 30 115 Q10 115 10 100 Z" 
                fill="currentColor" 
                className="text-primary animate-[liquid-shift_2s_infinite]"
              />
            </svg>
            
            {/* Pouring Stream */}
            <div className="w-[2px] bg-primary h-24 absolute top-full origin-top animate-[pour_2s_infinite] opacity-0" />
          </div>

          <div className="relative mt-24">
            <h1 className="text-8xl md:text-[10rem] font-black italic tracking-tighter text-white/5 relative">
              TITRATE
              {/* The "Filling" text layer */}
              <div 
                className="absolute inset-0 text-primary overflow-hidden animate-[fill-logo_4s_ease-out_forwards]"
                style={{ clipPath: 'inset(100% 0 0 0)' }}
              >
                TITRATE
              </div>
            </h1>
            
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 w-max">
               <div className="h-[1px] w-8 bg-white/10" />
               <span className="text-[9px] font-black uppercase tracking-[0.6em] text-primary/60 animate-pulse">
                 {stage === 'redirecting' ? 'RESUMING SESSION' : 'INITIALIZING LABORATORY'}
               </span>
               <div className="h-[1px] w-8 bg-white/10" />
            </div>
          </div>
        </div>

        <style jsx global>{`
          @keyframes tilt {
            0%, 100% { transform: rotate(0deg); }
            40%, 60% { transform: rotate(-45deg); }
          }
          @keyframes liquid-shift {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px) rotate(5deg); }
          }
          @keyframes pour {
            0%, 40% { opacity: 0; transform: scaleY(0); }
            45%, 65% { opacity: 1; transform: scaleY(1.5); }
            70%, 100% { opacity: 0; transform: scaleY(0); }
          }
          @keyframes fill-logo {
            0% { clip-path: inset(100% 0 0 0); }
            20% { clip-path: inset(100% 0 0 0); }
            100% { clip-path: inset(0% 0 0 0); }
          }
        `}</style>
      </div>
    );
  }

  if (stage === 'onboarding') {
    return (
      <div className="fixed inset-0 bg-[#050a0f] flex items-center justify-center z-[500] p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50" />
        
        <div className="riot-card max-w-2xl w-full bg-[#0A1219] border border-white/10 p-12 relative overflow-hidden animate-in fade-in zoom-in duration-700">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Microscope size={200} className="text-primary" />
          </div>

          <div className="relative z-10 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <Shield className="text-primary" size={24} />
                 <span className="text-primary font-black uppercase tracking-[0.4em] text-xs">Initialization Required</span>
              </div>
              <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
                Welcome, <br /><span className="text-primary">Future RMT</span>
              </h2>
              <p className="text-muted-foreground text-lg italic leading-relaxed max-w-md">
                Precision is the core of diagnostic excellence. Before initiating your first clinical assay, please synchronize your analyst credentials.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button asChild className="riot-button h-16 px-10 bg-primary hover:bg-primary/80 text-black rounded-none font-black tracking-widest text-[11px]">
                <Link href="/library">
                  CONFIGURE ANALYST PROFILE <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="h-16 px-10 border border-white/5 hover:bg-white/5 rounded-none uppercase font-black tracking-widest text-[10px]">
                <Link href="/dashboard">ENTER LABORATORY</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
