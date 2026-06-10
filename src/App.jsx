import React from 'react';
import { useRoutes } from 'react-router-dom';
import { routes } from './router/routes';
import { ThemeProvider } from './context/ThemeContext';
import { CmsProvider } from './context/CmsContext';

export default function App() {
  const element = useRoutes(routes);
  return (
    <CmsProvider>
      <ThemeProvider>
        {element}
      </ThemeProvider>
    </CmsProvider>
  );
}