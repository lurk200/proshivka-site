import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Image, MapPin } from 'lucide-react';
import MainBannersPage from './MainBannersPage';
import MainAboutPage from './MainAboutPage';

const TABS = [
  { id: 'banners', label: 'Баннеры услуг',  icon: Image,  Component: MainBannersPage },
  { id: 'about',   label: 'О нас и карта',  icon: MapPin, Component: MainAboutPage },
];

export default function MainPageEditorPage() {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get('tab') || 'banners';

  const current = TABS.find(t => t.id === activeTab) ?? TABS[0];
  const { Component } = current;

  const setTab = (id) => {
    setParams({ tab: id }, { replace: true });
  };

  return (
    <div>
      <div className="flex items-center gap-0.5 mb-6 overflow-x-auto pb-1 border-b border-white/[0.06]">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = id === activeTab;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'text-[#84CC16] border-b-2 border-[#84CC16] bg-[#84CC16]/5'
                  : 'text-[#6b7280] hover:text-[#9ca3af] hover:bg-white/[0.03] border-b-2 border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
              {label}
            </button>
          );
        })}
      </div>
      <Component />
    </div>
  );
}
