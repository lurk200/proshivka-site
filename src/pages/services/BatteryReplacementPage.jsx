import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Battery, BatteryCharging, BatteryWarning, 
  Zap, Snowflake, Flame, Clock, Activity, Cpu, Shield, 
  CheckCircle2, XCircle, AlertTriangle, Search, Wrench, 
  Settings, MessageCircle, Phone, Info, Smartphone, Thermometer
} from 'lucide-react';
import PageTransition from '../../components/layout/PageTransition';
import { Reveal, Card } from '../../components/ui';
import { useCms } from '../../context/CmsContext';

const SYMPTOMS = [
  { icon: BatteryWarning, title: "Быстрый разряд", desc: "Устройство не доживает до вечера даже при умеренном использовании. Заряд тает на глазах." },
  { icon: Snowflake, title: "Выключения на холоде", desc: "Внезапные отключения на улице при 20-40% заряда. Батарея не держит напряжение при низких температурах." },
  { icon: Clock, title: "Медленная зарядка", desc: "Устройство заряжается значительно дольше обычного или не может набрать 100% емкости." },
  { icon: Flame, title: "Сильный нагрев", desc: "Аномальный нагрев задней крышки при обычной зарядке или базовых задачах." },
  { icon: AlertTriangle, title: "Вздутие батареи", desc: "Экран или задняя крышка начинают отклеиваться от рамки. Появление пятен на матрице." },
  { icon: Activity, title: "Скачки процентов", desc: "Уровень заряда резко падает (например, с 50% до 10% за пару минут) или меняется после перезагрузки." }
];

const WORKFLOW = [
  { icon: Search, title: "Диагностика", desc: "Замер емкости и токов" },
  { icon: Wrench, title: "Разбор", desc: "Безопасное вскрытие" },
  { icon: Zap, title: "Питание", desc: "Проверка контроллера" },
  { icon: Battery, title: "Замена", desc: "Установка новой АКБ" },
  { icon: Settings, title: "BMS", desc: "Перенос чипа / калибровка" },
  { icon: Activity, title: "Тест", desc: "Проверка под нагрузкой" }
];

