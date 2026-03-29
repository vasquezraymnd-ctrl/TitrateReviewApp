"use client"

import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Shield, User, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function InstrumentationPage() {
  return (
    <div className="flex h-screen bg-[#0b111a] overflow-hidden text-white flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-28 md:py-32 space-y-12">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="text-primary" size={24} />
              <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">System Diagnostics</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">TITRATE Instrumentation</h2>
            <p className="text-muted-foreground text-sm md:text-lg italic max-w-2xl">
              Technical specifications and architectural manifest of the TITRATE study workstation.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Developer Card */}
            <div className="riot-card bg-[#111a24] border border-white/10 p-8 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <User size={120} className="text-primary" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Developer</p>
                  <h3 className="text-2xl md:text-3xl font-black italic uppercase text-white">R.V.</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Registered Medical Technologist (RMT)</p>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="riot-card bg-white/[0.02] border border-white/5 p-8 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">System Status</p>
                <h3 className="text-2xl font-black italic uppercase text-white">Operational</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Version</span>
                  <span className="text-[10px] font-black text-primary">1.0.4-STABLE</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Database</span>
                  <span className="text-[10px] font-black text-white">IndexedDB (Local-First)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Engine</span>
                  <span className="text-[10px] font-black text-white">SM-2 Spaced Repetition</span>
                </div>
              </div>
            </div>
          </div>

          <footer className="pt-12 border-t border-white/5 text-center opacity-40">
            <p className="text-[9px] font-black uppercase tracking-[0.5em]">TITRATE // Designed for the Growth of the MedTech Profession</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
