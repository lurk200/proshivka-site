import React, { useEffect, useState } from 'react';
import { Command, ExternalLink, Menu, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';
import { getAdminRouteLabel } from '../navigation';

export default function TopBar({ onMenuToggle }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const label = getAdminRouteLabel(location.pathname, location.search);

  useEffect(() => {
    const handler = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center gap-3 h-14 px-4 sm:px-6 bg-[#0a0b0e]/95 backdrop-blur-sm border-b border-white/[0.06] shrink-0">
        <button type="button" onClick={onMenuToggle} className="lg:hidden p-2 rounded-lg text-[#9ca3af] hover:text-white hover:bg-white/[0.06] transition-colors" aria-label="Открыть меню"><Menu className="w-5 h-5" /></button>
        <div className="flex items-center gap-2 text-[13.5px] min-w-0"><span className="text-[#4b5563] hidden sm:inline select-none">Админ-панель</span><span className="text-[#4b5563] hidden sm:inline select-none">/</span><span className="font-medium text-white truncate">{label}</span></div>
        <div className="flex-1" />
        <button type="button" onClick={() => setSearchOpen(true)} className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#6b7280] text-[13px] hover:border-white/[0.14] hover:text-[#9ca3af] transition-colors"><Search className="w-3.5 h-3.5" /><span>Поиск</span><kbd className="ml-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] text-[#4b5563]"><Command className="w-2.5 h-2.5" />K</kbd></button>
        <button type="button" onClick={() => setSearchOpen(true)} className="sm:hidden p-2 rounded-lg text-[#9ca3af] hover:text-white hover:bg-white/[0.06] transition-colors" aria-label="Поиск"><Search className="w-5 h-5" /></button>
        <a href="/" target="_blank" rel="noopener noreferrer" title="Открыть сайт" className="p-2 rounded-lg text-[#9ca3af] hover:text-white hover:bg-white/[0.06] transition-colors"><ExternalLink className="w-4 h-4" /></a>
      </header>
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </>
  );
}
