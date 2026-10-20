// Simulación del API de corte de caja: lee y guarda en localStorage.
// Cuando exista el backend, reemplazar por las llamadas con axiosClient.
import { METODOS_PAGO } from '../data/catalogo';
import { generarHistorialDemo } from '../data/historialDemo';

const VENTAS_KEY = 'ventas';
const APERTURA_KEY = 'aperturaCaja';
const MOVIMIENTOS_KEY = 'movimientosCaja';
const CORTES_KEY = 'cortesCaja';

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const leer = (key, inicial) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? inicial;
  } catch {
    return inicial;
  }
};

const redondear = (valor) => Math.round(valor * 100) / 100;

const inicioDelDia = () => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return hoy;
};

// El turno abarca lo registrado hoy después del último corte
const inicioDelTurno = () => {
  const ultimoCorte = leer(CORTES_KEY, []).at(-1);
  const desde = inicioDelDia();
  return ultimoCorte && new Date(ultimoCorte.fecha) > desde ? new Date(ultimoCorte.fecha) : desde;
};

const entre = (lista, desde, hasta = null) =>
  lista.filter((registro) => {
    const fecha = new Date(registro.fecha);
    return fecha > new Date(desde) && (!hasta || fecha <= new Date(hasta));
  });

const aperturaDelTurno = () => {
  const apertura = leer(APERTURA_KEY, null);
  return apertura && new Date(apertura.fecha) > inicioDelTurno() ? apertura : null;
};

// Totales de un conjunto de ventas y movimientos (turno actual o corte del historial)
export const construirResumen = ({ ventas, movimientos = [], apertura = null, fondo = apertura?.monto ?? 0, desde }) => {
  const bruto = redondear(ventas.reduce((suma, v) => suma + v.totales.subtotal, 0));
  const descuentos = redondear(ventas.reduce((suma, v) => suma + v.totales.descuento, 0));
  const neto = redondear(ventas.reduce((suma, v) => suma + v.totales.total, 0));
  const articulos = ventas.reduce((suma, v) => suma + v.totales.articulos, 0);

  // Formas de pago activas + cualquiera que tenga ventas (p. ej. SPEI cuando se habilite)
  const porMetodo = METODOS_PAGO.map((m) => {
    const delMetodo = ventas.filter((v) => v.metodo === m.id);
    const total = redondear(delMetodo.reduce((suma, v) => suma + v.totales.total, 0));
    return { ...m, total, transacciones: delMetodo.length, porcentaje: neto ? (total / neto) * 100 : 0 };
  }).filter((m) => m.activo || m.transacciones > 0);

  const totalDe = (id) => porMetodo.find((m) => m.id === id)?.total ?? 0;
  const entradas = redondear(movimientos.filter((m) => m.tipo === 'entrada').reduce((s, m) => s + m.monto, 0));
  const retiros = redondear(movimientos.filter((m) => m.tipo === 'retiro').reduce((s, m) => s + m.monto, 0));

  return {
    desde,
    apertura,
    ventas,
    movimientos,
    tickets: ventas.length,
    articulos,
    bruto,
    descuentos,
    neto,
    ticketPromedio: ventas.length ? neto / ventas.length : 0,
    porMetodo,
    efectivo: totalDe('efectivo'),
    tarjeta: totalDe('tarjeta'),
    fondo,
    entradas,
    retiros,
    efectivoEsperado: redondear(fondo + totalDe('efectivo') + entradas - retiros),
  };
};

export const calcularResumen = () => {
  const desde = inicioDelTurno().toISOString();
  return construirResumen({
    ventas: entre(leer(VENTAS_KEY, []), desde),
    movimientos: entre(leer(MOVIMIENTOS_KEY, []), desde),
    apertura: aperturaDelTurno(),
    desde,
  });
};

// Fecha local AAAA-MM-DD (clave de día del historial)
export const claveDia = (fecha) => {
  const f = new Date(fecha);
  const dos = (n) => String(n).padStart(2, '0');
  return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;
};

// Cortes registrados (más recientes primero), cada uno con las ventas y movimientos que abarcó
// TODO API: axiosClient.get('/caja/cortes')
export const obtenerHistorial = () => {
  const ventas = leer(VENTAS_KEY, []);
  const movimientos = leer(MOVIMIENTOS_KEY, []);
  const reales = leer(CORTES_KEY, []).map((corte) => ({
    ...corte,
    resumen: construirResumen({
      ventas: entre(ventas, corte.desde, corte.fecha),
      movimientos: entre(movimientos, corte.desde, corte.fecha),
      fondo: corte.efectivo.fondo,
      desde: corte.desde,
    }),
  }));

  // Días con corte real no se rellenan con datos de ejemplo
  const diasReales = new Set(reales.map((c) => claveDia(c.fecha)));
  const demo = generarHistorialDemo()
    .filter((c) => !diasReales.has(claveDia(c.fecha)))
    .map((corte) => ({ ...corte, resumen: construirResumen({ ventas: corte.ventas, movimientos: corte.movimientos, fondo: corte.efectivo.fondo, desde: corte.desde }) }));

  return [...reales, ...demo].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
};

// TODO API: axiosClient.post('/caja/movimientos', movimiento)
export const registrarMovimiento = async (movimiento) => {
  await esperar(300);
  const registro = { ...movimiento, id: Date.now(), fecha: new Date().toISOString() };
  localStorage.setItem(MOVIMIENTOS_KEY, JSON.stringify([...leer(MOVIMIENTOS_KEY, []), registro]));
  return registro;
};

// TODO API: axiosClient.post('/caja/cortes', corte)
export const registrarCorte = async (corte) => {
  await esperar(800);
  const registro = { ...corte, id: Date.now(), fecha: new Date().toISOString() };
  localStorage.setItem(CORTES_KEY, JSON.stringify([...leer(CORTES_KEY, []), registro]));
  return registro;
};
