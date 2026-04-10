import { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { RotateCcw } from 'lucide-react';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6" translate="no">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-[#C08C5D]/10 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-[#A64D32]/10 rounded-full flex items-center justify-center text-[#A64D32] mx-auto">
              <RotateCcw size={32} />
            </div>
            <h2 className="text-2xl font-serif text-[#1A1A1A]">Algo salió mal</h2>
            <p className="text-[#1A1A1A]/60 text-sm">
              Hubo un error al cargar la aplicación. Esto suele ocurrir si tienes activado el Traductor de Google o alguna extensión que modifica la página.
            </p>
            {this.state.error && (
              <div className="bg-red-50 p-4 rounded-xl text-left overflow-auto max-h-40 border border-red-100">
                <p className="text-red-800 text-[10px] font-mono leading-relaxed">
                  <strong>{this.state.error.name}</strong>: {this.state.error.message}
                  {this.state.error.stack && (
                    <span className="block mt-2 opacity-50 text-[8px] whitespace-pre-wrap">
                      {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                    </span>
                  )}
                </p>
              </div>
            )}
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#C08C5D] text-white py-3 rounded-full text-sm font-medium hover:bg-[#A64D32] transition-all shadow-lg shadow-[#C08C5D]/20"
            >
              Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
