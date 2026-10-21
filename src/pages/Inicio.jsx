import { useEffect, useState } from 'react';
import { Alert, Box, Snackbar } from '@mui/material';
import { mensajeDeError } from '../api/axiosClient';
import { puedeEntrar } from '../auth/roles';
import { getSession } from '../auth/session';
import { obtenerChecklistApertura } from '../services/checklistService';
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
  const [checklistItems, setChecklistItems] = useState(null);
  const [checklistAbierto, setChecklistAbierto] = useState(false);
  const [aviso, setAviso] = useState(false);
  const [errorChecklist, setErrorChecklist] = useState('');

  // El checklist se abre al entrar si hoy aún no se registra (ni completado ni omitido)
  useEffect(() => {
    let vigente = true;
    obtenerChecklistApertura()
      .then(({ items, registro }) => {
        if (!vigente) return;
        setChecklistItems(items);
        setChecklistAbierto(!registro);
      })
      .catch((err) => vigente && setErrorChecklist(mensajeDeError(err, 'No se pudo consultar el checklist de apertura.')));
    return () => {
      vigente = false;
    };
  }, []);

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

      {checklistItems && (
        <ChecklistApertura
          open={checklistAbierto}
          items={checklistItems}
          user={user}
          onClose={() => setChecklistAbierto(false)}
          onSaved={handleChecklistGuardado}
        />
      )}

      <Snackbar open={Boolean(errorChecklist)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" variant="filled" onClose={() => setErrorChecklist('')}>
          {errorChecklist}
        </Alert>
      </Snackbar>

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
