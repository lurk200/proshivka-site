import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Calculator,
  ClipboardList,
  HardDrive,
  Images,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { useCms } from '../context/CmsContext.jsx'
import { Card, PageHeader } from './components/ui.jsx'

const cards = [
  {
    to: '/crm',
    title: 'CRM · заказы',
    desc: 'Приёмка, статусы, выдача, трек клиента',
    icon: ClipboardList,
    primary: true,
  },
  {
    to: '/admin/works',
    title: 'Работы',
    desc: 'Добавить фото кейса за пару кликов',
    icon: Images,
  },
  {
    to: '/admin/services',
    title: 'Услуги и прайс',
    desc: 'Цены и описания направлений',
    icon: Wrench,
  },
  {
    to: '/admin/calculator',
    title: 'Калькулятор',
    desc: 'Наценка, работа, сроки ремонта',
    icon: Calculator,
  },
  {
    to: '/admin/hero',
    title: 'Главный экран',
    desc: 'Заголовок и фон на главной',
    icon: Sparkles,
  },
  {
    to: '/admin/company',
    title: 'Контакты',
    desc: 'Телефон, адрес, WhatsApp',
    icon: Building2,
  },
  {
    to: '/admin/backup',
    title: 'Резервная копия',
    desc: 'Скачать ZIP или восстановить сайт и CRM',
    icon: HardDrive,
  },
]

export default function DashboardPage() {
  const { company, services, allWorks, ready } = useCms()
  const published = allWorks.filter((w) => w.published !== false).length

  return (
    <div>
      <PageHeader
        title="Редактор"
        description="Меняйте тексты, цены и фото — на сайте сразу после «Сохранить»."
      />

      <div className="mb-4 grid grid-cols-3 gap-2 sm:mb-5 sm:gap-3">
        <Card className="p-3 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-[11px]">
            Компания
          </p>
          <p className="mt-1 truncate font-display text-[14px] font-bold text-slate-900 sm:text-[17px]">
            {company.name}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500 sm:mt-1 sm:text-[13px]">
            {company.phone}
          </p>
        </Card>
        <Card className="p-3 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-[11px]">
            Услуги
          </p>
          <p className="mt-1 font-display text-[14px] font-bold text-slate-900 sm:text-[17px]">
            {services.length}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:mt-1 sm:text-[13px]">направлений</p>
        </Card>
        <Card className="p-3 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:text-[11px]">
            Работы
          </p>
          <p className="mt-1 font-display text-[14px] font-bold text-slate-900 sm:text-[17px]">
            {published} / {allWorks.length}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500 sm:mt-1 sm:text-[13px]">на сайте</p>
        </Card>
      </div>

      {!ready ? <p className="mb-4 text-[13px] text-slate-400">Загрузка…</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ to, title, desc, icon: Icon, primary }) => (
          <Link
            key={to}
            to={to}
            className={`group flex min-h-[4.25rem] items-start gap-3 rounded-2xl border p-3.5 transition active:scale-[0.99] sm:p-4 ${
              primary
                ? 'border-lime-500/40 bg-lime-50 hover:border-lime-500'
                : 'border-slate-200 bg-white hover:border-lime-500/40'
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                primary ? 'bg-lime-500 text-slate-950' : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 font-display text-[15px] font-bold text-slate-900">
                {title}
                <ArrowRight className="h-4 w-4 opacity-40 sm:opacity-0 sm:transition sm:group-hover:translate-x-0.5 sm:group-hover:opacity-100" />
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-slate-500 sm:text-[13px]">
                {desc}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
