import { useEffect, useState } from 'react';

const STORAGE_KEY = 'optimizacioncdts-theme';

const getPreferredTheme = () => {
  if (typeof window === 'undefined') return 'light';

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // localStorage no disponible (modo privado, etc.): seguimos con la preferencia del sistema.
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

/**
 * Maneja el tema claro/oscuro de la app, sincronizando la clase `dark` en <html>
 * y recordando la preferencia del usuario entre visitas.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Si no se puede persistir, el tema simplemente no se recordará entre visitas.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme };
}
