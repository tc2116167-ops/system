
import React, { useState } from 'react';
import { Usuario } from '../types';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (user: Usuario) => void;
  usuarios: Usuario[];
}

const Login: React.FC<LoginProps> = ({ onLogin, usuarios }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    try {
      // 1. Autenticación con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new Error('Credenciales incorrectas o error de autenticación.');
      }

      // 2. Obtener perfil y rol desde tabla pública 'usuarios'
      const { data: userProfile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

      if (profileError || !userProfile) {
        // En este caso, el usuario existe en Auth pero no en la tabla de perfiles.
        // Podríamos lanzar error o crear un perfil básico. Por ahora, error.
        await supabase.auth.signOut(); // Logout por consistencia
        throw new Error('Usuario no encontrado en el registro de perfiles.');
      }

      if (userProfile.estado === 'Inactivo') {
        await supabase.auth.signOut();
        throw new Error('Tu cuenta ha sido desactivada. Contacta al administrador.');
      }

      // 3. Login exitoso
      onLogin(userProfile);

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Ocurrió un error al iniciar sesión.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl relative z-10 border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center font-black italic text-white text-2xl mx-auto shadow-xl shadow-indigo-200 mb-6">S</div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Acceso Cloud</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Gestión en tiempo real con Supabase</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-xs font-bold flex items-center animate-shake">
              <i className="fas fa-exclamation-circle mr-3"></i>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
            <div className="relative">
              <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input
                type="email"
                required
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="ejemplo@system.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input
                type="password"
                required
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-6 font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:-translate-y-1 transition-all uppercase tracking-widest text-xs mt-4 disabled:opacity-50"
          >
            {isLoggingIn ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 text-center space-y-2">
          <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Servidor Online • Base de Datos Segura</p>
          <div className="pt-2">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em]">Desarrollado por</p>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">edax edu perú</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
