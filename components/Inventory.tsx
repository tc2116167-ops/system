
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Producto, Talla, TipoMovimiento, Propietario, UserRole, Usuario } from '../types';
import * as XLSX from 'xlsx';

interface InventoryProps {
  productos: Producto[];
  onAddProduct: (p: Omit<Producto, 'id'>) => void;
  onAddMovement: (m: any) => void;
  onDeleteProduct: (id: string) => void;
  role: UserRole;
  currentUser: Usuario;
}

const Inventory: React.FC<InventoryProps> = ({ productos, onAddProduct, onAddMovement, onDeleteProduct, role, currentUser }) => {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showStockModal, setShowStockModal] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  
  const [modelSearch, setModelSearch] = useState('');
  const [colorSearch, setColorSearch] = useState('');
  const [sizeSearch, setSizeSearch] = useState('');
  
  const [showModelList, setShowModelList] = useState(false);
  const [showColorList, setShowColorList] = useState(false);
  const [showSizeList, setShowSizeList] = useState(false);

  const modelRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);

  const [newP, setNewP] = useState<Omit<Producto, 'id'>>({
    nombre: '',
    talla: Talla.M,
    color: '',
    stock: 0,
    precioBase: 0,
    propietario: currentUser.propietarioAsignado || Propietario.DUENO_1,
    comisionValor: 5,
    comisionTipo: 'monto'
  });

  // Filtro de productos basado en el rol: Los dueños solo ven su propio stock
  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return productos.filter(p => {
      // Restricción por rol de dueño
      if (role === UserRole.OWNER && p.propietario !== currentUser.propietarioAsignado) {
        return false;
      }
      // Filtro de búsqueda
      return (
        p.nombre.toLowerCase().includes(q) || 
        p.color.toLowerCase().includes(q) || 
        p.propietario.toLowerCase().includes(q)
      );
    }).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [productos, filter, role, currentUser.propietarioAsignado]);

  const modelosExistentes = useMemo(() => Array.from(new Set(filtered.map(p => p.nombre))), [filtered]);
  const coloresExistentes = useMemo(() => Array.from(new Set(filtered.map(p => p.color))), [filtered]);
  const tallasSugeridas = useMemo(() => {
    const defaultTallas = Object.values(Talla);
    const customTallas = filtered.map(p => p.talla as string);
    return Array.from(new Set([...defaultTallas, ...customTallas]));
  }, [filtered]);

  const filteredModelos = modelosExistentes.filter(m => m.toLowerCase().includes(modelSearch.toLowerCase()));
  const filteredColores = coloresExistentes.filter(c => c.toLowerCase().includes(colorSearch.toLowerCase()));
  const filteredTallas = tallasSugeridas.filter(t => t.toLowerCase().includes(sizeSearch.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) setShowModelList(false);
      if (colorRef.current && !colorRef.current.contains(event.target as Node)) setShowColorList(false);
      if (sizeRef.current && !sizeRef.current.contains(event.target as Node)) setShowSizeList(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [stockAdjustment, setStockAdjustment] = useState({
    cantidad: 1,
    tipo: TipoMovimiento.ENTRADA,
    comentario: ''
  });

  // Permisos: Solo administradores y dueños pueden gestionar stock. Vendedores bloqueados.
  const canManageStock = role === UserRole.ADMIN || role === UserRole.OWNER;

  const selectModel = (m: string) => {
    const similar = productos.find(p => p.nombre === m);
    setNewP({
      ...newP,
      nombre: m,
      precioBase: similar?.precioBase || newP.precioBase,
      propietario: similar?.propietario || newP.propietario
    });
    setModelSearch(m);
    setShowModelList(false);
  };

  const selectColor = (c: string) => {
    setNewP({ ...newP, color: c });
    setColorSearch(c);
    setShowColorList(false);
  };

  const selectSize = (t: string) => {
    setNewP({ ...newP, talla: t as Talla });
    setSizeSearch(t);
    setShowSizeList(false);
  };

  const handleDelete = (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar el producto "${nombre}" permanentemente del inventario?`)) {
      onDeleteProduct(id);
    }
  };

  const handleExportExcel = () => {
    // Exporta solo lo que está filtrado (su propio stock si es dueño)
    const dataToExport = filtered.map(p => ({
      'ID': p.id,
      'PRODUCTO / MODELO': p.nombre,
      'COLOR': p.color,
      'TALLA': p.talla,
      'PROPIETARIO': p.propietario,
      'STOCK ACTUAL': p.stock,
      'PRECIO UNITARIO (S/)': p.precioBase,
      'VALOR TOTAL STOCK (S/)': p.stock * p.precioBase
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    
    const today = new Date();
    const dateStr = `${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}`;
    const prefix = role === UserRole.OWNER ? `Inventario_${currentUser.propietarioAsignado}` : 'Inventario_Global';
    XLSX.writeFile(wb, `${prefix}_SYSTEM_${dateStr}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative w-full md:w-1/3">
          <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
          <input 
            type="text" 
            placeholder="Filtrar inventario..." 
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold text-slate-700"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <button 
            onClick={handleExportExcel}
            className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center text-[10px] uppercase tracking-widest active:scale-95"
          >
            <i className="fas fa-file-excel mr-3"></i> Exportar Mi Stock
          </button>
          
          {canManageStock && (
            <button 
              onClick={() => {
                setShowAddProduct(true);
                setModelSearch('');
                setColorSearch('');
                setSizeSearch('');
                // Reiniciar propietario al asignado por defecto
                setNewP(prev => ({...prev, propietario: currentUser.propietarioAsignado || Propietario.DUENO_1}));
              }}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center text-[10px] uppercase tracking-widest active:scale-95"
            >
              <i className="fas fa-plus mr-3"></i> Registrar Nueva Prenda
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[9px] uppercase font-black tracking-widest border-b border-slate-100">
                <th className="py-6 px-8">Modelo</th>
                {role === UserRole.ADMIN && <th className="py-6 px-8">Propietario</th>}
                <th className="py-6 px-8 text-center">Variante</th>
                <th className="py-6 px-8">Precio</th>
                <th className="py-6 px-8 text-center">Stock</th>
                {canManageStock && <th className="py-6 px-8 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-5 px-8">
                    <span className="font-black text-slate-800 text-sm block uppercase tracking-tight">{p.nombre}</span>
                    <span className="text-[9px] text-indigo-400 font-bold">ID: {p.id.substring(0,5)}</span>
                  </td>
                  {role === UserRole.ADMIN && (
                    <td className="py-5 px-8">
                      <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg uppercase">
                        {p.propietario}
                      </span>
                    </td>
                  )}
                  <td className="py-5 px-8 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase">{p.color}</span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black mt-1 uppercase">TALLA {p.talla}</span>
                    </div>
                  </td>
                  <td className="py-5 px-8 font-black text-slate-700 text-sm">S/ {p.precioBase.toFixed(2)}</td>
                  <td className="py-5 px-8 text-center">
                    <div className={`inline-block px-4 py-1.5 rounded-xl text-xs font-black ${p.stock < 5 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {p.stock}
                    </div>
                  </td>
                  {canManageStock && (
                    <td className="py-5 px-8 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => {
                            setShowStockModal(p.id);
                            setStockAdjustment({ cantidad: 1, tipo: TipoMovimiento.ENTRADA, comentario: '' });
                          }} 
                          className="w-10 h-10 text-indigo-500 hover:bg-indigo-600 hover:text-white rounded-xl transition-all border border-indigo-50 flex items-center justify-center"
                          title="Ajustar Stock"
                        >
                          <i className="fas fa-boxes-stacked"></i>
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id, p.nombre)}
                          className="w-10 h-10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-50 flex items-center justify-center"
                          title="Eliminar Producto"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={role === UserRole.ADMIN ? 6 : 5} className="py-20 text-center">
                    <div className="flex flex-col items-center">
                      <i className="fas fa-box-open text-4xl text-slate-100 mb-4"></i>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                        {role === UserRole.OWNER ? 'No tienes prendas registradas bajo tu nombre' : 'No hay prendas en el inventario'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REGISTRO DE NUEVA PRENDA */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] p-10 w-full max-w-2xl shadow-2xl border border-slate-100 overflow-visible max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-2xl font-black text-slate-900 flex items-center">
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mr-4 text-white shrink-0">
                   <i className="fas fa-tag"></i>
                 </div> 
                 Registrar Prenda
               </h3>
               <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>

            <div className="space-y-6">
              {/* Información de Propietario (Solo lectura para dueños) */}
              {role === UserRole.OWNER ? (
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Registrando como:</p>
                  <p className="text-sm font-black text-indigo-700 uppercase">{currentUser.propietarioAsignado}</p>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Asignar a Dueño</label>
                  <select 
                    className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-500 font-black text-slate-700 uppercase"
                    value={newP.propietario}
                    onChange={e => setNewP({...newP, propietario: e.target.value as Propietario})}
                  >
                    {Object.values(Propietario).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}

              <div className="relative" ref={modelRef}>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre del Modelo</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 outline-none font-black text-slate-700 uppercase" 
                    placeholder="Escribe o selecciona..."
                    value={modelSearch}
                    onChange={e => {
                      setModelSearch(e.target.value.toUpperCase());
                      setNewP({...newP, nombre: e.target.value.toUpperCase()});
                      setShowModelList(true);
                    }}
                    onFocus={() => setShowModelList(true)}
                  />
                  <i className="fas fa-search absolute right-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
                </div>
                {showModelList && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 max-h-[150px] overflow-y-auto custom-scrollbar p-1">
                    {filteredModelos.map(m => (
                      <button key={m} onClick={() => selectModel(m)} className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg font-bold text-xs text-slate-700 uppercase">
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative" ref={colorRef}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Color / Tono</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 outline-none font-black text-slate-700 uppercase" 
                      placeholder="Ej: AZUL REY"
                      value={colorSearch}
                      onChange={e => {
                        setColorSearch(e.target.value.toUpperCase());
                        setNewP({...newP, color: e.target.value.toUpperCase()});
                        setShowColorList(true);
                      }}
                      onFocus={() => setShowColorList(true)}
                    />
                  </div>
                  {showColorList && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 max-h-[150px] overflow-y-auto custom-scrollbar p-1">
                      {filteredColores.map(c => (
                        <button key={c} onClick={() => selectColor(c)} className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg font-bold text-xs text-slate-700 uppercase">
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={sizeRef}>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Talla</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500 outline-none font-black text-slate-700 uppercase" 
                      placeholder="Ej: M o XL"
                      value={sizeSearch}
                      onChange={e => {
                        setSizeSearch(e.target.value.toUpperCase());
                        setNewP({...newP, talla: e.target.value.toUpperCase() as Talla});
                        setShowSizeList(true);
                      }}
                      onFocus={() => setShowSizeList(true)}
                    />
                  </div>
                  {showSizeList && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 max-h-[150px] overflow-y-auto custom-scrollbar p-1">
                      {filteredTallas.map(t => (
                        <button key={t} onClick={() => selectSize(t)} className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg font-bold text-xs text-slate-700 uppercase">
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Stock Inicial</label>
                  <input type="number" className="w-full bg-white p-4 rounded-xl text-center font-black text-2xl focus:ring-2 focus:ring-indigo-500 outline-none" value={newP.stock} onChange={e => setNewP({...newP, stock: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Precio Unitario</label>
                  <input type="number" className="w-full bg-white p-4 rounded-xl text-center font-black text-2xl text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none" value={newP.precioBase} onChange={e => setNewP({...newP, precioBase: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
            </div>

            <button onClick={() => { if(!newP.nombre || !newP.color || !newP.talla) return alert("Completa Modelo, Color y Talla."); onAddProduct(newP); setShowAddProduct(false); }} className="w-full mt-8 py-5 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98]">Registrar en Mi Stock</button>
          </div>
        </div>
      )}

      {/* MODAL AJUSTE STOCK RÁPIDO */}
      {showStockModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl text-center">
            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Movimiento de Stock</h3>
            <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest mb-8">
              {productos.find(p => p.id === showStockModal)?.nombre} - {productos.find(p => p.id === showStockModal)?.color}
            </p>
            
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button onClick={() => setStockAdjustment({...stockAdjustment, tipo: TipoMovimiento.ENTRADA})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${stockAdjustment.tipo === TipoMovimiento.ENTRADA ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>Entrada (+)</button>
              <button onClick={() => setStockAdjustment({...stockAdjustment, tipo: TipoMovimiento.SALIDA})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${stockAdjustment.tipo === TipoMovimiento.SALIDA ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400'}`}>Salida (-)</button>
            </div>

            <div className="space-y-4 mb-10 text-left">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cantidad de unidades</label>
                <input 
                  type="number" 
                  className="w-full p-4 rounded-2xl bg-slate-50 text-4xl font-black text-center text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={stockAdjustment.cantidad} 
                  onChange={e => setStockAdjustment({...stockAdjustment, cantidad: Math.abs(parseInt(e.target.value)) || 1})} 
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Observación / Motivo</label>
                <textarea 
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-600 text-xs resize-none h-24"
                  placeholder="Ej: Prenda fallada, envío a provincia, etc."
                  value={stockAdjustment.comentario}
                  onChange={e => setStockAdjustment({...stockAdjustment, comentario: e.target.value})}
                ></textarea>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button onClick={() => setShowStockModal(null)} className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl">Cerrar</button>
              <button 
                onClick={() => {
                  onAddMovement({
                    productoId: showStockModal,
                    tipo: stockAdjustment.tipo,
                    cantidad: stockAdjustment.cantidad,
                    vendedor: currentUser.nombre,
                    comentario: stockAdjustment.comentario || `Ajuste de inventario realizado por ${role}`
                  });
                  setShowStockModal(null);
                }}
                className={`flex-1 py-4 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl ${stockAdjustment.tipo === TipoMovimiento.ENTRADA ? 'bg-indigo-600' : 'bg-rose-600'}`}
              >Confirmar Ajuste</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
