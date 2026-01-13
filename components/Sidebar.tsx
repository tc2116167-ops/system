
import React from 'react';
import { View, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  role: UserRole;
  onLogout: () => void;
  userName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, toggleSidebar, role, onLogout, userName }) => {
  const allItems = [
    { id: 'dashboard', icon: 'fa-chart-line', label: 'Dashboard', roles: [UserRole.ADMIN, UserRole.OWNER] },
    { id: 'inventory', icon: 'fa-boxes-stacked', label: 'Inventario', roles: [UserRole.ADMIN, UserRole.OWNER] },
    { id: 'promotions', icon: 'fa-tags', label: 'Promociones', roles: [UserRole.ADMIN, UserRole.OWNER] },
    { id: 'sales', icon: 'fa-cart-shopping', label: 'Ventas', roles: [UserRole.ADMIN, UserRole.SELLER] },
    { id: 'commissions', icon: 'fa-hand-holding-dollar', label: 'Comisiones', roles: [UserRole.ADMIN, UserRole.OWNER, UserRole.SELLER] },
    { id: 'users', icon: 'fa-user-group', label: 'Personal', roles: [UserRole.ADMIN] },
    { id: 'history', icon: 'fa-history', label: 'Historial', roles: [UserRole.ADMIN, UserRole.OWNER, UserRole.SELLER] },
  ];

  const menuItems = allItems.filter(item => item.roles.includes(role));

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      onLogout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      {/* Overlay para móviles */}
      <div
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60] transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      <aside className={`fixed left-0 top-0 h-full bg-slate-950 text-white transition-all duration-300 ease-in-out z-[70] flex flex-col shadow-2xl border-r border-slate-900 ${isOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden'}`}>
        <div className="p-8 flex items-center justify-between border-b border-slate-900 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black italic shadow-lg shadow-indigo-500/20">S</div>
            <span className="text-2xl font-black tracking-tighter">SYSTEM</span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white p-2">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="p-6 px-8 mt-4 shrink-0">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Menú Principal</p>
        </div>

        <nav className="flex-1 space-y-2 px-4 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id as View);
                if (window.innerWidth < 1024) toggleSidebar();
              }}
              className={`w-full flex items-center p-4 rounded-2xl transition-all duration-200 group ${currentView === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <i className={`fas ${item.icon} w-6 text-center text-lg`}></i>
              <span className="ml-4 font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-900 bg-slate-950 shrink-0">
          <div className="flex items-center p-4 bg-slate-900/50 rounded-2xl mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-black text-xs mr-3">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-500 uppercase truncate leading-none mb-1">Sesión iniciada</p>
              <p className="text-xs font-bold text-white truncate uppercase">{userName}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center p-4 rounded-2xl text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all">
            <i className="fas fa-power-off w-6 text-center"></i>
            <span className="ml-4 text-xs font-black uppercase tracking-widest">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
