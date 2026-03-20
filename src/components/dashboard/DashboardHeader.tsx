"use client"

import { Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function DashboardHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      "flex items-center justify-between px-6 lg:px-12 py-6 fixed top-0 left-0 right-0 lg:left-64 z-[90] transition-all duration-300",
      isScrolled ? "bg-[#0F1923] border-b border-primary/20 shadow-2xl" : "bg-transparent"
    )}>
      <div className="flex items-center gap-6">
        <h2 className="text-xs font-black tracking-[0.4em] uppercase text-white/50 hidden md:block">Clinical Dashboard</h2>
        <div className="relative group hidden sm:block">
           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-hover:text-primary transition-colors" />
           <input 
             placeholder="SEARCH PROTOCOLS..." 
             className="bg-white/5 border-none h-10 pl-10 pr-4 text-[10px] font-black tracking-widest uppercase focus:bg-white/10 focus:ring-0 transition-all outline-none w-48 focus:w-64" 
           />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" className="text-white/40 hover:text-primary transition-colors">
          <Bell size={18} />
        </Button>
        <div className="flex items-center gap-3 pl-6 border-l border-white/10 cursor-pointer group">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-primary transition-colors">Analyst Doe</p>
            <p className="text-[9px] font-bold text-primary uppercase tracking-tighter">Laboratory Grade 42</p>
          </div>
          <Avatar className="w-8 h-8 rounded-none border border-primary/50 p-0.5">
            <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop" className="grayscale" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
