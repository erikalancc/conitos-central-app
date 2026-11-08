import { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { mensajeDeError } from '../../api/axiosClient';
import { ROLES } from '../../auth/roles';
import { getSession } from '../../auth/session';
import { obtenerChecklistApertura } from '../../services/checklistService';
import ChecklistApertura from './ChecklistApertura';

/**
 * Checklist de apertura obligatorio para el Vendedor / Cajero, en cualquier pantalla:
 * si hoy su sucursal aún no tiene un checklist COMPLETADO, se muestra sin opción de cerrar ni omitir
 * hasta que lo guarde. Se revisa al entrar y al cambiar de pantalla (así también aparece al iniciar
 * un nuevo día sin cerrar sesión). A los demás roles no se les pide.
 */
const ChecklistObligatorio = () => {
  const user = getSession();
  const esVendedor = user?.id_rol === ROLES.CAJERO;
  const { pathname } = useLocation();

  const [checklist, setChecklist] = useState(null); // { fecha, sucursal, items }
  const [completadoEl, setCompletadoEl] = useState(null); // fecha ya completada (evita consultar de nuevo ese día)
  const [aviso, setAviso] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const hoy = new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD local
    if (!esVendedor || completadoEl === hoy) return undefined;

    let vigente = true;
    obtenerChecklistApertura()
      .then(({ fecha, sucursal, items, registro }) => {
        if (!vigente) return;
        if (registro?.estado === 'COMPLETADO') {
          setCompletadoEl(fecha);
          setChecklist(null);
        } else {
          // Un checklist "omitido" de antes también debe completarse
          setChecklist((actual) => (actual?.fecha === fecha ? actual : { fecha, sucursal, items }));
        }
      })
      .catch((err) => vigente && setError(mensajeDeError(err, 'No se pudo consultar el checklist de apertura.')));
    return () => {
      vigente = false;
    };
  }, [esVendedor, pathname, completadoEl]);

  if (!esVendedor) return null;

  return (
    <>
      {checklist && (
        <ChecklistApertura
          key={checklist.fecha}
          open
          obligatorio
          items={checklist.items}
          sucursal={checklist.sucursal}
          user={user}
          onClose={() => {}}
          onSaved={() => {
            setCompletadoEl(checklist.fecha);
            setChecklist(null);
            setAviso(true);
          }}
        />
      )}

      <Snackbar open={Boolean(error)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" variant="filled" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={aviso} autoHideDuration={3000} onClose={() => setAviso(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setAviso(false)}>
          Checklist de apertura guardado. Ya puedes abrir caja.
        </Alert>
      </Snackbar>
    </>
  );
};

export default ChecklistObligatorio;
