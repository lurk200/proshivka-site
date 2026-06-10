import { useCallback, useRef } from 'react';
import orderPrintCss from './orderPrintSheet.css?inline';

export function useOrderPrint(title = 'Документ') {
  const ref = useRef(null);

  const print = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const win = window.open('', '_blank', 'width=820,height=1100');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="ru"><head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>${orderPrintCss}</style>
</head><body><div class="order-print-isolate">${node.innerHTML}</div></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 400);
  }, [title]);

  return { ref, print };
}
