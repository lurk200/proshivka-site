import { CMS_SITE } from './cmsContent';
import { buildCmsData } from './cmsStore';

export const TOKENS = {
  colors: {
    // Cinematic Surface System
    bgCanvas: '#050507',
    bgPanel: '#0A0B0E',
    bgCard: '#111318',
    bgFloating: '#16181D',
    bgGlass: 'rgba(17, 19, 24, 0.6)',
    bgOverlay: 'rgba(5, 5, 7, 0.8)',
    bgAccentSoft: 'rgba(132, 204, 22, 0.05)',
    
    // Accent System
    accent: '#84CC16',
    accentHover: '#A3E635',
    accentGlow: 'rgba(132, 204, 22, 0.15)',
    accentGlowIntense: 'rgba(132, 204, 22, 0.4)',

    // Text Hierarchy
    textDisplay: '#FFFFFF',
    textPrimary: '#F0F0F0',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    textDisabled: '#52525B',

    // Border System
    borderSubtle: 'rgba(255, 255, 255, 0.03)',
    borderMedium: 'rgba(255, 255, 255, 0.06)',
    borderHover: 'rgba(255, 255, 255, 0.1)',
    borderAccent: 'rgba(132, 204, 22, 0.2)',
    borderAccentHover: 'rgba(132, 204, 22, 0.4)',

    // Shadow Depth System
    shadowSoft: '0 4px 20px rgba(0, 0, 0, 0.4)',
    shadowCard: '0 8px 32px rgba(0, 0, 0, 0.6)',
    shadowFloating: '0 16px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    shadowGlow: '0 0 40px rgba(132, 204, 22, 0.15)',
  },
  easing: {
    premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
    outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
    cinematic: 'cubic-bezier(0.4, 0, 0.2, 1)',
  }
};

/** @deprecated Use useCms() — kept for backward compatibility */
export const CMS_DATA = buildCmsData(CMS_SITE);
