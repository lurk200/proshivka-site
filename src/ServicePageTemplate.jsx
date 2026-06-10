import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, AlertTriangle, Shield, Clock, 
  Wrench, MessageCircle, Zap, ChevronDown, HelpCircle, 
  Terminal
} from 'lucide-react';
import PageTransition from './components/layout/PageTransition';

// --- Анимации ---
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, ease: [0.22, 1, 0.36, 1] } }
};

// --- Компонент FAQ Аккордеона ---
const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <motion.div 
      variants={fadeUp}
      className="border-b border-[var(--border-subtle)] last:border-0"
    >
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
      >
        <span className="text-[17px] font-medium text-[var(--text-primary)] group-hover:text-[#84CC16] transition-colors pr-8">
          {question}
        </span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-all duration-300 flex-shrink-0 ${isOpen ? 'bg-[#84CC16]/10 border-[#84CC16]/20' : 'group-hover:border-[var(--border-medium)]'}`}>
          <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#84CC16]' : ''}`} />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-[var(--text-secondary)] text-[15px] leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Дефолтные данные ---
const DEFAULT_PROCESS = [
  { 
    icon: Terminal, 
    title: 'Диагностика', 
    desc: 'Проводим бесплатную аппаратную диагностику для точного выявления проблемы.' 
  },
  { 
    icon: Clock, 
    title: 'Оценка', 
    desc: 'Согласовываем точную стоимость и сроки работ. Без скрытых наценок.' 
  },
  { 
    icon: Wrench, 
    title: 'Ремонт', 
    desc: 'Выполняем работы с использованием оригинальных или premium запчастей.' 
  },
  { 
    icon: Shield, 
    title: 'Гарантия', 
    desc: 'Тестируем устройство на стенде и выдаем акт с гарантией до 1 года.' 
  }
];

const DEFAULT_FAQ = [
  {
    question: "Сохранятся ли мои данные при ремонте?",
    answer: "При аппаратном компонентном ремонте мы не затрагиваем пользовательскую память устройства. Вероятность потери данных сведена к нулю, если материнская плата не имеет критических повреждений."
  },
  {
    question: "Сколько времени занимает диагностика?",
    answer: "Стандартная первичная диагностика занимает от 15 до 30 минут. При сложных случаях (например, залитие или короткое замыкание) может потребоваться глубокая диагностика до 1-2 рабочих дней."
  },
  {
    question: "Какие комплектующие вы используете?",
    answer: "Мы используем оригинальные запчасти, снятые с доноров, либо новые компоненты класса Original/Premium от проверенных поставщиков с заводской гарантией."
  }
];

