
import React, { useState, useEffect } from 'react';
import { getSmartSummary } from '../services/geminiService';
import { Producto, Movimiento } from '../types';

interface AIInsightsProps {
  productos: Producto[];
  movimientos: Movimiento[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ productos, movimientos }) => {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAIAnalysis = async () => {
    setLoading(true);
    const result = await getSmartSummary(productos, movimientos);
    setSummary(result || "Error al procesar el análisis.");
    setLoading(false);
  };

  useEffect(() => {
    fetchAIAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold mb-3 flex items-center">
              <i className="fas fa-brain mr-3 text-indigo-200"></i> Análisis Inteligente Gemini
            </h2>
            <p className="text-indigo-100 text-lg opacity-90">
              He procesado tus datos de inventario y ventas para darte una visión clara de cómo va el negocio compartido.
            </p>
          </div>
          <button 
            onClick={fetchAIAnalysis}
            disabled={loading}
            className="px-8 py-3 bg-white text-indigo-700 font-bold rounded-2xl hover:bg-indigo-50 transition-all disabled:opacity-50"
          >
            {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-sync-alt mr-2"></i>}
            Actualizar Análisis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[400px]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium animate-pulse">Pensando y analizando tendencias...</p>
            </div>
          ) : (
            <div className="prose prose-indigo max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">
                {summary}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
            <h4 className="text-amber-800 font-bold mb-4 flex items-center">
              <i className="fas fa-exclamation-triangle mr-2"></i> Alertas Críticas
            </h4>
            <ul className="space-y-3">
              {productos.filter(p => p.stock < 5).map(p => (
                <li key={p.id} className="text-xs text-amber-700 bg-white/50 p-2 rounded-lg">
                  <strong>{p.nombre} ({p.color})</strong> queda solo {p.stock} unid.
                </li>
              ))}
              {productos.filter(p => p.stock < 5).length === 0 && (
                <li className="text-xs text-emerald-700 bg-white/50 p-2 rounded-lg">
                  Todo el stock en niveles saludables.
                </li>
              )}
            </ul>
          </div>

          <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
            <h4 className="text-indigo-800 font-bold mb-4">Métrica de Propiedad</h4>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-indigo-700 text-slate-600">Dueño {i}</span>
                    <span className="font-bold text-slate-800">33.3%</span>
                  </div>
                  <div className="w-full bg-indigo-200 h-1.5 rounded-full">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{width: '33.3%'}}></div>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-slate-500 pt-2 italic">Basado en contrato de 3 propietarios.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
