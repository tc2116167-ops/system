
import React, { useState, useMemo } from 'react';
import { Promocion, Producto, Propietario, UserRole, Usuario } from '../types';

interface PromotionsProps {
  promociones: Promocion[];
  productos: Producto[];
  onAddPromo: (p: Omit<Promocion, 'id'>) => void;
  onDeletePromo: (id: string) => void;
  role: UserRole;
  currentUser: Usuario;
}

const Promotions: React.FC<PromotionsProps> = ({ promociones, productos, onAddPromo, onDeletePromo, role, currentUser }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newPromo, setNewPromo] = useState<Omit<Promocion, 'id'>>({
    nombre: '',
    descripcion: '',
    tipo: 'cantidad_fija',
    cantidadRequerida: 3,
    valorPromo: 99,
    modelosAplicables: [],
    propietarioId: role === UserRole.OWNER ? (currentUser.propietarioAsignado || Propietario.DUENO_1) : Propietario.DUENO_1,
    estado: 'Activa'
  });

  // Agrupar productos por nombre único (Modelos) para simplificar la lista
  const modelosDisponibles = useMemo(() => {
    const nombresUnicos = new Set<string>();
    const listaModelos: { nombre: string, propietario: Propietario }[] = [];
    
    productos.forEach(p => {
      if (!nombresUnicos.has(p.nombre)) {
        nombresUnicos.add(p.nombre);
        listaModelos.push({ nombre: p.nombre, propietario: p.propietario });
      }
    });
    
    return listaModelos.filter(m => role === UserRole.ADMIN || m.propietario === newPromo.propietarioId);
  }, [productos, role, newPromo.propietarioId]);

  const toggleModelSelection = (nombre: string) => {
    setNewPromo(prev => ({
      ...prev,
      modelosAplicables: prev.modelosAplicables.includes(nombre) 
        ? prev.modelosAplicables.filter(n => n !== nombre)
        : [...prev.modelosAplicables, nombre]
    }));
  };

  const handleSave = () => {
    if (!newPromo.nombre || newPromo.modelosAplicables.length === 0) {
      alert("Completa el nombre y selecciona al menos un modelo de prenda.");
      return;
    }
    onAddPromo(newPromo);
    setShowAdd(false);
    setNewPromo({
      nombre: '',
      descripcion: '',
      tipo: 'cantidad_fija',
      cantidadRequerida: 3,
      valorPromo: 99,
      modelosAplicables: [],
      propietarioId: role === UserRole.OWNER ? (currentUser.propietarioAsignado || Propietario.DUENO_1) : Propietario.DUENO_1,
      estado: 'Activa'
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Promociones</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Configuración masiva por modelo de prenda</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center text-xs uppercase tracking-[0.2em]"
        >
          <i className="fas fa-plus-circle mr-3"></i> Crear Nueva Oferta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {promociones.map(promo => (
          <div key={promo.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-50 transition-all border-t-8" style={{borderTopColor: '#6366f1'}}>
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <i className="fas fa-tags text-lg"></i>
              </div>
              <button 
                onClick={() => onDeletePromo(promo.id)}
                className="w-10 h-10 bg-rose-50 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
              >
                <i className="fas fa-trash-alt text-xs"></i>
              </button>
            </div>
            
            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight mb-2">{promo.nombre}</h3>
            <p className="text-slate-400 text-xs font-medium mb-4">{promo.descripcion}</p>
            
            <div className="mb-6">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Modelos incluidos:</p>
               <div className="flex flex-wrap gap-1">
                 {promo.modelosAplicables.map(m => (
                   <span key={m} className="px-2 py-1 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-lg">{m}</span>
                 ))}
               </div>
            </div>

            <div className="bg-indigo-50 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black text-indigo-400 uppercase">Condición</p>
                <p className="text-sm font-black text-indigo-700">{promo.cantidadRequerida} prendas</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-indigo-400 uppercase">Precio Promo</p>
                <p className="text-xl font-black text-indigo-800">S/ {promo.valorPromo}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
               <div>
                 <h3 className="text-2xl font-black tracking-tight">Nueva Promoción por Modelos</h3>
                 <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest opacity-70">Aplica a todas las tallas y colores del modelo seleccionado</p>
               </div>
               <button onClick={() => setShowAdd(false)} className="w-10 h-10 bg-white/10 rounded-xl hover:bg-white/20 transition-all flex items-center justify-center">
                 <i className="fas fa-times"></i>
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Nombre de la Campaña</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="Ej: Promo 3x99 Polos"
                      value={newPromo.nombre}
                      onChange={e => setNewPromo({...newPromo, nombre: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cantidad Mínima</label>
                      <input 
                        type="number" 
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-black text-slate-700 text-center text-xl"
                        value={newPromo.cantidadRequerida}
                        onChange={e => setNewPromo({...newPromo, cantidadRequerida: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Precio Final S/</label>
                      <input 
                        type="number" 
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-black text-indigo-600 text-center text-xl"
                        value={newPromo.valorPromo}
                        onChange={e => setNewPromo({...newPromo, valorPromo: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Modelos (Diseños)</label>
                  <div className="bg-slate-50 rounded-[2rem] p-4 h-[350px] overflow-y-auto custom-scrollbar border border-slate-100">
                    <div className="grid grid-cols-1 gap-2">
                      {modelosDisponibles.map(m => (
                        <button 
                          key={m.nombre}
                          onClick={() => toggleModelSelection(m.nombre)}
                          className={`w-full text-left p-4 rounded-2xl transition-all border-2 flex justify-between items-center group ${newPromo.modelosAplicables.includes(m.nombre) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-transparent text-slate-700 hover:border-indigo-100'}`}
                        >
                          <div>
                            <p className="text-sm font-black uppercase truncate leading-none">{m.nombre}</p>
                            <p className={`text-[9px] font-bold mt-1 ${newPromo.modelosAplicables.includes(m.nombre) ? 'text-indigo-100' : 'text-slate-400'}`}>Incluye todos los colores/tallas</p>
                          </div>
                          {newPromo.modelosAplicables.includes(m.nombre) && <i className="fas fa-check-circle"></i>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
               <button 
                onClick={handleSave}
                className="w-full py-5 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
               >Publicar Promoción para Vendedores</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promotions;
