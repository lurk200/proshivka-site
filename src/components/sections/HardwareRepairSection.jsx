import React from 'react';
import { motion } from 'framer-motion';
import { GlassWater, BatteryCharging, Droplets, Wrench } from 'lucide-react';

const CARDS = [
  {
    icon: GlassWater,
    label: 'HARDWARE.01',
    title: 'Замена разбитого стекла',
    desc: 'Меняем только верхнее стекло. Ваш оригинальный дисплей и цветопередача остаются прежними.',
  },
  {
    icon: BatteryCharging,
    label: 'HARDWARE.02',
    title: 'Замена аккумуляторов',
    desc: 'Телефон быстро разряжается или выключается на холоде? Устанавливаем новые батареи с гарантией.',
  },
  {
    icon: Droplets,
    label: 'HARDWARE.03',
    title: 'Восстановление после влаги',
    desc: 'Профессиональная чистка после попадания воды. Предотвращаем коррозию и короткие замыкания.',
  },
  {
    icon: Wrench,
    label: 'HARDWARE.04',
    title: 'Модульный ремонт',
    desc: 'Замена экранов, камер, микрофонов, динамиков и разъемов зарядки.',
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export default function HardwareRepairSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-transparent transition-colors duration-700">
      {/* Фоновые декоративные элементы в стиле лаборатории */}
      <div className="absolute inset-0 bg-diagnostic-grid pointer-events-none transition-opacity duration-700" style={{ opacity: 'var(--grid-opacity)' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[120px] rounded-full pointer-events-none transition-colors duration-700" style={{ background: 'var(--glow-accent)' }}></div>

      <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative z-10">
        <motion.div 
          className="mb-16 md:mb-24 max-w-2xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-[#84CC16] animate-pulse"></div>
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest">
              Hardware Repair
            </span>
          </div>
          <h2 className="text-[clamp(2.5rem,5vw,3.5rem)] font-medium text-[var(--text-primary)] leading-[1.1] tracking-tight mb-6" style={{ textShadow: 'var(--text-shadow)' }}>
            Классический<br/>аппаратный ремонт
          </h2>
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed font-normal max-w-xl">
            Выполняем как сложный компонентный ремонт, так и классическую замену поврежденных модулей устройств.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="group relative bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[28px] p-8 md:p-10 hover:border-[var(--border-accent-hover)] transition-all duration-700 ease-premium hover:-translate-y-1 overflow-hidden cursor-default shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)]"
              >
                {/* Эффект свечения при наведении */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#84CC16]/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                
                <div className="flex justify-between items-start mb-12 relative z-10">
                  <div className="w-14 h-14 rounded-[18px] bg-[var(--bg-elevated)] border border-[var(--border-medium)] flex items-center justify-center group-hover:border-[var(--border-accent-hover)] group-hover:bg-[#84CC16]/10 transition-all duration-700 ease-premium shadow-sm">
                    <Icon className="w-6 h-6 text-[var(--text-secondary)] group-hover:text-[#84CC16] transition-colors duration-700" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-widest uppercase mt-2 group-hover:text-[#84CC16] transition-colors duration-700">
                    {card.label}
                  </span>
                </div>

                <div className="relative z-10">
                  <h3 className="text-xl md:text-2xl font-medium text-[var(--text-primary)] mb-4 group-hover:text-[#84CC16] transition-colors duration-500 tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] text-[15px] leading-relaxed transition-colors duration-500">
                    {card.desc}
                  </p>
                </div>

                {/* Accent-линия внизу при наведении */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#84CC16]/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-premium opacity-0 group-hover:opacity-100 origin-center"></div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}