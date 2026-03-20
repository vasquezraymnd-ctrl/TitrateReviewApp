"use client"

import { Search, Heart, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function DashboardHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      "flex items-center justify-between px-4 lg:px-0 py-3 fixed top-0 left-0 right-0 lg:left-64 bg-background/80 backdrop-blur-xl border-b border-muted z-[90] lg:hidden",
      "transition-all duration-300"
    )}>
      <div className="flex items-center">
         <h1 className="text-2xl font-black italic tracking-tighter font-headline">TITRATE</h1>
      </div>
      
      <div className="flex items-center gap-5">
        <div className="relative bg-muted rounded-lg px-3 py-1.5 flex items-center gap-2 lg:hidden">
          <Search size={16} className="text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search" 
            className="bg-transparent border-none text-xs focus:ring-0 w-24 outline-none" 
          />
        </div>
        <Heart size={24} />
        <MessageCircle size={24} />
      </div>
    </header>
  );
}
