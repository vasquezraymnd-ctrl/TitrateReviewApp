
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
      // 1. Minimum duration for the Titration Animation (3.5s)
      const animationPromise = new Promise(resolve => setTimeout(resolve, 3500));
      
      // 2. Parallelly check profile status
      const profilePromise = db.getById<UserProfile>('profile', 'current-user');
      
      const [_, userProfile] = await Promise.all([animationPromise, profilePromise]);
      
      // 3. Determine if user is "Active" or needs initialization
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
      <div className="fixed inset-0 bg-[#050a0f] flex flex-col items-center justify-center z-[500]">
        <div className="relative flex flex-col items-center">
          {/* Titration Drop Animation */}
          <div className="mb-8 relative">
             <div className="w-1 h-8 bg-primary absolute -top-12 left-1/2 -translate-x-1/2 animate-[bounce_1.5s_infinite] opacity-40" />
             <Shield className="text-primary fill-primary/20 w-24 h-24 animate-pulse" />
             <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-white relative overflow-hidden">
            <span className="relative z-10">TITRATE</span>
            {/* Liquid Fill Effect */}
            <div className="absolute inset-0 bg-primary h-full w-full -translate-y-full animate-[slideInFromBottom_3s_ease-out_forwards] mix-blend-overlay opacity-50" />
          </h1>
          
          <div className="mt-4 flex items-center gap-4">
             <div className="h-[1px] w-12 bg-white/10" />
             <span className="text-[10px] font-black uppercase tracking-[0.6em] text-primary/60">
               {stage === 'redirecting' ? 'RESUMING SESSION' : 'INITIALIZING LABORATORY'}
             </span>
             <div className="h-[1px] w-12 bg-white/10" />
          </div>
        </div>
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
                "Precision is the core of diagnostic excellence. Before initiating your first clinical assay, please synchronize your analyst credentials."
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
