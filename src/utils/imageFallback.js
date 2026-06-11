export const IMAGE_FALLBACK = '/images/placeholder.svg';

export function handleImageError(event) {
  const img = event.currentTarget;
  if (!img || img.dataset.fallbackApplied === 'true') return;
  img.dataset.fallbackApplied = 'true';
  img.src = IMAGE_FALLBACK;
}
