
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
  const [isAuthChecking, setIsAuthChecking] = useState(true); // Estado de carga inicial de sesión

  // Fetch data from Supabase
  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase no está configurado aún.");
      return;
    }

    setIsLoading(true);
    // 1️⃣ CARGA RÁPIDA: Datos esenciales para operar (Bloqueante)
    try {
      console.time("CoreData");
      const [
        { data: prodData },
        { data: promoData },
        { data: userData }
      ] = await Promise.all([
        supabase.from('productos').select('*'),
        supabase.from('promociones').select('*'),
        supabase.from('usuarios').select('*')
      ]);
      console.timeEnd("CoreData");

      if (prodData) {
        setProductos(prodData.map((d: any) => ({
          id: d.id,
          nombre: d.nombre,
          talla: d.talla,
          color: d.color,
          stock: d.stock,
          precioBase: d.precio_base,
          propietario: d.propietario,
          comisionValor: d.comision_valor,
          comisionTipo: d.comision_tipo
        })));
      }
      if (promoData) {
        setPromociones(promoData.map((d: any) => ({
          id: d.id,
          nombre: d.nombre,
          descripcion: d.descripcion,
          tipo: d.tipo,
          cantidadRequerida: d.cantidad_requerida,
          valorPromo: d.valor_promo,
          modelosAplicables: d.modelos_aplicables,
          propietarioId: d.propietario_id,
          estado: d.estado
        })));
      }
      if (userData) {
        setUsuarios(userData.map((d: any) => ({
          id: d.id,
          nombre: d.nombre,
          email: d.email,
          role: d.role,
          propietarioAsignado: d.propietario_asignado,
          fechaRegistro: d.fecha_registro,
          estado: d.estado
        })));
      }
    } catch (error) {
      console.error('Error fetching Core data:', error);
    } finally {
      // Liberamos la UI rápidamente
      setIsLoading(false);
    }

    // 2️⃣ CARGA SECUNDARIA: Historial y Pagos (Segundo plano, no bloquea UI)
    try {
      console.time("HistoryData");
      const [
        { data: movData },
        { data: pagoData }
      ] = await Promise.all([
        supabase.from('movimientos').select('*').order('fecha', { ascending: false }).limit(2000), // Limitamos para rendimiento
        supabase.from('pagos_comisiones').select('*')
      ]);
      console.timeEnd("HistoryData");

      if (movData) {
        setMovimientos(movData.map((d: any) => ({
          id: d.id,
          productoId: d.producto_id,
          tipo: d.tipo,
          cantidad: d.cantidad,
          precioVenta: d.precio_venta,
          comisionPagada: d.comision_pagada,
          estadoComision: d.estado_comision,
          vendedor: d.vendedor,
          ubicacion: d.ubicacion,
          fecha: d.fecha,
          comentario: d.comentario,
          propietarioId: d.propietario_id,
          estadoPago: d.estado_pago || 'Pendiente'
        })));
      }
      if (pagoData) setPagosComisiones(pagoData);
    } catch (error) {
      console.error('Error fetching History data:', error);
    }
  }, []);

  // Manejo de la sesión de Supabase
  useEffect(() => {
    let isCancelled = false;
    let isLoadingProfile = false;
    let isInitializing = true;

    // Función simplificada para cargar perfil con logging
    const loadProfile = async (email: string) => {
      if (!email || isCancelled) return false;

      if (isLoadingProfile) {
        console.log("⏸️ [Session] Carga ya en progreso, ignorando...");
        return false;
      }

      isLoadingProfile = true;
      console.log("🔍 [Session] Cargando perfil para:", email);

      try {
        const { data: profile, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (isCancelled) return false;

        if (error) {
          console.error("❌ [Session] Error en consulta:", error);
          return false;
        }

        if (!profile) {
          console.warn("⚠️ [Session] Usuario sin perfil en tabla 'usuarios':", email);
          return false;
        }

        console.log("✅ [Session] Perfil cargado exitosamente:", profile.nombre, profile.role);

        // Mapeo explícito de campos de la BD (snake_case) a la interfaz (camelCase)
        const mappedUser: Usuario = {
          id: profile.id,
          nombre: profile.nombre,
          email: profile.email,
          role: profile.role,
          propietarioAsignado: profile.propietario_asignado,
          fechaRegistro: profile.fecha_registro,
          estado: profile.estado
        };

        setCurrentUser(mappedUser);
        return true;
      } catch (err) {
        console.error("❌ [Session] Excepción:", err);
        return false;
      } finally {
        isLoadingProfile = false;
      }
    };


    // Verificar sesión actual al cargar
    const initSession = async () => {
      console.log("🚀 [Session] Verificando sesión inicial...");

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ [Session] Error obteniendo sesión:", error);
          setIsAuthChecking(false);
          return;
        }

        if (session?.user?.email) {
          console.log("📧 [Session] Sesión activa detectada:", session.user.email);
          const success = await loadProfile(session.user.email);

          if (success) {
            console.log("🚀 [Session] Perfil cargado, iniciando carga de datos...");
            fetchData(); // <--- Carga datos INMEDIATAMENTE, no esperar al useEffect
          }

          if (!success) {
            console.warn("⚠️ [Session] Perfil no encontrado, cerrando sesión...");
            await supabase.auth.signOut();
            setCurrentUser(null);
          }
        } else {
          console.log("ℹ️ [Session] No hay sesión activa");
        }
      } catch (err) {
        console.error("❌ [Session] Error fatal en initSession:", err);
      } finally {
        setIsAuthChecking(false);
        isInitializing = false;
        console.log("✅ [Session] Verificación completada");
      }
    };
    initSession();


    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isCancelled) return;

      if (isInitializing) {
        console.log("⏭️ [Session] Ignorando evento durante inicialización:", event);
        return;
      }

      console.log("🔄 [Session] Evento de autenticación:", event);

      if (event === 'SIGNED_IN' && session?.user?.email) {
        console.log("🔐 [Session] Usuario iniciando sesión:", session.user.email);
        const success = await loadProfile(session.user.email);
        if (success) fetchData();
      } else if (event === 'SIGNED_OUT') {
        console.log("👋 Sesión cerrada");
        setCurrentUser(null);
        setProductos([]);
        setView('dashboard');
      }
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
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
        producto_id: mov.productoId, // Mapping
        tipo: mov.tipo,
        cantidad: mov.cantidad,
        vendedor: mov.vendedor || currentUser?.nombre,
        comision_pagada: comisionCalculada, // Mapping
        estado_comision: mov.tipo === TipoMovimiento.VENTA ? 'Pendiente' : null, // Mapping
        ubicacion: mov.ubicacion,
        fecha: new Date().toISOString(),
        comentario: mov.comentario,
        propietario_id: product.propietario, // Mapping
        precio_venta: mov.precioVenta, // Mapping
        estado_pago: mov.estadoPago || 'Pendiente' // Mapping with default
      }])
      .select()
      .single();

    if (movError) {
      console.error('Error inserting movement:', movError);
      alert('Error guardando movimiento: ' + movError.message);
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
    // Mapear camelCase a snake_case para Supabase
    const dbProduct = {
      nombre: p.nombre,
      talla: p.talla,
      color: p.color,
      stock: p.stock,
      precio_base: p.precioBase, // Cambio clave
      propietario: p.propietario,
      comision_valor: p.comisionValor, // Cambio clave
      comision_tipo: p.comisionTipo // Cambio clave
    };

    const { data: newProd, error: prodError } = await supabase
      .from('productos')
      .insert([dbProduct])
      .select()
      .single();

    if (prodError) {
      console.error('Error adding product:', prodError);
      alert('Error al guardar en Supabase: ' + prodError.message);
      return;
    }

    // Convertir respuesta de vuelta a camelCase para el estado local
    const localProd: Producto = {
      id: newProd.id,
      nombre: newProd.nombre,
      talla: newProd.talla,
      color: newProd.color,
      stock: newProd.stock,
      precioBase: newProd.precio_base,
      propietario: newProd.propietario,
      comisionValor: newProd.comision_valor,
      comisionTipo: newProd.comision_tipo
    };

    // Si se registró con stock inicial mayor a 0, crear registro en historial DIRECTAMENTE
    // No usamos addMovement porque ese duplicaría el stock (ya que el producto nace con stock)
    if (localProd.stock > 0) {
      await supabase.from('movimientos').insert([{
        producto_id: localProd.id,
        tipo: TipoMovimiento.ENTRADA,
        cantidad: localProd.stock,
        vendedor: currentUser?.nombre || 'Sistema',
        fecha: new Date().toISOString(),
        comentario: 'Stock Inicial (Registro de Producto Nuevo)',
        ubicacion: Ubicacion.LIMA,
        propietario_id: localProd.propietario
      }]);
    }

    fetchData(); // Recargar todo para ver el nuevo producto y su historial
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

  const handleUpdateMovement = async (id: string, updates: Partial<Movimiento>) => {
    const dbUpdates: any = {};
    if (updates.estadoPago) dbUpdates.estado_pago = updates.estadoPago;

    const { error } = await supabase
      .from('movimientos')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating movement:', error);
      alert('Error al actualizar movimiento');
    } else {
      fetchData();
    }
  };

  const renderView = () => {
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <i className="fas fa-circle-notch fa-spin text-4xl text-indigo-500 mb-4"></i>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando con Supabase...</p>
      </div>
    );

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
        return <History movimientos={movimientos} productos={productos} role={currentUser!.role} currentUser={currentUser!} onUpdateMovement={handleUpdateMovement} />;
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
          onUpdateUser={async (userId, updates) => {
            try {
              const { error } = await supabase
                .from('usuarios')
                .update({
                  role: updates.role,
                  propietario_asignado: updates.propietarioAsignado
                })
                .eq('id', userId);

              if (error) {
                console.error('Error updating user:', error);
                alert('Error actualizando usuario: ' + error.message);
              } else {
                alert('✅ Rol actualizado correctamente');
                fetchData();
              }
            } catch (e: any) {
              console.error('Error:', e);
              alert('Error inesperado: ' + e.message);
            }
          }}
          onToggleStatus={async (userId, newStatus) => {
            try {
              const { error } = await supabase
                .from('usuarios')
                .update({ estado: newStatus })
                .eq('id', userId);

              if (error) {
                console.error('Error toggling status:', error);
                alert('Error cambiando estado: ' + error.message);
              } else {
                alert(`✅ Cuenta ${newStatus === 'Activo' ? 'activada' : 'desactivada'} correctamente`);
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

  // If we are checking session, show loading (white screen or spinner)
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login usuarios={usuarios} onLogin={setCurrentUser} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-['Inter'] text-slate-600">
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

