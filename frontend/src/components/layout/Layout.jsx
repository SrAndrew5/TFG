import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Layout Base — Arctic Clarity
 *
 * Soporta dos modos de contenido:
 *   - Estándar: max-w-7xl centrado con padding (la mayoría de páginas)
 *   - Full-width: sin wrapper de max-width (ej. /map), la página rellena todo
 *
 * Las rutas full-width se declaran en FULL_WIDTH_ROUTES.
 */
const FULL_WIDTH_ROUTES = ['/map'];

export default function Layout() {
  const location = useLocation();
  const isFullWidth = FULL_WIDTH_ROUTES.some((r) => location.pathname.startsWith(r));

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F8FF' }}>

      {/* ── Navbar sticky ── */}
      <Navbar />

      {/* ── Área de contenido principal ── */}
      <main className="flex-1 w-full flex flex-col">
        {isFullWidth ? (
          /* Full-width: la página gestiona su propio padding/overflow */
          <div key={location.pathname} className="flex-1 flex flex-col animate-fade-in">
            <Outlet />
          </div>
        ) : (
          /* Estándar: contenedor centrado con padding */
          <div
            key={location.pathname}
            className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in"
          >
            <Outlet />
          </div>
        )}
      </main>

      {/* ── Footer (oculto en /map para maximizar el mapa) ── */}
      {!isFullWidth && <Footer />}
    </div>
  );
}
