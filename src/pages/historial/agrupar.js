import { claveDia } from '../../services/corteService';
import { metodoDesdeNombre } from '../../services/ventasService';

const redondear = (valor) => Math.round(valor * 100) / 100;
const sumar = (lista, obtener) => redondear(lista.reduce((suma, item) => suma + obtener(item), 0));

// Lunes de la semana de una fecha (semana de lunes a domingo)
const inicioSemana = (fecha) => {
  const lunes = new Date(fecha);
  lunes.setHours(0, 0, 0, 0);
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7));
  return lunes;
};

const diaCorto = (fecha) => fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');

const nombreSemana = (lunes) => {
  const semanas = Math.round((inicioSemana(new Date()) - lunes) / (7 * 24 * 3600 * 1000));
  if (semanas === 0) return 'Esta semana';
  if (semanas === 1) return 'Semana pasada';
  return `Hace ${semanas} semanas`;
};

const totalPorMetodo = (dia, metodo) => sumar(dia.por_metodo.filter((m) => metodoDesdeNombre(m.nombre) === metodo), (m) => m.total);

/**
 * Días del API (GET /ventas/resumen) con los cortes de caja de ese día (GET /caja/cortes).
 * Un corte cuenta para el día en que se abrió el turno.
 */
export const armarDias = (diasApi, cortes) => {
  const cortesPorDia = {};
  cortes.forEach((corte) => {
    const clave = claveDia(corte.desde);
    (cortesPorDia[clave] ??= []).push(corte);
  });

  return diasApi.map((d) => {
    const delDia = cortesPorDia[d.fecha] ?? [];
    return {
      clave: d.fecha,
      fecha: new Date(`${d.fecha}T12:00:00`),
      tickets: d.tickets,
      articulos: d.articulos,
      neto: d.total,
      descuento: d.descuento,
      efectivo: totalPorMetodo(d, 'efectivo'),
      tarjeta: totalPorMetodo(d, 'tarjeta'),
      porMetodo: d.por_metodo,
      vendedores: d.vendedores,
      cortes: delDia,
      difEfectivo: delDia.length ? sumar(delDia, (c) => c.efectivo.diferencia) : null,
      difTarjeta: delDia.length ? sumar(delDia, (c) => c.tarjeta.diferencia) : null,
    };
  });
};

// Semanas (más reciente primero) con sus días
export const agruparPorSemana = (dias) => {
  const semanas = new Map();
  dias.forEach((dia) => {
    const lunes = inicioSemana(dia.fecha);
    const clave = claveDia(lunes);
    if (!semanas.has(clave)) semanas.set(clave, { lunes, dias: [] });
    semanas.get(clave).dias.push(dia);
  });
  return [...semanas.entries()].map(([clave, { lunes, dias: delaSemana }]) => {
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    return {
      clave,
      nombre: nombreSemana(lunes),
      rango: `${diaCorto(lunes)} – ${diaCorto(domingo)}`,
      dias: delaSemana,
      neto: sumar(delaSemana, (d) => d.neto),
      efectivo: sumar(delaSemana, (d) => d.efectivo),
      tarjeta: sumar(delaSemana, (d) => d.tarjeta),
      tickets: delaSemana.reduce((suma, d) => suma + d.tickets, 0),
    };
  });
};
