import { useState } from 'react';
import { Box, ButtonBase, Collapse, IconButton, Typography } from '@mui/material';
import { CreditCard, ExpandMore, PaymentsOutlined, QrCode2, ReceiptLongOutlined } from '@mui/icons-material';
import IconTile from '../../components/IconTile';
import Panel from '../../components/Panel';
import { COLORS } from '../../theme';
import { formatMoney } from '../../utils/format';
import { describirLinea, importeLinea } from '../pos/pedido';
import { COLOR_METODO, subtituloSx, tituloSeccionSx } from './estilos';

const ICONOS = { efectivo: <PaymentsOutlined sx={{ fontSize: 14 }} />, tarjeta: <CreditCard sx={{ fontSize: 14 }} />, spei: <QrCode2 sx={{ fontSize: 14 }} /> };

const hora = (iso) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

const EtiquetaMetodo = ({ metodo }) => {
  const color = COLOR_METODO[metodo.id] ?? COLOR_METODO.tarjeta;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.75,
        py: 0.25,
        borderRadius: 1.5,
        fontSize: '0.72rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        color: color.fuerte,
        backgroundColor: color.suave,
      }}
    >
      {ICONOS[metodo.id]}
      {metodo.label}
    </Box>
  );
};

const Venta = ({ venta, metodo }) => {
  const color = COLOR_METODO[venta.metodo] ?? COLOR_METODO.tarjeta;
  return (
    <Box sx={{ p: 1.25, borderRadius: 2.5, border: `1px solid ${COLORS.border}`, borderLeft: `4px solid ${color.barra}`, backgroundColor: '#fff' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: COLORS.ink }}>#{venta.folio}</Typography>
        <Typography sx={{ fontSize: '0.78rem', color: COLORS.muted }}>{hora(venta.fecha)}</Typography>
        <EtiquetaMetodo metodo={metodo} />
        <Typography sx={{ ml: 'auto', fontWeight: 800, color: COLORS.ink, fontVariantNumeric: 'tabular-nums' }}>
          {formatMoney(venta.totales.total)}
        </Typography>
      </Box>
      <Box component="ul" sx={{ m: 0, mt: 0.75, p: 0, listStyle: 'none', display: 'grid', gap: 0.5 }}>
        {venta.lineas.map((linea) => {
          const detalle = describirLinea(linea);
          return (
            <Box component="li" key={linea.lineId} sx={{ display: 'flex', gap: 1, fontSize: '0.8rem', color: COLORS.label }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <span>
                  {linea.cantidad}× {linea.nombre}
                </span>
                {detalle && <Box sx={{ fontSize: '0.72rem', color: COLORS.muted }}>{detalle}</Box>}
              </Box>
              <Box component="span" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(importeLinea(linea))}
              </Box>
            </Box>
          );
        })}
      </Box>
      {(venta.totales.descuento > 0 || venta.metodo === 'efectivo' || venta.cliente) && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 1.5, mt: 0.75, pt: 0.75, borderTop: `1px dashed ${COLORS.border}`, fontSize: '0.72rem', color: COLORS.muted }}>
          {venta.cliente && <span>Cliente: {venta.cliente}</span>}
          {venta.totales.descuento > 0 && (
            <Box component="span" sx={{ color: COLORS.red }}>
              {venta.descuento?.nombre ?? 'Descuento'} -{formatMoney(venta.totales.descuento)}
            </Box>
          )}
          {venta.metodo === 'efectivo' && (
            <span>
              Recibido {formatMoney(venta.recibido)} · Cambio {formatMoney(venta.cambio)}
            </span>
          )}
        </Box>
      )}
    </Box>
  );
};

// Lista completa de ventas del turno, colapsable y con filtro por forma de pago
const VentasDelDia = ({ resumen, sx }) => {
  const [abierto, setAbierto] = useState(true);
  const [filtro, setFiltro] = useState('todas');

  const metodos = Object.fromEntries(resumen.porMetodo.map((m) => [m.id, m]));
  // Más recientes primero
  const ventas = [...resumen.ventas].reverse().filter((v) => filtro === 'todas' || v.metodo === filtro);
  const filtros = [{ id: 'todas', label: 'Todas', transacciones: resumen.tickets, total: resumen.neto }, ...resumen.porMetodo];

  return (
    <Panel sx={[{ p: 0, overflow: 'hidden' }, sx]}>
      <ButtonBase
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: { xs: 2, md: 2.5 }, textAlign: 'left', justifyContent: 'flex-start' }}
      >
        <IconTile bg={COLORS.yellowSoft} color="#8a6d00" size={44}>
          <ReceiptLongOutlined />
        </IconTile>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" sx={tituloSeccionSx}>
            Ventas del día ({resumen.tickets})
          </Typography>
          <Typography sx={subtituloSx}>Detalle de cada venta con su forma de pago</Typography>
        </Box>
        <IconButton component="span" tabIndex={-1} sx={{ backgroundColor: COLORS.inputBg, transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <ExpandMore />
        </IconButton>
      </ButtonBase>

      <Collapse in={abierto}>
        <Box sx={{ borderTop: `1px solid ${COLORS.border}` }}>
          {/* Filtro por forma de pago */}
          <Box sx={{ display: 'flex', gap: 0.75, p: 1.5, overflowX: 'auto' }}>
            {filtros.map((f) => {
              const activo = filtro === f.id;
              const color = COLOR_METODO[f.id];
              return (
                <ButtonBase
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  aria-pressed={activo}
                  sx={{
                    flex: 1,
                    minWidth: 96,
                    minHeight: 48,
                    px: 1.25,
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    borderRadius: 2,
                    border: `1px solid ${activo ? (color?.barra ?? COLORS.blueText) : COLORS.border}`,
                    backgroundColor: activo ? (color?.suave ?? COLORS.blueSoft) : '#fff',
                  }}
                >
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: color?.fuerte ?? COLORS.blueText }}>
                    {f.label} ({f.transacciones})
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: COLORS.ink, fontVariantNumeric: 'tabular-nums' }}>
                    {formatMoney(f.total)}
                  </Typography>
                </ButtonBase>
              );
            })}
          </Box>

          {/* En escritorio el panel acompaña el scroll: la lista se ajusta al alto visible */}
          <Box
            sx={{
              maxHeight: { xs: 520, lg: 'calc(100dvh - 340px)' },
              overflowY: 'auto',
              px: 1.5,
              pb: 1.5,
              display: 'grid',
              alignContent: 'start',
              gap: 1,
            }}
          >
            {ventas.length ? (
              ventas.map((venta) => <Venta key={venta.id} venta={venta} metodo={metodos[venta.metodo] ?? { id: venta.metodo, label: venta.metodo }} />)
            ) : (
              <Typography sx={{ py: 4, textAlign: 'center', fontSize: '0.85rem', color: COLORS.muted }}>Sin ventas registradas</Typography>
            )}
          </Box>
        </Box>
      </Collapse>
    </Panel>
  );
};

export default VentasDelDia;
