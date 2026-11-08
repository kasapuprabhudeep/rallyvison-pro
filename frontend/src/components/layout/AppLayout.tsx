import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
import { useAuth } from '../../context/AuthContext';
import { CrossedRacketsLogoIcon } from '../icons/BadmintonIcons';

export const AppLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans transition-colors duration-300 relative overflow-hidden mesmerizing-shading">
      {/* Mesmerizing Background Watermark: Two Crossed Badminton Rackets Logo with Feather Emblem */}
      <div className="fixed top-24 right-[-60px] sm:right-[-20px] pointer-events-none -z-0 opacity-[0.09] transform rotate-12 select-none filter drop-shadow-[0_0_40px_rgba(0,240,255,0.25)]">
        <CrossedRacketsLogoIcon size={660} glow={true} />
      </div>

      <div className="fixed bottom-[-60px] left-[-80px] pointer-events-none -z-0 opacity-[0.07] transform -rotate-12 select-none filter drop-shadow-[0_0_40px_rgba(99,102,241,0.25)]">
        <CrossedRacketsLogoIcon size={560} glow={true} />
      </div>

      {/* Central Ambient Watermark */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-0 opacity-[0.035] select-none">
        <CrossedRacketsLogoIcon size={820} glow={false} />
      </div>

      {/* Main App Content Stack */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex w-full">
          {user && <Sidebar />}
          <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-12">
            <Outlet />
          </main>
        </div>
        {user && <MobileNav />}
        <Footer />
      </div>
    </div>
  );
};
