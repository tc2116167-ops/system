import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getInitialUrl = () => {
  if (import.meta.env.VITE_SUPABASE_URL) {
    return import.meta.env.VITE_SUPABASE_URL;
  }
  return localStorage.getItem('sys_sb_url') || '';
};

const getInitialKey = () => {
  if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
  return localStorage.getItem('sys_sb_key') || '';
};

// Configuración explícita de autenticación con persistencia
const createSupabaseClientWithConfig = (url: string, anonKey: string): SupabaseClient => {
  console.log("🔧 [Supabase] Inicializando con persistencia localStorage");

  return createClient(url, anonKey, {
    auth: {
      storage: window.localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  });
};

// Instancia inicial del cliente con configuración de auth
export let supabase = createSupabaseClientWithConfig(getInitialUrl(), getInitialKey());

export const updateSupabaseConfig = (url: string, key: string) => {
  console.log("🔄 [Supabase] Actualizando configuración");
  localStorage.setItem('sys_sb_url', url);
  localStorage.setItem('sys_sb_key', key);
  // Re-instanciar el cliente con las nuevas credenciales
  supabase = createSupabaseClientWithConfig(url, key);
};

export const isSupabaseConfigured = () => {
  const url = getInitialUrl();
  const key = getInitialKey();
  return url.length > 0 && key.length > 0;
};
