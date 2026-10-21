import { formatMoney } from '../../utils/format';

// 1 = domingo … 7 = sábado (DAYOFWEEK de MySQL)
export const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const nombreDia = (dia) => (dia ? DIAS_SEMANA[dia - 1] : 'Todos los días');

const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const coincide = (termino, ...textos) => !termino || normalizar(textos.join(' ')).includes(normalizar(termino));

// Pestañas de administración: cada una es un recurso del API
export const RECURSOS = [
  {
    id: 'productos',
    label: 'Productos',
    singular: 'producto',
    nuevo: 'Nuevo producto',
    campoActivo: 'activo',
    texto: (p, catalogo) =>
      [p.nombre, catalogo.categorias.find((c) => c.id === p.id_categoria)?.nombre, ...p.presentaciones.map((x) => x.nombre)].join(' '),
    bloqueado: (p) => (p.vendido ? 'Ya tiene ventas registradas: desactívalo para ocultarlo del POS' : null),
  },
  {
    id: 'sabores',
    label: 'Sabores',
    singular: 'sabor',
    nuevo: 'Nuevo sabor',
    campoActivo: 'activo',
    texto: (s) => `${s.nombre} ${s.tipo}`,
    bloqueado: (s) => (s.vendido ? 'Ya tiene ventas u órdenes de producción: desactívalo para ocultarlo del POS' : null),
  },
  {
    id: 'categorias',
    label: 'Categorías',
    singular: 'categoría',
    nuevo: 'Nueva categoría',
    campoActivo: 'activo',
    texto: (c) => c.nombre,
    bloqueado: (c) => (c.productos ? `Tiene ${c.productos} producto(s): muévelos o desactiva la categoría` : null),
  },
  {
    id: 'extras',
    label: 'Extras y toppings',
    singular: 'extra',
    nuevo: 'Nuevo extra',
    campoActivo: 'activo',
    texto: (e) => `${e.nombre} ${formatMoney(e.precio)}`,
    bloqueado: (e) => (e.vendido ? 'Ya tiene ventas registradas: desactívalo para ocultarlo del POS' : null),
  },
  {
    id: 'promociones',
    label: 'Promociones',
    singular: 'promoción',
    nuevo: 'Nueva promoción',
    campoActivo: 'activa',
    texto: (p) => `${p.nombre} ${nombreDia(p.dia_semana)}`,
    bloqueado: (p) => (p.vendida ? 'Ya tiene ventas registradas: desactívala en su lugar' : null),
  },
];

export const recursoPorId = (id) => RECURSOS.find((r) => r.id === id) ?? RECURSOS[0];

// Nivel de vitrina de un sabor (inventario_sabores)
export const estadoVitrina = (inventario) => {
  if (!inventario) return null;
  const porcentaje = inventario.porciones_max ? Math.min(100, (inventario.porciones_actual / inventario.porciones_max) * 100) : 0;
  const reservaBaja = inventario.botes_reserva < inventario.stock_minimo;
  const vitrinaBaja = porcentaje < 25;
  return { porcentaje, reservaBaja, vitrinaBaja, critico: reservaBaja || vitrinaBaja };
};

// Tipos de terminal POS de una sucursal (terminales.tipo)
export const TIPOS_TERMINAL = [
  { id: 'caja', label: 'Caja' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'kiosko', label: 'Kiosko' },
];
