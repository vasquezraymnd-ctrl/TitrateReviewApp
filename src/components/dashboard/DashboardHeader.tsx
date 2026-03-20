"use client"

import { Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { db, Schedule } from '@/lib/db';

export function DashboardHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasDueSchedules, setHasDueSchedules] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    const checkSchedules = async () => {
      const schedules = await db.getAll<Schedule>('schedules');
      const todayDate = new Date().toISOString().split('T')[0];
      const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

      const isDue = schedules.some(s => {
        if (s.type === 'class') return s.dayOfWeek === todayDay;
        return s.date === todayDate;
      });

      setHasDueSchedules(isDue);
    };

    window.addEventListener('scroll', handleScroll);
    checkSchedules();

    // Listen for schedule updates to refresh the notification status
    const handleScheduleUpdate = () => checkSchedules();
    window.addEventListener('schedule-updated', handleScheduleUpdate);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('schedule-updated', handleScheduleUpdate);
    };
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
        <Button variant="ghost" size="icon" className="text-white/40 hover:text-primary transition-colors relative">
          <Bell size={18} />
          {hasDueSchedules && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0F1923] animate-pulse" />
          )}
        </Button>
      </div>
    </header>
  );
}
