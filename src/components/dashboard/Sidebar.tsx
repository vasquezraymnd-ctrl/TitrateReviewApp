
"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlayCircle, PlusSquare, Microscope, Settings, Shield, Archive, BookOpen, UserCircle, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const mainNav = [
  { icon: Home, label: 'Laboratory Center', href: '/dashboard' },
  { icon: Archive, label: 'Protocol Archives', href: '/library' },
  { icon: Clock, label: 'Study Calibration', href: '/scheduler' },
];

const secondaryNav = [
  { icon: PlusSquare, label: 'Data Titration', href: '/import' },
  { icon: PlayCircle, label: 'Active Assay', href: '/quiz' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMode, setIsMobileMode] = useState(false);

  useEffect(() => {
    // Check session storage for device mode preference
    const mode = sessionStorage.getItem('TITRATE_DEVICE_MODE');
    setIsMobileMode(mode === 'phone');
  }, []);

  return (
    <>
      {/* Desktop/Tablet Sidebar */}
      <div className={cn(
        "hidden lg:flex w-64 h-full bg-[#050a0f] flex-col border-r border-white/5 select-none z-50 transition-all duration-500",
        isMobileMode && "lg:w-20"
      )}>
        <div className="p-8 mb-4">
          <h1 className={cn(
            "text-3xl font-black italic tracking-tighter flex items-center gap-2 text-primary overflow-hidden transition-all",
            isMobileMode && "text-transparent"
          )}>
            <Shield className="fill-primary text-primary shrink-0" size={28} />
            <span className={isMobileMode ? "hidden" : "block"}>TITRATE</span>
          </h1>
        </div>

        <div className="px-4 space-y-10">
          <nav className="flex flex-col gap-1">
             <p className={cn(
               "text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] px-4 mb-4 transition-opacity",
               isMobileMode && "opacity-0"
             )}>
               Clinical Protocols
             </p>
            {mainNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 transition-all duration-300 group relative",
                    isActive ? "text-white bg-primary/5" : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(0,255,127,0.5)]" />}
                  <item.icon size={18} className={cn(isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors")} />
                  <span className={cn("text-[11px] font-black uppercase tracking-widest transition-all", isMobileMode && "hidden")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <nav className="flex flex-col gap-1">
            <p className={cn(
               "text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] px-4 mb-4 transition-opacity",
               isMobileMode && "opacity-0"
             )}>
               Laboratory Tools
             </p>
            {secondaryNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 transition-all duration-300 group relative",
                    isActive ? "text-white bg-primary/5" : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(0,255,127,0.5)]" />}
                  <item.icon size={18} className={cn(isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary transition-colors")} />
                  <span className={cn("text-[11px] font-black uppercase tracking-widest transition-all", isMobileMode && "hidden")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5 bg-black/40">
          <Link href="/settings" className="flex items-center gap-3 text-[11px] font-black text-muted-foreground hover:text-white transition-colors uppercase tracking-widest">
            <Settings size={16} />
            <span className={isMobileMode ? "hidden" : "block"}>Instrumentation</span>
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Nav - Only visible on small screens OR if phone mode selected */}
      <div className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#050a0f] border-t border-primary/20 flex items-center justify-around px-2 z-[100] backdrop-blur-md bg-opacity-90 transition-all",
        "lg:hidden" // Always show bottom nav on mobile/tablet screens
      )}>
        {[
          { icon: Home, label: 'Center', href: '/dashboard' },
          { icon: Archive, label: 'Archive', href: '/library' },
          { icon: PlayCircle, label: 'Assay', href: '/quiz' },
          { icon: Clock, label: 'Study', href: '/scheduler' },
          { icon: PlusSquare, label: 'Data', href: '/import' }
        ].map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 min-w-[60px]">
              <item.icon size={18} className={isActive ? "text-primary" : "text-muted-foreground"} />
              <span className={cn("text-[8px] font-black uppercase tracking-tighter", isActive ? "text-white" : "text-muted-foreground")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
