
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Producto, Ubicacion, TipoMovimiento, UserRole, Usuario, Movimiento, Promocion } from '../types';

interface SalesRegistryProps {
  productos: Producto[];
  promociones: Promocion[];
  onRegisterSale: (m: Omit<Movimiento, 'id' | 'fecha'>) => void;
  role: UserRole;
  currentUser: Usuario;
}

interface CartItem {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
}

const DISTRITOS_LIMA = [
  // ZONA NORTE
  { nombre: 'Independencia', costo: 10, zona: 'Norte' },
  { nombre: 'SMP I', costo: 10, zona: 'Norte' },
  { nombre: 'SMP II (Canta Callao)', costo: 11, zona: 'Norte' },
  { nombre: 'Los Olivos', costo: 10, zona: 'Norte' },
  { nombre: 'Comas', costo: 10, zona: 'Norte' },
  { nombre: 'Puente Piedra', costo: 13, zona: 'Norte' },
  { nombre: 'Carabayllo', costo: 13, zona: 'Norte' },
  // ZONA CENTRO
  { nombre: 'Cercado', costo: 10, zona: 'Centro' },
  { nombre: 'Breña', costo: 10, zona: 'Centro' },
  { nombre: 'La Victoria', costo: 10, zona: 'Centro' },
  { nombre: 'Rimac', costo: 10, zona: 'Centro' },
  { nombre: 'Lince', costo: 10, zona: 'Centro' },
  { nombre: 'Jesus Maria', costo: 10, zona: 'Centro' },
  { nombre: 'Pueblo Libre', costo: 10, zona: 'Centro' },
  { nombre: 'Magdalena', costo: 10, zona: 'Centro' },
  { nombre: 'San Miguel', costo: 10, zona: 'Centro' },
  { nombre: 'San Isidro', costo: 10, zona: 'Centro' },
  { nombre: 'Miraflores', costo: 10, zona: 'Centro' },
  { nombre: 'Surquillo', costo: 10, zona: 'Centro' },
  { nombre: 'San Borja', costo: 10, zona: 'Centro' },
  // ZONA SUR
  { nombre: 'Surco', costo: 10, zona: 'Sur' },
  { nombre: 'Barranco', costo: 10, zona: 'Sur' },
  { nombre: 'Chorrillos', costo: 13, zona: 'Sur' },
  { nombre: 'SJM', costo: 13, zona: 'Sur' },
  { nombre: 'VES', costo: 13, zona: 'Sur' },
  { nombre: 'VMT', costo: 13, zona: 'Sur' },
  // ZONA PROV. CALLAO
  { nombre: 'Bellavista', costo: 10, zona: 'Callao' },
  { nombre: 'Carmen de la Legua', costo: 10, zona: 'Callao' },
  { nombre: 'La Perla', costo: 10, zona: 'Callao' },
  { nombre: 'Callao Oeste', costo: 10, zona: 'Callao' },
  { nombre: 'Callao Norte', costo: 10, zona: 'Callao' },
  { nombre: 'La Punta', costo: 13, zona: 'Callao' },
  { nombre: 'Ventanilla', costo: 13, zona: 'Callao' },
  // ZONA ESTE
  { nombre: 'El Agustino', costo: 12, zona: 'Este' },
  { nombre: 'San Luis', costo: 10, zona: 'Este' },
  { nombre: 'Santa Anita', costo: 10, zona: 'Este' },
  { nombre: 'SJL I', costo: 10, zona: 'Este' },
  { nombre: 'SJL II', costo: 13, zona: 'Este' },
  { nombre: 'La Molina', costo: 13, zona: 'Este' },
  { nombre: 'Ate Salamanca', costo: 10, zona: 'Este' },
  { nombre: 'Ate Vitarte', costo: 13, zona: 'Este' },
  { nombre: 'Ate Santa Clara', costo: 20, zona: 'Este' },
];

const AGENCIAS_PROVINCIA = ['Shalom', 'Olva', 'Flores', 'Marvisur', 'Otro'];

