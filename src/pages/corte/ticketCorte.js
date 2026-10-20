import { jsPDF } from 'jspdf';
import { DENOMINACIONES } from '../../data/catalogo';
import { TERMINAL, TURNO } from '../../data/dummy';
import { formatMoney } from '../../utils/format';
import { describirLinea, importeLinea } from '../pos/pedido';
import { estadoDiferencia, totalContado } from './estilos';

// Ticket térmico de 80 mm: ancho fijo, largo según el contenido
const ANCHO = 80;
const MARGEN = 5;
const UTIL = ANCHO - MARGEN * 2;

const hora = (iso) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
const fechaHora = (fecha) =>
  fecha.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
const etiquetaDenominacion = (valor) => (valor < 1 ? `${valor * 100} c` : `$${valor}`);
const conSigno = (valor) => `${valor > 0 ? '+' : ''}${formatMoney(valor)}`;

// Dibuja el ticket. Con dibujar=false solo mide el alto necesario.
const componer = (doc, datos, dibujar) => {
  const { tipo, folio, fecha, resumen, conteo, terminal, observaciones, user } = datos;
  let y = MARGEN + 2;

  const texto = (contenido, { size = 8, bold = false, align = 'left', alto } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lineas = doc.splitTextToSize(String(contenido), UTIL);
    const altoLinea = alto ?? size * 0.42;
    lineas.forEach((linea) => {
      if (dibujar) {
        const x = align === 'center' ? ANCHO / 2 : align === 'right' ? ANCHO - MARGEN : MARGEN;
        doc.text(linea, x, y, { align });
      }
      y += altoLinea;
    });
  };

  const par = (izquierda, derecha, { size = 8, bold = false } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const anchoDerecha = doc.getTextWidth(derecha) + 2;
    const lineas = doc.splitTextToSize(String(izquierda), UTIL - anchoDerecha);
    lineas.forEach((linea, i) => {
      if (dibujar) {
        doc.text(linea, MARGEN, y);
        if (i === 0) doc.text(derecha, ANCHO - MARGEN, y, { align: 'right' });
      }
      y += size * 0.42;
    });
  };

  const separador = (punteado = true) => {
    y += 0.5;
    if (dibujar) {
      doc.setLineWidth(0.2);
      doc.setLineDashPattern(punteado ? [0.8, 0.8] : [], 0);
      doc.line(MARGEN, y, ANCHO - MARGEN, y);
    }
    y += 3.5;
  };

  const titulo = (contenido) => {
    y += 1;
    texto(contenido, { size: 9, bold: true });
    y += 0.5;
  };

  const espacio = (mm = 2) => {
    y += mm;
  };

  // ENCABEZADO
  texto('CONITOS CENTRAL', { size: 13, bold: true, align: 'center', alto: 6 });
  texto(TERMINAL.sucursal, { align: 'center' });
  texto(`Terminal #${TERMINAL.numero} · ${TERMINAL.version}`, { align: 'center' });
  espacio();
  texto(tipo === 'Z' ? 'CORTE Z · CIERRE DE TURNO' : 'PRE-CORTE X · LECTURA PARCIAL', { size: 10, bold: true, align: 'center', alto: 5 });
  if (folio) texto(`Folio de corte: ${folio}`, { align: 'center' });
  separador(false);
  par('Fecha de impresión', fechaHora(fecha));
  par('Ventas desde', fechaHora(new Date(resumen.desde)));
  par('Turno', TURNO.nombre);
  par('Cajero', user?.nombre ?? '-');
  separador();

  // RESUMEN
  titulo('RESUMEN DE VENTAS');
  par('Tickets emitidos', String(resumen.tickets));
  par('Artículos vendidos', String(resumen.articulos));
  par('Ventas brutas', formatMoney(resumen.bruto));
  par('Descuentos', resumen.descuentos ? `-${formatMoney(resumen.descuentos)}` : formatMoney(0));
  par('VENTAS NETAS', formatMoney(resumen.neto), { size: 9, bold: true });
  espacio(1);
  resumen.porMetodo.forEach((m) => par(`${m.label} (${m.transacciones})`, formatMoney(m.total)));
  separador();

  // DETALLE POR FORMA DE PAGO
  resumen.porMetodo.forEach((m) => {
    const ventas = resumen.ventas.filter((v) => v.metodo === m.id);
    titulo(`VENTAS EN ${m.label.toUpperCase()} (${ventas.length})`);
    if (!ventas.length) texto('Sin ventas', { size: 7.5 });
    ventas.forEach((v) => {
      par(`#${v.folio} · ${hora(v.fecha)}${v.cliente ? ` · ${v.cliente}` : ''}`, formatMoney(v.totales.total), { bold: true });
      v.lineas.forEach((linea) => {
        par(`  ${linea.cantidad}x ${linea.nombre}`, formatMoney(importeLinea(linea)), { size: 7.5 });
        const detalle = describirLinea(linea);
        if (detalle) texto(`     ${detalle}`, { size: 6.5 });
      });
      if (v.totales.descuento > 0) par(`  ${v.descuento?.nombre ?? 'Descuento'}`, `-${formatMoney(v.totales.descuento)}`, { size: 7.5 });
      if (m.id === 'efectivo') par('  Recibido / cambio', `${formatMoney(v.recibido)} / ${formatMoney(v.cambio)}`, { size: 7 });
      espacio(1);
    });
    par(`Total ${m.label.toLowerCase()}`, formatMoney(m.total), { bold: true });
    separador();
  });

  // CONTEO DE EFECTIVO
  const contado = totalContado(conteo);
  titulo('CONTEO FÍSICO DE EFECTIVO');
  const filaDenominacion = (valor) => {
    const piezas = conteo[valor] ?? 0;
    par(`${etiquetaDenominacion(valor).padEnd(6)} x ${piezas}`, formatMoney(valor * piezas), { size: 7.5 });
  };
  texto('Billetes', { bold: true, size: 7.5 });
  DENOMINACIONES.billetes.forEach(filaDenominacion);
  texto('Monedas', { bold: true, size: 7.5 });
  DENOMINACIONES.monedas.forEach(filaDenominacion);
  par('Total contado', formatMoney(contado), { bold: true });
  separador();

  // CUADRES
  const difEfectivo = Math.round((contado - resumen.efectivoEsperado) * 100) / 100;
  titulo('CUADRE DE EFECTIVO');
  par('Fondo inicial', formatMoney(resumen.fondo));
  par('Ventas en efectivo', `+${formatMoney(resumen.efectivo)}`);
  resumen.movimientos.forEach((mov) =>
    par(`${mov.tipo === 'retiro' ? 'Retiro' : 'Entrada'}: ${mov.concepto}`, `${mov.tipo === 'retiro' ? '-' : '+'}${formatMoney(mov.monto)}`)
  );
  par('Esperado en gaveta', formatMoney(resumen.efectivoEsperado), { bold: true });
  par('Contado', formatMoney(contado));
  par(`Diferencia (${estadoDiferencia(difEfectivo).label})`, conSigno(difEfectivo), { bold: true });
  separador();

  const difTarjeta = Math.round((terminal.monto - resumen.tarjeta) * 100) / 100;
  titulo('CONCILIACIÓN DE TARJETA');
  par('Cobrado en sistema', formatMoney(resumen.tarjeta));
  par('Cierre de lote terminal', formatMoney(terminal.monto));
  par('Ventas / vouchers', `${resumen.porMetodo.find((m) => m.id === 'tarjeta')?.transacciones ?? 0} / ${terminal.vouchers || '-'}`);
  par(`Diferencia (${estadoDiferencia(difTarjeta).label})`, conSigno(difTarjeta), { bold: true });
  separador();

  if (observaciones?.trim()) {
    titulo('OBSERVACIONES');
    texto(observaciones.trim(), { size: 7.5 });
    separador();
  }

  // FIRMAS
  espacio(10);
  const firma = (rol) => {
    if (dibujar) {
      doc.setLineDashPattern([], 0);
      doc.line(MARGEN + 8, y, ANCHO - MARGEN - 8, y);
    }
    y += 4;
    texto(rol, { size: 7.5, align: 'center' });
    espacio(10);
  };
  firma('Firma del cajero');
  firma('Firma del supervisor');
  texto('Conitos Central · Sistema Operativo de Mostrador', { size: 6.5, align: 'center' });

  return y + MARGEN;
};

// Genera el ticket del corte y lo descarga como PDF
export const descargarTicketCorte = (datos) => {
  const conFecha = { ...datos, fecha: datos.fecha ?? new Date() };
  const alto = componer(new jsPDF({ unit: 'mm', format: [ANCHO, 2000] }), conFecha, false);
  const doc = new jsPDF({ unit: 'mm', format: [ANCHO, Math.max(alto, 100)] });
  componer(doc, conFecha, true);

  const f = conFecha.fecha;
  const dos = (n) => String(n).padStart(2, '0');
  const marca = `${f.getFullYear()}${dos(f.getMonth() + 1)}${dos(f.getDate())}-${dos(f.getHours())}${dos(f.getMinutes())}`;
  doc.save(`corte-${datos.tipo === 'Z' ? 'Z' : 'X'}-caja${TERMINAL.numero}-${marca}.pdf`);
};
