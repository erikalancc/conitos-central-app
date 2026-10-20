import { useState } from 'react';
import { Alert, Box, Snackbar } from '@mui/material';
import { getSession } from '../auth/session';
import { obtenerChecklistDelTurno } from '../services/checklistService';
import AccesosRapidos from './inicio/AccesosRapidos';
import AperturaCaja from './inicio/AperturaCaja';
import Bienvenida from './inicio/Bienvenida';
import ChecklistApertura from './inicio/ChecklistApertura';
import PromoCard from './inicio/PromoCard';
import Protocolo from './inicio/Protocolo';
import TopVentas from './inicio/TopVentas';

const GAP = { xs: 2, md: 3 };

const Inicio = () => {
  const user = getSession();
  // El checklist se abre al entrar si aún no se registra en este turno
  const [checklistAbierto, setChecklistAbierto] = useState(() => !obtenerChecklistDelTurno());
  const [aviso, setAviso] = useState(false);

  const handleChecklistGuardado = () => {
    setChecklistAbierto(false);
    setAviso(true);
  };

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
          <AperturaCaja />
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

      <ChecklistApertura
        open={checklistAbierto}
        user={user}
        onClose={() => setChecklistAbierto(false)}
        onSaved={handleChecklistGuardado}
      />

      <Snackbar
        open={aviso}
        autoHideDuration={3000}
        onClose={() => setAviso(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setAviso(false)}>
          Checklist de apertura guardado. Ya puedes abrir caja.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Inicio;
