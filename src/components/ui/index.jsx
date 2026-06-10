import React from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { Activity, Clock, CheckCircle2 } from 'lucide-react';

export const Reveal = ({ children, delay = 0, className = "", as: Component = "div", immediate = false }) => {
  const { ref, isVisible } = useScrollReveal({ rootMargin: immediate ? '0px' : '0px 0px -40px 0px' });
  const visible = immediate || isVisible;
  return (
    <Component ref={ref} style={{ transitionDelay: immediate ? '0ms' : `${delay}ms` }} className={`transition-all duration-1000 ease-premium gpu-accelerated ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}>
      {children}
    </Component>
  );
};

export const Button = ({ children, variant = 'primary', className = '', href, to, type = "button", onClick }) => {
  const baseStyle = "inline-flex items-center justify-center px-6 py-4 text-[14px] font-medium transition-all duration-500 ease-premium rounded-xl gap-2 active:scale-[0.98] relative overflow-hidden group focus-ring select-none shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)]";
  const variants = {
    primary: "bg-[#84CC16] text-[#0A0A0C] hover:bg-[#9BE02A] shadow-[0_0_20px_rgba(132,204,22,0.2)]",
    secondary: "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-medium)] hover:bg-[var(--border-subtle)]",
  };
  if (to) {
    return <Link to={to} className={`${baseStyle} ${variants[variant]} ${className}`} onClick={onClick}><span className="relative z-10 flex items-center gap-2">{children}</span></Link>;
  }
  const Component = href ? 'a' : 'button';
  const specificProps = href ? { href } : { type, onClick };
  return (
    <Component className={`${baseStyle} ${variants[variant]} ${className}`} {...specificProps}>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </Component>
  );
};

export const Card = ({ children, className = '', interactive = false, as: Component = "article" }) => (
  <Component tabIndex={interactive ? 0 : undefined} className={`bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[24px] transition-all duration-700 ease-premium relative overflow-hidden shadow-[var(--shadow-soft)] ${interactive ? 'hover:border-[var(--border-accent-hover)] hover:-translate-y-1 hover:shadow-[var(--shadow-card)] group cursor-pointer focus-ring' : ''} ${className}`}>
    <div className="absolute inset-0 shadow-[inset_0_1px_0_0_var(--border-subtle)] rounded-[24px] pointer-events-none"></div>
    {children}
  </Component>
);

export const Tag = ({ children, className = "", active = false }) => (
  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-[11px] font-mono tracking-wide transition-colors duration-500 ease-premium cursor-default ${active ? 'bg-[#84CC16]/5 border-[#84CC16]/20 text-[#84CC16]' : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border-medium)] hover:text-[var(--text-primary)]'} ${className}`}>
    {children}
  </span>
);

export const MetaBadge = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1.5">{label}</span>
    <span className="text-[12px] font-medium text-[var(--text-primary)]">{value}</span>
  </div>
);

export const Section = ({ id, className = '', children, bg = 'base', ...props }) => {
  const bgClasses = { base: 'bg-[var(--bg-base)]', surface: 'bg-[var(--bg-surface)]' };
  return (
    <section id={id} className={`py-24 md:py-32 relative ${bgClasses[bg]} ${id !== 'hero' ? 'content-auto' : ''} transition-colors duration-700 ease-premium ${className}`} {...props}>
      {children}
    </section>
  );
};

export const TelemetryWidget = ({ data }) => (
  <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-10 text-[10px] md:text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest border-l-2 border-[#84CC16]/30 pl-4 py-1">
    <div className="flex flex-col gap-1">
      <span className="text-[var(--text-muted)]">СТАТУС СИСТЕМЫ</span>
      <span className="text-[#84CC16] flex items-center gap-1.5"><Activity className="w-3 h-3" />{data.status}</span>
    </div>
    <div className="w-px h-6 bg-[var(--border-medium)]"></div>
    <div className="flex flex-col gap-1">
      <span className="text-[var(--text-muted)]">ОЦЕНКА ВРЕМЕНИ</span>
      <span className="text-[var(--text-primary)] flex items-center gap-1.5"><Clock className="w-3 h-3" />{data.diagTime}</span>
    </div>
    <div className="w-px h-6 bg-[var(--border-medium)]"></div>
    <div className="flex flex-col gap-1">
      <span className="text-[var(--text-muted)]">РЕЗУЛЬТАТ</span>
      <span className="text-[var(--text-primary)] flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" />{data.successRate}</span>
    </div>
  </div>
);
