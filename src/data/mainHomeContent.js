import { HOME_SERVICE_BANNERS } from './homeBanners';
import { HOME_ABOUT } from './homeAbout';

export function createDefaultMainHome() {
  return {
    seo: {
      description:
        'Программный ремонт, замена стекла, аккумуляторов, восстановление после влаги и модульный ремонт устройств.',
    },
    bannersSection: {
      eyebrow: 'Направления лаборатории',
      subtitle: 'Выберите услугу — откроется подробная страница с процессом и кейсами',
      /** 0–100: сила нижнего градиента под текстом */
      gradient: {
        bottomFade: 100,
        heroOverlay: 100,
        imageOpacity: 100,
      },
    },
    banners: structuredClone(HOME_SERVICE_BANNERS),
    about: structuredClone(HOME_ABOUT),
  };
}