const SalesRegistry: React.FC<SalesRegistryProps> = ({ productos, promociones, onRegisterSale, role, currentUser }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ubicacion, setUbicacion] = useState<Ubicacion>(Ubicacion.LIMA);
  const [comentario, setComentario] = useState('');

  // Estado para éxito y envío WhatsApp
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const [whatsappNumber, setWhatsappNumber] = useState(localStorage.getItem('sys_last_wa') || '');
  const [rememberWA, setRememberWA] = useState(!!localStorage.getItem('sys_last_wa'));

  // Datos comunes cliente
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteTelefono, setClienteTelefono] = useState('');

  // Datos de cliente para Lima
  const [distritoSeleccionado, setDistritoSeleccionado] = useState('');
  const [direccionLima, setDireccionLima] = useState('');
  const [costoDelivery, setCostoDelivery] = useState(0);

  // Datos para Provincia
  const [agenciaProvincia, setAgenciaProvincia] = useState('Shalom');
  const [agenciaOtro, setAgenciaOtro] = useState('');
  const [clienteDni, setClienteDni] = useState('');
  const [destinoProvincia, setDestinoProvincia] = useState('');
  const [estadoPagoEnvio, setEstadoPagoEnvio] = useState('Pago Completo');

  const [totalAjustado, setTotalAjustado] = useState<number | null>(null);
  const [promoAplicadaId, setPromoAplicadaId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return productos.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.color.toLowerCase().includes(q) ||
      p.propietario.toLowerCase().includes(q)
    );
  }, [productos, searchQuery]);

  const activePromosSugeridas = useMemo(() => {
    return promociones.filter(promo => {
      if (promo.estado !== 'Activa') return false;
      const itemsQueCalifican = cart.filter(item =>
        promo.modelosAplicables.includes(item.producto.nombre)
      );
      const cantidadTotalEnCarrito = itemsQueCalifican.reduce((acc, item) => acc + item.cantidad, 0);
      return cantidadTotalEnCarrito >= promo.cantidadRequerida;
    });
  }, [cart, promociones]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addToCart = (p: Producto) => {
    setCart(prev => {
      const existing = prev.find(item => item.producto.id === p.id);
      if (existing) {
        return prev.map(item => item.producto.id === p.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { producto: p, cantidad: 1, precioUnitario: p.precioBase }];
    });
    setSearchQuery('');
    setIsDropdownOpen(false);
    resetAjustes();
  };

  const resetAjustes = () => {
    setTotalAjustado(null);
    setPromoAplicadaId(null);
  };

  const applyPromo = (promo: Promocion) => {
    setTotalAjustado(promo.valorPromo);
    setPromoAplicadaId(promo.id);
    setComentario(`Promo Aplicada: ${promo.nombre}`);
  };

  const handleDistritoChange = (nombre: string) => {
    const dist = DISTRITOS_LIMA.find(d => d.nombre === nombre);
    setDistritoSeleccionado(nombre);
    setCostoDelivery(dist ? dist.costo : 0);
  };

  const subtotalSugerido = cart.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
  const totalBase = totalAjustado !== null ? totalAjustado : subtotalSugerido;
  const totalFinal = totalBase + (ubicacion === Ubicacion.LIMA ? costoDelivery : 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (ubicacion === Ubicacion.LIMA && (!clienteNombre || !distritoSeleccionado)) {
      alert("Para envíos en Lima, completa el nombre del cliente y selecciona un distrito.");
      return;
    }

    if (ubicacion === Ubicacion.PROVINCIA && (!clienteNombre || !destinoProvincia || (agenciaProvincia === 'Otro' && !agenciaOtro))) {
      alert("Para envíos a Provincia, completa el nombre del cliente, destino y agencia.");
      return;
    }

    const factorAjuste = totalAjustado !== null ? totalAjustado / subtotalSugerido : 1;

    // Almacenar datos para el resumen de éxito
    const dataForWA = {
      cliente: clienteNombre,
      dni: clienteDni,
      tel: clienteTelefono,
      ubicacion: ubicacion,
      distrito: distritoSeleccionado,
      direccion: direccionLima,
      agencia: agenciaProvincia === 'Otro' ? agenciaOtro : agenciaProvincia,
      destino: destinoProvincia,
      pago: estadoPagoEnvio,
      items: [...cart],
      delivery: costoDelivery,
      total: totalFinal,
      comentario: comentario
    };

    setLastSaleData(dataForWA);

    let estadoPagoMapped: 'Pendiente' | 'Pagado' | 'Adelanto' = 'Pendiente';
    if (estadoPagoEnvio === 'Pago Completo') estadoPagoMapped = 'Pagado';
    else if (estadoPagoEnvio.includes('Adelanto')) estadoPagoMapped = 'Adelanto';

    // Registrar cada producto en el historial
    cart.forEach(item => {
      onRegisterSale({
        productoId: item.producto.id,
        cantidad: item.cantidad,
        precioVenta: Number((item.precioUnitario * factorAjuste).toFixed(2)),
        tipo: TipoMovimiento.VENTA,
        vendedor: currentUser.nombre,
        ubicacion: ubicacion,
        comentario: comentario, // El historial detallado se maneja en el reporte de WA
        estadoPago: estadoPagoMapped
      });
    });

    setShowSuccess(true);
  };

  const resetForm = () => {
    setCart([]);
    resetAjustes();
    setComentario('');
    setClienteNombre('');
    setClienteTelefono('');
    setDistritoSeleccionado('');
    setDireccionLima('');
    setCostoDelivery(0);
    setClienteDni('');
    setDestinoProvincia('');
    setAgenciaOtro('');
    setShowSuccess(false);
    setLastSaleData(null);
  };

  const sendToWhatsApp = () => {
    if (!whatsappNumber) return alert("Por favor, ingresa un número de WhatsApp.");
    if (rememberWA) {
      localStorage.setItem('sys_last_wa', whatsappNumber);
    } else {
      localStorage.removeItem('sys_last_wa');
    }

    const data = lastSaleData;
    let message = `*NUEVO PEDIDO - SYSTEM*\n`;
    message += `----------------------------\n`;
    message += `*CLIENTE:* ${data.cliente.toUpperCase()}\n`;
    if (data.tel) message += `*TEL:* ${data.tel}\n`;
    if (data.dni) message += `*DNI:* ${data.dni}\n`;

    if (data.ubicacion === Ubicacion.LIMA) {
      message += `*DESTINO:* ${data.distrito.toUpperCase()} (LIMA)\n`;
      if (data.direccion) message += `*DIRECCIÓN:* ${data.direccion}\n`;
    } else {
      message += `*AGENCIA:* ${data.agencia.toUpperCase()}\n`;
      message += `*DESTINO:* ${data.destino.toUpperCase()}\n`;
      message += `*ESTADO PAGO:* ${data.pago.toUpperCase()}\n`;
    }

    message += `----------------------------\n`;
    message += `*PEDIDO:*\n`;
    data.items.forEach((item: CartItem) => {
      message += `- ${item.cantidad}x ${item.producto.nombre} (${item.producto.color} - ${item.producto.talla})\n`;
    });

    message += `----------------------------\n`;
    if (data.comentario) message += `*OBS:* ${data.comentario}\n`;
    if (data.delivery > 0) message += `*DELIVERY:* S/ ${data.delivery}.00\n`;
    message += `*TOTAL A COBRAR: S/ ${data.total.toFixed(2)}*\n`;
    message += `----------------------------\n`;
    message += `Vendedor: ${currentUser.nombre}`;

    const encoded = encodeURIComponent(message);
    const cleanNumber = whatsappNumber.replace(/\D/g, '');
    window.open(`https://wa.me/51${cleanNumber}?text=${encoded}`, '_blank');
  };

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-12 text-center">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center text-4xl mx-auto mb-8 animate-bounce">
            <i className="fas fa-check-double"></i>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-3">¡Venta Registrada!</h2>
          <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.3em] mb-12">El stock ha sido actualizado correctamente</p>

          <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-10 border border-slate-100 text-left">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center">
              <i className="fab fa-whatsapp mr-2 text-emerald-500 text-sm"></i> Enviar pedido por WhatsApp
            </h4>

            <div className="space-y-6">
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Número de WhatsApp Destino</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">+51</span>
                  <input
                    type="tel"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-5 pl-14 pr-6 font-black text-lg text-slate-800 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                    placeholder="999 999 999"
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 ml-1">
                <button
                  type="button"
                  onClick={() => setRememberWA(!rememberWA)}
                  className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${rememberWA ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'}`}
                >
                  {rememberWA && <i className="fas fa-check text-[10px]"></i>}
                </button>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer" onClick={() => setRememberWA(!rememberWA)}>Recordar este número</span>
              </div>

              <button
                onClick={sendToWhatsApp}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-6 rounded-2xl shadow-xl shadow-emerald-100 transition-all uppercase tracking-[0.3em] text-[11px] flex items-center justify-center"
              >
                <i className="fab fa-whatsapp mr-3 text-lg"></i> Enviar Pedido al WhatsApp
              </button>
            </div>
          </div>

          <button
            onClick={resetForm}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-6 rounded-2xl transition-all uppercase tracking-[0.3em] text-[11px]"
          >
            Realizar Nueva Venta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
        {/* ENCABEZADO CON BUSCADOR */}
        <div className="bg-indigo-600 p-8 md:p-12 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase">Terminal de Ventas</h2>
              <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 opacity-70">Sistema SYS</p>
            </div>

            <div className="relative flex-1 max-w-xl" ref={dropdownRef}>
              <div className="relative group">
                <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-indigo-300"></i>
                <input
                  type="text"
                  className="w-full bg-indigo-500/30 border-2 border-indigo-400/30 rounded-2xl py-5 pl-14 pr-6 font-bold text-white placeholder:text-indigo-200 focus:outline-none focus:bg-indigo-500/50 focus:border-white transition-all text-sm"
                  placeholder="Escribe el modelo o tono de la prenda..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                  onFocus={() => setIsDropdownOpen(true)}
                />
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-3 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                  {filteredProducts.map(p => (
                    <button key={p.id} type="button" onClick={() => addToCart(p)} className="w-full text-left p-4 hover:bg-indigo-50 rounded-2xl transition-all flex justify-between items-center group border-b border-slate-50 last:border-0">
                      <div className="min-w-0 pr-4 text-slate-800">
                        <p className="font-black text-sm uppercase truncate">{p.nombre}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{p.color} • Talla {p.talla}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-indigo-600 font-black text-xs">S/ {p.precioBase}</span>
                        <span className={`text-[9px] font-black uppercase ${p.stock < 5 ? 'text-rose-500' : 'text-emerald-500'}`}>Stock: {p.stock}</span>
                      </div>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && <div className="p-10 text-center text-slate-400 font-bold text-xs italic">No se encontraron resultados</div>}
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* SELECCIÓN DE UBICACIÓN PRINCIPAL (ARRIBA) */}
          <div className="px-8 md:px-12 pt-10">
            <div className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <i className="fas fa-map-location-dot text-xl"></i>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Ubicación de Venta</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Define el punto de destino principal</p>
                </div>
              </div>

              <div className="flex bg-white p-2 rounded-2xl border border-slate-200 w-full md:w-auto shadow-inner">
                {Object.values(Ubicacion).map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => { setUbicacion(u); if (u !== Ubicacion.LIMA) setCostoDelivery(0); }}
                    className={`flex-1 md:w-40 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${ubicacion === u ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
                  >
                    <i className={`fas ${u === Ubicacion.LIMA ? 'fa-city' : 'fa-truck-ramp-box'} mr-2`}></i>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                {/* CARRITO */}
                <div>
                  <div className="flex justify-between items-end mb-5 px-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Contenido del Carrito ({cart.length})</h3>
                    {cart.length > 0 && <button type="button" onClick={() => { setCart([]); resetAjustes(); }} className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Vaciar Carrito</button>}
                  </div>

                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.producto.id} className="bg-white rounded-3xl p-6 flex items-center justify-between border border-slate-100 hover:border-indigo-100 transition-all shadow-sm">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-slate-100 shrink-0"><i className="fas fa-tshirt text-lg"></i></div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 text-sm uppercase leading-none mb-1 truncate">{item.producto.nombre}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{item.producto.color} • Talla {item.producto.talla}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-200 p-1">
                            <button type="button" onClick={() => { setCart(prev => prev.map(i => i.producto.id === item.producto.id ? { ...i, cantidad: Math.max(1, i.cantidad - 1) } : i)); resetAjustes(); }} className="w-9 h-9 rounded-xl hover:bg-white text-slate-400 shadow-sm transition-all">-</button>
                            <span className="w-10 text-center font-black text-slate-800 text-sm">{item.cantidad}</span>
                            <button type="button" onClick={() => { setCart(prev => prev.map(i => i.producto.id === item.producto.id ? { ...i, cantidad: i.cantidad + 1 } : i)); resetAjustes(); }} className="w-9 h-9 rounded-xl hover:bg-white text-slate-400 shadow-sm transition-all">+</button>
                          </div>
                          <div className="text-right w-24 hidden sm:block">
                            <p className="font-black text-slate-800 text-sm">S/ {(item.precioUnitario * item.cantidad).toFixed(2)}</p>
                          </div>
                          <button type="button" onClick={() => { setCart(prev => prev.filter(i => i.producto.id !== item.producto.id)); resetAjustes(); }} className="text-slate-200 hover:text-rose-500 transition-all p-2"><i className="fas fa-times-circle text-xl"></i></button>
                        </div>
                      </div>
                    ))}
                    {cart.length === 0 && (
                      <div className="h-64 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 bg-slate-50/30">
                        <i className="fas fa-shopping-basket text-6xl mb-5 opacity-10"></i>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Selecciona productos arriba</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* DATOS DE ENVÍO LIMA (DINÁMICO) */}
                {ubicacion === Ubicacion.LIMA && (
                  <div className="bg-indigo-50/40 p-10 rounded-[3.5rem] border border-indigo-100/50 animate-fade-in space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-sm shadow-lg shadow-indigo-100">
                        <i className="fas fa-truck-fast"></i>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">Guía de Despacho Local</h4>
                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Completa los datos para el Courier Nel</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nombre Completo del Cliente *</label>
                        <input
                          type="text"
                          className="w-full p-5 rounded-[1.5rem] bg-white border border-indigo-100 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-xs shadow-sm transition-all"
                          placeholder="Ej: Sofia Mendoza"
                          value={clienteNombre}
                          onChange={e => setClienteNombre(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Teléfono de Contacto</label>
                        <input
                          type="tel"
                          className="w-full p-5 rounded-[1.5rem] bg-white border border-indigo-100 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-xs shadow-sm transition-all"
                          placeholder="999 999 999"
                          value={clienteTelefono}
                          onChange={e => setClienteTelefono(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Distrito de Destino (Lima Metropolitana) *</label>
                      <div className="relative">
                        <select
                          className="w-full p-5 rounded-[1.5rem] bg-white border border-indigo-100 outline-none focus:ring-4 focus:ring-indigo-500/10 font-black text-xs appearance-none shadow-sm transition-all pr-12"
                          value={distritoSeleccionado}
                          onChange={e => handleDistritoChange(e.target.value)}
                        >
                          <option value="">-- Elige un distrito del tarifario --</option>
                          {DISTRITOS_LIMA.map(d => (
                            <option key={d.nombre} value={d.nombre}>{d.nombre.toUpperCase()} (S/ {d.costo}.00)</option>
                          ))}
                        </select>
                        <i className="fas fa-location-dot absolute right-6 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none opacity-50"></i>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Dirección Exacta de Entrega</label>
                      <textarea
                        className="w-full p-5 rounded-[1.5rem] bg-white border border-indigo-100 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-xs shadow-sm transition-all resize-none h-24"
                        placeholder="Ej: Av. Principal 123 - Ref: Frente al parque"
                        value={direccionLima}
                        onChange={e => setDireccionLima(e.target.value)}
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Estado de Pago del Pedido *</label>
                      <div className="flex flex-wrap gap-4 bg-white p-2 rounded-[2rem] border border-indigo-100 shadow-inner">
                        {['Pago Completo', 'Adelanto S/ 30', 'Pago Pendiente'].map(estado => (
                          <button
                            key={estado}
                            type="button"
                            onClick={() => setEstadoPagoEnvio(estado)}
                            className={`flex-1 min-w-[120px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${estadoPagoEnvio === estado ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                          >
                            {estado}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* DATOS DE ENVÍO PROVINCIA (DINÁMICO) */}
                {ubicacion === Ubicacion.PROVINCIA && (
                  <div className="bg-amber-50/40 p-10 rounded-[3.5rem] border border-amber-100/50 animate-fade-in space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white text-sm shadow-lg shadow-amber-100">
                        <i className="fas fa-truck-ramp-box"></i>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest leading-none mb-1">Guía de Envío Nacional</h4>
                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Despacho a través de agencias</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Agencia *</label>
                        <select
                          className="w-full p-5 rounded-[1.5rem] bg-white border border-amber-100 outline-none focus:ring-4 focus:ring-amber-500/10 font-black text-xs appearance-none shadow-sm transition-all"
                          value={agenciaProvincia}
                          onChange={e => setAgenciaProvincia(e.target.value)}
                        >
                          {AGENCIAS_PROVINCIA.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </div>
                      {agenciaProvincia === 'Otro' && (
                        <div className="lg:col-span-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nombre de Agencia *</label>
                          <input
                            type="text"
                            className="w-full p-5 rounded-[1.5rem] bg-white border border-amber-100 outline-none focus:ring-4 focus:ring-amber-500/10 font-bold text-xs shadow-sm transition-all"
                            placeholder="Especifica la agencia"
                            value={agenciaOtro}
                            onChange={e => setAgenciaOtro(e.target.value)}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Nombre Completo del Cliente *</label>
                        <input
                          type="text"
                          className="w-full p-5 rounded-[1.5rem] bg-white border border-amber-100 outline-none focus:ring-4 focus:ring-amber-500/10 font-bold text-xs shadow-sm transition-all"
                          placeholder="Ej: Sofia Mendoza"
                          value={clienteNombre}
                          onChange={e => setClienteNombre(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Número DNI</label>
                        <input
                          type="text"
                          className="w-full p-5 rounded-[1.5rem] bg-white border border-amber-100 outline-none focus:ring-4 focus:ring-amber-500/10 font-bold text-xs shadow-sm transition-all"
                          placeholder="8 dígitos"
                          value={clienteDni}
                          onChange={e => setClienteDni(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Teléfono</label>
                        <input
                          type="tel"
                          className="w-full p-5 rounded-[1.5rem] bg-white border border-amber-100 outline-none focus:ring-4 focus:ring-amber-500/10 font-bold text-xs shadow-sm transition-all"
                          placeholder="999 999 999"
                          value={clienteTelefono}
                          onChange={e => setClienteTelefono(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Destino (Ciudad / Agencia) *</label>
                        <input
                          type="text"
                          className="w-full p-5 rounded-[1.5rem] bg-white border border-amber-100 outline-none focus:ring-4 focus:ring-amber-500/10 font-bold text-xs shadow-sm transition-all"
                          placeholder="Ej: Trujillo Centro"
                          value={destinoProvincia}
                          onChange={e => setDestinoProvincia(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Estado de Pago del Pedido *</label>
                      <div className="flex flex-wrap gap-4 bg-white p-2 rounded-[2rem] border border-amber-100 shadow-inner">
                        {['Pago Completo', 'Adelanto S/ 30', 'Pago Pendiente'].map(estado => (
                          <button
                            key={estado}
                            type="button"
                            onClick={() => setEstadoPagoEnvio(estado)}
                            className={`flex-1 min-w-[120px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${estadoPagoEnvio === estado ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                          >
                            {estado}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* OBSERVACIONES GENERALES */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 ml-2">Notas y Observaciones de la Venta</label>
                  <textarea
                    className="w-full p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold text-slate-600 text-xs resize-none h-40 shadow-inner"
                    placeholder="Escribe aquí detalles adicionales (ej: horario de entrega, referencia de casa, etc.)"
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                  ></textarea>
                </div>

                {activePromosSugeridas.length > 0 && (
                  <div className="mt-10 animate-fade-in">
                    <h4 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-5 ml-2 flex items-center">
                      <i className="fas fa-wand-magic-sparkles mr-3"></i> Promociones sugeridas para este carrito
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {activePromosSugeridas.map(promo => (
                        <button
                          key={promo.id}
                          type="button"
                          onClick={() => applyPromo(promo)}
                          className={`p-6 rounded-[2.5rem] border-2 transition-all flex items-center justify-between group shadow-sm ${promoAplicadaId === promo.id ? 'bg-indigo-600 border-indigo-600 text-white scale-[1.02] shadow-xl shadow-indigo-100' : 'bg-white border-indigo-50 text-indigo-600 hover:border-indigo-200'}`}
                        >
                          <div className="text-left">
                            <p className="text-[12px] font-black uppercase leading-none mb-1">{promo.nombre}</p>
                            <p className={`text-[10px] font-bold ${promoAplicadaId === promo.id ? 'text-indigo-200' : 'text-slate-400'}`}>Toca para aplicar precio combo</p>
                          </div>
                          <div className={`text-lg font-black ${promoAplicadaId === promo.id ? 'text-white' : 'text-indigo-600'}`}>S/ {promo.valorPromo}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RESUMEN DE PAGO (DERECHA) */}
              <div className="space-y-8 bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl h-fit sticky top-28 text-white border border-slate-800">
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-3 mb-5 opacity-60">
                      <i className="fas fa-tag text-[10px]"></i>
                      <label className="block text-[10px] font-black uppercase tracking-widest">Precio Base de Prendas</label>
                    </div>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-indigo-400/50 text-2xl italic">S/</span>
                      <input
                        type="number" step="0.01" className={`w-full bg-slate-800/50 border-2 rounded-[2.2rem] py-7 pl-16 pr-8 font-black text-4xl focus:outline-none transition-all ${totalAjustado !== null ? 'border-indigo-500 text-indigo-400' : 'border-slate-800 text-white'}`}
                        placeholder={subtotalSugerido.toString()}
                        value={totalAjustado === null ? '' : totalAjustado}
                        onChange={(e) => { const v = e.target.value; setTotalAjustado(v === '' ? null : parseFloat(v)); setPromoAplicadaId(null); }}
                      />
                    </div>
                    {totalAjustado !== null && <button type="button" onClick={resetAjustes} className="text-[10px] font-black text-rose-400 uppercase mt-3 ml-3 hover:text-rose-300 transition-colors">Volver al precio normal</button>}
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-800 space-y-5">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Subtotal Prendas</span>
                    <span className="text-white">S/ {totalBase.toFixed(2)}</span>
                  </div>
                  {ubicacion === Ubicacion.LIMA && (
                    <div className="flex justify-between items-center text-[11px] font-bold text-indigo-400 uppercase tracking-widest">
                      <span>Delivery ({distritoSeleccionado || 'No definido'})</span>
                      <span>S/ {costoDelivery.toFixed(2)}</span>
                    </div>
                  )}
                  {ubicacion === Ubicacion.PROVINCIA && (
                    <div className="flex justify-between items-center text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                      <span>Envío a Provincia</span>
                      <span>POR PAGAR</span>
                    </div>
                  )}

                  <div className="pt-8 border-t border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 text-center">Monto Total a Cobrar</span>
                      <div className="flex justify-center items-center gap-3">
                        <span className="text-2xl font-black text-indigo-500 mt-1 italic">S/</span>
                        <span className="text-6xl font-black text-white tracking-tighter">{totalFinal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={cart.length === 0}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-7 rounded-[2.2rem] shadow-2xl shadow-emerald-950/20 transition-all uppercase tracking-[0.4em] text-[11px] mt-10 active:scale-95 group"
                  >
                    Confirmar Venta <i className="fas fa-check-double ml-3 group-hover:translate-x-1 transition-transform"></i>
                  </button>

                  <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest text-center mt-6">Sistema SYS • Registro Seguro de Venta</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div >
    </div >
  );
};

export default SalesRegistry;
