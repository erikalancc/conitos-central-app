import { Box, Typography } from '@mui/material';
import { Icecream } from '@mui/icons-material';
import Panel from '../../components/Panel';
import { TOP_VENTAS } from '../../data/dummy';
import { COLORS } from '../../theme';
import { formatMoney } from '../../utils/format';

// Fondos de miniatura mientras no existan fotos de producto
const MINIATURAS = [
  'linear-gradient(135deg, #fde2e4, #f8b4c0)',
  'linear-gradient(135deg, #ffe8b3, #ffb347)',
  'linear-gradient(135deg, #ead7c7, #a47551)',
];

const TopVentas = () => (
  <Panel component="section">
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
      <Typography component="h2" sx={{ fontWeight: 600, fontSize: '1.1rem', color: COLORS.ink }}>
        Top Ventas Ayer
      </Typography>
      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', color: COLORS.blueText }}>Ranking</Typography>
    </Box>

    <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {TOP_VENTAS.map((producto, index) => (
        <Box component="li" key={producto.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              flexShrink: 0,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              background: MINIATURAS[index % MINIATURAS.length],
              color: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <Icecream sx={{ fontSize: 30 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.92rem', color: COLORS.ink }}>{producto.nombre}</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: COLORS.muted }}>
              {producto.vendidos} vendidos · {formatMoney(producto.precio)} c/u
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', color: COLORS.blueText, pr: 1 }}>#{index + 1}</Typography>
        </Box>
      ))}
    </Box>
  </Panel>
);

export default TopVentas;