export default function BatteryReplacementPage() {
  const { cmsData } = useCms();
  const page = cmsData.servicePages.batteryReplacement;

  return (
    <PageTransition>
      {/* 1. HERO BLOCK */}
      <section className="relative pt-40 pb-24 md:pt-56 md:pb-32 overflow-hidden bg-[var(--bg-canvas)] transition-colors duration-700">
        <div className="absolute inset-0 bg-diagnostic-grid pointer-events-none transition-opacity duration-700 mix-blend-overlay" style={{ opacity: '0.15' }}></div>
        
        {/* Cinematic Spotlight */}
        <div className="absolute top-1/4 right-1/4 w-[900px] h-[700px] blur-[180px] rounded-full pointer-events-none transition-colors duration-700 opacity-60 mix-blend-screen" style={{ background: 'var(--accent-glow-intense, rgba(132, 204, 22, 0.2))' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative z-10">
          <Reveal>
            <Link to="/" className="inline-flex items-center text-[13px] font-mono text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors group mb-12">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              НА ГЛАВНУЮ
            </Link>
          </Reveal>

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-center">
            <div>
              <Reveal delay={100}>
                <div className="inline-flex items-center gap-3 mb-8 px-4 py-2 rounded-full bg-[var(--bg-accent-soft)] border border-[var(--border-accent)] backdrop-blur-md shadow-[var(--shadow-glow)]">
                  <Activity className="w-4 h-4 text-[var(--accent)] animate-pulse" />
                  <span className="text-[11px] font-mono text-[var(--accent)] uppercase tracking-widest">ДИАГНОСТИКА ПИТАНИЯ</span>
                </div>
              </Reveal>
              <Reveal delay={150}>
                <h1 className="text-[clamp(2.75rem,6vw,5.5rem)] font-medium text-[var(--text-display)] leading-[1.05] tracking-tight mb-8 transition-colors drop-shadow-2xl">
                  {page.heroTitle}
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-[var(--text-secondary)] text-lg md:text-xl leading-relaxed font-normal max-w-2xl mb-12 drop-shadow-md">
                  {page.heroDescription}
                </p>
              </Reveal>
              <Reveal delay={250}>
                <div className="flex flex-wrap gap-8">
                  <div className="flex flex-col relative">
                    <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Ресурс</span>
                    <span className="text-[var(--text-primary)] font-medium text-lg tracking-wide">100% СОСТОЯНИЕ</span>
                  </div>
                  <div className="w-px h-10 bg-[var(--border-subtle)] self-center hidden sm:block"></div>
                  <div className="flex flex-col relative">
                    <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Сроки</span>
                    <span className="text-[var(--text-primary)] font-medium text-lg tracking-wide">30-60 мин</span>
                  </div>
                  <div className="w-px h-10 bg-[var(--border-subtle)] self-center hidden sm:block"></div>
                  <div className="flex flex-col relative">
                    <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-widest mb-2">Гарантия</span>
                    <span className="text-[var(--text-primary)] font-medium text-lg tracking-wide">До 1 года</span>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Cinematic Telemetry Graphic */}
            <Reveal delay={300} className="relative hidden lg:flex items-center justify-center perspective-1000">
              <div className="relative w-full aspect-square max-w-[520px] flex items-center justify-center transform-gpu rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-[1200ms] ease-out drop-shadow-2xl">
                
                {/* Telemetry floating blocks Level 4 */}
                <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[15%] left-[0%] bg-[var(--bg-floating)] border border-[var(--border-medium)] p-4 rounded-2xl shadow-[var(--shadow-floating)] backdrop-blur-xl z-20 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-accent-soft)] flex items-center justify-center border border-[var(--border-accent)] shadow-[var(--shadow-glow)]">
                    <Battery className="w-5 h-5 text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">ЕМКОСТЬ</div>
                    <div className="text-base font-medium text-[var(--text-primary)] drop-shadow-md">92%</div>
                  </div>
                </motion.div>

                <motion.div animate={{ y: [6, -8, 6] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[20%] left-[-5%] bg-[var(--bg-floating)] border border-[var(--border-medium)] p-4 rounded-2xl shadow-[var(--shadow-floating)] backdrop-blur-xl z-20 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                    <Zap className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">ТОК РАЗРЯДА</div>
                    <div className="text-base font-medium text-[var(--text-primary)] drop-shadow-md">450 mA</div>
                  </div>
                </motion.div>

                <motion.div animate={{ y: [-5, 7, -5] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[25%] right-[-5%] bg-[var(--bg-floating)] border border-[var(--border-medium)] p-4 rounded-2xl shadow-[var(--shadow-floating)] backdrop-blur-xl z-20 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                    <Thermometer className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">ТЕМПЕРАТУРА</div>
                    <div className="text-base font-medium text-[var(--text-primary)] drop-shadow-md">38°C</div>
                  </div>
                </motion.div>

                <motion.div animate={{ y: [7, -7, 7] }} transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[15%] right-[2%] bg-[var(--bg-floating)] border border-[var(--border-medium)] p-4 rounded-2xl shadow-[var(--shadow-floating)] backdrop-blur-xl z-20 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-1">ЦИКЛЫ ЗАРЯДКИ</div>
                    <div className="text-base font-medium text-[var(--text-primary)] drop-shadow-md">842</div>
                  </div>
                </motion.div>

                {/* Protocol Badge */}
                <div className="absolute top-[5%] bg-[var(--bg-glass)] backdrop-blur-2xl border border-[var(--border-accent)] px-5 py-2 rounded-full shadow-[var(--shadow-floating)] z-30">
                  <span className="text-[11px] font-mono text-[var(--accent)] uppercase tracking-widest drop-shadow-md">Протокол USB-C PD</span>
                </div>

                {/* Main Central Battery Visual Level 3 */}
                <div className="w-[190px] h-[380px] border border-[var(--border-subtle)] rounded-[36px] p-2 flex flex-col justify-end relative shadow-[var(--shadow-floating)] bg-[var(--bg-glass)] backdrop-blur-2xl overflow-hidden z-10">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-5 bg-[var(--bg-floating)] border border-[var(--border-subtle)] border-b-0 rounded-t-lg shadow-inner"></div>
                  <div className="absolute inset-0 bg-diagnostic-grid opacity-20 mix-blend-overlay"></div>
                  
                  <div className="relative w-full h-[74%] bg-gradient-to-t from-[#65A30D] to-[#A3E635] rounded-[28px] overflow-hidden shadow-[var(--shadow-glow)]">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay"></div>
                    <motion.div animate={{ y: [0, -120] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-0 opacity-40">
                      <div className="w-full h-[200%] bg-gradient-to-t from-transparent via-white to-transparent opacity-60 blur-lg mix-blend-overlay"></div>
                    </motion.div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center z-10 flex-col drop-shadow-2xl">
                    <span className="text-6xl font-medium text-white tracking-tighter">74%</span>
                    <span className="text-[10px] font-mono text-[#A3E635] uppercase tracking-widest mt-3 bg-black/50 px-4 py-2 rounded-lg backdrop-blur-md border border-[#84CC16]/30 shadow-2xl">ИЗНОС</span>
                  </div>
                </div>

              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 2. SYMPTOMS SECTION */}
      <section className="py-32 bg-[var(--bg-panel)] transition-colors duration-700 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-canvas)] to-transparent h-32 pointer-events-none"></div>
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative z-10">
          <Reveal className="mb-20 text-center">
            <span className="text-[var(--accent)] text-[11px] font-mono uppercase tracking-widest block mb-4 drop-shadow-md">ИНДИКАТОРЫ ДИАГНОСТИКИ</span>
            <h2 className="text-4xl md:text-5xl font-medium text-[var(--text-display)] tracking-tight">Симптомы износа</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SYMPTOMS.map((symptom, idx) => (
              <Reveal key={idx} delay={idx * 50}>
                {/* Level 3: Cards */}
                <div className="p-10 h-full flex flex-col group bg-[var(--bg-card)] rounded-[24px] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-card)] transition-all duration-700 hover:-translate-y-1 hover:bg-[var(--bg-floating)] border border-transparent hover:border-[var(--border-subtle)]">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--bg-canvas)] flex items-center justify-center mb-8 shadow-inner group-hover:bg-[var(--bg-accent-soft)] transition-colors duration-700">
                    <symptom.icon className="w-6 h-6 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors duration-700 drop-shadow-sm" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[20px] font-medium text-[var(--text-primary)] mb-4 tracking-tight">{symptom.title}</h3>
                  <p className="text-[var(--text-secondary)] text-[15px] leading-relaxed opacity-90">{symptom.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3. PLATFORM SPECIFIC (iOS & Android) */}
      <section className="py-32 bg-[var(--bg-canvas)] relative overflow-hidden transition-colors duration-700">
        <div className="absolute inset-0 bg-diagnostic-grid pointer-events-none transition-opacity duration-700 mix-blend-overlay" style={{ opacity: '0.1' }}></div>
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl relative z-10">
          
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* iOS System */}
            <Reveal delay={100}>
              <div className="bg-[var(--bg-card)] rounded-[32px] p-10 md:p-14 relative overflow-hidden h-full shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-floating)] transition-all duration-700 border border-transparent hover:border-[var(--border-subtle)] group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700"></div>
                
                <div className="flex items-center gap-4 mb-10 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-canvas)] flex items-center justify-center shadow-inner">
                    <Smartphone className="w-5 h-5 text-blue-400 drop-shadow-md" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-medium text-[var(--text-display)] tracking-tight">Контроллер iOS</h3>
                </div>

                <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-10 relative z-10">
                  В современных iPhone контроллер батареи привязан к материнской плате. При обычной замене появляется системная ошибка "Неизвестная деталь" (Unknown Part), а в настройках пропадает емкость.
                </p>

                <div className="space-y-5 mb-12 relative z-10">
                  <div className="flex items-start text-[var(--text-primary)] text-[15px] opacity-90">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mr-4 mt-0.5 flex-shrink-0 drop-shadow-sm" />
                    <span className="leading-relaxed">Мы переносим оригинальный шлейф с контроллером (BMS) на новую банку.</span>
                  </div>
                  <div className="flex items-start text-[var(--text-primary)] text-[15px] opacity-90">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mr-4 mt-0.5 flex-shrink-0 drop-shadow-sm" />
                    <span className="leading-relaxed">Программно обнуляем циклы с помощью программатора.</span>
                  </div>
                  <div className="flex items-start text-[var(--text-primary)] text-[15px] opacity-90">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 mr-4 mt-0.5 flex-shrink-0 drop-shadow-sm" />
                    <span className="leading-relaxed">Настройки отображают 100% емкости, ошибка пропадает.</span>
                  </div>
                </div>

                {/* Fake iOS Settings UI Level 4 */}
                <div className="bg-[var(--bg-panel)] rounded-[24px] p-6 shadow-[var(--shadow-soft)] relative z-10 border border-[var(--border-subtle)]">
                  <div className="flex gap-5">
                    <div className="mt-1"><Info className="text-red-500 w-6 h-6 drop-shadow-md" fill="currentColor" stroke="var(--bg-panel)" /></div>
                    <div>
                      <div className="text-[var(--text-display)] font-medium text-[16px] mb-2">Важное сообщение об аккумуляторе</div>
                      <div className="text-[var(--text-muted)] text-[14px] leading-relaxed">Не удается проверить подлинность аккумулятора Apple в этом iPhone. Информация о состоянии недоступна. <br/><br/><span className="text-blue-400 font-medium opacity-90">— Этого сообщения НЕ будет после нашего ремонта.</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Android System */}
            <Reveal delay={200}>
              <div className="bg-[var(--bg-card)] rounded-[32px] p-10 md:p-14 relative overflow-hidden h-full flex flex-col shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-floating)] transition-all duration-700 border border-transparent hover:border-[var(--border-subtle)] group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-700"></div>
                
                <div className="flex items-center gap-4 mb-10 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-[var(--bg-canvas)] flex items-center justify-center shadow-inner">
                    <Zap className="w-5 h-5 text-emerald-400 drop-shadow-md" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-medium text-[var(--text-display)] tracking-tight">Зарядка Android</h3>
                </div>

                <p className="text-[var(--text-secondary)] text-lg leading-relaxed mb-10 relative z-10">
                  Флагманы Samsung, Xiaomi и других брендов используют сложные алгоритмы быстрой зарядки (до 120W+). Установка некачественной АКБ с дешевым контроллером полностью блокирует эти режимы.
                </p>

                <div className="space-y-5 mb-12 flex-grow relative z-10">
                  <div className="flex items-start text-[var(--text-primary)] text-[15px] opacity-90">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-4 mt-0.5 flex-shrink-0 drop-shadow-sm" />
                    <span className="leading-relaxed">Устанавливаем оригинальные Service Pack батареи.</span>
                  </div>
                  <div className="flex items-start text-[var(--text-primary)] text-[15px] opacity-90">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-4 mt-0.5 flex-shrink-0 drop-shadow-sm" />
                    <span className="leading-relaxed">Поддержка протоколов PD, Quick Charge, Super Fast Charge.</span>
                  </div>
                  <div className="flex items-start text-[var(--text-primary)] text-[15px] opacity-90">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-4 mt-0.5 flex-shrink-0 drop-shadow-sm" />
                    <span className="leading-relaxed">Калибровка контроллера питания на системной плате.</span>
                  </div>
                </div>

                {/* Fake Android UI Level 4 */}
                <div className="bg-[var(--bg-panel)] rounded-[24px] p-8 flex flex-col items-center justify-center shadow-[var(--shadow-soft)] relative z-10 border border-[var(--border-subtle)]">
                  <div className="w-20 h-20 rounded-full border-[4px] border-emerald-500/20 flex items-center justify-center mb-5 relative shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <div className="absolute inset-0 border-[4px] border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                    <Zap className="text-emerald-400 w-8 h-8 fill-current drop-shadow-md" />
                  </div>
                  <div className="text-[var(--text-display)] font-medium text-[17px] mb-2 tracking-wide">Очень быстрая зарядка 2.0</div>
                  <div className="text-emerald-400/90 text-[14px] font-mono tracking-widest">84% • 14 МИН ДО КОНЦА</div>
                </div>
              </div>
            </Reveal>
          </div>

        </div>
      </section>

      {/* 4. ORIGINAL VS COPY */}
      <section className="py-32 bg-[var(--bg-panel)] transition-colors duration-700 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-canvas)] to-transparent h-40 bottom-0 top-auto pointer-events-none z-0"></div>
        <div className="container mx-auto px-6 lg:px-8 max-w-5xl relative z-10">
          <Reveal className="mb-20 text-center">
            <h2 className="text-4xl md:text-5xl font-medium text-[var(--text-display)] tracking-tight">Оригинал против Копии</h2>
            <p className="text-[var(--text-secondary)] text-lg mt-5 max-w-2xl mx-auto">Почему экономия на аккумуляторе обходится дороже</p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Original Level 3 Premium */}
            <Reveal delay={100}>
              <div className="bg-[var(--bg-card)] rounded-[32px] p-10 md:p-12 shadow-[var(--shadow-card)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--accent-glow)] blur-[120px] rounded-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
                
                <div className="flex items-center gap-4 mb-10 relative z-10">
                  <Shield className="w-8 h-8 text-[var(--accent)] drop-shadow-md" />
                  <h3 className="text-2xl font-medium text-[var(--text-display)]">Премиум и Оригинал</h3>
                </div>
                <ul className="space-y-6 relative z-10">
                  <li className="flex items-center text-[var(--text-primary)] text-[15px] opacity-90"><CheckCircle2 className="w-5 h-5 text-[var(--accent)] mr-4 flex-shrink-0" />Честная емкость mAh</li>
                  <li className="flex items-center text-[var(--text-primary)] text-[15px] opacity-90"><CheckCircle2 className="w-5 h-5 text-[var(--accent)] mr-4 flex-shrink-0" />Ресурс: 2-3 года (500-800 циклов)</li>
                  <li className="flex items-center text-[var(--text-primary)] text-[15px] opacity-90"><CheckCircle2 className="w-5 h-5 text-[var(--accent)] mr-4 flex-shrink-0" />Защита от перезаряда и КЗ</li>
                  <li className="flex items-center text-[var(--text-primary)] text-[15px] opacity-90"><CheckCircle2 className="w-5 h-5 text-[var(--accent)] mr-4 flex-shrink-0" />Стабильная работа на морозе</li>
                  <li className="flex items-center text-[var(--text-primary)] text-[15px] opacity-90"><CheckCircle2 className="w-5 h-5 text-[var(--accent)] mr-4 flex-shrink-0" />Поддержка Fast Charge</li>
                </ul>
              </div>
            </Reveal>

            {/* Copy Level 2 Subdued */}
            <Reveal delay={200}>
              <div className="bg-[var(--bg-canvas)] border border-[var(--border-subtle)] rounded-[32px] p-10 md:p-12 shadow-inner hover:shadow-[var(--shadow-soft)] transition-all duration-700">
                <div className="flex items-center gap-4 mb-10">
                  <AlertTriangle className="w-8 h-8 text-amber-500/70" />
                  <h3 className="text-2xl font-medium text-[var(--text-primary)] opacity-80">Дешевые Копии</h3>
                </div>
                <ul className="space-y-6">
                  <li className="flex items-center text-[var(--text-muted)] text-[15px]"><XCircle className="w-5 h-5 text-amber-500/50 mr-4 flex-shrink-0" />Емкость ниже заявленной на 20-30%</li>
                  <li className="flex items-center text-[var(--text-muted)] text-[15px]"><XCircle className="w-5 h-5 text-amber-500/50 mr-4 flex-shrink-0" />Смерть через 3-6 месяцев</li>
                  <li className="flex items-center text-[var(--text-muted)] text-[15px]"><XCircle className="w-5 h-5 text-amber-500/50 mr-4 flex-shrink-0" />Риск вздутия и возгорания</li>
                  <li className="flex items-center text-[var(--text-muted)] text-[15px]"><XCircle className="w-5 h-5 text-amber-500/50 mr-4 flex-shrink-0" />Выключения при 20% заряда</li>
                  <li className="flex items-center text-[var(--text-muted)] text-[15px]"><XCircle className="w-5 h-5 text-amber-500/50 mr-4 flex-shrink-0" />Отсутствие датчиков температуры</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5. WORKFLOW TIMELINE */}
      <section className="py-32 bg-[var(--bg-canvas)] transition-colors duration-700">
        <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
          <Reveal className="mb-24 text-center">
            <span className="text-[var(--accent)] text-[11px] font-mono uppercase tracking-widest block mb-4 drop-shadow-md">ЭТАПЫ ОБСЛУЖИВАНИЯ</span>
            <h2 className="text-4xl md:text-5xl font-medium text-[var(--text-display)] tracking-tight">Процесс замены</h2>
          </Reveal>

          <div className="relative">
            {/* Cinematic connecting line */}
            <div className="hidden lg:block absolute top-[44px] left-[8%] right-[8%] h-[1px] bg-[var(--border-subtle)] z-0">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-20 origin-left animate-[scale-x_3s_ease-in-out_infinite_alternate]"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 relative z-10">
              {WORKFLOW.map((step, idx) => (
                <Reveal key={idx} delay={idx * 100} className="relative group">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-[24px] bg-[var(--bg-panel)] flex items-center justify-center mb-8 shadow-[var(--shadow-soft)] group-hover:shadow-[var(--shadow-floating)] group-hover:-translate-y-2 transition-all duration-700 relative z-10 border border-transparent group-hover:border-[var(--border-subtle)]">
                      <step.icon className="w-8 h-8 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors duration-700 drop-shadow-sm" strokeWidth={1.5} />
                      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[var(--bg-card)] shadow-inner flex items-center justify-center text-[11px] font-mono text-[var(--text-muted)] border border-[var(--border-subtle)]">
                        0{idx + 1}
                      </div>
                    </div>
                    <h4 className="text-[17px] font-medium text-[var(--text-display)] mb-3">{step.title}</h4>
                    <p className="text-[var(--text-muted)] text-[14px] leading-relaxed max-w-[140px]">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. WARNING BLOCK */}
      <section className="py-20 bg-[var(--bg-canvas)] transition-colors duration-700">
        <div className="container mx-auto px-6 lg:px-8 max-w-4xl">
          <Reveal>
            <div className="bg-[var(--bg-panel)] rounded-[32px] p-8 md:p-10 flex flex-col sm:flex-row items-start gap-6 shadow-[var(--shadow-soft)] border-l-4 border-amber-500/70">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-1">
                <AlertTriangle className="w-6 h-6 text-amber-500 drop-shadow-md" />
              </div>
              <div>
                <h4 className="text-[18px] font-medium text-[var(--text-display)] mb-3">Опасность вздутия</h4>
                <p className="text-[var(--text-secondary)] text-[15px] leading-relaxed opacity-90">
                  Если дисплей или задняя крышка вашего устройства начали отклеиваться от рамки — немедленно обратитесь в сервис. Вздутый аккумулятор может повредить дисплейную матрицу изнутри или воспламениться при проколе/давлении.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7. CTA SECTION */}
      <section className="pt-32 pb-40 relative overflow-hidden bg-[var(--bg-canvas)] transition-colors duration-700">
        {/* Deep cinematic glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] blur-[200px] rounded-full pointer-events-none transition-colors duration-1000 opacity-40 mix-blend-screen" style={{ background: 'var(--accent-glow-intense)' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 max-w-4xl relative z-10 text-center">
          <Reveal className="flex flex-col items-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-[var(--bg-accent-soft)] mb-10 shadow-[var(--shadow-glow)] border border-[var(--border-accent)]">
              <Battery className="w-10 h-10 text-[var(--accent)] drop-shadow-md" />
            </div>
            <h2 className="text-4xl md:text-6xl font-medium text-[var(--text-display)] mb-8 tracking-tight drop-shadow-2xl">
              Проверить состояние аккумулятора
            </h2>
            <p className="text-[var(--text-secondary)] text-xl mb-14 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
              Бесплатная диагностика токов зарядки, проверка ресурса батареи на спец. оборудовании и подбор оригинальной детали.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
              <a 
                href="https://t.me/your_telegram" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full sm:w-auto inline-flex justify-center items-center px-10 py-5 rounded-2xl bg-[var(--bg-floating)] text-[var(--text-primary)] hover:bg-[var(--bg-card)] hover:text-white transition-all duration-500 font-medium text-[16px] transform hover:-translate-y-1 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-floating)] border border-[var(--border-subtle)]"
              >
                <MessageCircle className="w-5 h-5 mr-3 opacity-80" />
                Telegram
              </a>
              <a 
                href="https://wa.me/70000000000" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full sm:w-auto inline-flex justify-center items-center px-10 py-5 rounded-2xl bg-[var(--bg-accent-soft)] text-[var(--accent)] border border-[var(--border-accent)] hover:bg-[var(--accent)] hover:text-[#050507] transition-all duration-500 font-medium text-[16px] transform hover:-translate-y-1 shadow-[var(--shadow-glow)]"
              >
                <MessageCircle className="w-5 h-5 mr-3" />
                WhatsApp
              </a>
              <a 
                href="tel:+70000000000" 
                className="w-full sm:w-auto inline-flex justify-center items-center px-10 py-5 rounded-2xl bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-500 font-medium text-[16px] transform hover:-translate-y-1"
              >
                <Phone className="w-5 h-5 mr-3 opacity-70" />
                Позвонить
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </PageTransition>
  );
}