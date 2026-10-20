// Catálogo de prueba para la Terminal POS (vendrá del API).

export const CATEGORIAS = [
  { id: 'helados', label: 'Helados' },
  { id: 'paletas', label: 'Paletas' },
  { id: 'aguas', label: 'Aguas Frescas' },
  { id: 'especialidades', label: 'Especialidades' },
  { id: 'crepas', label: 'Crepas & Malteadas' },
  { id: 'promociones', label: 'Promociones' },
];

// Fondo de la miniatura mientras no existan fotos de producto
export const ESTILO_CATEGORIA = {
  helados: 'linear-gradient(135deg, #fff1d6, #ffd9a8)',
  paletas: 'linear-gradient(135deg, #ffe0e6, #ffb3c1)',
  aguas: 'linear-gradient(135deg, #dff3ff, #a9dcf7)',
  especialidades: 'linear-gradient(135deg, #ffe9d6, #ffbf8a)',
  crepas: 'linear-gradient(135deg, #f1e4d8, #d9b99b)',
  promociones: 'linear-gradient(135deg, #fff7b3, #fbe100)',
};

const SABORES_HELADO = [
  { nombre: 'Vainilla' },
  { nombre: 'Fresa' },
  { nombre: 'Chocolate' },
  { nombre: 'Mamey' },
  { nombre: 'Limón' },
  { nombre: 'Queso con zarzamora' },
  { nombre: 'Nuez', extra: 10 },
  { nombre: 'Piñón', extra: 15 },
];

const SABORES_PALETA_AGUA = [{ nombre: 'Limón' }, { nombre: 'Fresa' }, { nombre: 'Mango con chile' }, { nombre: 'Jamaica' }, { nombre: 'Tamarindo' }];
const SABORES_PALETA_LECHE = [{ nombre: 'Zarzamora con queso' }, { nombre: 'Piñón' }, { nombre: 'Nuez' }, { nombre: 'Coco' }];
const SABORES_AGUA = [{ nombre: 'Horchata' }, { nombre: 'Jamaica' }, { nombre: 'Cebada' }, { nombre: 'Limón con chía' }];
const SABORES_MALTEADA = [{ nombre: 'Vainilla' }, { nombre: 'Chocolate' }, { nombre: 'Fresa' }, { nombre: 'Oreo', extra: 10 }];
const SABORES_CREPA = [{ nombre: 'Nutella con fresa y plátano' }, { nombre: 'Cajeta con nuez' }, { nombre: 'Lechera con durazno' }];

export const EXTRAS = {
  chispas: { nombre: 'Chispas de chocolate', precio: 10 },
  nuez: { nombre: 'Nuez picada', precio: 12 },
  cajeta: { nombre: 'Cajeta', precio: 8 },
  crema: { nombre: 'Crema batida', precio: 10 },
  chamoy: { nombre: 'Chamoy y Tajín', precio: 0 },
  valentina: { nombre: 'Valentina extra', precio: 0 },
  japoneses: { nombre: 'Cacahuates japoneses', precio: 10 },
  clamato: { nombre: 'Clamato', precio: 15 },
  helado: { nombre: 'Bola de helado extra', precio: 18 },
};

