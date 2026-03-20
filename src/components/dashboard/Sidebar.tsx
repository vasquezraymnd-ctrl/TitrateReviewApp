"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Library, PlayCircle, PlusSquare, Heart, Settings, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const mainNav = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: Search, label: 'Search', href: '/explore' },
  { icon: Library, label: 'Your Library', href: '/library' },
];

const secondaryNav = [
  { icon: PlusSquare, label: 'Import Decks', href: '/import' },
  { icon: PlayCircle, label: 'Smart Scheduler', href: '/scheduler' },
  { icon: Heart, label: 'Liked Questions', href: '/liked' },
];

const playlistDecks = [
  'Microbiology Board Essentials',
  'Hematology Rapid Fire',
  'Clinical Chemistry V2',
  'Immuno-Sero High Yield',
  'Histopathology 2025',
  'MT Laws & Ethics',
  'Analysis of Urine',
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 h-full bg-black flex-col py-6 px-3 select-none z-50">
        <div className="px-4 mb-6">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <PlayCircle className="text-black fill-black" size={20} />
            </div>
            TITRATE
          </h1>
        </div>

        <nav className="flex flex-col gap-1 mb-8">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-200 group",
                  isActive ? "text-white bg-white/10" : "text-muted-foreground hover:text-white"
                )}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-sm font-bold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 mb-4">
          {secondaryNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-2 transition-all duration-200 group",
                  isActive ? "text-white" : "text-muted-foreground hover:text-white"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-sm flex items-center justify-center transition-colors",
                  item.label === 'Import Decks' ? "bg-muted-foreground/20 group-hover:bg-muted-foreground/40" : 
                  item.label === 'Liked Questions' ? "bg-gradient-to-br from-indigo-700 to-slate-400" : "bg-primary/20 group-hover:bg-primary/40"
                )}>
                  <item.icon size={14} className={item.label === 'Liked Questions' ? "text-white fill-white" : ""} />
                </div>
                <span className="text-sm font-bold">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="h-px bg-white/10 mx-4 my-4" />

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-3 pb-4">
          {playlistDecks.map((deck) => (
            <Link 
              key={deck} 
              href={`/quiz/${deck.toLowerCase().replace(/\s+/g, '-')}`}
              className="block text-sm text-muted-foreground hover:text-white transition-colors truncate"
            >
              {deck}
            </Link>
          ))}
        </div>

        <div className="mt-auto px-4 pt-4">
          <Link href="/settings" className="flex items-center gap-3 text-sm font-bold text-muted-foreground hover:text-white transition-colors">
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around px-2 z-[100]">
        {[...mainNav, { icon: PlayCircle, label: 'Quiz', href: '/quiz' }].map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1">
              <item.icon size={24} className={isActive ? "text-white" : "text-muted-foreground"} />
              <span className={cn("text-[10px] font-bold", isActive ? "text-white" : "text-muted-foreground")}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}