
import React, { useState, useEffect, useCallback } from 'react';
import {
  Producto,
  Movimiento,
  Talla,
  Ubicacion,
  TipoMovimiento,
  Propietario,
  UserRole,
  View,
  Usuario,
  Promocion,
  PagoComision
} from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import SalesRegistry from './components/SalesRegistry';
import History from './components/History';
import UserManagement from './components/UserManagement';
import Promotions from './components/Promotions';
import CommissionManagement from './components/CommissionManagement';
import Login from './components/Login';
import Settings from './components/Settings';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pagosComisiones, setPagosComisiones] = useState<PagoComision[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase no está configurado aún.");
      return;
    }

    setIsLoading(true);
    try {
      const [
        { data: prodData },
        { data: promoData },
        { data: movData },
        { data: userData },
        { data: pagoData }
      ] = await Promise.all([
        supabase.from('productos').select('*'),
        supabase.from('promociones').select('*'),
        supabase.from('movimientos').select('*').order('fecha', { ascending: false }),
        supabase.from('usuarios').select('*'),
        supabase.from('pagos_comisiones').select('*')
      ]);

      if (prodData) setProductos(prodData);
      if (promoData) setPromociones(promoData);
      if (movData) setMovimientos(movData);
      if (userData) setUsuarios(userData);
      if (pagoData) setPagosComisiones(pagoData);
    } catch (error) {
      console.error('Error fetching Supabase data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manejo de la sesión de Supabase
  useEffect(() => {
    // 1. Función para cargar perfil dado un usuario de Auth
    const loadProfile = async (email: string) => {
      if (!email) return;
      try {
        const { data: profile } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', email)
          .single();

        if (profile) {
          setCurrentUser(profile);
        } else {
          // Si no existe perfil para el usuario autenticado, logout
          await supabase.auth.signOut();
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };

    // 2. Verificar sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        loadProfile(session.user.email);
      }
    });

    // 3. Escuchar cambios en la autenticación (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.email) {
        // Solo cargamos si el usuario actual es diferente o nulo
        if (!currentUser || currentUser.email !== session.user.email) {
          await loadProfile(session.user.email);
        }
      } else {
        setCurrentUser(null);
        setView('dashboard'); // Reset view on logout
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  // Redirección inicial basada en el rol
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === UserRole.SELLER) {
        setView('sales');
      } else {
        setView('dashboard');
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addMovement = async (mov: Omit<Movimiento, 'id' | 'fecha'>) => {
    const product = productos.find(p => p.id === mov.productoId);
    if (!product) return;

    let comisionCalculada = 0;
    if (mov.tipo === TipoMovimiento.VENTA && mov.precioVenta) {
      if (product.comisionTipo === 'monto') {
        comisionCalculada = product.comisionValor * mov.cantidad;
      } else {
        comisionCalculada = (mov.precioVenta * mov.cantidad) * (product.comisionValor / 100);
      }
    }

    const { data: newMov, error: movError } = await supabase
      .from('movimientos')
      .insert([{
        ...mov,
        fecha: new Date().toISOString(),
        propietarioId: product.propietario,
        vendedor: mov.vendedor || currentUser?.nombre,
        comisionPagada: comisionCalculada,
        estadoComision: mov.tipo === TipoMovimiento.VENTA ? 'Pendiente' : null
      }])
      .select()
      .single();

    if (movError) {
      console.error('Error inserting movement:', movError);
      return;
    }

    // Actualizar stock local y en DB
    let newStock = product.stock;
    if (mov.tipo === TipoMovimiento.ENTRADA) newStock += mov.cantidad;
    if (mov.tipo === TipoMovimiento.SALIDA || mov.tipo === TipoMovimiento.VENTA) newStock -= mov.cantidad;

    const { error: stockError } = await supabase
      .from('productos')
      .update({ stock: newStock })
      .eq('id', product.id);

    if (stockError) console.error('Error updating stock:', stockError);

    // Refresh local state
    fetchData();
  };

  const handleAddNewProduct = async (p: Omit<Producto, 'id'>) => {
    const { data: newProd, error: prodError } = await supabase
      .from('productos')
      .insert([p])
      .select()
      .single();

    if (prodError) {
      console.error('Error adding product:', prodError);
      return;
    }

    if (p.stock > 0) {
      await addMovement({
        productoId: newProd.id,
        tipo: TipoMovimiento.ENTRADA,
        cantidad: p.stock,
        vendedor: currentUser?.nombre || 'Sistema',
        comentario: 'Registro inicial de nueva prenda en stock'
      });
    } else {
      fetchData();
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabase.from('productos').delete().eq('id', productId);
    if (error) console.error('Error deleting product:', error);
    else fetchData();
  };

  const handlePayCommissions = async (vendedor: string, monto: number) => {
    // 1. Marcar movimientos como pagados
    await supabase
      .from('movimientos')
      .update({ estadoComision: 'Pagado' })
      .eq('vendedor', vendedor)
      .eq('estadoComision', 'Pendiente');

    // 2. Registrar el pago
    await supabase
      .from('pagos_comisiones')
      .insert([{
        vendedor,
        monto,
        fecha: new Date().toISOString(),
        periodo: new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
      }]);

    fetchData();
  };

  const renderView = () => {
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <i className="fas fa-circle-notch fa-spin text-4xl text-indigo-500 mb-4"></i>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando con Supabase...</p>
      </div>
    );

    if (view === 'settings') return <Settings onConfigUpdated={fetchData} />;

    // Si no hay configuración, mostrar advertencia si no estamos en login
    if (!isSupabaseConfigured() && currentUser) {
      return (
        <div className="bg-amber-50 border-2 border-amber-200 p-12 rounded-[3rem] text-center max-w-xl mx-auto mt-10">
          <i className="fas fa-plug-circle-exclamation text-5xl text-amber-500 mb-6"></i>
          <h2 className="text-xl font-black text-amber-900 uppercase mb-4">Base de Datos No Conectada</h2>
          <p className="text-amber-700 font-bold text-xs uppercase mb-8 leading-relaxed">
            Para que el sistema funcione, debes configurar tu URL y Key de Supabase en el módulo de Configuración.
          </p>
          {currentUser.role === UserRole.ADMIN ? (
            <button
              onClick={() => setView('settings')}
              className="px-10 py-4 bg-amber-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-xl hover:bg-amber-700 transition-all"
            >
              Ir a Configuración ahora
            </button>
          ) : (
            <p className="text-amber-500 font-black text-[9px] uppercase italic">Contacta al administrador para vincular la base de datos.</p>
          )}
        </div>
      );
    }

    switch (view) {
      case 'dashboard':
        return <Dashboard productos={productos} movimientos={movimientos} role={currentUser!.role} />;
      case 'inventory':
        return <Inventory productos={productos} onAddProduct={handleAddNewProduct} onAddMovement={addMovement} onDeleteProduct={handleDeleteProduct} role={currentUser!.role} currentUser={currentUser!} />;
      case 'sales':
        return <SalesRegistry productos={productos} promociones={promociones} onRegisterSale={addMovement} role={currentUser!.role} currentUser={currentUser!} />;
      case 'promotions':
        return <Promotions promociones={promociones} productos={productos} onAddPromo={async (p) => { await supabase.from('promociones').insert([p]); fetchData(); }} onDeletePromo={async (id) => { await supabase.from('promociones').delete().eq('id', id); fetchData(); }} role={currentUser!.role} currentUser={currentUser!} />;
      case 'commissions':
        return <CommissionManagement movimientos={movimientos} pagos={pagosComisiones} onPay={handlePayCommissions} role={currentUser!.role} currentUser={currentUser!} />;
      case 'history':
        return <History movimientos={movimientos} productos={productos} role={currentUser!.role} currentUser={currentUser!} />;
      case 'users':
        return <UserManagement
          usuarios={usuarios}
          onAddUser={async (u) => {
            try {
              // Llamar a la función RPC de postgres "create_new_user"
              const { data, error } = await supabase.rpc('create_new_user', {
                email: u.email,
                password: u.password,
                user_metadata: {
                  nombre: u.nombre,
                  propietario_asignado: u.propietarioAsignado || null
                },
                role_name: u.role
              });

              if (error) {
                console.error('Error creating user:', error);
                alert('Error creando usuario: ' + error.message);
              } else {
                alert('Usuario creado correctamente');
                fetchData();
              }
            } catch (e: any) {
              console.error('Error:', e);
              alert('Error inesperado: ' + e.message);
            }
          }}
        />;
      default:
        return <Dashboard productos={productos} movimientos={movimientos} role={currentUser!.role} />;
    }
  };

  if (!currentUser) return <Login onLogin={setCurrentUser} usuarios={usuarios} />;

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
      <Sidebar
        currentView={view}
        setView={setView}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        role={currentUser.role}
        onLogout={() => setCurrentUser(null)}
        userName={currentUser.nombre}
      />

      <main className={`flex-1 transition-all duration-300 ease-in-out w-full min-w-0 ${isSidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl px-4 md:px-8 py-5 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-3 text-slate-600 hover:bg-slate-100 rounded-2xl shadow-sm border border-slate-200 transition-all active:scale-95"
              >
                <i className={`fas ${isSidebarOpen ? 'fa-indent' : 'fa-bars-staggered'} text-xl`}></i>
              </button>
              <div className="hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1 opacity-70">Cloud Sync Active</p>
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{view}</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{currentUser.role}</span>
                <span className="text-sm font-black text-slate-800">{currentUser.nombre}</span>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-100">
                {currentUser.nombre.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-10 animate-fade-in max-w-[1600px] mx-auto min-h-[calc(100vh-80px)]">
          {renderView()}
        </div>

        <footer className="p-8 text-center border-t border-slate-100 mt-20">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">SYSTEM v3.1 • Configuración Dinámica Supabase</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
