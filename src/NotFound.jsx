import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Terminal } from 'lucide-react';
import { Button, Reveal } from '../components/ui';
import { PageTransition } from '../components/layout/PageTransition';

export default function NotFound() {
  return (
    <PageTransition>
      <Helmet>
        <title>404: Сектор не найден | ПРОШИВКА</title>
      </Helmet>
      <section className="min-h-[80vh] flex items-center justify-center relative overflow-hidden pt-32 pb-24">
        <div className="absolute inset-0 bg-diagnostic-grid opacity-[0.15] z-0 pointer-events-none"></div>
        <div className="container mx-auto px-6 max-w-2xl relative z-10 text-center flex flex-col items-center">
           <Reveal>
             <div className="w-20 h-20 rounded-[20px] bg-[#84CC16]/10 border border-[#84CC16]/20 flex items-center justify-center mb-8 mx-auto shadow-[inset_0_1px_0_rgba(132,204,22,0.1)]">
                <Terminal className="w-10 h-10 text-[#84CC16]" />
             </div>
             <h1 className="text-[clamp(3rem,8vw,5rem)] font-medium leading-[1] tracking-[-0.02em] text-[#F5F5F5] mb-4">404</h1>
             <div className="text-[11px] font-mono text-[#84CC16] uppercase tracking-widest mb-6 terminal-cursor">SYSTEM_ERROR_PAGE_NOT_FOUND</div>
             <p className="text-[#9CA3AF] text-[15px] leading-relaxed mb-10 max-w-[40ch] mx-auto">Запрошенный сектор памяти отсутствует или был перемещен. Пожалуйста, вернитесь на главную панель управления.</p>
             <Button to="/">Инициализировать возврат</Button>
           </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}