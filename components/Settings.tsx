
import React, { useState } from 'react';
import { updateSupabaseConfig } from '../lib/supabase';

interface SettingsProps {
  onConfigUpdated: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onConfigUpdated }) => {
  const [url, setUrl] = useState(localStorage.getItem('sys_sb_url') || '');
  const [key, setKey] = useState(localStorage.getItem('sys_sb_key') || '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');

    // Actualizar configuración y cliente
    updateSupabaseConfig(url, key);

    setTimeout(() => {
      setStatus('success');
      onConfigUpdated();
      setTimeout(() => setStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10 md:p-16">
        <div className="flex items-center gap-6 mb-12">
          <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
            <i className="fas fa-database text-2xl"></i>
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Conexión Cloud</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Configura tu base de datos Supabase</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Project URL</label>
            <div className="relative">
              <i className="fas fa-link absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input
                type="text"
                required
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-5 pl-14 pr-6 font-bold text-slate-700 outline-none transition-all shadow-inner"
                placeholder="https://xxxxxx.supabase.co"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>
            <p className="text-[9px] text-slate-400 ml-2 italic">Puedes encontrar esto en Settings &gt; API en tu panel de Supabase.</p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Anon Key / Public Key</label>
            <div className="relative">
              <i className="fas fa-key absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <textarea
                required
                className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-5 pl-14 pr-6 font-mono text-xs font-bold text-slate-700 outline-none transition-all shadow-inner resize-none h-32"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={e => setKey(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={status === 'saving'}
              className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all flex items-center justify-center shadow-2xl ${status === 'success' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
            >
              {status === 'saving' && <i className="fas fa-spinner fa-spin mr-3"></i>}
              {status === 'success' && <i className="fas fa-check-circle mr-3"></i>}
              {status === 'success' ? 'Configuración Guardada' : 'Probar y Vincular Base de Datos'}
            </button>
          </div>
        </form>

        <div className="mt-12 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
          <i className="fas fa-info-circle text-amber-500 mt-1"></i>
          <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase">
            Nota: Al guardar, el sistema intentará sincronizar las tablas: <span className="font-black text-amber-800">productos, movimientos, usuarios, promociones</span> y <span className="font-black text-amber-800">pagos_comisiones</span>. Asegúrate de que existan en tu proyecto.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
