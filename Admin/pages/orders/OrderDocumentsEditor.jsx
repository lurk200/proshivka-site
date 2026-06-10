import React from 'react';
import { Field, Input } from '../../components/ui';

const textareaClass =
  'w-full min-h-[72px] rounded-xl border border-white/[0.08] bg-[#14161a] px-4 py-3 text-[14px] text-[#f3f4f6]';

/** Поля для правок в квитанции и акте — синхронизированы с формой заказа. */
export default function OrderDocumentsEditor({ form, set }) {
  const on = (key) => (e) => set(key, e.target.value);

  return (
    <div className="mb-5 space-y-3">
      <p className="text-[12px] text-[#9ca3af] rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 leading-relaxed">
        Исправьте данные ниже — превью обновится сразу. Нажмите «Сохранить» внизу формы, чтобы записать в заказ.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <Field label="Клиент (ФИО)">
          <Input value={form.clientName} onChange={on('clientName')} />
        </Field>
        <Field label="Телефон">
          <Input value={form.clientPhone} onChange={on('clientPhone')} />
        </Field>
        <Field label="Причина обращения" className="sm:col-span-2">
          <Input value={form.reason} onChange={on('reason')} />
        </Field>
        <Field label="Вид устройства" className="sm:col-span-2">
          <Input value={form.device} onChange={on('device')} />
        </Field>
        <Field label="Внешний вид">
          <Input value={form.appearance} onChange={on('appearance')} />
        </Field>
        <Field label="Комплектация">
          <Input value={form.kit} onChange={on('kit')} />
        </Field>
        <Field label="Ориентир. дата готовности">
          <Input type="date" value={form.estimatedReadyAt} onChange={on('estimatedReadyAt')} />
        </Field>
        <Field label="Предоплата, ₽">
          <Input type="number" min={0} value={form.prepayment} onChange={on('prepayment')} />
        </Field>
        <Field label="Стоимость в акте, ₽">
          <Input type="number" min={0} value={form.cost} onChange={on('cost')} />
        </Field>
        <Field label="Менеджер / мастер">
          <Input value={form.managerName} onChange={on('managerName')} />
        </Field>
        <Field label="Выполненные работы (акт)" className="sm:col-span-2">
          <textarea
            className={textareaClass}
            value={form.workPerformed}
            onChange={on('workPerformed')}
          />
        </Field>
        <Field label="Рекомендации после ремонта" className="sm:col-span-2">
          <Input value={form.recommendations} onChange={on('recommendations')} />
        </Field>
        <Field label="Заметки приёмщика (квитанция)" className="sm:col-span-2">
          <Input value={form.internalNote} onChange={on('internalNote')} />
        </Field>
      </div>
    </div>
  );
}
