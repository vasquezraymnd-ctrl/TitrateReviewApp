"use client"

import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-background/50 backdrop-blur-md sticky top-0 z-50">
      <div className="flex gap-4">
        <Button variant="ghost" size="icon" className="rounded-full bg-black/40 hover:bg-black/60">
          <ChevronLeft size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-black/40 hover:bg-black/60">
          <ChevronRight size={20} />
        </Button>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="outline" className="rounded-full border-muted text-xs font-bold bg-transparent hover:scale-105 transition-transform">
          UPGRADE
        </Button>
        <div className="flex items-center gap-2 bg-black/40 pr-2 pl-1 py-1 rounded-full cursor-pointer hover:bg-black/60 transition-colors">
          <Avatar className="h-7 w-7">
            <AvatarImage src="" />
            <AvatarFallback className="bg-muted text-[10px] font-bold">MT</AvatarFallback>
          </Avatar>
          <span className="text-xs font-bold">MedTech Candidate</span>
        </div>
      </div>
    </header>
  );
}
