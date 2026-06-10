import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCms } from '../../context/CmsContext';

export function ServiceNavCard({ card }) {
  const Icon = card.icon;
  return (
    <Link
      to={card.path}
      className="group relative flex items-center gap-4 p-4 rounded-[16px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-accent-hover)] hover:bg-[var(--border-subtle)] hover:shadow-[var(--shadow-card)] transition-all duration-500 ease-premium hover:-translate-y-1 overflow-hidden backdrop-blur-md"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#84CC16]/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="w-10 h-10 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-medium)] flex flex-shrink-0 items-center justify-center group-hover:border-[var(--border-accent-hover)] group-hover:bg-[#84CC16]/10 transition-colors duration-500 shadow-sm relative z-10">
        <Icon className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[#84CC16] transition-colors duration-500" strokeWidth={1.5} />
      </div>
      <div className="flex-1 relative z-10">
        <h3 className="text-[14px] font-medium text-[var(--text-primary)] group-hover:text-[#84CC16] transition-colors tracking-tight">
          {card.title}
        </h3>
      </div>
      <ArrowRight
        className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[#84CC16] transition-all duration-500 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 relative z-10"
        strokeWidth={2}
      />
    </Link>
  );
}

export default function ServiceNavGrid({ includeSoftwareRepair = true, className = '' }) {
  const { cmsData } = useCms();
  const { serviceNav, softwareNav } = cmsData.siteNavigation;
  const cards = includeSoftwareRepair ? [...serviceNav, softwareNav] : serviceNav;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 ${className}`}>
      {cards.map((card) => (
        <ServiceNavCard key={card.path} card={card} />
      ))}
    </div>
  );
}
