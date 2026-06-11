import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator, List } from 'lucide-react';
import PageTransition from '../components/layout/PageTransition';
import { Reveal } from '../components/ui';
import { useCms } from '../context/CmsContext';
import PriceHero from './components/PriceHero';
import SmartSearch from './components/SmartSearch';
import RepairResultsPanel from './components/RepairResultsPanel';
import ResultSkeleton from './components/SearchSkeleton';
import EmptyState from './components/EmptyState';
import ErrorState from './components/ErrorState';
import { DesktopCta } from './components/StickyMobileCta';
import PartQualityGuide from './components/PartQualityGuide';
import BrandRepairGuide from './components/BrandRepairGuide';
import ServiceCatalog from './components/ServiceCatalog';
import ModelServiceCatalog from './components/ModelServiceCatalog';
import { useRepairPriceSearch } from './hooks/useRepairPriceSearch';

import { HOME_ABOUT } from '../data/homeAbout';

const TABS = [
  { id: 'catalog', label: 'Каталог услуг', icon: List },
  { id: 'calculator', label: 'Рассчитать по модели', icon: Calculator },
];

function TabBar({ active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-medium)] mb-8">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition-all ${
            active === id
              ? 'bg-[#84CC16] text-[#0a0b0e] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span className="hidden xs:inline sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

export default function RepairPricePage() {
  const { cmsData } = useCms();
  const { company } = cmsData;
  const mapUrl = cmsData.mainHome?.about?.yandexMap?.orgUrl ?? HOME_ABOUT.yandexMap.orgUrl;
  const search = useRepairPriceSearch();
  const [tab, setTab] = useState('catalog');
  // Model selected in calculator — drives brand filter in catalog
  const [selectedModel, setSelectedModel] = useState('');

  // When user selects a model — stay on calculator tab, show full catalog below supplier results
  const handleSelectModel = (item) => {
    search.selectModel(item);
    setSelectedModel(item.label);
  };

  const handleSubmit = () => {
    const trimmed = search.query.trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');
    const exact = search.suggestions.find(
      (m) => m.label.toLowerCase() === normalized,
    );
    if (exact) { handleSelectModel(exact); return; }
    search.loadPrice(trimmed);
  };

  const handleClearModel = () => {
    setSelectedModel('');
    search.resetResult();
    search.setQuery('');
  };

  const showCta =
    (search.result?.categories?.length ?? 0) > 0 || search.resultError;

  return (
    <PageTransition>
      <div className="relative min-h-[85vh] pb-24 md:pb-20">
        <div
          className="pointer-events-none absolute inset-0 bg-diagnostic-grid"
          style={{ opacity: 'var(--grid-opacity)' }}
        />

        <div className="relative z-10">
          <div className="mx-auto max-w-lg px-4 sm:px-6">
            <Reveal immediate className="pt-6 pb-2">
              <Link
                to="/"
                className="inline-flex items-center text-[13px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] group"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Назад
              </Link>
            </Reveal>
          </div>

          <PriceHero />

          <section className="relative z-10 mx-auto w-full max-w-3xl px-4 sm:px-6 lg:max-w-5xl">
            <Reveal delay={60}>
              <TabBar active={tab} onChange={setTab} />
            </Reveal>

            {/* ── Catalog tab ─────────────────────────────────────────────── */}
            {tab === 'catalog' && (
              <Reveal delay={80}>
                <ServiceCatalog
                  phone={company?.phone}
                  contacts={company?.contacts}
                  selectedModel={selectedModel || undefined}
                  onClearModel={handleClearModel}
                />
                <div className="mt-10">
                  <DesktopCta
                    phone={company.phone}
                    contacts={company.contacts}
                    mapUrl={mapUrl}
                  />
                </div>
              </Reveal>
            )}

            {/* ── Calculator tab ───────────────────────────────────────────── */}
            {tab === 'calculator' && (
              <Reveal delay={80}>
                <SmartSearch
                  query={search.query}
                  onQueryChange={(v) => {
                    search.setQuery(v);
                    search.resetResult();
                  }}
                  suggestions={search.suggestions}
                  suggestionsLoading={search.suggestionsLoading}
                  suggestionsError={search.suggestionsError}
                  dropdownOpen={search.dropdownOpen}
                  onDropdownOpen={search.setDropdownOpen}
                  onSelect={handleSelectModel}
                  onSubmit={handleSubmit}
                />

                <div className="mt-8 min-h-[120px]">
                  {search.resultLoading ? <ResultSkeleton /> : null}

                  {!search.resultLoading && search.resultError?.type === 'empty' ? (
                    <EmptyState description={search.resultError.message} />
                  ) : null}

                  {!search.resultLoading && search.resultError?.type === 'error' ? (
                    <ErrorState
                      message={search.resultError.message}
                      onRetry={() =>
                        search.selectedId
                          ? search.loadPrice(search.selectedId)
                          : search.loadPrice(search.query)
                      }
                    />
                  ) : null}

                  {!search.resultLoading && search.result?.categories?.length ? (
                    <RepairResultsPanel data={search.result} intent={search.resultIntent} />
                  ) : null}
                </div>

                {/* Full service catalog for selected model */}
                {selectedModel && (
                  <ModelServiceCatalog
                    modelLabel={selectedModel}
                    contacts={company?.contacts}
                  />
                )}

                {(showCta || selectedModel) ? (
                  <div className="mt-10 hidden md:block">
                    <DesktopCta
                      phone={company.phone}
                      contacts={company.contacts}
                      mapUrl={mapUrl}
                    />
                  </div>
                ) : null}
              </Reveal>
            )}
          </section>

          <PartQualityGuide />
          <BrandRepairGuide />
        </div>
      </div>
    </PageTransition>
  );
}
