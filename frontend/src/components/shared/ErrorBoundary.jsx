import { Component } from 'react';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';

/**
 * Error Boundary global. Captura errores de render dentro del árbol React
 * y muestra una pantalla de fallback en lugar de la pantalla blanca por defecto.
 *
 * Solo captura errores de render — los errores en handlers async se siguen propagando
 * y los recoge el interceptor de Axios.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // En producción mandaríamos esto a Sentry/Datadog. Para TFG, console.error basta.
    console.error('[ErrorBoundary]', error, info);
  }

  handleReload = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#F8F8FF' }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-[0_8px_32px_rgba(99,102,241,0.10)] border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 flex items-center justify-center">
            <HiOutlineExclamationTriangle className="w-8 h-8 text-red-500" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Algo ha fallado</h1>
          <p className="text-sm text-gray-600 mb-6">
            La aplicación encontró un error inesperado. Hemos registrado el problema. Vuelve al inicio para continuar.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 mb-5 overflow-auto max-h-32 text-red-700">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            className="btn-primary w-full"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }
}
