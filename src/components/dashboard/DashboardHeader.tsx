"use client"

import { useEffect, useState } from 'react';
import { Search, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

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
      "flex items-center justify-between px-12 py-4 fixed top-0 right-0 left-20 lg:left-64 z-[100] transition-colors duration-500",
      isScrolled ? "bg-black/95 shadow-md" : "bg-gradient-to-b from-black/80 to-transparent"
    )}>
      <div className="flex items-center gap-8">
        <div className="hidden md:flex gap-6 text-sm font-medium">
          <span className="cursor-pointer hover:text-white/70 transition-colors text-white">Browse</span>
          <span className="cursor-pointer hover:text-white/70 transition-colors text-white/70">Top Performance</span>
          <span className="cursor-pointer hover:text-white/70 transition-colors text-white/70">Weak Spots</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <Search size={20} className="text-white cursor-pointer" />
        <span className="text-sm font-bold hidden sm:inline">CANDIDATE</span>
        <Bell size={20} className="text-white cursor-pointer" />
        
        <div className="flex items-center gap-2 cursor-pointer group">
          <Avatar className="h-8 w-8 rounded-sm overflow-hidden">
            <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop" />
            <AvatarFallback className="bg-primary text-white rounded-none">MT</AvatarFallback>
          </Avatar>
          <div className="border-t-4 border-l-4 border-r-4 border-transparent border-t-white ml-1 group-hover:rotate-180 transition-transform duration-200" />
        </div>
      </div>
    </header>
  );
}