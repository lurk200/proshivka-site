import React from 'react';
import { ACT_WARRANTY_TERMS } from '../../../data/orderDocumentTexts';
import { formatMoneyRub, qrImageUrl } from '../../../utils/orderDocData';
import PrintBrandHeader from './PrintBrandHeader';

export default function WorkCompletionActDocument({ data }) {
  const qr = qrImageUrl(data.reviewQrUrl, 120);

  const infoRows = [
    ['Клиент', data.clientLine],
    ['Причина обращения', data.reason],
    ['Вид устройства', data.device],
    ['Внешний вид', data.appearance || ''],
    ['Комплектация', data.kit || ''],
    ['Предоплата', data.prepayment],
  ];

  return (
    <div className="order-print-root">
      <PrintBrandHeader name={data.company.name} tagline={data.company.tagline} />

      <header className="op-header">
        <div>
          <h1 className="op-title">Акт выполненных работ</h1>
          <p className="op-order-meta">
            Заказ <span>№{data.orderNumber}</span> от {data.actDate || data.orderDate}
          </p>
        </div>
        <div className="op-company">
          <strong>{data.company.title}</strong>
          <span className="op-company-phone">{data.company.phone}</span>
        </div>
      </header>

      <table className="op-table">
        <tbody>
          {infoRows.map(([label, value], idx) => (
            <tr key={label}>
              <td className="op-label">{label}</td>
              <td>{value || ' '}</td>
              {idx === 0 ? (
                <td rowSpan={infoRows.length} className="op-qr-cell">
                  <p className="op-qr-hint">Наведите камеру на QR-код, чтобы оставить отзыв</p>
                  <div className="op-qr-box">
                    {qr ? <img src={qr} alt="" className="op-qr-img" /> : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
          <tr>
            <td className="op-label">Рекомендации после ремонта</td>
            <td colSpan={2}>{data.recommendations || ' '}</td>
          </tr>
        </tbody>
      </table>

      <table className="op-table op-services">
        <thead>
          <tr>
            <th style={{ width: '4%' }}>№</th>
            <th style={{ width: '32%' }}>Позиция</th>
            <th style={{ width: '10%' }}>Артикул</th>
            <th style={{ width: '10%' }}>Гарантия</th>
            <th style={{ width: '12%' }}>Цена</th>
            <th style={{ width: '10%' }}>Скидка</th>
            <th style={{ width: '8%' }}>Кол.</th>
            <th style={{ width: '14%' }}>Сумма</th>
          </tr>
        </thead>
        <tbody>
          {data.lineItems.map((row) => (
            <tr key={row.index}>
              <td>{row.index}</td>
              <td className="op-pos">{row.title}</td>
              <td>{row.sku}</td>
              <td>{row.warrantyDays ?? '—'}</td>
              <td>{formatMoneyRub(row.price).replace(' ₽', '')}</td>
              <td>0,00</td>
              <td>{row.qty}</td>
              <td>{formatMoneyRub(row.sum).replace(' ₽', '')}</td>
            </tr>
          ))}
          <tr className="op-total-row">
            <td colSpan={7} style={{ textAlign: 'right' }}>
              Итого, ₽
            </td>
            <td>{data.totalFormatted.replace(' ₽', '')}</td>
          </tr>
        </tbody>
      </table>

      {data.warrantyDays ? (
        <div className="op-warranty-box">
          <span className="op-warranty-days">Гарантия {data.warrantyDays} дней</span>
          {data.warrantyUntil ? (
            <span style={{ marginLeft: 8, fontSize: '10px' }}>до {data.warrantyUntil}</span>
          ) : null}
        </div>
      ) : null}

      <div className="op-legal">
        <p className="op-legal-title">Условия гарантийного обслуживания</p>
        <ol>
          {ACT_WARRANTY_TERMS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
        <p style={{ marginTop: 6 }}>Претензии по работе ________________________________</p>
        <p style={{ marginTop: 4, fontSize: '8px' }}>
          Настоящий акт составлен в двух экземплярах, по одному для каждой из сторон.
        </p>
      </div>

      <div className="op-signatures">
        <p>
          Менеджер: <span className="op-sign-line" /> {data.managerName}
        </p>
        <p>
          Заказчик: <span className="op-sign-line" /> {data.clientName || data.clientLine}
          <br />
          <span style={{ fontSize: '8px', color: '#71717a' }}>
            с условиями оказания услуг ознакомлен и согласен
          </span>
        </p>
      </div>
      <p className="op-footer-date">Дата: {data.printDate}</p>
    </div>
  );
}
