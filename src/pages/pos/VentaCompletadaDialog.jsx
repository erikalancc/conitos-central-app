import { Box, Button, Dialog, Divider, Typography } from '@mui/material';
import { CheckCircle, PrintOutlined } from '@mui/icons-material';
import { METODOS_PAGO } from '../../data/catalogo';
import { COLORS } from '../../theme';
import { formatMoney } from '../../utils/format';
import { describirLinea, importeLinea } from './pedido';

const Renglon = ({ label, value, fuerte, color }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, fontSize: fuerte ? '1.1rem' : '0.92rem', fontWeight: fuerte ? 800 : 500, color }}>
    <span>{label}</span>
    <span>{value}</span>
  </Box>
);

const LineaVendida = ({ linea }) => {
  const detalle = describirLinea(linea);
  return (
    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start', py: 1 }}>
      <Box
        sx={{
          minWidth: 32,
          height: 24,
          px: 0.75,
          borderRadius: 1.5,
          display: 'grid',
          placeItems: 'center',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: COLORS.blueText,
          backgroundColor: COLORS.blueSoft,
        }}
      >
        {linea.cantidad}×
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.92rem', lineHeight: 1.3, color: COLORS.ink }}>{linea.nombre}</Typography>
        {detalle && <Typography sx={{ mt: 0.25, fontSize: '0.78rem', color: COLORS.muted }}>{detalle}</Typography>}
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap', color: COLORS.ink }}>
        {formatMoney(importeLinea(linea))}
      </Typography>
    </Box>
  );
};

const VentaCompletadaDialog = ({ venta, onImprimir, onNuevaVenta }) => (
  <Dialog open={Boolean(venta)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
    {venta && (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 56, color: '#16a34a' }} />
          <Typography component="h2" sx={{ mt: 0.5, fontWeight: 800, fontSize: '1.4rem', color: COLORS.ink }}>
            Venta completada
          </Typography>
          <Typography sx={{ color: COLORS.muted }}>
            Orden #{venta.folio} · {venta.servicio === 'aqui' ? 'Para comer aquí' : 'Para llevar'}
            {venta.cliente && ` · ${venta.cliente}`}
          </Typography>

          {venta.cambio > 0 && (
            <Box sx={{ mt: 2, p: 1.5, borderRadius: 3, backgroundColor: '#dcfce7' }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#15803d' }}>CAMBIO A ENTREGAR</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '2.2rem', color: '#15803d', lineHeight: 1.1 }}>{formatMoney(venta.cambio)}</Typography>
            </Box>
          )}
        </Box>

        {/* DETALLE DE LO VENDIDO */}
        <Typography sx={{ mt: 2, mb: 0.5, fontSize: '0.72rem', fontWeight: 700, letterSpacing: 0.6, color: COLORS.muted }}>
          DETALLE · {venta.totales.articulos} ARTÍCULO{venta.totales.articulos === 1 ? '' : 'S'}
        </Typography>
        <Box
          sx={{
            flex: 1,
            minHeight: 80,
            maxHeight: 260,
            overflowY: 'auto',
            px: 1.5,
            borderRadius: 3,
            backgroundColor: '#f8fafc',
            border: `1px solid ${COLORS.border}`,
            '& > :not(:last-child)': { borderBottom: `1px dashed ${COLORS.border}` },
          }}
        >
          {venta.lineas.map((linea) => (
            <LineaVendida key={linea.lineId} linea={linea} />
          ))}
        </Box>

        <Box sx={{ mt: 1.5, color: COLORS.label }}>
          {venta.totales.descuento > 0 && (
            <>
              <Renglon label="Subtotal" value={formatMoney(venta.totales.subtotal)} />
              <Renglon
                label={venta.descuento?.nombre ?? 'Descuento'}
                value={`-${formatMoney(venta.totales.descuento)}`}
                color={COLORS.red}
              />
            </>
          )}
          <Renglon label="Método" value={METODOS_PAGO.find((m) => m.id === venta.metodo)?.label} />
          {venta.metodo === 'efectivo' && <Renglon label="Recibido" value={formatMoney(venta.recibido)} />}
          <Divider sx={{ my: 0.5 }} />
          <Renglon label="Total cobrado" value={formatMoney(venta.totales.total)} fuerte color={COLORS.ink} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 2 }}>
          <Button
            onClick={onImprimir}
            startIcon={<PrintOutlined />}
            sx={{ minHeight: 52, borderRadius: 2.5, textTransform: 'none', fontWeight: 600, color: COLORS.label, backgroundColor: COLORS.inputBg }}
          >
            Ticket
          </Button>
          <Button
            autoFocus
            variant="contained"
            disableElevation
            onClick={onNuevaVenta}
            sx={{ minHeight: 52, borderRadius: 2.5, textTransform: 'none', fontWeight: 700, backgroundColor: COLORS.red, '&:hover': { backgroundColor: COLORS.redHover } }}
          >
            Nueva venta
          </Button>
        </Box>
      </Box>
    )}
  </Dialog>
);

export default VentaCompletadaDialog;
