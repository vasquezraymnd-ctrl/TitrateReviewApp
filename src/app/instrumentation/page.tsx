"use client"

import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Shield, User, Info, BookMarked, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function InstrumentationPage() {
  const references = [
    { subject: "Hematology", source: "Rodak's Hematology: Clinical Principles and Applications" },
    { subject: "Clinical Chemistry", source: "Bishop's Clinical Chemistry: Principles, Techniques, and Correlations" },
    { subject: "Microbiology", source: "Bailey & Scott's Diagnostic Microbiology" },
    { subject: "Immuno-Serology", source: "Stevens' Immunology and Serology in Your Laboratory" },
    { subject: "Clinical Microscopy", source: "Strasinger's Urinalysis and Body Fluids" },
    { subject: "HTMLE", source: "Gregorio's Histopathologic Techniques" },
  ];

  const laws = [
    "RA 5527: The Philippine Medical Technology Act of 1969",
    "RA 4688: Clinical Laboratory Law",
    "RA 7719: National Blood Service Act of 1994",
    "RA 9165: Comprehensive Dangerous Drugs Act of 2002",
    "RA 11166: Philippine HIV and AIDS Policy Act",
    "RA 10912: Continuing Professional Development (CPD) Act of 2016"
  ];

  return (
    <div className="flex h-screen bg-[#0b111a] overflow-hidden text-white flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        <DashboardHeader />
        
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-28 md:py-32 space-y-12 pb-40">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="text-primary" size={24} />
              <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">System Diagnostics</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">TITRATE Instrumentation</h2>
            <p className="text-muted-foreground text-sm md:text-lg italic max-w-2xl">
              Technical specifications and architectural manifest of the TITRATE high-fidelity workstation.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* System Status */}
            <div className="riot-card bg-white/[0.02] border border-white/5 p-8 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">System Status</p>
                <h3 className="text-2xl font-black italic uppercase text-white">Operational</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Version</span>
                  <span className="text-[10px] font-black text-primary">1.0.5-STABLE</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Database</span>
                  <span className="text-[10px] font-black text-white">IndexedDB (Local-First)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Engine</span>
                  <span className="text-[10px] font-black text-white">SM-2 Clinical Titration</span>
                </div>
              </div>
            </div>

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
          </div>

          {/* Bibliographic Manifest */}
          <section className="space-y-8 pt-8">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <BookMarked className="text-primary" size={20} />
              <h3 className="text-xl font-black italic uppercase tracking-widest">Bibliographic Manifest</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Core Textbooks</h4>
                <div className="space-y-4">
                  {references.map((ref) => (
                    <div key={ref.subject} className="space-y-1">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{ref.subject}</p>
                      <p className="text-sm italic text-white/80">{ref.source}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Regulatory Statutes</h4>
                <div className="space-y-4">
                  {laws.map((law) => (
                    <div key={law} className="flex gap-3">
                      <Scale size={14} className="text-white/20 shrink-0 mt-1" />
                      <p className="text-sm italic text-white/80 leading-relaxed">{law}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <footer className="pt-12 border-t border-white/5 text-center opacity-40">
            <p className="text-[9px] font-black uppercase tracking-[0.5em]">TITRATE // Designed for the Growth of the MedTech Profession</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
