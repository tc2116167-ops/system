
import React from 'react';
import { Producto, Movimiento, TipoMovimiento, Ubicacion, Propietario, UserRole } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

interface DashboardProps {
  productos: Producto[];
  movimientos: Movimiento[];
  role: UserRole;
  ownerName?: Propietario;
}

const Dashboard: React.FC<DashboardProps> = ({ productos, movimientos, role, ownerName }) => {
  const totalStock = productos.reduce((acc, p) => acc + p.stock, 0);
  const salesMovements = movimientos.filter(m => m.tipo === TipoMovimiento.VENTA);
  const totalSalesCount = salesMovements.reduce((acc, m) => acc + m.cantidad, 0);
  const totalRevenue = salesMovements.reduce((acc, m) => acc + (m.precioVenta || 0) * m.cantidad, 0);
  const totalCommissions = salesMovements.reduce((acc, m) => acc + (m.comisionPagada || 0), 0);

  const salesByLocation = [
    { name: 'Lima', value: salesMovements.filter(m => m.ubicacion === Ubicacion.LIMA).length },
    { name: 'Provincia', value: salesMovements.filter(m => m.ubicacion === Ubicacion.PROVINCIA).length },
  ];

  // Agrupar ventas por vendedor
  const salesByVendorMap = salesMovements.reduce((acc: any, m) => {
    const vendor = m.vendedor || 'Desconocido';
    acc[vendor] = (acc[vendor] || 0) + m.cantidad;
    return acc;
  }, {});

  const salesByVendorData = Object.entries(salesByVendorMap).map(([name, value]) => ({ name, value }));

  const stockByOwner = Object.values(Propietario).map(owner => ({
    name: owner,
    value: productos.filter(p => p.propietario === owner).reduce((acc, p) => acc + p.stock, 0)
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const recentMovements = movimientos.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Stock Disponible" value={`${totalStock}`} icon="fa-box-open" color="indigo" />
        <StatCard title="Ventas Totales" value={totalSalesCount.toString()} icon="fa-shopping-cart" color="emerald" />
        <StatCard title="Ingresos Brutos" value={`S/ ${totalRevenue.toLocaleString()}`} icon="fa-sack-dollar" color="amber" />
        <StatCard title="Comisiones Pag." value={`S/ ${totalCommissions.toLocaleString()}`} icon="fa-user-tag" color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-lg font-black text-slate-800 flex items-center">
                <i className="fas fa-chart-line mr-3 text-indigo-500"></i>
                Rendimiento de Ventas por Vendedor
             </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByVendorData.length > 0 ? salesByVendorData : [{name: 'Sin datos', value: 0}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 flex items-center mb-8">
            <i className="fas fa-map-marked-alt mr-3 text-emerald-500"></i>
            Zonas de Venta
          </h3>
          <div className="h-[200px] w-full relative">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={salesByLocation} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value">
                  {salesByLocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#f59e0b'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Total</p>
                    <p className="text-xl font-black text-slate-800">{salesMovements.length}</p>
                </div>
            </div>
          </div>
          <div className="space-y-3 mt-8">
              <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl">
                  <span className="text-[10px] font-black text-emerald-600 uppercase">Lima</span>
                  <span className="font-black text-emerald-700">{salesByLocation[0].value} despachos</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-amber-50 rounded-2xl">
                  <span className="text-[10px] font-black text-amber-600 uppercase">Provincias</span>
                  <span className="font-black text-amber-700">{salesByLocation[1].value} envíos</span>
              </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Actividad Reciente</h3>
          <i className="fas fa-bolt text-amber-400"></i>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[9px] uppercase font-black tracking-widest">
                <th className="py-5 px-8">Producto / Modelo</th>
                <th className="py-5 px-8">Operación</th>
                <th className="py-5 px-8">Vendedor</th>
                <th className="py-5 px-8 text-center">Cant.</th>
                <th className="py-5 px-8">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentMovements.map(m => {
                const p = productos.find(prod => prod.id === m.productoId);
                return (
                  <tr key={m.id} className="text-slate-700 hover:bg-slate-50/80 transition-all">
                    <td className="py-5 px-8">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-indigo-500 mr-4 shrink-0">
                            <i className="fas fa-shirt text-[10px]"></i>
                        </div>
                        <div>
                            <p className="font-black text-slate-800 text-sm">{p?.nombre}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{p?.color}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        m.tipo === TipoMovimiento.VENTA ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="py-5 px-8">
                        <p className="text-xs font-black text-slate-600">{m.vendedor || 'Sistema'}</p>
                    </td>
                    <td className="py-5 px-8 text-center font-black text-sm">{m.cantidad}</td>
                    <td className="py-5 px-8 text-slate-400 text-[10px] font-bold whitespace-nowrap">{m.fecha.split(',')[0]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {recentMovements.length === 0 && (
              <div className="p-20 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest">Aún no hay actividad</div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: string, icon: string, color: string }) => {
  const colorMap: any = {
    indigo: 'bg-indigo-600 text-white shadow-indigo-200',
    emerald: 'bg-emerald-500 text-white shadow-emerald-200',
    amber: 'bg-amber-500 text-white shadow-amber-200',
    rose: 'bg-rose-500 text-white shadow-rose-200'
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-100 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${colorMap[color]}`}>
          <i className={`fas ${icon} text-lg`}></i>
        </div>
        <i className="fas fa-ellipsis-h text-slate-200"></i>
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
        <h4 className="text-2xl font-black text-slate-900 mt-1">{value}</h4>
      </div>
    </div>
  );
};

export default Dashboard;
