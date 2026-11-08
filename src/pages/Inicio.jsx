import { Box } from '@mui/material';
import { puedeEntrar } from '../auth/roles';
import { getSession } from '../auth/session';
import AccesosRapidos from './inicio/AccesosRapidos';
import AperturaCaja from './inicio/AperturaCaja';
import Bienvenida from './inicio/Bienvenida';
import PromoCard from './inicio/PromoCard';
import Protocolo from './inicio/Protocolo';
import TopVentas from './inicio/TopVentas';

const GAP = { xs: 2, md: 3 };

// El checklist de apertura (obligatorio para Vendedor / Cajero) lo muestra AppLayout en cualquier pantalla
const Inicio = () => {
  const user = getSession();

  return (
    <Box sx={{ display: 'grid', gap: GAP }}>
      <Bienvenida user={user} />

      <Box
        sx={{
          display: 'grid',
          gap: GAP,
          alignItems: 'start',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'minmax(0, 1fr) 320px',
            lg: 'minmax(0, 1fr) 380px',
            xl: 'minmax(0, 1fr) 460px',
          },
        }}
      >
        {/* Columna principal */}
        <Box sx={{ display: 'grid', gap: GAP, minWidth: 0 }}>
          {/* Abrir caja solo para quien opera caja */}
          {puedeEntrar(user, 'corte') && <AperturaCaja />}
          <AccesosRapidos />
        </Box>

        {/* Columna lateral (en tablet vertical se reacomoda en 2 columnas) */}
        <Box
          component="aside"
          sx={{
            display: 'grid',
            gap: GAP,
            alignItems: 'start',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', md: 'minmax(0, 1fr)' },
          }}
        >
          <PromoCard />
          <TopVentas />
          <Protocolo />
        </Box>
      </Box>
    </Box>
  );
};

export default Inicio;
