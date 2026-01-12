
import React, { useState, useMemo } from 'react';
import { Movimiento, Producto, TipoMovimiento, UserRole, Usuario, Propietario } from '../types';

interface HistoryProps {
  movimientos: Movimiento[];
  productos: Producto[];
  role: UserRole;
  currentUser: Usuario;
}

const History: React.FC<HistoryProps> = ({ movimientos, productos, role, currentUser }) => {
  const isAdmin = role === UserRole.ADMIN;
  const [onlyMine, setOnlyMine] = useState(role === UserRole.SELLER);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMovimientos = useMemo(() => {
    let result = [...movimientos];

    // 1. Filtro por "Mis Registros" (si está activo)
    if (onlyMine) {
      result = result.filter(m => m.vendedor === currentUser.nombre);
    }

    // 2. Buscador Universal (Modelo, Color, Vendedor, Dueño)
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(m => {
        const p = productos.find(prod => prod.id === m.productoId);
        return (
          p?.nombre.toLowerCase().includes(q) ||
          p?.color.toLowerCase().includes(q) ||
          m.vendedor?.toLowerCase().includes(q) ||
          m.propietarioId?.toLowerCase().includes(q) ||
          m.tipo.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [movimientos, onlyMine, currentUser.nombre, searchTerm, productos]);

  return (
    <div className="space-y-6">
      {/* CABECERA Y FILTROS */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-lg ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <i className={`fas ${isAdmin ? 'fa-shield-halved' : 'fa-history'}`}></i>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                {isAdmin ? 'Auditoría Global de Movimientos' : 'Historial de Actividad'}
              </h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
                {isAdmin ? 'Acceso total sin restricciones a toda la base de datos' : 'Registro de tus operaciones en el sistema'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            {/* Buscador Rápido */}
            <div className="relative w-full sm:w-64">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
              <input 
                type="text"
                placeholder="Buscar en historial..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Toggle de Vista */}
            <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl shrink-0">
              <button 
                onClick={() => setOnlyMine(true)}
                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${onlyMine ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                Mis Acciones
              </button>
              <button 
                onClick={() => setOnlyMine(false)}
                className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!onlyMine ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                {isAdmin ? 'Ver Todo el Sistema' : 'Ver Todos'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA DE DATOS */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase tracking-widest font-black border-b border-slate-100">
                <th className="py-6 px-8">Fecha y Hora</th>
                <th className="py-6 px-8">Operación</th>
                <th className="py-6 px-8">Prenda / Modelo</th>
                {isAdmin && <th className="py-6 px-8">Dueño de Prenda</th>}
                <th className="py-6 px-8 text-center">Cant.</th>
                <th className="py-6 px-8">Detalle / Valor</th>
                <th className="py-6 px-8">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMovimientos.length > 0 ? filteredMovimientos.map(m => {
                const p = productos.find(prod => prod.id === m.productoId);
                const isVenta = m.tipo === TipoMovimiento.VENTA;
                const isSystem = m.vendedor === 'Sistema' || !m.vendedor;
                
                return (
                  <tr key={m.id} className="text-slate-700 hover:bg-slate-50/80 transition-all group">
                    <td className="py-5 px-8">
                      <p className="text-[11px] font-black text-slate-500 whitespace-nowrap">{m.fecha}</p>
                      <p className="font-mono text-[8px] text-slate-300 uppercase tracking-tighter">ID: {m.id.substring(0,8)}</p>
                    </td>
                    <td className="py-5 px-8">
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center ${
                        m.tipo === TipoMovimiento.VENTA ? 'bg-emerald-50 text-emerald-600' : 
                        m.tipo === TipoMovimiento.ENTRADA ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        <i className={`fas ${m.tipo === TipoMovimiento.VENTA ? 'fa-cart-shopping' : m.tipo === TipoMovimiento.ENTRADA ? 'fa-arrow-up' : 'fa-arrow-down'} mr-2`}></i>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="py-5 px-8">
                      <p className="font-black text-slate-800 text-sm uppercase truncate max-w-[180px]">{p?.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{p?.color} • {p?.talla}</p>
                    </td>
                    {isAdmin && (
                      <td className="py-5 px-8">
                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg uppercase whitespace-nowrap">
                          <i className="fas fa-id-badge mr-2 opacity-50"></i>
                          {m.propietarioId || 'N/A'}
                        </span>
                      </td>
                    )}
                    <td className="py-5 px-8 text-center">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 font-black text-slate-800 text-xs border border-slate-100">
                        {m.cantidad}
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      {isVenta ? (
                        <div className="flex flex-col">
                          <span className="font-black text-slate-700 text-xs">Venta: S/ {((m.precioVenta || 0) * m.cantidad).toFixed(2)}</span>
                          <span className="text-[9px] font-bold text-indigo-500">Comisión: S/ {m.comisionPagada?.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-bold text-[9px] uppercase italic">{m.comentario || 'Ajuste de inventario'}</span>
                      )}
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex items-center">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-3 text-[10px] font-black ${isSystem ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                          {isSystem ? <i className="fas fa-robot"></i> : (m.vendedor?.charAt(0) || 'U')}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-700 uppercase leading-none mb-1">{m.vendedor || 'Sistema'}</p>
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">
                            {isVenta ? (m.ubicacion || 'LOCAL') : 'OPERATIVO'}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-32 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                          <i className="fas fa-search text-3xl text-slate-200"></i>
                        </div>
                        <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Sin resultados para mostrar</p>
                        <p className="text-slate-300 text-[10px] mt-2 font-bold uppercase">Prueba ajustando los filtros o el buscador</p>
                      </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* INDICADOR DE TOTALES FILTRADOS */}
      <div className="flex justify-end px-8">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Mostrando {filteredMovimientos.length} de {movimientos.length} movimientos registrados
        </p>
      </div>
    </div>
  );
};

export default History;
