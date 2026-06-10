export function createDefaultSiteNavigation() {
  return {
    serviceNav: [
      { id: 'glass', icon: 'GlassWater', title: 'Замена разбитого стекла', path: '/services/glass-replacement' },
      { id: 'battery', icon: 'BatteryCharging', title: 'Замена аккумуляторов', path: '/services/battery-replacement' },
      { id: 'water', icon: 'Droplets', title: 'Восстановление после влаги', path: '/services/water-damage' },
      { id: 'modular', icon: 'Wrench', title: 'Модульный ремонт', path: '/services/modular-repair' },
    ],
    softwareNav: {
      icon: 'Terminal',
      title: 'Программный ремонт',
      path: '/programmnyj-remont',
    },
    headerLinks: [
      { label: 'Узнать стоимость', to: '/prise' },
      { label: 'Статус заказа', to: '/status-zakaza' },
      { label: 'О нас', to: '/#about' },
      { label: 'Наши работы', to: '/nashi-raboty' },
    ],
    footerLinks: [
      { label: 'О нас', to: '/#about' },
      { label: 'Наши работы', to: '/nashi-raboty' },
      { label: 'Узнать стоимость', to: '/prise' },
      { label: 'Отправить в ремонт', to: '/otpravit-v-remont' },
      { label: 'Статус заказа', to: '/status-zakaza' },
      { label: 'Программный ремонт', to: '/programmnyj-remont' },
    ],
  };
}
