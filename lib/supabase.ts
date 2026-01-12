
import { createClient } from '@supabase/supabase-js';

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

// Instancia inicial del cliente
export let supabase = createClient(getInitialUrl(), getInitialKey());

export const updateSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('sys_sb_url', url);
  localStorage.setItem('sys_sb_key', key);
  // Re-instanciar el cliente con las nuevas credenciales en tiempo de ejecución
  supabase = createClient(url, key);
};

export const isSupabaseConfigured = () => {
  const url = getInitialUrl();
  const key = getInitialKey();
  return url.length > 0 && key.length > 0;
};
