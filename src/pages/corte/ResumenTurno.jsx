import { Box, Chip, Typography } from '@mui/material';
import { LocalOfferOutlined, ReceiptLongOutlined, TrendingUp } from '@mui/icons-material';
import Panel from '../../components/Panel';
import { TERMINAL, TURNO } from '../../data/dummy';
import { COLORS } from '../../theme';
import { formatLongDate, formatMoney } from '../../utils/format';

const hora = (iso) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });

const Kpi = ({ titulo, valor, detalle, icono, color = COLORS.ink, sx }) => (
  <Panel sx={[{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 0 }, sx]}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: COLORS.label }}>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 500 }}>{titulo}</Typography>
      {icono}
    </Box>
    <Typography
      sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.75rem' }, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}
    >
      {valor}
    </Typography>
    <Typography sx={{ fontSize: '0.78rem', color: COLORS.muted }}>{detalle}</Typography>
  </Panel>
);

// Encabezado + indicadores de venta. Por defecto describe el turno en curso;
// el historial pasa su propio encabezado (etiqueta, titulo, subtitulo, chips, inicio).
const ResumenTurno = ({
  resumen,
  user,
  etiqueta = 'CORTE DE CAJA · CIERRE DEL DÍA',
  titulo = 'Resumen del turno',
  subtitulo = `${formatLongDate(new Date(resumen.desde))} · Ventas desde las ${hora(resumen.desde)} hrs`,
  chips = [
    { label: `Turno ${TURNO.nombre}`, bg: COLORS.yellowSoft, color: '#5c4a00' },
    { label: `Caja #${TERMINAL.numero} · ${user?.nombre ?? ''}`, bg: COLORS.blueSoft, color: COLORS.blueText },
  ],
  inicio,
  etiquetaNeto = 'VENTAS NETAS DEL TURNO',
}) => (
  <Box sx={{ display: 'grid', gap: { xs: 1.5, md: 2 } }}>
    <Panel
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { sm: 'center' },
        gap: 1.5,
        p: { xs: 2, md: 3 },
      }}
    >
      {inicio}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1, color: COLORS.blueText }}>{etiqueta}</Typography>
        <Typography component="h1" sx={{ mt: 0.25, fontWeight: 800, fontSize: { xs: '1.4rem', md: '1.8rem' }, color: COLORS.ink }}>
          {titulo}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: COLORS.label }}>{subtitulo}</Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {chips.map((chip) => (
          <Chip key={chip.label} label={chip.label} sx={{ fontWeight: 600, backgroundColor: chip.bg, color: chip.color }} />
        ))}
      </Box>
    </Panel>

    <Box sx={{ display: 'grid', gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' } }}>
      {/* Venta neta destacada */}
      <Panel
        sx={{
          gridColumn: { xs: '1 / -1', xl: 'span 2' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 1,
          color: '#fff',
          backgroundColor: COLORS.blueText,
          borderColor: COLORS.blueText,
        }}
      >
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: 0.8, opacity: 0.85 }}>{etiquetaNeto}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '2rem', md: '2.4rem' }, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {formatMoney(resumen.neto)}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', opacity: 0.8 }}>MXN</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.8rem', opacity: 0.85 }}>
          {resumen.tickets} ticket{resumen.tickets === 1 ? '' : 's'} · {resumen.articulos} artículo{resumen.articulos === 1 ? '' : 's'}
        </Typography>
      </Panel>

      <Kpi
        titulo="Ventas brutas"
        valor={formatMoney(resumen.bruto)}
        detalle="Antes de descuentos"
        icono={<TrendingUp fontSize="small" />}
      />
      <Kpi
        titulo="Descuentos"
        valor={resumen.descuentos ? `-${formatMoney(resumen.descuentos)}` : formatMoney(0)}
        detalle="Promociones y cupones"
        color={resumen.descuentos ? COLORS.red : COLORS.ink}
        icono={<LocalOfferOutlined fontSize="small" sx={{ color: COLORS.red }} />}
      />
      <Kpi
        titulo="Ticket promedio"
        valor={formatMoney(resumen.ticketPromedio)}
        detalle="Por cliente"
        sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}
        icono={<ReceiptLongOutlined fontSize="small" />}
      />
    </Box>
  </Box>
);

export default ResumenTurno;
