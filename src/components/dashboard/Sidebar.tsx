"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Compass, PlayCircle, Heart, PlusSquare, User, Settings, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: Search, label: 'Search', href: '/search' },
  { icon: Compass, label: 'Explore', href: '/explore' },
  { icon: PlayCircle, label: 'Reviews', href: '/quiz' },
  { icon: Heart, label: 'Notifications', href: '/notifications' },
  { icon: PlusSquare, label: 'Create', href: '/import' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 h-full bg-background flex-col py-8 px-3 border-r border-muted select-none z-50">
        <div className="px-4 mb-10">
          <h1 className="text-2xl font-black italic tracking-tighter font-headline">TITRATE</h1>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group hover:bg-muted/50",
                  isActive ? "text-white font-black" : "text-white/90 font-medium"
                )}
              >
                <item.icon size={26} strokeWidth={isActive ? 3 : 2} className={cn("transition-transform group-hover:scale-105")} />
                <span className="text-base">{item.label}</span>
              </Link>
            );
          })}
          
          <Link
            href="/profile"
            className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 transition-all mt-2"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[2px]">
              <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-muted">
                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop" alt="Profile" className="object-cover" />
              </div>
            </div>
            <span className="text-base">Profile</span>
          </Link>
        </nav>

        <div className="mt-auto">
           <Link
            href="/settings"
            className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 transition-all text-white/90"
          >
            <Menu size={26} />
            <span className="text-base">More</span>
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-background border-t border-muted flex items-center justify-around px-2 z-[100]">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="p-2">
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={cn(isActive ? "text-white" : "text-white/60")} />
            </Link>
          );
        })}
        <Link href="/profile" className="p-2">
          <div className="w-7 h-7 rounded-full border border-white/20 overflow-hidden">
             <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=64&h=64&fit=crop" alt="Profile" className="object-cover" />
          </div>
        </Link>
      </div>
    </>
  );
}
