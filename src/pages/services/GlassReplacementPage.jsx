import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Layers, Smartphone, Sparkles, Fingerprint, 
  Eye, Zap, Shield, AlertTriangle, Monitor, Droplets, 
  Wind, CheckCircle2, XCircle, MessageCircle, Phone, 
  Sun, Maximize, Activity, Thermometer, Wrench, Search
} from 'lucide-react';
import PageTransition from '../../components/layout/PageTransition';
import { Reveal, Card } from '../../components/ui';
import { useCms } from '../../context/CmsContext';

const PRESERVED_FEATURES = [
  { icon: Monitor, title: "Оригинальная матрица", desc: "Остается ваша родная OLED/AMOLED панель от завода-производителя устройства." },
  { icon: Sun, title: "Яркость и HDR", desc: "Никаких тусклых экранов. Пиковая яркость и контрастность 2000000:1 сохраняются полностью." },
  { icon: Zap, title: "Частота 120Hz", desc: "Плавность анимаций ProMotion и адаптивная частота обновления работают без рывков." },
  { icon: Eye, title: "True Tone & Цвета", desc: "Автоматическая подстройка под освещение и цветовой охват DCI-P3 работают штатно." },
  { icon: Fingerprint, title: "Face ID и Touch ID", desc: "Датчики освещенности, проектор точек и подэкранные сканеры отпечатков не повреждаются." },
  { icon: Maximize, title: "Идеальный отклик", desc: "Оригинальный сенсорный слой реагирует на касания мгновенно, без 'фантомных' нажатий." }
];

const WORKFLOW = [
  { icon: Search, title: "Диагностика", desc: "Проверка матрицы на мертвые пиксели" },
  { icon: Layers, title: "Сепарация", desc: "Срезка битого стекла струной" },
  { icon: Droplets, title: "Очистка", desc: "Удаление старого слоя OCA" },
  { icon: Smartphone, title: "Ламинация", desc: "Центровка нового стекла" },
  { icon: Wind, title: "Вакуум", desc: "Пресс для удаления пузырей" },
  { icon: Sparkles, title: "УФ-Сушка", desc: "Полимеризация клея" },
];

const BRANDS = [
  {
    id: 'Apple',
    title: 'Apple iPhone',
    specs: ['Поддержка OLED/Super Retina XDR', 'Сохранение True Tone', 'Отсутствие ошибки дисплея', 'Керамическое стекло (Ceramic Shield)']
  },
  {
    id: 'Samsung',
    title: 'Samsung Galaxy',
    specs: ['Восстановление изогнутых (Edge) экранов', 'Поддержка Dynamic AMOLED 2X', 'Сохранение подэкранного Touch ID', 'Поддержка S-Pen']
  },
  {
    id: 'Xiaomi',
    title: 'Xiaomi / POCO',
    specs: ['Восстановление экранов 120Hz/144Hz', 'Поддержка LTPO панелей', 'Точная калибровка оптического сканера', 'Олеофобное покрытие премиум класса']
  }
];

