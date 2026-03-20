
"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, UserProfile } from '@/lib/db';
import { Shield, ArrowRight, Microscope, Smartphone, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [stage, setStage] = useState<'animating' | 'device-selection' | 'onboarding' | 'redirecting'>('animating');
  const [deviceType, setDeviceType] = useState<'phone' | 'tablet' | null>(null);

  useEffect(() => {
    const startupSequence = async () => {
      // Mandatory 5-second Titration Animation for every app launch
      await new Promise(resolve => setTimeout(resolve, 5000));
      setStage('device-selection');
    };

    startupSequence();
  }, []);

  const handleDeviceSelect = async (type: 'phone' | 'tablet') => {
    setDeviceType(type);
    
    // Store device preference in sessionStorage for the current session
    sessionStorage.setItem('TITRATE_DEVICE_MODE', type);
    
    const userProfile = await db.getById<UserProfile>('profile', 'current-user');
    const isInitialized = userProfile && userProfile.name && userProfile.name !== 'Future RMT';

    if (isInitialized) {
      setStage('redirecting');
      router.push('/dashboard');
    } else {
      setStage('onboarding');
    }
  };

  // Stage 1: Titration Animation (The Loading Screen)
  if (stage === 'animating' || stage === 'redirecting') {
    return (
      <div className="fixed inset-0 bg-[#050a0f] flex flex-col items-center justify-center z-[500] overflow-hidden">
        <div className="relative flex flex-col items-center w-full max-w-lg">
          
          {/* Beaker Pouring Animation */}
          <div className="absolute -top-48 left-1/2 -translate-x-1/2">
            <div className="relative flex flex-col items-center">
              <svg 
                width="80" 
                height="160" 
                viewBox="0 0 60 120" 
                className="animate-[tilt-and-pour_5s_ease-in-out_infinite] origin-[30px_110px]"
              >
                <path 
                  d="M10 10 Q10 5 15 5 L45 5 Q50 5 50 10 L50 100 Q50 115 30 115 Q10 115 10 100 Z" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  className="text-white/20"
                />
                <path 
                  d="M10 40 L50 40 L50 100 Q50 115 30 115 Q10 115 10 100 Z" 
                  fill="currentColor" 
                  className="text-primary animate-[liquid-drain_5s_infinite]"
                />
              </svg>
              <div className="absolute top-[110px] left-1/2 -translate-x-1/2 w-[3px] bg-primary origin-top animate-[stream-flow_5s_infinite]" />
            </div>
          </div>

          {/* Logo Animation */}
          <div className="relative mt-24">
            <h1 className="text-7xl md:text-8xl lg:text-[10rem] font-black italic tracking-tighter text-white/5 relative">
              TITRATE
              <div 
                className="absolute inset-0 text-primary overflow-hidden animate-[fill-logo-word_5s_ease-out_forwards]"
                style={{ clipPath: 'inset(100% 0 0 0)' }}
              >
                TITRATE
              </div>
            </h1>
            
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 w-max">
               <div className="h-[1px] w-12 bg-white/10" />
               <span className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/60 animate-pulse">
                 {stage === 'redirecting' ? 'RESUMING SESSION' : 'INITIALIZING LABORATORY'}
               </span>
               <div className="h-[1px] w-12 bg-white/10" />
            </div>
          </div>
        </div>

        <style jsx global>{`
          @keyframes tilt-and-pour {
            0% { transform: rotate(0deg); opacity: 0; }
            10% { transform: rotate(0deg); opacity: 1; }
            30% { transform: rotate(-65deg); }
            75% { transform: rotate(-65deg); }
            90% { transform: rotate(0deg); opacity: 1; }
            100% { transform: rotate(0deg); opacity: 0; }
          }
          @keyframes liquid-drain {
            0%, 30% { transform: scaleY(1); }
            75% { transform: scaleY(0.1); }
            100% { transform: scaleY(0.1); }
          }
          @keyframes stream-flow {
            0%, 35% { height: 0; opacity: 0; }
            40% { height: 250px; opacity: 1; }
            75% { height: 250px; opacity: 1; }
            80%, 100% { height: 0; opacity: 0; }
          }
          @keyframes fill-logo-word {
            0%, 45% { clip-path: inset(100% 0 0 0); }
            100% { clip-path: inset(0% 0 0 0); }
          }
        `}</style>
      </div>
    );
  }

  // Stage 2: Device Calibration
  if (stage === 'device-selection') {
    return (
      <div className="fixed inset-0 bg-[#050a0f] flex items-center justify-center z-[500] p-6">
        <div className="riot-card max-w-xl w-full bg-[#0A1219] border border-white/10 p-8 md:p-12 relative overflow-hidden animate-in fade-in zoom-in duration-700">
          <div className="relative z-10 space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <Shield className="text-primary" size={24} />
                 <span className="text-primary font-black uppercase tracking-[0.4em] text-xs">Device Calibration</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                Select <br /><span className="text-primary">Interface Mode</span>
              </h2>
              <p className="text-muted-foreground text-sm italic uppercase tracking-widest">Optimize clinical viewport for your analytical hardware.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={() => handleDeviceSelect('phone')}
                className="riot-card p-8 bg-white/5 border border-white/10 hover:bg-primary hover:text-black transition-all group flex flex-col items-center gap-4"
              >
                <Smartphone size={32} className="group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-widest">Phone / Mobile</span>
              </button>
              <button 
                onClick={() => handleDeviceSelect('tablet')}
                className="riot-card p-8 bg-white/5 border border-white/10 hover:bg-primary hover:text-black transition-all group flex flex-col items-center gap-4"
              >
                <Tablet size={32} className="group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-widest">Tablet / Desktop</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stage 3: Welcome & Onboarding
  if (stage === 'onboarding') {
    return (
      <div className="fixed inset-0 bg-[#050a0f] flex items-center justify-center z-[500] p-4 md:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50" />
        
        <div className="riot-card max-w-2xl w-full bg-[#0A1219] border border-white/10 p-8 md:p-12 relative overflow-hidden animate-in fade-in zoom-in duration-700">
          <div className="relative z-10 space-y-8 md:space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <Shield className="text-primary" size={24} />
                 <span className="text-primary font-black uppercase tracking-[0.4em] text-xs">Initialization Required</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                Welcome, <br /><span className="text-primary">Future RMT</span>
              </h2>
              <p className="text-muted-foreground text-sm md:text-lg italic leading-relaxed max-w-md">
                The journey to RMT is a grueling phase but a rewarding one. Galingan Katusok!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button asChild className="riot-button h-14 md:h-16 px-8 md:px-10 bg-primary hover:bg-primary/80 text-black rounded-none font-black tracking-widest text-[10px] md:text-[11px]">
                <Link href="/library">
                  CONFIGURE ANALYST PROFILE <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="h-14 md:h-16 px-8 md:px-10 border border-white/5 hover:bg-white/5 rounded-none uppercase font-black tracking-widest text-[9px] md:text-[10px]">
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
