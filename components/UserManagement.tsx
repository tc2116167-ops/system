
import React, { useState } from 'react';
import { Usuario, UserRole, Propietario } from '../types';

interface UserManagementProps {
  usuarios: Usuario[];
  onAddUser: (u: Omit<Usuario, 'id' | 'fechaRegistro' | 'estado'>) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ usuarios, onAddUser }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    nombre: '',
    email: '',
    password: '',
    role: UserRole.SELLER,
    propietarioAsignado: Propietario.DUENO_1
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Directorio de Personal</h2>
          <p className="text-slate-500 text-sm font-medium">Control de acceso para dueños y vendedores del sistema.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center text-xs uppercase tracking-widest"
        >
          <i className="fas fa-user-plus mr-3"></i> Registrar Nuevo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {usuarios.map(u => (
          <div key={u.id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 group hover:shadow-xl hover:shadow-indigo-50/50 transition-all border-l-4" 
            style={{borderLeftColor: u.role === UserRole.ADMIN ? '#a855f7' : u.role === UserRole.OWNER ? '#3b82f6' : '#10b981'}}>
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm ${
                u.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600' :
                u.role === UserRole.OWNER ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {u.nombre.charAt(0)}
              </div>
              <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                u.estado === 'Activo' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
              }`}>
                {u.estado}
              </span>
            </div>
            
            <h3 className="text-lg font-black text-slate-800 truncate">{u.nombre}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{u.role}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-2 italic">{u.email}</p>
            
            {u.propietarioAsignado && (
              <div className="mt-4 flex items-center p-2.5 bg-blue-50 rounded-xl text-blue-700">
                <i className="fas fa-link text-[10px] mr-2"></i>
                <span className="text-[10px] font-black uppercase">Vinculado a: {u.propietarioAsignado}</span>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-slate-400">
              <div className="flex items-center">
                <i className="far fa-calendar-alt text-xs mr-2"></i>
                <span className="text-[10px] font-bold">{u.fechaRegistro}</span>
              </div>
              <button className="text-slate-300 hover:text-indigo-600 transition-colors">
                <i className="fas fa-ellipsis-v"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: REGISTRAR USUARIO */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-scale-up border border-slate-50 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Nuevo Acceso</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-tighter mb-8">Define el rol y credenciales del personal</p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                <input 
                  type="text" 
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                  placeholder="Ej: Juan Perez"
                  value={newUser.nombre}
                  onChange={e => setNewUser({...newUser, nombre: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                  placeholder="juan@system.com"
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña de Acceso</label>
                <input 
                  type="password" 
                  className="w-full p-4 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-indigo-500 font-bold" 
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Asignar Rol</label>
                <div className="grid grid-cols-2 gap-3">
                  {[UserRole.OWNER, UserRole.SELLER].map(r => (
                    <button
                      key={r}
                      onClick={() => setNewUser({...newUser, role: r})}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newUser.role === r ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {newUser.role === UserRole.OWNER && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre Dueño</label>
                  <select 
                    className="w-full p-4 rounded-2xl bg-blue-50 text-blue-700 border-none outline-none focus:ring-2 focus:ring-blue-500 font-black"
                    value={newUser.propietarioAsignado}
                    onChange={e => setNewUser({...newUser, propietarioAsignado: e.target.value as Propietario})}
                  >
                    {Object.values(Propietario).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-10 flex space-x-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all">Cancelar</button>
              <button 
                onClick={() => {
                  onAddUser(newUser);
                  setShowAddModal(false);
                  setNewUser({ nombre: '', email: '', password: '', role: UserRole.SELLER, propietarioAsignado: Propietario.DUENO_1 });
                }}
                disabled={!newUser.nombre || !newUser.email || !newUser.password}
                className="flex-1 py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
