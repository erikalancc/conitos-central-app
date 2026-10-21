import axiosClient from '../api/axiosClient';

// Ventas: se registran en el API; las órdenes en espera aún se guardan solo en localStorage.
const VENTAS_KEY = 'ventas';
const ORDENES_KEY = 'ordenesGuardadas';

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const leerLista = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? [];
  } catch {
    return [];
  }
};

const agregarALista = (key, registro) => {
  localStorage.setItem(key, JSON.stringify([...leerLista(key), registro]));
};

const redondear = (valor) => Math.round(valor * 100) / 100;

// Línea del POS -> línea del API (un id de sabor por porción: 2× Vainilla = [1, 1])
const lineaApi = (linea) =>
  linea.idPromocion
    ? { id_promocion: linea.idPromocion, cantidad: linea.cantidad, notas: linea.notas || null }
    : {
        id_presentacion: linea.idPresentacion,
        cantidad: linea.cantidad,
        sabores: linea.sabores.flatMap((s) => Array(s.cantidad).fill(s.id)),
        extras: linea.extras.map((e) => e.id),
        notas: linea.notas || null,
      };

/**
 * POST /ventas — el API recalcula los precios con el catálogo vigente y responde 409 si
 * no coinciden con los del POS. Se guarda además una copia local para el corte y el historial
 * (que todavía leen de este navegador).
 */
export const registrarVenta = async (venta, idMetodoPago) => {
  const { data } = await axiosClient.post('/ventas', {
    folio_orden: venta.folio,
    cliente: venta.cliente,
    servicio: venta.servicio,
    id_metodo_pago: idMetodoPago,
    monto_recibido: venta.metodo === 'efectivo' ? venta.recibido : null,
    descuento: venta.descuento ? { nombre: venta.descuento.nombre, tipo: venta.descuento.tipo, valor: venta.descuento.valor } : null,
    total: redondear(venta.totales.total),
    lineas: venta.lineas.map(lineaApi),
  });
  const guardada = data.data;

  const registro = {
    ...venta,
    id: guardada.id,
    idVenta: guardada.id,
    fecha: guardada.fecha,
    metodoPago: guardada.metodo_pago,
    recibido: guardada.monto_recibido ?? guardada.total,
    cambio: guardada.cambio ?? 0,
  };
  agregarALista(VENTAS_KEY, registro);
  return registro;
};

// TODO API: axiosClient.post('/ordenes-en-espera', orden)
export const guardarOrden = async (orden) => {
  await esperar(400);
  const registro = { ...orden, id: Date.now(), fecha: new Date().toISOString() };
  agregarALista(ORDENES_KEY, registro);
  return registro;
};

// Piezas vendidas por producto en esta terminal (para ordenar por "más vendidos")
export const contarVendidosPorProducto = () => {
  const conteo = {};
  leerLista(VENTAS_KEY).forEach((venta) =>
    venta.lineas.forEach((linea) => {
      conteo[linea.productoId] = (conteo[linea.productoId] ?? 0) + linea.cantidad;
    })
  );
  return conteo;
};

// GET /ventas/resumen — totales por día (default: últimas 8 semanas)
export const obtenerResumenVentas = async ({ desde, hasta } = {}) => {
  const { data } = await axiosClient.get('/ventas/resumen', { params: { desde, hasta } });
  return data.data;
};

// GET /ventas?fecha=AAAA-MM-DD — ventas del día con su detalle
export const obtenerVentasDelDia = async (fecha) => {
  const { data } = await axiosClient.get('/ventas', { params: { fecha } });
  return data.data.ventas;
};

// Forma de pago del POS a partir del nombre en metodos_pago (Débito y Crédito cuentan como tarjeta)
export const metodoDesdeNombre = (nombre = '') => {
  const texto = nombre.toLowerCase();
  if (texto.includes('efectivo')) return 'efectivo';
  if (texto.includes('tarjeta')) return 'tarjeta';
  return 'spei';
};

// Venta del API -> misma forma que las ventas del POS (para reutilizar resumen, desglose y lista)
export const ventaDesdeApi = (v) => ({
  id: v.id,
  idVenta: v.id,
  folio: v.id,
  folioOrden: v.folio_orden,
  fecha: v.fecha,
  vendedor: v.vendedor,
  cliente: v.cliente,
  servicio: v.servicio,
  metodo: metodoDesdeNombre(v.metodo_pago.nombre),
  metodoPago: v.metodo_pago.nombre,
  descuento: v.descuento > 0 ? { nombre: v.descuento_concepto ?? 'Descuento' } : null,
  totales: {
    subtotal: v.subtotal,
    descuento: v.descuento,
    total: v.total,
    articulos: v.lineas.reduce((suma, l) => suma + l.cantidad, 0),
  },
  recibido: v.monto_recibido ?? v.total,
  cambio: v.cambio ?? 0,
  lineas: v.lineas.map((l) => {
    const extras = l.extras.map((e) => ({ id: e.id, nombre: e.nombre, precio: e.precio * e.cantidad }));
    return {
      lineId: l.id,
      productoId: l.id_producto ?? `promo-${l.id_promocion}`,
      nombre: l.nombre,
      cantidad: l.cantidad,
      presentacion: l.presentacion,
      // El recargo de cada sabor ya va dentro del precio unitario guardado
      sabores: l.sabores.map((s) => ({ id: s.id, nombre: s.nombre, cantidad: s.cantidad, extra: 0 })),
      extras,
      notas: l.notas ?? '',
      precioBase: Math.round((l.precio_unitario - extras.reduce((suma, e) => suma + e.precio, 0)) * 100) / 100,
    };
  }),
});
