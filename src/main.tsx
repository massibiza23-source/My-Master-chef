import { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { RotateCcw } from 'lucide-react';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-[#C08C5D]/10 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-[#A64D32]/10 rounded-full flex items-center justify-center text-[#A64D32] mx-auto">
              <RotateCcw size={32} />
            </div>
            <h2 className="text-2xl font-serif text-[#1A1A1A]">Algo salió mal</h2>
            <p className="text-[#1A1A1A]/60 text-sm">
              Hubo un error al cargar la aplicación. Por favor, intenta recargar la página.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#C08C5D] text-white py-3 rounded-full text-sm font-medium hover:bg-[#A64D32] transition-all"
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
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
