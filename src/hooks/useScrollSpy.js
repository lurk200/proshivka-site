import { useState, useEffect } from 'react';

export const useScrollSpy = (sectionIds, offset = 120) => {
  const [activeSection, setActiveSection] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const scrollPosition = window.scrollY + offset;
      let current = '';
      for (const section of sectionIds) {
        const element = document.getElementById(section);
        if (element && scrollPosition >= element.offsetTop) current = section;
      }
      setActiveSection(window.scrollY < 100 ? '' : current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionIds, offset]);
  return { activeSection, scrolled };
};