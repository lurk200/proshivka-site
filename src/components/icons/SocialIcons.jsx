import React from 'react';
import { IconBrandTelegram, IconBrandVk, IconBrandWhatsapp, IconMessageCircle } from '@tabler/icons-react';
import { SOCIAL_ICON_SIZE, SOCIAL_STROKE } from './socialIconPaths';

const iconProps = {
  size: SOCIAL_ICON_SIZE,
  stroke: SOCIAL_STROKE,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const ICONS = {
  telegram: IconBrandTelegram,
  whatsapp: IconBrandWhatsapp,
  vk: IconBrandVk,
  max: IconMessageCircle,
};

export function SocialIcon({ type, className }) {
  const Icon = ICONS[type];
  if (!Icon) return null;
  return <Icon className={className} {...iconProps} />;
}
