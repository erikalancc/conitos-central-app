import { Box, Chip, Skeleton, Typography } from '@mui/material';
import { StorefrontOutlined } from '@mui/icons-material';
import { COLORS } from '../../theme';

// Una sucursal a la vez: elegir otra recarga el historial solo con sus ventas y cortes
const SelectorSucursal = ({ sucursales, valor, onCambiar }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: COLORS.muted }}>
      <StorefrontOutlined sx={{ fontSize: 18 }} />
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: 0.6 }}>SUCURSAL</Typography>
    </Box>
    {sucursales === null
      ? [0, 1].map((i) => <Skeleton key={i} variant="rounded" width={140} height={32} sx={{ borderRadius: 4 }} />)
      : sucursales.map((s) => {
          const elegida = s.id === valor;
          return (
            <Chip
              key={s.id}
              label={s.activo ? s.nombre : `${s.nombre} (inactiva)`}
              onClick={() => !elegida && onCambiar(s.id)}
              aria-pressed={elegida}
              sx={{
                minHeight: 36,
                fontWeight: 700,
                borderRadius: 4,
                border: `1px solid ${elegida ? COLORS.blueText : COLORS.border}`,
                backgroundColor: elegida ? COLORS.blueSoft : COLORS.surface,
                color: elegida ? COLORS.blueText : COLORS.label,
                '&:hover': { backgroundColor: elegida ? COLORS.blueSoft : COLORS.inputBg },
              }}
            />
          );
        })}
  </Box>
);

export default SelectorSucursal;
