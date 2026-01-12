
import React, { useMemo, useState } from 'react';
import { Movimiento, PagoComision, UserRole, Usuario, TipoMovimiento } from '../types';

interface CommissionManagementProps {
  movimientos: Movimiento[];
  pagos: PagoComision[];
  onPay: (vendedor: string, monto: number) => void;
  role: UserRole;
  currentUser: Usuario;
}

const CommissionManagement: React.FC<CommissionManagementProps> = ({ movimientos, pagos, onPay, role, currentUser }) => {
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  // Agrupar deuda pendiente por vendedor
  const deudasPendientes = useMemo(() => {
    const map: Record<string, number> = {};
    movimientos
      .filter(m => m.tipo === TipoMovimiento.VENTA && m.estadoComision === 'Pendiente')
      .forEach(m => {
        const v = m.vendedor || 'Sistema';
        map[v] = (map[v] || 0) + (m.comisionPagada || 0);
      });
    return Object.entries(map).map(([vendedor, monto]) => ({ vendedor, monto }));
  }, [movimientos]);

  // Historial de pagos para el vendedor actual (si es vendedor) o para todos si es admin
  const historialFiltrado = useMemo(() => {
    if (role === UserRole.SELLER) {
      return pagos.filter(p => p.vendedor === currentUser.nombre);
    }
    return pagos;
  }, [pagos, role, currentUser.nombre]);

  const canPay = role === UserRole.ADMIN || role === UserRole.OWNER;

  return (
    <div className="space-y-8">
      {/* SECCIÓN DE COBRO (SOLO ADMIN/DUEÑO) */}
      {canPay && (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-amber-100">
              <i className="fas fa-wallet text-xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Comisiones por Liquidar</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Saldo acumulado por ventas confirmadas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deudasPendientes.map(item => (
              <div key={item.vendedor} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Vendedor</p>
                    <h4 className="font-black text-slate-800 uppercase">{item.vendedor}</h4>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-600 text-[9px] font-black rounded-lg uppercase tracking-widest">Pendiente</span>
                </div>
                <div className="mt-6 flex justify-between items-end">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Monto a Pagar</p>
                    <p className="text-2xl font-black text-slate-900">S/ {item.monto.toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => {
                      if(confirm(`¿Confirmas el pago de S/ ${item.monto.toFixed(2)} a ${item.vendedor}?`)) {
                        onPay(item.vendedor, item.monto);
                      }
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                  >
                    Pagar Ahora
                  </button>
                </div>
              </div>
            ))}
            {deudasPendientes.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-300 font-black text-xs uppercase tracking-[0.2em]">
                <i className="fas fa-check-circle text-4xl mb-4 opacity-20 block"></i>
                No hay comisiones pendientes de pago
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORIAL DE PAGOS RECIBIDOS */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Historial de Cobros</h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
            {role === UserRole.SELLER ? 'Tus comisiones recibidas' : 'Registro general de liquidaciones realizadas'}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[9px] uppercase font-black tracking-widest">
                <th className="py-6 px-8">ID Pago</th>
                <th className="py-6 px-8">Fecha y Periodo</th>
                <th className="py-6 px-8">Vendedor</th>
                <th className="py-6 px-8 text-center">Monto Liquidado</th>
                <th className="py-6 px-8 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {historialFiltrado.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="py-5 px-8 font-mono text-[10px] text-indigo-400 font-black">#REC-{p.id.toUpperCase()}</td>
                  <td className="py-5 px-8">
                    <p className="text-xs font-black text-slate-700 uppercase">{p.periodo}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{p.fecha}</p>
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center font-black mr-3 text-[10px]">
                        {p.vendedor.charAt(0)}
                      </div>
                      <span className="text-xs font-black text-slate-700 uppercase">{p.vendedor}</span>
                    </div>
                  </td>
                  <td className="py-5 px-8 text-center">
                    <span className="text-sm font-black text-slate-900">S/ {p.monto.toFixed(2)}</span>
                  </td>
                  <td className="py-5 px-8 text-center">
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest">
                      <i className="fas fa-check-circle mr-1.5"></i> Pagado
                    </span>
                  </td>
                </tr>
              ))}
              {historialFiltrado.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest">
                    No se registran pagos previos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommissionManagement;
