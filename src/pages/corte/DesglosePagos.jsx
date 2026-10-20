import { Box, Typography } from '@mui/material';
import { CreditCard, PaymentsOutlined, QrCode2, StorefrontOutlined, AccountBalanceOutlined } from '@mui/icons-material';
import IconTile from '../../components/IconTile';
import Panel from '../../components/Panel';
import { COLORS } from '../../theme';
import { formatMoney } from '../../utils/format';
import { COLOR_METODO, subtituloSx, tituloSeccionSx } from './estilos';

const ICONOS = { efectivo: <PaymentsOutlined />, tarjeta: <CreditCard />, spei: <QrCode2 /> };

// A dónde llega el dinero de cada forma de pago
const DESTINO = {
  efectivo: { icono: <StorefrontOutlined sx={{ fontSize: 16 }} />, texto: 'Debe estar en la gaveta' },
  tarjeta: { icono: <AccountBalanceOutlined sx={{ fontSize: 16 }} />, texto: 'Se deposita por el banco' },
  spei: { icono: <AccountBalanceOutlined sx={{ fontSize: 16 }} />, texto: 'Transferencia a cuenta' },
};

const DesglosePagos = ({ resumen }) => {
  const { porMetodo, neto } = resumen;

  return (
    <Panel sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography component="h2" sx={tituloSeccionSx}>
            Desglose por forma de pago
          </Typography>
          <Typography sx={subtituloSx}>El efectivo se cuenta en gaveta; la tarjeta se concilia con la terminal bancaria</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.85rem', color: COLORS.label }}>
          Total: <strong>{formatMoney(neto)}</strong>
        </Typography>
      </Box>

      {/* Barra de proporción */}
      <Box sx={{ display: 'flex', height: 12, mt: 2, borderRadius: 6, overflow: 'hidden', backgroundColor: COLORS.inputBg }}>
        {porMetodo
          .filter((m) => m.total > 0)
          .map((m) => (
            <Box key={m.id} title={`${m.label}: ${m.porcentaje.toFixed(1)}%`} sx={{ width: `${m.porcentaje}%`, backgroundColor: COLOR_METODO[m.id]?.barra }} />
          ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          mt: 2,
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: `repeat(${porMetodo.length}, minmax(0, 1fr))` },
        }}
      >
        {porMetodo.map((m) => {
          const color = COLOR_METODO[m.id] ?? COLOR_METODO.tarjeta;
          return (
            <Box
              key={m.id}
              sx={{
                p: 2,
                borderRadius: 3,
                border: `1px solid ${COLORS.border}`,
                borderTop: `4px solid ${color.barra}`,
                backgroundColor: '#fbfcfd',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <IconTile bg={color.suave} color={color.fuerte} size={40}>
                  {ICONOS[m.id]}
                </IconTile>
                <Typography sx={{ flex: 1, fontWeight: 700, color: COLORS.ink }}>{m.label}</Typography>
                <Typography sx={{ px: 1, py: 0.25, borderRadius: 1.5, fontSize: '0.75rem', fontWeight: 600, color: COLORS.label, backgroundColor: COLORS.inputBg }}>
                  {m.transacciones} venta{m.transacciones === 1 ? '' : 's'}
                </Typography>
              </Box>
              <Typography sx={{ mt: 1.5, fontWeight: 800, fontSize: { xs: '1.6rem', md: '1.8rem' }, color: color.fuerte, fontVariantNumeric: 'tabular-nums' }}>
                {formatMoney(m.total)}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, fontSize: '0.78rem', color: COLORS.muted }}>
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {DESTINO[m.id]?.icono}
                  {DESTINO[m.id]?.texto}
                </Box>
                <span>{m.porcentaje.toFixed(1)}%</span>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Panel>
  );
};

export default DesglosePagos;