export default function GlassReplacementPage() {
  const { cmsData } = useCms();
  const page = cmsData.servicePages.glassReplacement;
  const [activeBrand, setActiveBrand] = useState(BRANDS[0].id);
  const activeBrandData = BRANDS.find(b => b.id === activeBrand);

  return (
    <PageTransition>
      {/* 1. HERO BLOCK */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-base)] transition-colors duration-700">
        <div className="absolute inset-0 bg-diagnostic-grid pointer-events-none transition-opacity duration-700" style={{ opacity: 'var(--grid-opacity)' }}></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] blur-[150px] rounded-full pointer-events-none transition-colors duration-700" style={{ background: 'var(--glow-accent)' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative z-10">
          <Reveal>
            <Link to="/" className="inline-flex items-center text-[13px] font-mono text-[var(--text-muted)] hover:text-[#84CC16] transition-colors group mb-8">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              НА ГЛАВНУЮ
            </Link>
          </Reveal>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-20 items-center">
            <div>
              <Reveal delay={100}>
                <div className="inline-flex items-center gap-3 mb-6 px-4 py-2 rounded-full bg-[#84CC16]/10 border border-[#84CC16]/20">
                  <Layers className="w-4 h-4 text-[#84CC16]" />
                  <span className="text-[11px] font-mono text-[#84CC16] uppercase tracking-widest">{page.heroBadge}</span>
                </div>
              </Reveal>
              <Reveal delay={150}>
                <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-medium text-[var(--text-primary)] leading-[1.05] tracking-tight mb-6 transition-colors" style={{ textShadow: 'var(--text-shadow)' }}>
                  {page.heroTitle}<br/><span className="text-[var(--text-secondary)]">{page.heroTitleAccent}</span>
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-[var(--text-secondary)] text-lg md:text-xl leading-relaxed font-normal max-w-2xl mb-10">
                  {page.heroDescription}
                </p>
              </Reveal>
              <Reveal delay={250}>
                <div className="flex flex-wrap gap-4 border-l-2 border-[#84CC16]/30 pl-4">
                  <div className="flex flex-col pr-6 border-r border-[var(--border-subtle)]">
                    <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">МАТРИЦА</span>
                    <span className="text-[var(--text-primary)] font-medium">ORIGINAL</span>
                  </div>
                  <div className="flex flex-col pr-6 border-r border-[var(--border-subtle)]">
                    <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">ВЫГОДА</span>
                    <span className="text-[var(--text-primary)] font-medium">ДО -60%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-1">ЭСТЕТИКА</span>
                    <span className="text-[var(--text-primary)] font-medium">КАК НОВЫЙ</span>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* 3D Layered Glass Graphic */}
            <Reveal delay={300} className="relative hidden lg:flex items-center justify-center perspective-1000">
              <div className="relative w-full aspect-square max-w-[500px] flex items-center justify-center transform-gpu rotate-y-[-10deg] rotate-x-[10deg] group hover:rotate-y-[-5deg] hover:rotate-x-[5deg] transition-transform duration-1000 ease-premium">
                
                <div className="relative w-[260px] h-[520px] transform-gpu rotate-x-[50deg] rotate-z-[-30deg]">
                  
                  {/* Bottom Layer: OLED Matrix */}
                  <motion.div 
                    animate={{ z: [0, -10, 0] }} 
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} 
                    className="absolute inset-0 bg-[#0A0A0C] border-2 border-[#84CC16]/50 shadow-[0_0_80px_rgba(132,204,22,0.3)] rounded-[32px] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-40"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#84CC16]/20 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4 text-[10px] font-mono text-[#84CC16] uppercase flex justify-between">
                      <span>OLED MATRIX</span>
                      <span>ACTIVE</span>
                    </div>
                  </motion.div>

                  {/* Middle Layer: OCA Film */}
                  <motion.div 
                    animate={{ z: [40, 50, 40] }} 
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} 
                    className="absolute inset-0 bg-[var(--bg-elevated)]/60 border border-[var(--border-medium)] rounded-[32px] backdrop-blur-[2px] shadow-xl flex items-center justify-center"
                  >
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase border border-[var(--border-subtle)] px-3 py-1 rounded-full">OCA GLUE FILM</div>
                  </motion.div>

                  {/* Top Layer: New Glass */}
                  <motion.div 
                    animate={{ z: [80, 110, 80] }} 
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} 
                    className="absolute inset-0 bg-gradient-to-br from-[var(--border-medium)] to-transparent border border-[var(--border-medium)] rounded-[32px] backdrop-blur-md shadow-[var(--shadow-card)] overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-[150%] bg-gradient-to-b from-[var(--border-medium)] to-transparent transform -skew-y-12 translate-y-[-50%]"></div>
                    <div className="absolute top-4 left-4 text-[10px] font-mono text-[var(--text-secondary)] uppercase">PREMIUM GLASS</div>
                  </motion.div>

                </div>

                {/* Floating Telemetry */}
                <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[15%] left-0 bg-[var(--glass-bg)] border border-[var(--border-subtle)] p-3 rounded-xl shadow-[var(--shadow-card)] backdrop-blur-md z-20 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Wind className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">ВАКУУМНЫЙ ПРЕСС</div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">-98 kPa</div>
                  </div>
                </motion.div>

                <motion.div animate={{ y: [5, -5, 5] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[20%] right-[-10%] bg-[var(--glass-bg)] border border-[var(--border-subtle)] p-3 rounded-xl shadow-[var(--shadow-card)] backdrop-blur-md z-20 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Sun className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase">УФ-ПОЛИМЕРИЗАЦИЯ</div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">365 nm</div>
                  </div>
                </motion.div>

              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 2. PRESERVED FEATURES SECTION */}
      <section className="py-24 bg-[var(--bg-base)] transition-colors duration-700">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          <Reveal className="mb-16 text-center">
            <span className="text-[#84CC16] text-[10px] font-mono uppercase tracking-widest block mb-3">DISPLAY INTEGRITY</span>
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] tracking-tight">Что сохраняется при восстановлении</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRESERVED_FEATURES.map((feature, idx) => (
              <Reveal key={idx} delay={idx * 50}>
                <Card interactive className="p-8 h-full flex flex-col group glow-accent">
                  <div className="w-12 h-12 rounded-[14px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center mb-6 group-hover:bg-[#84CC16]/10 group-hover:border-[#84CC16]/20 transition-colors duration-500">
                    <feature.icon className="w-6 h-6 text-[var(--text-secondary)] group-hover:text-[#84CC16] transition-colors duration-500" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[18px] font-medium text-[var(--text-primary)] mb-3 group-hover:text-[#84CC16] transition-colors tracking-tight">{feature.title}</h3>
                  <p className="text-[var(--text-muted)] text-[14px] leading-relaxed">{feature.desc}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3. WORKFLOW TIMELINE */}
      <section className="py-24 bg-[var(--bg-surface)] border-y border-[var(--border-subtle)] transition-colors duration-700">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          <Reveal className="mb-20 text-center">
            <span className="text-[#84CC16] text-[10px] font-mono uppercase tracking-widest block mb-3">ENGINEERING WORKFLOW</span>
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] tracking-tight">Процесс переклейки</h2>
          </Reveal>

          <div className="relative">
            <div className="hidden lg:block absolute top-[40px] left-[5%] right-[5%] h-[2px] bg-[var(--border-medium)] z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#84CC16]/30 to-transparent origin-left animate-[scale-x_2s_ease-out_forwards]"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative z-10">
              {WORKFLOW.map((step, idx) => (
                <Reveal key={idx} delay={idx * 100} className="relative group">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-[20px] bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center mb-6 shadow-[var(--shadow-soft)] group-hover:border-[#84CC16]/30 group-hover:bg-[#84CC16]/5 transition-all duration-500 relative z-10">
                      <step.icon className="w-8 h-8 text-[var(--text-muted)] group-hover:text-[#84CC16] transition-colors duration-500" strokeWidth={1.5} />
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[10px] font-mono text-[var(--text-secondary)]">
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

      {/* 4. OLED VS COPY - COMPARISON */}
      <section className="py-24 bg-[var(--bg-base)] transition-colors duration-700">
        <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
          <Reveal className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] tracking-tight">Оригинал против Дешевых Копий</h2>
            <p className="text-[var(--text-secondary)] mt-4 max-w-2xl mx-auto">Почему лучше восстановить свой родной дисплей, чем ставить китайскую подделку.</p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Original Restored */}
            <Reveal delay={100}>
              <div className="bg-[var(--bg-surface)] border border-[#84CC16]/20 rounded-[32px] p-8 md:p-10 shadow-[var(--shadow-card)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#84CC16]/5 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-[16px] bg-[#84CC16]/10 flex items-center justify-center border border-[#84CC16]/20">
                    <CheckCircle2 className="w-6 h-6 text-[#84CC16]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium text-[var(--text-primary)]">Оригинал после переклейки</h3>
                    <span className="text-[#84CC16] text-[13px] font-mono uppercase">Laboratory Restored</span>
                  </div>
                </div>
                <ul className="space-y-5">
                  <li className="flex items-center text-[var(--text-primary)] text-[15px]"><CheckCircle2 className="w-5 h-5 text-[#84CC16] mr-4 flex-shrink-0" />Идеальная яркость и глубокий черный (OLED)</li>
                  <li className="flex items-center text-[var(--text-primary)] text-[15px]"><CheckCircle2 className="w-5 h-5 text-[#84CC16] mr-4 flex-shrink-0" />Точный сенсор без фантомных нажатий</li>
                  <li className="flex items-center text-[var(--text-primary)] text-[15px]"><CheckCircle2 className="w-5 h-5 text-[#84CC16] mr-4 flex-shrink-0" />Полная поддержка 120Hz (ProMotion)</li>
                  <li className="flex items-center text-[var(--text-primary)] text-[15px]"><CheckCircle2 className="w-5 h-5 text-[#84CC16] mr-4 flex-shrink-0" />Низкое энергопотребление</li>
                  <li className="flex items-center text-[var(--text-primary)] text-[15px]"><CheckCircle2 className="w-5 h-5 text-[#84CC16] mr-4 flex-shrink-0" />Идеальная толщина (модуль не выпирает)</li>
                  <li className="flex items-center text-[var(--text-primary)] text-[15px]"><CheckCircle2 className="w-5 h-5 text-[#84CC16] mr-4 flex-shrink-0" />Отсутствие ошибки о замене дисплея</li>
                </ul>
              </div>
            </Reveal>

            {/* Fake Copy */}
            <Reveal delay={200}>
              <div className="bg-[var(--bg-surface)] border border-amber-500/20 rounded-[32px] p-8 md:p-10 shadow-[var(--shadow-soft)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-[16px] bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <XCircle className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium text-[var(--text-primary)]">Дешевая TFT копия</h3>
                    <span className="text-amber-500 text-[13px] font-mono uppercase">Full Replacement</span>
                  </div>
                </div>
                <ul className="space-y-5">
                  <li className="flex items-center text-[var(--text-secondary)] text-[15px]"><XCircle className="w-5 h-5 text-amber-500 mr-4 flex-shrink-0" />Блеклые цвета, тусклая подсветка, сероватый фон</li>
                  <li className="flex items-center text-[var(--text-secondary)] text-[15px]"><XCircle className="w-5 h-5 text-amber-500 mr-4 flex-shrink-0" />Глюки тачскрина при зарядке и на морозе</li>
                  <li className="flex items-center text-[var(--text-secondary)] text-[15px]"><XCircle className="w-5 h-5 text-amber-500 mr-4 flex-shrink-0" />Только 60Hz, рваные анимации</li>
                  <li className="flex items-center text-[var(--text-secondary)] text-[15px]"><XCircle className="w-5 h-5 text-amber-500 mr-4 flex-shrink-0" />Повышенный расход аккумулятора (на 20-30%)</li>
                  <li className="flex items-center text-[var(--text-secondary)] text-[15px]"><XCircle className="w-5 h-5 text-amber-500 mr-4 flex-shrink-0" />Дисплей толще оригинала, выступает из корпуса</li>
                  <li className="flex items-center text-[var(--text-secondary)] text-[15px]"><XCircle className="w-5 h-5 text-amber-500 mr-4 flex-shrink-0" />Уведомление "Неизвестная деталь" (iPhone)</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5. DEVICE COMPATIBILITY (INTERACTIVE) */}
      <section className="py-24 bg-[var(--bg-surface)] border-y border-[var(--border-subtle)] transition-colors duration-700">
        <div className="container mx-auto px-6 lg:px-8 max-w-5xl">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-medium text-[var(--text-primary)] tracking-tight">Мы восстанавливаем</h2>
          </Reveal>

          <Reveal>
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {BRANDS.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => setActiveBrand(brand.id)}
                  className={`px-6 py-3 rounded-full text-[14px] font-medium transition-all duration-300 ease-premium border ${
                    activeBrand === brand.id 
                      ? 'bg-[#84CC16]/10 border-[#84CC16]/30 text-[#84CC16] shadow-[0_0_20px_rgba(132,204,22,0.15)]' 
                      : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {brand.id}
                </button>
              ))}
            </div>

            <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-[24px] p-8 md:p-12 text-center max-w-3xl mx-auto shadow-[var(--shadow-card)] relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeBrand}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-2xl font-medium text-[var(--text-primary)] mb-8">{activeBrandData.title}</h3>
                  <div className="grid sm:grid-cols-2 gap-4 text-left">
                    {activeBrandData.specs.map((spec, i) => (
                      <div key={i} className="flex items-center text-[var(--text-secondary)] bg-[var(--bg-surface)] p-4 rounded-[16px] border border-[var(--border-subtle)]">
                        <CheckCircle2 className="w-5 h-5 text-[#84CC16] mr-3 flex-shrink-0" />
                        <span className="text-[14px]">{spec}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 6. RISKS AND CONSTRAINTS */}
      <section className="py-20 bg-[var(--bg-base)] transition-colors duration-700">
        <div className="container mx-auto px-6 lg:px-8 max-w-5xl">
          <Reveal>
            <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-[32px] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-[var(--shadow-soft)]">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 border border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
              </div>
              <div>
                <h3 className="text-2xl font-medium text-[var(--text-primary)] mb-3">Ограничения технологии</h3>
                <p className="text-[var(--text-secondary)] text-[15px] leading-relaxed mb-6">
                  Восстановление стекла возможно только если оригинальная OLED/AMOLED матрица полностью исправна. Процедура не проводится, если:
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-[var(--bg-elevated)] border border-amber-500/20 rounded-full text-[13px] text-amber-600">Черные пятна на экране</span>
                  <span className="px-4 py-2 bg-[var(--bg-elevated)] border border-amber-500/20 rounded-full text-[13px] text-amber-600">Цветные полосы</span>
                  <span className="px-4 py-2 bg-[var(--bg-elevated)] border border-amber-500/20 rounded-full text-[13px] text-amber-600">Мертвые зоны тачскрина</span>
                  <span className="px-4 py-2 bg-[var(--bg-elevated)] border border-amber-500/20 rounded-full text-[13px] text-amber-600">Глубокие сколы у шлейфа</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7. CTA SECTION */}
      <section className="py-24 lg:py-32 relative overflow-hidden bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] transition-colors duration-700">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-[120px] rounded-full pointer-events-none transition-colors duration-700" style={{ background: 'var(--glow-accent)' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 max-w-4xl relative z-10 text-center">
          <Reveal className="flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-[#84CC16]/10 mb-8 shadow-[inset_0_1px_0_var(--border-accent-hover)]">
              <Eye className="w-8 h-8 text-[#84CC16]" />
            </div>
            <h2 className="text-4xl md:text-5xl font-medium text-[var(--text-primary)] mb-6 tracking-tight transition-colors" style={{ textShadow: 'var(--text-shadow)' }}>
              Узнать возможность восстановления
            </h2>
            <p className="text-[var(--text-secondary)] text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
              Пришлите фото вашего разбитого устройства, и инженер сразу скажет, возможно ли сохранить родную матрицу и сколько это будет стоить.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <a 
                href="https://t.me/your_telegram" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-4 rounded-xl bg-[#84CC16] text-[#0A0A0C] font-semibold text-[15px] hover:bg-[#95D926] transition-all duration-300 shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] transform hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Написать в Telegram
              </a>
              <a 
                href="https://wa.me/70000000000" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-4 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-medium)] hover:bg-[var(--border-subtle)] hover:border-[var(--border-accent-hover)] transition-all duration-300 font-medium text-[15px] transform hover:-translate-y-0.5 shadow-[var(--shadow-soft)]"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                WhatsApp
              </a>
              <a 
                href="tel:+70000000000" 
                className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-4 rounded-xl bg-transparent text-[var(--text-primary)] border border-[var(--border-medium)] hover:bg-[var(--bg-elevated)] hover:border-[var(--border-accent-hover)] transition-all duration-300 font-medium text-[15px] transform hover:-translate-y-0.5"
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