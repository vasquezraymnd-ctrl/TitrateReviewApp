"use client"

import { ChevronLeft, ChevronRight, User, Bell } from 'lucide-react';
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
      "flex items-center justify-between px-6 lg:px-8 py-4 fixed top-0 left-0 right-0 lg:left-64 z-[90] transition-all duration-300",
      isScrolled ? "bg-[#070707] shadow-xl" : "bg-transparent"
    )}>
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="bg-black/40 hover:bg-black/60 rounded-full w-8 h-8 text-white">
            <ChevronLeft size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="bg-black/40 hover:bg-black/60 rounded-full w-8 h-8 text-white hidden md:flex">
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="outline" className="hidden md:flex rounded-full border-white/20 bg-transparent text-white font-bold hover:scale-105 transition-transform">
          Upgrade Pro
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white transition-colors">
          <Bell size={20} />
        </Button>
        <div className="bg-black/40 p-0.5 pr-3 rounded-full flex items-center gap-2 hover:bg-[#282828] cursor-pointer group transition-colors">
          <Avatar className="w-7 h-7">
            <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">John Doe</span>
        </div>
      </div>
    </header>
  );
}