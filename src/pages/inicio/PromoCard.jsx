import { Box, Chip, Typography } from '@mui/material';
import { Campaign } from '@mui/icons-material';
import { PROMO } from '../../data/dummy';
import { COLORS } from '../../theme';

const PromoCard = () => (
  <Box
    component="section"
    sx={{
      p: { xs: 2, md: 2.5 },
      borderRadius: 3,
      backgroundColor: COLORS.yellow,
      color: '#5c4a00',
      boxShadow: '0 4px 14px rgba(251, 225, 0, 0.35)',
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
      <Chip
        size="small"
        icon={<Campaign sx={{ fontSize: '1rem !important', color: '#8a6d00 !important' }} />}
        label={PROMO.etiqueta.toUpperCase()}
        sx={{ backgroundColor: 'rgba(138, 109, 0, 0.12)', color: '#6b5400', fontWeight: 700, fontSize: '0.7rem' }}
      />
      <Typography sx={{ fontWeight: 700, fontSize: '0.78rem' }}>{PROMO.horario}</Typography>
    </Box>
    <Typography component="h2" sx={{ mt: 1.5, fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.45rem' }, color: '#3d3100' }}>
      {PROMO.titulo}
    </Typography>
    <Typography sx={{ mt: 0.5, fontSize: '0.85rem', color: '#8a6d00' }}>{PROMO.descripcion}</Typography>
  </Box>
);

export default PromoCard;
