import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Wrench, Smartphone, Battery, MonitorPlay, 
  Camera, Usb, Volume2, ScanFace, CheckCircle2, 
  AlertTriangle, Shield, Droplets, Activity, Cpu, 
  MessageCircle, Phone, Fingerprint, Layers
} from 'lucide-react';
import PageTransition from '../../components/layout/PageTransition';
import { Reveal, Card, Button } from '../../components/ui';
import { useCms } from '../../context/CmsContext';

const BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'POCO', 'Redmi', 'Huawei', 'Honor', 'Realme'];

const REPAIR_TYPES = {
  display: {
    icon: MonitorPlay,
    title: "Замена дисплея",
    time: "1-2 часа",
    desc: "Установка оригинальных OLED/AMOLED матриц или качественных In-Cell копий высшего грейда.",
    appleTags: ["Восстановление True Tone", "Перенос IC (без ошибки)"],
    androidTags: ["Оригинальные Service Pack", "Калибровка сканера отпечатка"]
  },
  battery: {
    icon: Battery,
    title: "Замена аккумулятора",
    time: "30-60 мин",
    desc: "Установка новых элементов питания с восстановлением заводской автономности и пиковой производительности.",
    appleTags: ["Сброс циклов", "Отображение 100% емкости"],
    androidTags: ["Поддержка быстрой зарядки", "Оригинальные контроллеры"]
  },
  camera: {
    icon: Camera,
    title: "Модули камер",
    time: "1-2 часа",
    desc: "Устранение проблем с фокусировкой, пятнами на матрице или разбитым стеклом объектива.",
    appleTags: ["Оригинальная оптика", "Без пятен и пыли"],
    androidTags: ["Сохранение OIS", "Оригинальные стекла"]
  },
  port: {
    icon: Usb,
    title: "Разъем зарядки",
    time: "1-2 часа",
    desc: "Замена нижнего шлейфа или перепайка самого коннектора Type-C / Lightning.",
    appleTags: ["Чистка микрофонов", "Замена шлейфа в сборе"],
    androidTags: ["Восстановление Fast Charge", "Пайка коннектора"]
  },
  faceid: {
    icon: ScanFace,
    title: "Face ID / Touch ID",
    time: "1-3 дня",
    desc: "Сложный компонентный ремонт биометрических датчиков с применением микропайки.",
    appleTags: ["Восстановление Dot Projector", "Реболл Flood Illuminator"],
    androidTags: ["Ультразвуковые сканеры", "Оптические датчики"]
  },
  housing: {
    icon: Layers,
    title: "Корпус и стекла",
    time: "3-4 часа",
    desc: "Замена разбитой задней крышки лазером или полная пересборка устройства в новую оригинальную раму.",
    appleTags: ["Лазерная срезка стекла", "Оригинальные рамы"],
    androidTags: ["Заводская проклейка", "Замена крышки"]
  }
};

const WORKFLOW = [
  { icon: Activity, title: "Диагностика", desc: "Выявление точной причины" },
  { icon: Cpu, title: "Совместимость", desc: "Подбор ревизии детали" },
  { icon: CheckCircle2, title: "Согласование", desc: "Фиксация цены и сроков" },
  { icon: Wrench, title: "Ремонт", desc: "Установка и калибровка" },
  { icon: Shield, title: "Тестирование", desc: "Проверка на стенде" },
  { icon: Smartphone, title: "Выдача", desc: "Оплата и гарантия" }
];

