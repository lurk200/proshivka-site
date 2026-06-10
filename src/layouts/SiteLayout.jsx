import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import FloatingActionBar from '../components/layout/FloatingActionBar';
import SiteSeo from '../components/seo/SiteSeo';

export default function SiteLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans selection:bg-[#84CC16]/30 overflow-x-hidden transition-colors duration-500 ease-in-out">
      <SiteSeo />
      <Header />
      <main className="flex-grow flex flex-col relative z-10 w-full">
        <Outlet />
      </main>
      <Footer />
      <FloatingActionBar />
    </div>
  );
}