import { useReducer } from 'react';
import { EXTRAS, FOLIO_INICIAL, IVA } from '../../data/catalogo';
import { formatMoney } from '../../utils/format';

// Línea de orden:
// { lineId, productoId, nombre, emoji, categoria, precioBase, cantidad,
//   presentacion, sabores: [{ nombre, cantidad, extra }], extras: [idExtra], notas }

export const precioUnitario = (linea) =>
  linea.precioBase +
  linea.sabores.reduce((suma, s) => suma + (s.extra ?? 0) * s.cantidad, 0) +
  linea.extras.reduce((suma, id) => suma + (EXTRAS[id]?.precio ?? 0), 0);

export const importeLinea = (linea) => precioUnitario(linea) * linea.cantidad;

// "Vaso | Sabores: 1× Vainilla, 1× Piñón (+$15.00) | Topping: Chispas de chocolate"
export const describirLinea = (linea) => {
  const partes = [];
  if (linea.presentacion) partes.push(linea.presentacion);
  if (linea.sabores.length) {
    const sabores = linea.sabores
      .map((s) => `${s.cantidad}× ${s.nombre}${s.extra ? ` (+${formatMoney(s.extra * s.cantidad)})` : ''}`)
      .join(', ');
    partes.push(`Sabores: ${sabores}`);
  }
  if (linea.extras.length) partes.push(`Extras: ${linea.extras.map((id) => EXTRAS[id]?.nombre).join(', ')}`);
  if (linea.notas) partes.push(linea.notas);
  return partes.join(' | ');
};

export const calcularTotales = (lineas, descuento) => {
  const subtotal = lineas.reduce((suma, linea) => suma + importeLinea(linea), 0);
  let montoDescuento = 0;
  if (descuento && subtotal > 0) {
    montoDescuento = descuento.tipo === 'porcentaje' ? (subtotal * descuento.valor) / 100 : descuento.valor;
    montoDescuento = Math.min(Math.round(montoDescuento * 100) / 100, subtotal);
  }
  const total = subtotal - montoDescuento;
  const iva = total - total / (1 + IVA);
  const articulos = lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
  return { subtotal, descuento: montoDescuento, iva, total, articulos };
};

// Montos sugeridos para pago en efectivo: exacto + siguientes billetes comunes
export const montosSugeridos = (total) => {
  if (total <= 0) return [];
  const sugeridos = new Set([total]);
  [50, 100, 200, 500].forEach((billete) => {
    const monto = Math.ceil(total / billete) * billete;
    if (monto > total) sugeridos.add(monto);
  });
  return [...sugeridos].slice(0, 4);
};

const configuracionVacia = { presentacion: null, sabores: [], extras: [], notas: '' };

// Mismas opciones = misma línea (se suma la cantidad en lugar de duplicar)
const mismaConfiguracion = (a, b) =>
  a.productoId === b.productoId &&
  a.presentacion === b.presentacion &&
  a.notas === b.notas &&
  JSON.stringify(a.sabores) === JSON.stringify(b.sabores) &&
  JSON.stringify([...a.extras].sort()) === JSON.stringify([...b.extras].sort());

const estadoInicial = {
  lineas: [],
  descuento: null,
  servicio: 'llevar',
  cliente: null,
  folio: FOLIO_INICIAL,
};

let siguienteLineId = 1;

const reducer = (state, action) => {
  switch (action.type) {
    case 'agregar': {
      const { producto, configuracion = configuracionVacia, cantidad = 1 } = action;
      const nueva = {
        lineId: siguienteLineId++,
        productoId: producto.id,
        nombre: producto.nombre,
        emoji: producto.emoji,
        categoria: producto.categoria,
        precioBase: producto.precio,
        cantidad,
        ...configuracionVacia,
        ...configuracion,
      };
      const existente = state.lineas.find((linea) => mismaConfiguracion(linea, nueva));
      if (existente) {
        return {
          ...state,
          lineas: state.lineas.map((linea) =>
            linea.lineId === existente.lineId ? { ...linea, cantidad: linea.cantidad + cantidad } : linea
          ),
        };
      }
      return { ...state, lineas: [...state.lineas, nueva] };
    }
    case 'actualizar':
      return {
        ...state,
        lineas: state.lineas.map((linea) => (linea.lineId === action.lineId ? { ...linea, ...action.cambios } : linea)),
      };
    case 'cantidad':
      return {
        ...state,
        lineas: state.lineas
          .map((linea) => (linea.lineId === action.lineId ? { ...linea, cantidad: linea.cantidad + action.delta } : linea))
          .filter((linea) => linea.cantidad > 0),
      };
    case 'quitar':
      return { ...state, lineas: state.lineas.filter((linea) => linea.lineId !== action.lineId) };
    case 'descuento':
      return { ...state, descuento: action.descuento };
    case 'servicio':
      return { ...state, servicio: action.servicio };
    case 'cliente':
      return { ...state, cliente: action.cliente };
    case 'vaciar':
      return { ...estadoInicial, folio: state.folio, servicio: state.servicio };
    case 'nueva':
      return { ...estadoInicial, folio: state.folio + 1, servicio: state.servicio };
    default:
      return state;
  }
};

export const usePedido = () => {
  const [pedido, dispatch] = useReducer(reducer, estadoInicial);

  return {
    pedido,
    totales: calcularTotales(pedido.lineas, pedido.descuento),
    agregar: (producto, configuracion, cantidad) => dispatch({ type: 'agregar', producto, configuracion, cantidad }),
    actualizar: (lineId, cambios) => dispatch({ type: 'actualizar', lineId, cambios }),
    cambiarCantidad: (lineId, delta) => dispatch({ type: 'cantidad', lineId, delta }),
    quitar: (lineId) => dispatch({ type: 'quitar', lineId }),
    setDescuento: (descuento) => dispatch({ type: 'descuento', descuento }),
    setServicio: (servicio) => dispatch({ type: 'servicio', servicio }),
    setCliente: (cliente) => dispatch({ type: 'cliente', cliente }),
    vaciar: () => dispatch({ type: 'vaciar' }),
    nuevaOrden: () => dispatch({ type: 'nueva' }),
  };
};
