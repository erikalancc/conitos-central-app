import { Box, Chip, InputBase, Typography } from '@mui/material';
import { CreditCard } from '@mui/icons-material';
import IconTile from '../../components/IconTile';
import Panel from '../../components/Panel';
import { COLORS } from '../../theme';
import { formatMoney } from '../../utils/format';
import { estadoDiferencia, subtituloSx, tituloSeccionSx } from './estilos';
import MontoInput from './MontoInput';

// Compara lo cobrado con tarjeta en el POS contra el cierre de lote de la terminal bancaria
const ConciliacionTarjeta = ({ sistema, transacciones, terminal, onTerminal }) => {
  // Sin ventas con tarjeta no hay nada que conciliar
  const capturado = terminal.monto > 0 || sistema === 0;
  const diferencia = capturado ? Math.round((terminal.monto - sistema) * 100) / 100 : 0;
  const estado = estadoDiferencia(diferencia);
  const vouchersDiferentes = terminal.vouchers > 0 && terminal.vouchers !== transacciones;

  return (
    <Panel sx={{ p: { xs: 2, md: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <IconTile bg={COLORS.blueSoft} color={COLORS.blueText} size={44}>
          <CreditCard />
        </IconTile>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" sx={tituloSeccionSx}>
            Conciliación de tarjeta
          </Typography>
          <Typography sx={subtituloSx}>Captura el cierre de lote de la terminal bancaria</Typography>
        </Box>
        <Chip
          size="small"
          label={capturado ? 'Capturado' : 'Pendiente'}
          sx={{ fontWeight: 600, backgroundColor: capturado ? COLORS.blueSoft : COLORS.inputBg, color: capturado ? COLORS.blueText : COLORS.label }}
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 96px', gap: 1, mt: 2 }}>
        <Box>
          <Typography component="label" htmlFor="total-terminal" sx={{ display: 'block', mb: 0.5, fontSize: '0.78rem', color: COLORS.label }}>
            Total del cierre de lote
          </Typography>
          <MontoInput id="total-terminal" value={terminal.monto} onChange={(monto) => onTerminal({ ...terminal, monto })} />
        </Box>
        <Box>
          <Typography component="label" htmlFor="vouchers-terminal" sx={{ display: 'block', mb: 0.5, fontSize: '0.78rem', color: COLORS.label }}>
            Vouchers
          </Typography>
          <InputBase
            id="vouchers-terminal"
            value={terminal.vouchers || ''}
            placeholder="0"
            onChange={(e) => onTerminal({ ...terminal, vouchers: Number(e.target.value.replace(/\D/g, '').slice(0, 4)) || 0 })}
            slotProps={{ input: { inputMode: 'numeric', style: { textAlign: 'center' } } }}
            sx={{
              width: '100%',
              minHeight: 52,
              borderRadius: 2.5,
              border: `1px solid ${COLORS.border}`,
              fontSize: '1.2rem',
              fontWeight: 700,
              '&.Mui-focused': { borderColor: COLORS.blue, boxShadow: `0 0 0 1px ${COLORS.blue}` },
            }}
          />
        </Box>
      </Box>

      <Box sx={{ mt: 2, p: 2, borderRadius: 3, backgroundColor: '#f8fafc', border: `1px solid ${COLORS.border}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: COLORS.label }}>
          <span>Cobrado con tarjeta (sistema)</span>
          <Typography component="span" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {formatMoney(sistema)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75, fontSize: '0.85rem', color: vouchersDiferentes ? '#a16207' : COLORS.muted }}>
          <span>Ventas con tarjeta / vouchers</span>
          <span>
            {transacciones} / {terminal.vouchers || '—'}
          </span>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1.5,
            px: 1.5,
            py: 1.25,
            borderRadius: 2,
            backgroundColor: capturado ? estado.bg : COLORS.inputBg,
            color: capturado ? estado.color : COLORS.muted,
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>{capturado ? `Tarjeta ${estado.label.toLowerCase()}` : 'Sin capturar'}</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', fontVariantNumeric: 'tabular-nums' }}>
            {diferencia > 0 ? '+' : ''}
            {formatMoney(diferencia)}
          </Typography>
        </Box>
      </Box>
    </Panel>
  );
};

export default ConciliacionTarjeta;
