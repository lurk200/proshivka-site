import React from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[AdminErrorBoundary]', error, info.componentStack);
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" strokeWidth={1.5} />
        </div>
        <h2 className="text-[17px] font-semibold text-white mb-2">Не удалось загрузить раздел</h2>
        <p className="text-[13px] text-[#6b7280] mb-6 max-w-sm">
          Произошла ошибка при рендере. Попробуйте обновить страницу или вернитесь на дашборд.
        </p>

        {isDev && (
          <pre className="mb-6 max-w-xl w-full text-left text-[11px] text-red-300 bg-red-500/[0.06] border border-red-500/20 rounded-xl px-4 py-3 overflow-x-auto whitespace-pre-wrap">
            {error.message}
            {'\n'}
            {error.stack}
          </pre>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => this.reset()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.1] text-[#9ca3af] text-[13px] hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Попробовать снова
          </button>
          <a
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#84CC16] text-[#0c0d10] font-semibold text-[13px] hover:bg-[#9be02a] transition-colors"
          >
            <Home className="w-4 h-4" />
            На дашборд
          </a>
        </div>
      </div>
    );
  }
}
