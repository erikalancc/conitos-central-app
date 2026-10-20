// Cortes de ejemplo de días anteriores mientras no exista el API de historial.
// Se generan siempre iguales para cada fecha y no se guardan en localStorage.
// Para quitarlos basta con poner HISTORIAL_DEMO en false.
import { calcularTotales, montosSugeridos } from '../pages/pos/pedido';
import { DENOMINACIONES, DESCUENTOS, PRODUCTOS } from './catalogo';

export const HISTORIAL_DEMO = true;

const DIAS = 24;
const CAJEROS = [
  { id: 1, nombre: 'Santiago Martínez' },
  { id: 2, nombre: 'Sofía Mendoza' },
];
const DIFERENCIAS = [0, 0, 0, 0, 0, 0, -20, 10, -50];
// Solo descuentos de monto fijo: los porcentuales dejan centavos que no se pueden contar en gaveta
const DESCUENTOS_DEMO = DESCUENTOS.filter((d) => d.tipo === 'monto');
const RETIROS = [
  { concepto: 'Compra de hielo', monto: 80 },
  { concepto: 'Servilletas y vasos', monto: 120 },
  { concepto: 'Garrafones de agua', monto: 150 },
];

// Generador pseudoaleatorio con semilla (mulberry32)
const crearAzar = (semilla) => {
  let a = semilla;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const redondear = (valor) => Math.round(valor * 100) / 100;

const desglosar = (monto) => {
  const conteo = {};
  let resto = Math.round(monto * 2) / 2;
  [...DENOMINACIONES.billetes, ...DENOMINACIONES.monedas].forEach((valor) => {
    const piezas = Math.floor((resto + 0.001) / valor);
    if (piezas) {
      conteo[valor] = piezas;
      resto = redondear(resto - piezas * valor);
    }
  });
  return conteo;
};

const generarLinea = (azar, lineId) => {
  const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
  const producto = elegir(PRODUCTOS.filter((p) => p.categoria !== 'promociones'));
  const { opciones } = producto;
  const sabores = [];
  if (opciones?.sabores) {
    for (let i = 0; i < opciones.sabores.cantidad; i++) {
      const sabor = elegir(opciones.sabores.lista);
      const existente = sabores.find((s) => s.nombre === sabor.nombre);
      if (existente) existente.cantidad += 1;
      else sabores.push({ nombre: sabor.nombre, cantidad: 1, ...(sabor.extra ? { extra: sabor.extra } : {}) });
    }
  }
  return {
    lineId,
    productoId: producto.id,
    nombre: producto.nombre,
    emoji: producto.emoji,
    categoria: producto.categoria,
    precioBase: producto.precio,
    cantidad: azar() < 0.8 ? 1 : 2,
    presentacion: opciones?.presentaciones ? elegir(opciones.presentaciones) : null,
    sabores,
    extras: opciones?.extras && azar() < 0.25 ? [elegir(opciones.extras)] : [],
    notas: '',
  };
};

const generarDia = (fecha, indice) => {
  const azar = crearAzar(fecha.getFullYear() * 10000 + (fecha.getMonth() + 1) * 100 + fecha.getDate());
  const cajero = CAJEROS[indice % CAJEROS.length];
  const desde = new Date(fecha);
  desde.setHours(9, 0, 0, 0);

  const cantidadVentas = 14 + Math.floor(azar() * 20);
  const ventas = Array.from({ length: cantidadVentas }, (_, i) => {
    const lineas = Array.from({ length: 1 + Math.floor(azar() * 3) }, (_, j) => generarLinea(azar, i * 10 + j + 1));
    const descuento = azar() < 0.1 ? DESCUENTOS_DEMO[Math.floor(azar() * DESCUENTOS_DEMO.length)] : null;
    const totales = calcularTotales(lineas, descuento);
    const metodo = azar() < 0.58 ? 'efectivo' : 'tarjeta';
    const sugeridos = montosSugeridos(totales.total);
    const recibido = metodo === 'efectivo' ? sugeridos[Math.floor(azar() * sugeridos.length)] : totales.total;
    const hora = new Date(desde.getTime() + ((i + azar()) / cantidadVentas) * 8 * 3600 * 1000);
    return {
      id: `demo-${desde.getTime()}-${i}`,
      folio: 1000 + indice * 40 + i,
      usuarioId: cajero.id,
      cliente: null,
      servicio: azar() < 0.6 ? 'llevar' : 'aqui',
      lineas,
      descuento,
      totales,
      metodo,
      recibido,
      cambio: redondear(recibido - totales.total),
      fecha: hora.toISOString(),
    };
  });

  const retiro = azar() < 0.4 ? RETIROS[Math.floor(azar() * RETIROS.length)] : null;
  const movimientos = retiro
    ? [{ id: `demo-mov-${desde.getTime()}`, tipo: 'retiro', ...retiro, fecha: new Date(desde.getTime() + 4 * 3600 * 1000).toISOString() }]
    : [];

  const fondo = 1000;
  const sumar = (id) => redondear(ventas.filter((v) => v.metodo === id).reduce((s, v) => s + v.totales.total, 0));
  const efectivo = sumar('efectivo');
  const tarjeta = sumar('tarjeta');
  const retiros = retiro?.monto ?? 0;
  const esperado = redondear(fondo + efectivo - retiros);
  const conteo = desglosar(esperado + DIFERENCIAS[Math.floor(azar() * DIFERENCIAS.length)]);
  const contado = redondear(Object.entries(conteo).reduce((s, [valor, piezas]) => s + Number(valor) * piezas, 0));
  const diferencia = redondear(contado - esperado);
  const vouchers = ventas.filter((v) => v.metodo === 'tarjeta').length;

  const cierre = new Date(desde);
  cierre.setHours(17, Math.floor(azar() * 40), 0, 0);

  return {
    id: `demo-${claveCorta(fecha)}`,
    demo: true,
    fecha: cierre.toISOString(),
    desde: desde.toISOString(),
    usuarioId: cajero.id,
    usuarioNombre: cajero.nombre,
    ventas,
    movimientos,
    efectivo: { fondo, entradas: 0, retiros, esperado, contado, diferencia, conteo },
    tarjeta: { sistema: tarjeta, terminal: tarjeta, vouchers, diferencia: 0 },
    observaciones:
      diferencia < 0
        ? `Faltante de $${Math.abs(diferencia)} reportado a supervisión.`
        : diferencia > 0
          ? `Sobrante de $${diferencia}, se deja en sobre para revisión.`
          : 'Entregado sin novedad.',
  };
};

const claveCorta = (fecha) => `${fecha.getFullYear()}${fecha.getMonth() + 1}${fecha.getDate()}`;

let cache = null;

export const generarHistorialDemo = () => {
  if (!HISTORIAL_DEMO) return [];
  const hoy = new Date();
  const clave = claveCorta(hoy);
  if (cache?.clave === clave) return cache.cortes;

  const cortes = Array.from({ length: DIAS }, (_, i) => {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - (i + 1));
    return generarDia(fecha, DIAS - i);
  });
  cache = { clave, cortes };
  return cortes;
};