export default function ModularRepairPage() {
  const { cmsData } = useCms();
  const page = cmsData.servicePages.modularRepair;
  const [activeBrand, setActiveBrand] = useState('Apple');
  const isApple = activeBrand === 'Apple';

  return (
    <PageTransition>
      {/* 1. HERO BLOCK */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-base)] transition-colors duration-700">
        <div className="absolute inset-0 bg-diagnostic-grid pointer-events-none transition-opacity duration-700" style={{ opacity: 'var(--grid-opacity)' }}></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] blur-[150px] rounded-full pointer-events-none transition-colors duration-700" style={{ background: 'var(--glow-accent)' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative z-10">
          <Reveal>
            <Link to="/" className="inline-flex items-center text-[13px] font-mono text-[var(--text-muted)] hover:text-[#84CC16] transition-colors group mb-8">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              НА ГЛАВНУЮ
            </Link>
          </Reveal>

          <div className="grid lg:grid-cols-[1fr_0.8fr] gap-12 lg:gap-20 items-center">
            <div>
              <Reveal delay={100}>
                <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-[#84CC16]/10 border border-[#84CC16]/20">
                  <Wrench className="w-4 h-4 text-[#84CC16]" />
                  <span className="text-[11px] font-mono text-[#84CC16] uppercase tracking-widest">Hardware Component Replacement</span>
                </div>
              </Reveal>
              <Reveal delay={150}>
                <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-medium text-[var(--text-primary)] leading-[1.05] tracking-tight mb-6 transition-colors" style={{ textShadow: 'var(--text-shadow)' }}>
                  {page.heroTitle}
                  {page.heroTitleAccent ? (
                    <>
                      <br />
                      <span className="text-[var(--text-secondary)]">{page.heroTitleAccent}</span>
                    </>
                  ) : null}
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-[var(--text-secondary)] text-lg md:text-xl leading-relaxed font-normal max-w-2xl mb-10">
                  {page.heroDescription}
                </p>
              </Reveal>
              <Reveal delay={250}>
                <div className="flex gap-6 border-l-2 border-[#84CC16]/30 pl-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Сроки</span>
                    <span className="text-[var(--text-primary)] font-medium">От 30 минут</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Запчасти</span>
                    <span className="text-[var(--text-primary)] font-medium">Original / Premium</span>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Floating Hardware Graphic */}
            <Reveal delay={300} className="relative hidden lg:block perspective-1000">
              <div className="relative w-full aspect-square max-w-[500px] mx-auto transform-gpu rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-1000 ease-premium">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#84CC16]/20 to-transparent rounded-full blur-3xl transition-opacity duration-700" style={{ opacity: 'var(--grid-opacity)' }}></div>
                <div className="absolute inset-4 border border-[var(--border-subtle)] rounded-full animate-[spin_60s_linear_infinite] border-dashed"></div>
                <div className="absolute inset-12 border border-[#84CC16]/10 rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-3xl shadow-[var(--shadow-card)] flex items-center justify-center backdrop-blur-xl relative z-10">
                    <Cpu className="w-12 h-12 text-[#84CC16]" strokeWidth={1} />
                  </div>
                </div>
                {/* Floating elements */}
                <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 left-1/4 w-16 h-16 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-2xl flex items-center justify-center shadow-[var(--shadow-soft)]">
                  <MonitorPlay className="w-6 h-6 text-[var(--text-secondary)]" />
                </motion.div>
                <motion.div animate={{ y: [10, -10, 10] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-1/4 right-1/4 w-16 h-16 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-2xl flex items-center justify-center shadow-[var(--shadow-soft)]">
                  <Battery className="w-6 h-6 text-[var(--text-secondary)]" />
                </motion.div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 2. BRAND SELECTOR */}
      <section className="py-20 bg-[var(--bg-base)] transition-colors duration-700">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          <Reveal>
            <div className="flex flex-col items-center mb-12">
              <h2 className="text-[12px] font-mono text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6">Выберите производителя</h2>
              <div className="flex flex-wrap justify-center gap-3 max-w-4xl">
                {BRANDS.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => setActiveBrand(brand)}
                    className={`px-6 py-3 rounded-full text-[14px] font-medium transition-all duration-300 ease-premium border ${
                      activeBrand === brand 
                        ? 'bg-[#84CC16]/10 border-[#84CC16]/30 text-[#84CC16] shadow-[0_0_20px_rgba(132,204,22,0.15)]' 
                        : 'bg-[var(--bg-surface)] border-[var(--border-medium)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent-hover)]'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* 3. REPAIR TYPES GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="wait">
              {Object.entries(REPAIR_TYPES).map(([key, repair], idx) => {
                const tags = isApple ? repair.appleTags : repair.androidTags;
                
                return (
                  <Reveal key={`${key}-${activeBrand}`} delay={idx * 50}>
                    <Card interactive className="p-8 h-full flex flex-col group bg-[var(--bg-surface)] border-[var(--border-subtle)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)]">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--border-medium)] flex items-center justify-center group-hover:border-[var(--border-accent-hover)] group-hover:bg-[#84CC16]/10 transition-colors duration-500 shadow-sm">
                          <repair.icon className="w-6 h-6 text-[var(--text-secondary)] group-hover:text-[#84CC16] transition-colors duration-500" strokeWidth={1.5} />
                        </div>
                        <span className="text-[11px] font-mono text-[var(--text-muted)] bg-[var(--bg-base)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                          {repair.time}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-medium text-[var(--text-primary)] mb-3 group-hover:text-[#84CC16] transition-colors">{repair.title}</h3>
                      <p className="text-[var(--text-secondary)] text-[14px] leading-relaxed mb-6 flex-grow">{repair.desc}</p>
                      
                      <div className="space-y-2 mt-auto pt-6 border-t border-[var(--border-subtle)]">
                        {tags.map((tag, i) => (
                          <div key={i} className="flex items-center text-[13px] text-[var(--text-secondary)]">
                            <CheckCircle2 className="w-4 h-4 text-[#84CC16] mr-2 flex-shrink-0 opacity-70" />
                            {tag}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Reveal>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 4. IMPORTANT INFO SECTION */}
      <section className="py-24 bg-[var(--bg-surface)] border-y border-[var(--border-subtle)] relative overflow-hidden transition-colors duration-700">
        <div className="absolute inset-0 bg-diagnostic-grid pointer-events-none transition-opacity duration-700" style={{ opacity: 'var(--grid-opacity)' }}></div>
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative z-10">
          <Reveal className="mb-16">
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] tracking-tight">Стандарты качества</h2>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Reveal delay={100}>
              <div className="bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-[24px] p-8 md:p-10 relative overflow-hidden group shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] hover:border-[var(--border-accent-hover)] transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 blur-[80px] rounded-full pointer-events-none transition-colors duration-700" style={{ background: 'var(--glow-accent)' }}></div>
                <Shield className="w-8 h-8 text-[#84CC16] mb-6" strokeWidth={1.5} />
                <h3 className="text-2xl font-medium text-[var(--text-primary)] mb-4">Оригиналы и премиум аналоги</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-6">Мы не используем дешевые TFT-копии дисплеев, которые сажают батарею и портят зрение. Только оригинальные Service Pack, снятые с доноров оригиналы или сертифицированные OLED/In-Cell матрицы высшего класса.</p>
                <ul className="space-y-3">
                  <li className="flex items-center text-[var(--text-primary)] text-[15px]"><div className="w-1.5 h-1.5 rounded-full bg-[#84CC16] mr-3"></div>Сохранение оригинальной цветопередачи</li>
                  <li className="flex items-center text-[var(--text-primary)] text-[15px]"><div className="w-1.5 h-1.5 rounded-full bg-[#84CC16] mr-3"></div>Оригинальные контроллеры тачскрина</li>
                </ul>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="bg-[var(--bg-elevated)] border border-amber-500/20 rounded-[24px] p-8 md:p-10 relative overflow-hidden group shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] hover:border-amber-500/40 transition-all duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                <AlertTriangle className="w-8 h-8 text-amber-500 mb-6" strokeWidth={1.5} />
                <h3 className="text-2xl font-medium text-[var(--text-primary)] mb-4">Нюансы сборки и прошивки</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed mb-6">Современные смартфоны (особенно Apple) программно привязывают детали к материнской плате. При ремонте мы выполняем перенос микросхем или прошивку серийных номеров.</p>
                <ul className="space-y-3">
                  <li className="flex items-center text-[var(--text-primary)] text-[15px]"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-3"></div>Восстановление True Tone</li>
                  <li className="flex items-center text-[var(--text-primary)] text-[15px]"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-3"></div>Восстановление пыле/влагозащитных проклеек</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5. DEVICE STATUS FLOW */}
      <section className="py-24 bg-[var(--bg-base)] transition-colors duration-700">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          <Reveal className="mb-20 text-center">
            <span className="text-[#84CC16] text-[10px] font-mono uppercase tracking-widest block mb-3">Service Pipeline</span>
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] tracking-tight">Процесс обслуживания</h2>
          </Reveal>

          <div className="relative">
            {/* Desktop connecting line */}
            <div className="hidden lg:block absolute top-[40px] left-[5%] right-[5%] h-[2px] bg-[var(--border-subtle)] z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#84CC16]/30 to-transparent origin-left animate-[scale-x_2s_ease-out_forwards]"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative z-10">
              {WORKFLOW.map((step, idx) => (
                <Reveal key={idx} delay={idx * 100} className="relative group">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-[20px] bg-[var(--bg-elevated)] border border-[var(--border-medium)] flex items-center justify-center mb-6 shadow-[var(--shadow-soft)] group-hover:border-[var(--border-accent-hover)] group-hover:bg-[#84CC16]/5 transition-all duration-500 relative z-10">
                      <step.icon className="w-8 h-8 text-[var(--text-secondary)] group-hover:text-[#84CC16] transition-colors duration-500" strokeWidth={1.5} />
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--bg-surface)] border border-[var(--border-medium)] flex items-center justify-center text-[10px] font-mono text-[var(--text-muted)]">
                        {idx + 1}
                      </div>
                    </div>
                    <h4 className="text-[16px] font-medium text-[var(--text-primary)] mb-2">{step.title}</h4>
                    <p className="text-[var(--text-muted)] text-[13px] leading-relaxed">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRICE INFO BLOCK */}
      <section className="py-20 bg-[var(--bg-surface)] border-y border-[var(--border-subtle)] transition-colors duration-700">
        <div className="container mx-auto px-6 lg:px-8 max-w-4xl">
          <Reveal>
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-accent-hover)] rounded-[24px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[var(--shadow-card)]">
              <div>
                <h3 className="text-2xl font-medium text-[var(--text-primary)] mb-3">Оценка стоимости ремонта</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed max-w-xl">
                  Цена запчасти и работы сильно зависит от конкретной модели устройства, ревизии платы и наличия привязок. Мы озвучиваем точную стоимость <span className="text-[var(--text-primary)] font-medium">только после бесплатной аппаратной диагностики</span>.
                </p>
              </div>
              <div className="w-full md:w-auto flex-shrink-0">
                <div className="px-6 py-4 rounded-[16px] bg-[var(--bg-surface)] border border-[var(--border-medium)] text-center shadow-[var(--shadow-soft)]">
                  <span className="block text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">Диагностика</span>
                  <span className="block text-xl font-medium text-[#84CC16]">Бесплатно</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7. CTA BLOCK */}
      <section className="py-24 lg:py-32 relative overflow-hidden bg-[var(--bg-base)] transition-colors duration-700">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-[120px] rounded-full pointer-events-none transition-colors duration-700" style={{ background: 'var(--glow-accent)' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 max-w-4xl relative z-10 text-center">
          <Reveal className="flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-[#84CC16]/10 mb-8 shadow-[inset_0_1px_0_var(--border-accent-hover)]">
              <Activity className="w-8 h-8 text-[#84CC16]" />
            </div>
            <h2 className="text-4xl md:text-5xl font-medium text-[var(--text-primary)] mb-6 tracking-tight transition-colors" style={{ textShadow: 'var(--text-shadow)' }}>
              Отправить устройство на диагностику
            </h2>
            <p className="text-[var(--text-secondary)] text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
              Свяжитесь с нами, опишите поломку, и инженер сориентирует вас по примерным срокам и наличию деталей на складе.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <a
                href="https://t.me/your_telegram" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-4 rounded-xl bg-[#84CC16] text-[#0A0A0C] font-semibold text-[15px] hover:bg-[#9BE02A] transition-all duration-300 shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] transform hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Написать в Telegram
              </a>
              <a 
                href="https://wa.me/70000000000" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-4 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-medium)] hover:bg-[var(--border-subtle)] hover:border-[var(--border-accent-hover)] transition-all duration-300 font-medium text-[15px] transform hover:-translate-y-0.5 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)]"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp
              </a>
              <a 
                href="tel:+70000000000" 
                className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-4 rounded-xl bg-transparent text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-medium)] transition-all duration-300 font-medium text-[15px] transform hover:-translate-y-0.5"
              >
                <Phone className="w-5 h-5 mr-2" />
                Позвонить
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}