import { claveDia } from '../../services/corteService';

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

// Totales comparables entre un día y una semana
const totalizar = (cortes) => ({
  neto: sumar(cortes, (c) => c.resumen.neto),
  efectivo: sumar(cortes, (c) => c.resumen.efectivo),
  tarjeta: sumar(cortes, (c) => c.resumen.tarjeta),
  tickets: cortes.reduce((suma, c) => suma + c.resumen.tickets, 0),
  difEfectivo: sumar(cortes, (c) => c.efectivo.diferencia),
  difTarjeta: sumar(cortes, (c) => c.tarjeta.diferencia),
});

// Día con sus cortes (normalmente uno por turno)
export const agruparPorDia = (cortes) => {
  const dias = new Map();
  cortes.forEach((corte) => {
    const clave = claveDia(corte.fecha);
    if (!dias.has(clave)) dias.set(clave, []);
    dias.get(clave).push(corte);
  });
  return [...dias.entries()].map(([clave, delDia]) => ({
    clave,
    fecha: new Date(`${clave}T12:00:00`),
    cortes: delDia,
    cajeros: [...new Set(delDia.map((c) => c.usuarioNombre).filter(Boolean))],
    demo: delDia.every((c) => c.demo),
    ...totalizar(delDia),
  }));
};

// Semanas (más reciente primero) con sus días
export const agruparPorSemana = (cortes) => {
  const semanas = new Map();
  agruparPorDia(cortes).forEach((dia) => {
    const lunes = inicioSemana(dia.fecha);
    const clave = lunes.toISOString();
    if (!semanas.has(clave)) semanas.set(clave, { lunes, dias: [] });
    semanas.get(clave).dias.push(dia);
  });
  return [...semanas.values()].map(({ lunes, dias }) => {
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    return {
      clave: claveDia(lunes),
      nombre: nombreSemana(lunes),
      rango: `${diaCorto(lunes)} – ${diaCorto(domingo)}`,
      dias,
      neto: sumar(dias, (d) => d.neto),
      efectivo: sumar(dias, (d) => d.efectivo),
      tarjeta: sumar(dias, (d) => d.tarjeta),
      tickets: dias.reduce((suma, d) => suma + d.tickets, 0),
    };
  });
};