// opciones: presentaciones, sabores ({ cantidad, lista }) y extras permitidos.
// Los productos con opciones abren el diálogo de personalización al tocarlos.
export const PRODUCTOS = [
  {
    id: 'helado-chico',
    categoria: 'helados',
    nombre: 'Helado Chico (1 bola)',
    descripcion: 'Cono o vasito tradicional',
    precio: 25,
    emoji: '🍦',
    badge: 'Popular',
    popularidad: 98,
    favorito: true,
    opciones: { presentaciones: ['Cono', 'Vaso'], sabores: { cantidad: 1, lista: SABORES_HELADO }, extras: ['chispas', 'nuez', 'cajeta'] },
  },
  {
    id: 'helado-doble',
    categoria: 'helados',
    nombre: 'Helado Doble (2 bolas)',
    descripcion: 'Mezcla dos sabores',
    precio: 45,
    emoji: '🍦',
    popularidad: 90,
    favorito: true,
    opciones: { presentaciones: ['Cono', 'Vaso'], sabores: { cantidad: 2, lista: SABORES_HELADO }, extras: ['chispas', 'nuez', 'cajeta'] },
  },
  {
    id: 'helado-grande',
    categoria: 'helados',
    nombre: 'Helado Grande (3 bolas)',
    descripcion: 'Vaso grande con extras',
    precio: 60,
    emoji: '🍨',
    badge: 'Personalizable',
    popularidad: 85,
    opciones: { presentaciones: ['Vaso', 'Cono'], sabores: { cantidad: 3, lista: SABORES_HELADO }, extras: ['chispas', 'nuez', 'cajeta', 'crema'] },
  },
  {
    id: 'combo-martes',
    categoria: 'promociones',
    nombre: 'Martes Loco Combo',
    descripcion: '2 Helados Sencillos + 1 Paleta de Fruta',
    precio: 65,
    precioAnterior: 85,
    emoji: '🎉',
    oferta: true,
    popularidad: 95,
  },
  {
    id: 'paleta-agua',
    categoria: 'paletas',
    nombre: 'Paleta de Agua',
    descripcion: 'Limón, Fresa, Mango con Chile',
    precio: 25,
    emoji: '🍧',
    popularidad: 80,
    favorito: true,
    opciones: { sabores: { cantidad: 1, lista: SABORES_PALETA_AGUA }, extras: ['chamoy'] },
  },
  {
    id: 'paleta-leche',
    categoria: 'paletas',
    nombre: 'Paleta de Leche',
    descripcion: 'Zarzamora con queso, Piñón, Nuez',
    precio: 32,
    emoji: '🍧',
    badge: 'Premium',
    popularidad: 70,
    opciones: { sabores: { cantidad: 1, lista: SABORES_PALETA_LECHE } },
  },
  {
    id: 'paleta-2x1',
    categoria: 'promociones',
    nombre: '2×1 Paletas de Agua',
    descripcion: 'Promo de la tarde (16:00 – 18:00)',
    precio: 25,
    precioAnterior: 50,
    emoji: '🍧',
    badge: 'Promo',
    popularidad: 60,
    opciones: { sabores: { cantidad: 2, lista: SABORES_PALETA_AGUA } },
  },
  {
    id: 'agua-medio',
    categoria: 'aguas',
    nombre: 'Agua Fresca 1/2 Litro',
    descripcion: 'Horchata, Jamaica, Cebada',
    precio: 25,
    emoji: '🥤',
    popularidad: 75,
    opciones: { sabores: { cantidad: 1, lista: SABORES_AGUA } },
  },
  {
    id: 'agua-litro',
    categoria: 'aguas',
    nombre: 'Agua Fresca 1 Litro',
    descripcion: 'Vaso gigante para llevar',
    precio: 42,
    emoji: '🥤',
    popularidad: 65,
    opciones: { sabores: { cantidad: 1, lista: SABORES_AGUA } },
  },
  {
    id: 'dorilocos',
    categoria: 'especialidades',
    nombre: 'Dorilocos Especiales',
    descripcion: 'Cueritos, cacahuate y chamoy',
    precio: 55,
    emoji: '🌶️',
    popularidad: 88,
    favorito: true,
    opciones: { extras: ['valentina', 'japoneses', 'clamato'] },
  },
  {
    id: 'sundae',
    categoria: 'especialidades',
    nombre: 'Sundae Choco-Avellana',
    descripcion: 'Dos bolas, Nutella y avellana',
    precio: 85,
    emoji: '🍨',
    badge: 'Nuevo',
    popularidad: 72,
    opciones: { sabores: { cantidad: 2, lista: SABORES_HELADO }, extras: ['crema', 'chispas'] },
  },
  {
    id: 'banana-split',
    categoria: 'especialidades',
    nombre: 'Banana Split',
    descripcion: 'Tres sabores, plátano y jarabes',
    precio: 95,
    emoji: '🍌',
    popularidad: 55,
    opciones: { sabores: { cantidad: 3, lista: SABORES_HELADO }, extras: ['crema', 'nuez'] },
  },
  {
    id: 'crepa-dulce',
    categoria: 'crepas',
    nombre: 'Crepa Dulce',
    descripcion: 'Nutella con fresa y plátano',
    precio: 48,
    emoji: '🥞',
    popularidad: 68,
    opciones: { sabores: { cantidad: 1, lista: SABORES_CREPA }, extras: ['helado', 'crema'] },
  },
  {
    id: 'malteada',
    categoria: 'crepas',
    nombre: 'Malteada Espesa',
    descripcion: 'Hecha con helado artesanal',
    precio: 50,
    emoji: '🥛',
    popularidad: 66,
    opciones: { sabores: { cantidad: 1, lista: SABORES_MALTEADA }, extras: ['crema', 'chispas'] },
  },
  {
    id: 'cono-waffle',
    categoria: 'helados',
    nombre: 'Cono Waffle',
    descripcion: 'Elaborado al momento',
    precio: 12,
    emoji: '🧇',
    popularidad: 50,
  },
  {
    id: 'bola-extra',
    categoria: 'helados',
    nombre: 'Bola Extra',
    descripcion: 'Agrega una bola a cualquier helado',
    precio: 18,
    emoji: '🍦',
    popularidad: 45,
    opciones: { sabores: { cantidad: 1, lista: SABORES_HELADO } },
  },
];

export const DESCUENTOS = [
  { id: 'martes-loco', nombre: 'Descuento Martes Loco', detalle: 'Cupón aplicado a carrito', tipo: 'monto', valor: 15 },
  { id: 'empleado', nombre: 'Descuento Empleado', detalle: '10% sobre el subtotal', tipo: 'porcentaje', valor: 10 },
  { id: 'cumpleanos', nombre: 'Cumpleañero', detalle: '$25 de descuento con identificación', tipo: 'monto', valor: 25 },
];

export const METODOS_PAGO = [
  { id: 'efectivo', label: 'Efectivo', atajo: 'F4', activo: true },
  { id: 'tarjeta', label: 'Tarjeta', atajo: 'F5', activo: true },
  // Oculto hasta habilitar el cobro por SPEI / QR (cambiar a true para mostrarlo)
  { id: 'spei', label: 'SPEI / QR', atajo: 'F6', activo: false },
];

export const METODOS_PAGO_ACTIVOS = METODOS_PAGO.filter((m) => m.activo);

export const IVA = 0.16;

// Siguiente folio de cliente/orden para la terminal
export const FOLIO_INICIAL = 48;

// Denominaciones de efectivo (MXN) para el conteo físico de gaveta
export const DENOMINACIONES = {
  billetes: [1000, 500, 200, 100, 50, 20],
  monedas: [10, 5, 2, 1, 0.5],
};
