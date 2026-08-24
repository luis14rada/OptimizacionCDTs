import { Component } from 'react';

/**
 * Red de seguridad ante un error de render inesperado en cualquier parte del
 * árbol. Sin esto, un error deja la pantalla en blanco sin explicación -- en
 * una herramienta que se usa para decidir sobre la propia plata, eso es
 * particularmente malo. React solo soporta Error Boundaries como componentes
 * de clase; no hay equivalente en hooks.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { huboError: false };
  }

  static getDerivedStateFromError() {
    return { huboError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Error de render capturado por ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.huboError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="glass-card max-w-md w-full p-6 md:p-8 space-y-4 text-center bg-white dark:bg-slate-900">
            <span className="text-4xl" aria-hidden="true">⚠️</span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Algo salió mal
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              La aplicación encontró un error inesperado. Tus datos guardados no se
              perdieron: recargar la página suele resolverlo.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
