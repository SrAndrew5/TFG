import { createPortal } from 'react-dom';

/**
 * ModalPortal
 * 
 * Renderiza sus hijos en un nodo fuera del flujo normal del DOM (al final de body).
 * Esto es CRÍTICO para evitar que los contenedores con 'transform' o 'animation' 
 * rompan el posicionamiento 'fixed' de los modales, haciendo que se centren 
 * correctamente en el VIEWPORT y no en medio de toda la página.
 */
export default function ModalPortal({ children }) {
  // Aseguramos que el código solo se ejecute en el cliente
  if (typeof document === 'undefined') return null;
  
  // Usamos document.body directamente como destino del portal
  return createPortal(children, document.body);
}
