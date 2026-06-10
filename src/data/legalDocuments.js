/** @deprecated Контент в CMS (`legal`). Используйте cmsData.legal на сайте. */
import { createDefaultLegal, getLegalDocument as findLegalDoc } from './legalContent';

export const LEGAL_DOCUMENTS = createDefaultLegal();

export function getLegalDocument(id, documents = LEGAL_DOCUMENTS) {
  return findLegalDoc(id, documents);
}
