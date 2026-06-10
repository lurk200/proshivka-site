import React from 'react';
import { Star } from 'lucide-react';
import { Reveal, Card, Tag, Section } from '../ui';

const ReviewCard = ({ review }) => (
  <Card interactive className="p-8 h-full flex flex-col border-[var(--border-subtle)] bg-[var(--bg-base)]"><div className="flex text-[#84CC16]/80 mb-6 gap-1" aria-hidden="true">{[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}</div><p className="text-[var(--text-secondary)] leading-relaxed mb-8 flex-1 text-[14px] font-normal">"{review.text}"</p><div className="pt-5 border-t border-[var(--border-subtle)] flex items-center justify-between"><div className="font-medium text-[var(--text-primary)] text-[14px]">{review.name}</div><Tag>{review.model}</Tag></div></Card>
);

export default function ReviewsSection({ data, companyRating = '5.0', section }) {
  const meta = section ?? {};
  return (
    <Section id="reviews">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <Reveal as="header" className="mb-16 md:mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div><span className="text-[#84CC16] text-[10px] font-mono uppercase tracking-widest block mb-3">{meta.eyebrow}</span><h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-medium text-[var(--text-primary)] tracking-[-0.01em]">{meta.title}</h2></div>
          <div className="flex items-center gap-3 bg-[var(--bg-elevated)] px-5 py-3 rounded-2xl border border-[var(--border-subtle)] w-fit"><Star className="w-4 h-4 text-[#84CC16] fill-current" aria-hidden="true" /><span className="text-[var(--text-primary)] text-[14px] font-medium">{companyRating} Рейтинг сервиса</span></div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8" role="list">
          {data.map((review, idx) => (<Reveal key={review.id} delay={idx * 100} role="listitem"><ReviewCard review={review} /></Reveal>))}
        </div>
      </div>
    </Section>
  );
}