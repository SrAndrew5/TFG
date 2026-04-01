import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Layout Base — Arctic Clarity
 *
 * Estructura:
 *   ┌─────────────────────────────┐
 *   │  <Navbar /> — sticky top   │
 *   ├─────────────────────────────┤
 *   │                             │
 *   │  <main>                     │
 *   │    <Outlet />  ← vistas    │
 *   │  </main>                    │
 *   │                             │
 *   ├─────────────────────────────┤
 *   │  <Footer />                 │
 *   └─────────────────────────────┘
 *
 * El fondo base es surface-subtle (#F8F8FF), ligeramente tintado de lavanda,
 * que diferencia el contenido del blanco puro de cards y navbar.
 */
export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F8FF' }}>

      {/* ── Navbar sticky ── */}
      <Navbar />

      {/* ── Área de contenido principal ── */}
      <main className="flex-1 w-full">
        <div
          key={location.pathname}          /* Re-dispara animación al cambiar de ruta */
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in"
        >
          <Outlet />
        </div>
      </main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
