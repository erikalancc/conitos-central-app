import { Button, Typography } from '@mui/material';
import { ArrowBack, ConstructionOutlined } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import IconTile from '../components/IconTile';
import Panel from '../components/Panel';
import { COLORS } from '../theme';

// Vista temporal para las secciones que aún no se diseñan
const EnConstruccion = ({ titulo }) => (
  <Panel sx={{ maxWidth: 560, mx: 'auto', mt: { xs: 2, md: 6 }, p: { xs: 3, md: 5 }, textAlign: 'center' }}>
    <IconTile bg={COLORS.yellowSoft} color="#8a6d00" size={64} sx={{ mx: 'auto', mb: 2 }}>
      <ConstructionOutlined sx={{ fontSize: 32 }} />
    </IconTile>
    <Typography component="h1" sx={{ fontWeight: 700, fontSize: '1.5rem', color: COLORS.ink }}>
      {titulo}
    </Typography>
    <Typography sx={{ mt: 1, mb: 3, color: COLORS.muted }}>Esta pantalla está en construcción.</Typography>
    <Button
      component={Link}
      to="/inicio"
      startIcon={<ArrowBack />}
      variant="contained"
      disableElevation
      sx={{ minHeight: 48, px: 3, borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}
    >
      Volver al inicio
    </Button>
  </Panel>
);

export default EnConstruccion;
