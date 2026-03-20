"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, Calendar, Settings, PlusSquare, Search, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Library, label: 'Your Library', href: '/library' },
];

const actionItems = [
  { icon: PlusSquare, label: 'Import Anki', href: '/import' },
  { icon: Calendar, label: 'Scheduler', href: '/scheduler' },
  { icon: ClipboardList, label: 'Practice Quiz', href: '/quiz' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-full bg-black flex flex-col p-4 gap-6 select-none">
      <div className="px-4 py-2">
        <h1 className="text-2xl font-headline font-bold text-primary tracking-tight">TITRATE</h1>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-md transition-colors font-medium",
                isActive ? "text-white bg-muted" : "text-muted-foreground hover:text-white"
              )}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1">
        <p className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Actions</p>
        {actionItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-4 px-4 py-3 rounded-md transition-colors font-medium",
              pathname === item.href ? "text-white bg-muted" : "text-muted-foreground hover:text-white"
            )}
          >
            <div className={cn(
              "p-1 rounded-sm",
              item.label === 'Import Anki' ? "bg-primary text-black" : "bg-accent text-white"
            )}>
              <item.icon size={16} strokeWidth={2.5} />
            </div>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-1">
        <Link
          href="/settings"
          className="flex items-center gap-4 px-4 py-3 rounded-md text-muted-foreground hover:text-white transition-colors"
        >
          <Settings size={24} />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
