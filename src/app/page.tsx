
"use client"

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db, UserProfile } from '@/lib/db';
import { Shield, ArrowRight, Smartphone, Tablet, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const [stage, setStage] = useState<'animating' | 'device-selection' | 'onboarding' | 'ready-to-hold'>('animating');
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [deviceType, setDeviceType] = useState<'phone' | 'tablet' | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const startupSequence = async () => {
      // Check if we already have device preference and profile
      const storedDevice = localStorage.getItem('TITRATE_DEVICE_MODE');
      const userProfile = await db.getById<UserProfile>('profile', 'current-user');
      const isInitialized = userProfile && userProfile.name && userProfile.name !== 'Future RMT';

      if (storedDevice && isInitialized) {
        setStage('ready-to-hold');
      } else {
        // First time users see the 5s intro
        await new Promise(resolve => setTimeout(resolve, 5000));
        setStage('device-selection');
      }
    };

    startupSequence();
  }, [router]);

  useEffect(() => {
    if (isHolding) {
      holdIntervalRef.current = setInterval(() => {
        setHoldProgress(prev => {
          if (prev >= 100) {
            clearInterval(holdIntervalRef.current!);
            router.push('/dashboard');
            return 100;
          }
          return prev + 2; // Titration speed
        });
      }, 30);
    } else {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
      // Optional: slowly drain progress if released early
      const drainInterval = setInterval(() => {
        setHoldProgress(prev => {
          if (prev <= 0) {
            clearInterval(drainInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 20);
      return () => clearInterval(drainInterval);
    }
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, [isHolding, router]);

  const handleDeviceSelect = async (type: 'phone' | 'tablet') => {
    setDeviceType(type);
    localStorage.setItem('TITRATE_DEVICE_MODE', type);
    
    const userProfile = await db.getById<UserProfile>('profile', 'current-user');
    const isInitialized = userProfile && userProfile.name && userProfile.name !== 'Future RMT';

    if (isInitialized) {
      router.push('/dashboard');
    } else {
      setStage('onboarding');
    }
  };

  // Stage 1: Initial Animation (Auto-play for first launch)
  if (stage === 'animating') {
    return (
      <div className="fixed inset-0 bg-[#0b111a] flex flex-col items-center justify-center z-[500] overflow-hidden px-6">
        <div className="relative flex flex-col items-center w-full max-w-lg">
          <div className="absolute -top-32 md:-top-48 left-1/2 -translate-x-1/2 scale-75 md:scale-100">
            <div className="relative flex flex-col items-center">
              <svg width="80" height="160" viewBox="0 0 60 120" className="animate-[tilt-and-pour_5s_ease-in-out_infinite] origin-[30px_110px]">
                <path d="M10 10 Q10 5 15 5 L45 5 Q50 5 50 10 L50 100 Q50 115 30 115 Q10 115 10 100 Z" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20" />
                <path d="M10 40 L50 40 L50 100 Q50 115 30 115 Q10 115 10 100 Z" fill="currentColor" className="text-primary animate-[liquid-drain_5s_infinite]" />
              </svg>
              <div className="absolute top-[110px] left-1/2 -translate-x-1/2 w-[2px] md:w-[3px] bg-primary origin-top animate-[stream-flow_5s_infinite]" />
            </div>
          </div>
          <div className="relative mt-20 md:mt-24 text-center">
            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black italic tracking-tighter text-white/5 relative">
              TITRATE
              <div className="absolute inset-0 text-primary overflow-hidden animate-[fill-logo-word_5s_ease-out_forwards]" style={{ clipPath: 'inset(100% 0 0 0)' }}>
                TITRATE
              </div>
            </h1>
            <div className="absolute -bottom-8 md:-bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 md:gap-4 w-max">
               <div className="h-[1px] w-8 md:w-12 bg-white/10" />
               <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.6em] text-primary/60 animate-pulse">INITIALIZING</span>
               <div className="h-[1px] w-8 md:w-12 bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stage: Ready to Hold (For returning users)
  if (stage === 'ready-to-hold') {
    return (
      <div 
        className="fixed inset-0 bg-[#0b111a] flex flex-col items-center justify-center z-[500] overflow-hidden px-6 cursor-none select-none touch-none"
        onMouseDown={() => setIsHolding(true)}
        onMouseUp={() => setIsHolding(false)}
        onTouchStart={() => setIsHolding(true)}
        onTouchEnd={() => setIsHolding(false)}
      >
        <div className="relative flex flex-col items-center w-full max-w-lg">
          
          <div className="absolute -top-32 md:-top-48 left-1/2 -translate-x-1/2 scale-75 md:scale-100 transition-transform duration-500">
            <div className="relative flex flex-col items-center">
              <svg 
                width="80" 
                height="160" 
                viewBox="0 0 60 120" 
                className="origin-[30px_110px] transition-transform duration-700"
                style={{ transform: `rotate(${-65 * (holdProgress / 100)}deg)` }}
              >
                <path d="M10 10 Q10 5 15 5 L45 5 Q50 5 50 10 L50 100 Q50 115 30 115 Q10 115 10 100 Z" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20" />
                <path 
                  d="M10 40 L50 40 L50 100 Q50 115 30 115 Q10 115 10 100 Z" 
                  fill="currentColor" 
                  className="text-primary"
                  style={{ transform: `scaleY(${Math.max(0.1, 1 - (holdProgress / 100))})`, transformOrigin: 'bottom' }}
                />
              </svg>
              {holdProgress > 5 && holdProgress < 100 && (
                <div className="absolute top-[110px] left-1/2 -translate-x-1/2 w-[2px] md:w-[3px] bg-primary origin-top animate-pulse" style={{ height: '250px' }} />
              )}
            </div>
          </div>

          <div className="relative mt-20 md:mt-24 text-center">
            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black italic tracking-tighter text-white/5 relative">
              TITRATE
              <div 
                className="absolute inset-0 text-primary overflow-hidden" 
                style={{ clipPath: `inset(${100 - holdProgress}% 0 0 0)` }}
              >
                TITRATE
              </div>
            </h1>
            
            <div className="mt-12 space-y-4">
              <div className="flex flex-col items-center gap-2">
                <Zap className={cn("text-primary", isHolding && "animate-pulse")} size={20} />
                <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-primary">
                  {holdProgress > 0 ? `TITRATION: ${Math.round(holdProgress)}%` : 'HOLD TO ENTER LAB'}
                </p>
              </div>
              <div className="w-48 h-1 bg-white/5 mx-auto">
                <div 
                  className="h-full bg-primary transition-all duration-75" 
                  style={{ width: `${holdProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'device-selection') {
    return (
      <div className="fixed inset-0 bg-[#0b111a] flex items-center justify-center z-[500] p-6">
        <div className="riot-card max-w-xl w-full bg-[#111a24] border border-white/10 p-6 md:p-12 relative overflow-hidden animate-in fade-in zoom-in duration-700">
          <div className="relative z-10 space-y-8 md:space-y-10">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                 <Shield className="text-primary" size={20} />
                 <span className="text-primary font-black uppercase tracking-[0.4em] text-[9px]">Calibration</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                Select <br /><span className="text-primary">Interface Mode</span>
              </h2>
              <p className="text-muted-foreground text-[10px] md:text-xs italic uppercase tracking-widest">Optimize viewport for your hardware.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <button onClick={() => handleDeviceSelect('phone')} className="riot-card p-6 md:p-8 bg-white/5 border border-white/10 hover:bg-primary hover:text-black transition-all group flex flex-col items-center gap-3">
                <Smartphone size={24} className="group-hover:scale-110 transition-transform md:size-32" />
                <span className="text-[10px] font-black uppercase tracking-widest">Phone / Mobile</span>
              </button>
              <button onClick={() => handleDeviceSelect('tablet')} className="riot-card p-6 md:p-8 bg-white/5 border border-white/10 hover:bg-primary hover:text-black transition-all group flex flex-col items-center gap-3">
                <Tablet size={24} className="group-hover:scale-110 transition-transform md:size-32" />
                <span className="text-[10px] font-black uppercase tracking-widest">Tablet / Desktop</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'onboarding') {
    return (
      <div className="fixed inset-0 bg-[#0b111a] flex items-center justify-center z-[500] p-4 md:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50" />
        <div className="riot-card max-w-2xl w-full bg-[#111a24] border border-white/10 p-8 md:p-12 relative overflow-hidden animate-in fade-in zoom-in duration-700">
          <div className="relative z-10 space-y-6 md:space-y-10">
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-3">
                 <Shield className="text-primary" size={20} />
                 <span className="text-primary font-black uppercase tracking-[0.4em] text-[9px]">Initialization Required</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                Welcome, <br /><span className="text-primary">Future RMT</span>
              </h2>
              <p className="text-muted-foreground text-sm md:text-lg italic leading-relaxed max-w-md">
                The journey to RMT is a grueling phase but a rewarding one. Galingan Katusok!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-4 md:pt-6">
              <Button asChild className="riot-button h-12 md:h-16 px-6 md:px-10 bg-primary hover:bg-primary/80 text-black rounded-none font-black tracking-widest text-[9px] md:text-[11px]">
                <Link href="/library" className="flex items-center">
                  CONFIGURE PROFILE <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="h-12 md:h-16 px-6 md:px-10 border border-white/5 hover:bg-white/5 rounded-none uppercase font-black tracking-widest text-[9px] md:text-[10px]">
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
