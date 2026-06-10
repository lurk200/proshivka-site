import { useState, useEffect, useRef } from 'react';

export const useScrollReveal = ({ threshold = 0, rootMargin = '0px 0px 0px 0px' } = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. SSR & Fallback (Защита от отсутствия API)
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setIsVisible(true);
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsVisible(true);
      return;
    }

    const currentRef = ref.current;
    // 2. Fallback на случай потери ref компонентом
    if (!currentRef) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // 3. Защита от мертвых зон и скролла при загрузке (если элемент уже выше экрана)
        if (entry.isIntersecting || entry.boundingClientRect.top <= 0) {
          setIsVisible(true);
          observer.disconnect(); // Сразу отключаем, так как нужно только одно срабатывание
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return { ref, isVisible };
};