
export enum Talla {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
  UNICA = 'Única'
}

export enum Ubicacion {
  LIMA = 'Lima',
  PROVINCIA = 'Provincia'
}

export enum TipoMovimiento {
  ENTRADA = 'Entrada',
  SALIDA = 'Salida',
  VENTA = 'Venta'
}

export enum Propietario {
  DUENO_1 = 'Dueño 1',
  DUENO_2 = 'Dueño 2',
  DUENO_3 = 'Dueño 3'
}

export enum UserRole {
  ADMIN = 'Administrador General',
  OWNER = 'Dueño',
  SELLER = 'Vendedor'
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password?: string;
  role: UserRole;
  propietarioAsignado?: Propietario;
  fechaRegistro: string;
  estado: 'Activo' | 'Inactivo';
}

export interface Producto {
  id: string;
  nombre: string;
  talla: Talla;
  color: string;
  stock: number;
  precioBase: number;
  propietario: Propietario;
  comisionValor: number;
  comisionTipo: 'monto' | 'porcentaje';
}

export interface Promocion {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'cantidad_fija' | 'descuento_porcentaje';
  cantidadRequerida: number;
  valorPromo: number; 
  modelosAplicables: string[]; 
  propietarioId: Propietario;
  estado: 'Activa' | 'Inactiva';
}

export interface Movimiento {
  id: string;
  productoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  precioVenta?: number;
  comisionPagada?: number; 
  estadoComision?: 'Pendiente' | 'Pagado';
  vendedor?: string;
  ubicacion?: Ubicacion;
  fecha: string;
  comentario?: string;
  propietarioId?: Propietario;
}

export interface PagoComision {
  id: string;
  vendedor: string;
  monto: number;
  fecha: string;
  periodo: string;
}

export type View = 'dashboard' | 'inventory' | 'sales' | 'history' | 'users' | 'promotions' | 'commissions' | 'settings';