// --- Главный Компонент ---
export default function ServicePageTemplate({
  seoTitle,
  seoDesc,
  icon: Icon = Wrench,
  title,
  description,
  advantages = [],
  risks = [],
  process = [],
  faq = [],
  bottomCta,
  telegramUrl,
}) {
  const [openFAQIndex, setOpenFAQIndex] = useState(0);
  
  const processData = process.length > 0 ? process : DEFAULT_PROCESS;
  const faqData = faq.length > 0 ? faq : DEFAULT_FAQ;
  const cta = bottomCta ?? {
    title: 'Нужна консультация инженера?',
    subtitle:
      'Опишите проблему, и мы сориентируем по срокам, рискам и точной стоимости ремонта вашего устройства. Без ботов, отвечает профильный специалист.',
    telegramLabel: 'Написать в Telegram',
    siteLabel: 'Оставить заявку на сайте',
  };
  const tgHref = telegramUrl || 'https://t.me/your_telegram';

  return (
    <PageTransition>
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-base)] transition-colors duration-700">
        <div className="absolute inset-0 bg-diagnostic-grid pointer-events-none transition-opacity duration-700" style={{ opacity: 'var(--grid-opacity)' }}></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] blur-[120px] rounded-full pointer-events-none transition-colors duration-700" style={{ background: 'var(--glow-accent)' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="mb-8">
            <Link to="/" className="inline-flex items-center text-[13px] font-mono text-[var(--text-muted)] hover:text-[#84CC16] transition-colors group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              НАЗАД В ЛАБОРАТОРИЮ
            </Link>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl">
            <motion.div variants={fadeUp} className="w-16 h-16 rounded-[20px] bg-[var(--bg-elevated)] border border-[var(--border-medium)] shadow-[var(--shadow-soft)] flex items-center justify-center mb-8">
              <Icon className="w-8 h-8 text-[#84CC16]" strokeWidth={1.5} />
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-[clamp(2.5rem,4vw,3.5rem)] font-medium text-[var(--text-primary)] leading-[1.1] tracking-tight mb-6 transition-colors" style={{ textShadow: 'var(--text-shadow)' }}>
              {title}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-[var(--text-secondary)] text-[clamp(1rem,1.5vw,1.125rem)] leading-relaxed font-normal">
              {description}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* 2 & 3. ADVANTAGES & RISKS SECTION */}
      <section className="py-20 lg:py-28 bg-[var(--bg-base)] transition-colors duration-700">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
            
            {/* Advantages */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}>
              <div className="flex items-center gap-3 mb-8">
                <CheckCircle2 className="w-6 h-6 text-[#84CC16]" />
                <h3 className="text-2xl font-medium text-[var(--text-primary)] tracking-tight">Преимущества</h3>
              </div>
              <div className="space-y-4">
                {advantages.map((adv, idx) => (
                  <motion.div key={idx} variants={fadeUp} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[20px] p-6 flex items-start gap-4 hover:border-[var(--border-accent-hover)] transition-all duration-500 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#84CC16] mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(132,204,22,0.5)]"></div>
                    <p className="text-[var(--text-primary)] text-[15px] leading-relaxed">{adv}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Risks */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer}>
              <div className="flex items-center gap-3 mb-8">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <h3 className="text-2xl font-medium text-[var(--text-primary)] tracking-tight">Риски и ограничения</h3>
              </div>
              <div className="space-y-4">
                {risks.map((risk, idx) => (
                  <motion.div key={idx} variants={fadeUp} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[20px] p-6 flex items-start gap-4 hover:border-amber-500/30 transition-all duration-500 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                    <p className="text-[var(--text-secondary)] text-[15px] leading-relaxed">{risk}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 4. REPAIR PROCESS TIMELINE */}
      <section className="py-20 lg:py-28 bg-[var(--bg-surface)] border-y border-[var(--border-subtle)] relative overflow-hidden transition-colors duration-700">
        <div className="absolute inset-0 bg-diagnostic-grid pointer-events-none transition-opacity duration-700" style={{ opacity: 'var(--grid-opacity)' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-16">
            <span className="text-[#84CC16] text-[10px] font-mono uppercase tracking-widest block mb-3">Workflow</span>
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] tracking-tight">Процесс работы</h2>
          </motion.div>

          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true }} 
            variants={staggerContainer}
            className="relative"
          >
            {/* Timeline line desktop */}
            <div className="hidden lg:block absolute top-10 left-0 w-full h-[1px] bg-[var(--border-medium)] -translate-y-1/2 z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              {processData.map((step, idx) => (
                <motion.div key={idx} variants={fadeUp} className="relative group">
                  <div className="w-20 h-20 rounded-[20px] bg-[var(--bg-elevated)] border border-[var(--border-medium)] flex items-center justify-center mb-6 shadow-sm group-hover:border-[var(--border-accent-hover)] transition-all duration-500 relative z-10">
                    <step.icon className="w-8 h-8 text-[var(--text-secondary)] group-hover:text-[#84CC16] transition-colors duration-500" strokeWidth={1.5} />
                    {/* Step indicator dot */}
                    <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[10px] font-mono text-[var(--text-muted)]">
                      {idx + 1}
                    </div>
                  </div>
                  <h4 className="text-lg font-medium text-[var(--text-primary)] mb-3">{step.title}</h4>
                  <p className="text-[var(--text-muted)] text-[14px] leading-relaxed pr-4">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="py-20 lg:py-28 bg-[var(--bg-base)] transition-colors duration-700">
        <div className="container mx-auto px-6 lg:px-8 max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <HelpCircle className="w-8 h-8 text-[#84CC16] mx-auto mb-6 opacity-80" strokeWidth={1.5} />
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] tracking-tight">Частые вопросы</h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[24px] p-6 md:p-10 shadow-[var(--shadow-card)]">
            {faqData.map((item, idx) => (
              <FAQItem 
                key={idx} 
                question={item.question} 
                answer={item.answer} 
                isOpen={openFAQIndex === idx}
                onClick={() => setOpenFAQIndex(openFAQIndex === idx ? -1 : idx)}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* 6 & 7. TELEGRAM & BOTTOM CTA */}
      <section className="py-24 lg:py-32 relative overflow-hidden bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] transition-colors duration-700">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] blur-[120px] rounded-full pointer-events-none transition-colors duration-700" style={{ background: 'var(--glow-accent)' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 max-w-4xl relative z-10 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={fadeUp} className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-[#84CC16]/10 mb-8 shadow-[inset_0_1px_0_var(--border-accent-hover)]">
              <Zap className="w-8 h-8 text-[#84CC16]" />
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-medium text-[var(--text-primary)] mb-6 tracking-tight transition-colors" style={{ textShadow: 'var(--text-shadow)' }}>
              {cta.title}
            </motion.h2>
            <motion.p variants={fadeUp} className="text-[var(--text-secondary)] text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              {cta.subtitle}
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={tgHref} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-4 rounded-[16px] bg-[#84CC16] text-[#0A0A0C] font-semibold text-[15px] hover:bg-[#9BE02A] transition-all duration-300 shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] transform hover:-translate-y-0.5">
                <MessageCircle className="w-5 h-5 mr-2" />
                {cta.telegramLabel}
              </a>
              <Link to="/#about" className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-4 rounded-[16px] bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-medium)] hover:bg-[var(--border-subtle)] hover:border-[var(--border-accent-hover)] transition-all duration-300 font-medium text-[15px] transform hover:-translate-y-0.5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)]">
                {cta.siteLabel}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </PageTransition>
  );
}