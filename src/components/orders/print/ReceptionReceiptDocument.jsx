import React from 'react';
import { RECEPTION_SERVICE_TERMS } from '../../../data/orderDocumentTexts';
import { qrImageUrl } from '../../../utils/orderDocData';
import PrintBrandHeader from './PrintBrandHeader';

const QR_ROWS = 8;

export default function ReceptionReceiptDocument({ data }) {
  const qr = qrImageUrl(data.statusQrUrl, 120);

  const rows = [
    ['Клиент', data.clientLine],
    ['Причина обращения', data.reason],
    ['Вид устройства', data.device],
    ['Внешний вид', data.appearance || ''],
    ['Комплектация', data.kit || ''],
    ['Ориентировочная дата готовности', data.estimatedReadyAt],
    ['Ориентировочная стоимость', data.estimatedCost],
    ['Предоплата', data.prepayment],
    ['Заметки приемщика', data.receiverNote || ''],
  ];

  return (
    <div className="order-print-root">
      <PrintBrandHeader name={data.company.name} tagline={data.company.tagline} />

      <header className="op-header">
        <div>
          <h1 className="op-title">Приемная квитанция</h1>
          <p className="op-order-meta">
            Заказ <span>№{data.orderNumber}</span> от {data.orderDate}
          </p>
        </div>
        <div className="op-company">
          <strong>{data.company.title}</strong>
          <span className="op-company-phone">{data.company.phone}</span>
        </div>
      </header>

      <table className="op-table">
        <tbody>
          {rows.map(([label, value], idx) => (
            <tr key={label}>
              <td className="op-label">{label}</td>
              {idx < QR_ROWS ? (
                <>
                  <td>{value || ' '}</td>
                  {idx === 0 ? (
                    <td rowSpan={QR_ROWS} className="op-qr-cell">
                      <p className="op-qr-hint">Наведите камеру на QR-код, чтобы узнать статус заказа</p>
                      <div className="op-qr-box">
                        {qr ? <img src={qr} alt="" className="op-qr-img" /> : null}
                      </div>
                    </td>
                  ) : null}
                </>
              ) : (
                <td colSpan={2}>{value || ' '}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="op-legal">
        <p className="op-legal-title">Условия оказания услуг</p>
        <ol>
          {RECEPTION_SERVICE_TERMS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
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
