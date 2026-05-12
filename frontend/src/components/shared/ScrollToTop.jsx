import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * 
 * Escucha cambios en la URL (location) y hace scroll automático
 * al inicio de la página. Imprescindible en SPAs (React) para 
 * evitar que al navegar a una página nueva te quedes a mitad de scroll.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
