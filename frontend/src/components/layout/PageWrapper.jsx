import React from 'react';

/**
 * Componente que aplica una animación de entrada consistente a todas las páginas.
 * Usa la animación 'animate-fade-up' definida en index.css.
 */
const PageWrapper = ({ children }) => {
  return (
    <div className="animate-fade-up">
      {children}
    </div>
  );
};

export default PageWrapper;
