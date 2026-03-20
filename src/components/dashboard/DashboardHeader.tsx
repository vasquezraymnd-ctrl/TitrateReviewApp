
"use client"

import { Bell, Menu, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { db, Schedule } from '@/lib/db';

export function DashboardHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [hasDueSchedules, setHasDueSchedules] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
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

    window.addEventListener('scroll', handleScroll, { passive: true });
    checkSchedules();

    const handleScheduleUpdate = () => checkSchedules();
    window.addEventListener('schedule-updated', handleScheduleUpdate);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('schedule-updated', handleScheduleUpdate);
    };
  }, []);

  return (
    <header className={cn(
      "flex items-center justify-between px-4 md:px-6 lg:px-12 py-4 md:py-6 fixed top-0 left-0 right-0 lg:left-64 z-[90] transition-all duration-300",
      isScrolled ? "bg-[#0F1923] border-b border-primary/20 shadow-2xl py-3 md:py-4" : "bg-transparent"
    )}>
      <div className="flex items-center gap-4 md:gap-6">
        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-2">
          <Shield className="text-primary" size={20} />
          <h1 className="text-sm font-black italic tracking-tighter text-white">TITRATE</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-4 md:gap-6">
        <Button variant="ghost" size="icon" className="text-white/40 hover:text-primary transition-colors relative h-8 w-8 md:h-10 md:w-10">
          <Bell size={18} />
          {hasDueSchedules && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0F1923] animate-pulse" />
          )}
        </Button>
      </div>
    </header>
  );
}
