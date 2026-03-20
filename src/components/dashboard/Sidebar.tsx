"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, Calendar, Settings, PlusSquare, Search, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Library, label: 'My List', href: '/library' },
];

const actionItems = [
  { icon: PlusSquare, label: 'Import Anki', href: '/import' },
  { icon: Calendar, label: 'Scheduler', href: '/scheduler' },
  { icon: ClipboardList, label: 'Practice Quiz', href: '/quiz' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-20 lg:w-64 h-full bg-black flex flex-col py-6 gap-8 select-none border-r border-white/5 z-50">
      <div className="px-6 flex justify-center lg:justify-start">
        <h1 className="text-2xl lg:text-3xl font-black text-primary italic tracking-tighter">TITRATE</h1>
      </div>

      <nav className="flex flex-col gap-2 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-sm transition-all duration-200 group",
                isActive ? "text-white font-bold" : "text-muted-foreground hover:text-white"
              )}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive && "text-primary")} />
              <span className="hidden lg:block text-sm">{item.label}</span>
              {isActive && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 px-2">
        <p className="hidden lg:block px-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Activities</p>
        {actionItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-sm transition-all duration-200 group",
                isActive ? "text-white font-bold" : "text-muted-foreground hover:text-white"
              )}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="hidden lg:block text-sm">{item.label}</span>
              {isActive && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-2 px-2">
        <Link
          href="/settings"
          className="flex items-center gap-4 px-4 py-3 text-muted-foreground hover:text-white transition-colors"
        >
          <Settings size={24} />
          <span className="hidden lg:block text-sm">Settings</span>
        </Link>
      </div>
    </div>
  );
}