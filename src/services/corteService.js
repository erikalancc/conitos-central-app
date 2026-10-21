import axiosClient from '../api/axiosClient';
import { METODOS_PAGO } from '../data/catalogo';
import { ventaDesdeApi } from './ventasService';

// Caja: turnos (apertura con fondo → movimientos → corte Z) guardados en el API

const redondear = (valor) => Math.round(valor * 100) / 100;

// Fecha local AAAA-MM-DD (clave de día del historial)
export const claveDia = (fecha) => {
  const f = new Date(fecha);
  const dos = (n) => String(n).padStart(2, '0');
  return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;
};

// Totales de un conjunto de ventas y movimientos (turno en curso, corte o día del historial)
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

// Turno o corte del API -> resumen del front (requiere sus ventas con detalle)
export const resumenDesdeTurno = (turno) => {
  const ventas = (turno.ventas_detalle ?? []).map(ventaDesdeApi);
  // Las ventas cobradas antes de abrir caja se suman al turno: "desde" es lo más temprano
  const desde = [turno.apertura.fecha, ...ventas.map((v) => v.fecha)].reduce((a, b) => (new Date(b) < new Date(a) ? b : a));
  return construirResumen({
    ventas,
    movimientos: turno.movimientos,
    apertura: { monto: turno.apertura.fondo, fecha: turno.apertura.fecha, comentario: turno.apertura.comentario, usuario: turno.apertura.usuario },
    fondo: turno.apertura.fondo,
    desde,
  });
};

// Corte cerrado del API -> forma que usan el cuadre del historial y el ticket
export const corteDesdeApi = (corte) => ({
  id: corte.id,
  fecha: corte.cierre?.fecha ?? corte.apertura.fecha,
  desde: corte.apertura.fecha,
  usuarioNombre: corte.cierre?.usuario ?? corte.apertura.usuario,
  efectivo: {
    ...corte.efectivo,
    conteo: Object.fromEntries(corte.efectivo.conteo.map((c) => [c.denominacion, c.piezas])),
  },
  tarjeta: corte.tarjeta,
  observaciones: corte.observaciones,
  // Sin ventas_detalle (listado), el resumen trae solo los totales del corte
  resumen: corte.ventas_detalle
    ? resumenDesdeTurno(corte)
    : {
        ventas: [],
        movimientos: corte.movimientos,
        tickets: corte.ventas.tickets,
        neto: corte.ventas.ventas_netas,
        efectivo: corte.ventas.ventas_efectivo,
        tarjeta: corte.ventas.ventas_tarjeta,
        porMetodo: [
          { id: 'efectivo', transacciones: corte.ventas.por_metodo.filter((m) => m.nombre.toLowerCase().includes('efectivo')).reduce((s, m) => s + m.tickets, 0) },
          { id: 'tarjeta', transacciones: corte.ventas.por_metodo.filter((m) => m.nombre.toLowerCase().includes('tarjeta')).reduce((s, m) => s + m.tickets, 0) },
        ],
      },
});

// GET /caja/turno — turno abierto con totales en vivo y sus ventas, o null si la caja está cerrada
export const obtenerTurno = async () => {
  const { data } = await axiosClient.get('/caja/turno');
  return data.data.turno;
};

// POST /caja/apertura — abre el turno; las ventas de hoy sin turno se le asignan
export const abrirCaja = async ({ fondo, comentario }) => {
  const { data } = await axiosClient.post('/caja/apertura', { fondo_inicial: fondo, comentario: comentario || null });
  return data.data.turno;
};

// POST /caja/movimientos — entrada o retiro de efectivo del turno abierto
export const registrarMovimiento = async ({ tipo, monto, concepto }) => {
  const { data } = await axiosClient.post('/caja/movimientos', { tipo, monto, concepto });
  return data.data.turno;
};

// POST /caja/cierre — corte Z; el API calcula esperado y diferencias
export const cerrarCaja = async ({ conteo, terminal, observaciones }) => {
  const { data } = await axiosClient.post('/caja/cierre', {
    conteo: Object.fromEntries(Object.entries(conteo).filter(([, piezas]) => piezas > 0)),
    tarjeta_terminal: terminal.monto,
    vouchers: terminal.vouchers || null,
    observaciones,
  });
  return data.data.corte;
};

// GET /caja/cortes — cortes cerrados en un rango (por fecha de apertura)
export const obtenerCortes = async ({ desde, hasta } = {}) => {
  const { data } = await axiosClient.get('/caja/cortes', { params: { desde, hasta } });
  return data.data.cortes;
};

// GET /caja/cortes/{id} — corte con todas sus ventas (para el ticket)
export const obtenerCorte = async (id) => {
  const { data } = await axiosClient.get(`/caja/cortes/${id}`);
  return data.data;
};
