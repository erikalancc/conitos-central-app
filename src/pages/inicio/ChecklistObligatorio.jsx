import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { mensajeDeError } from '../../api/axiosClient';
import Aviso from '../../components/Aviso';
import { avisoError, avisoExito } from '../../utils/aviso';
import { ROLES } from '../../auth/roles';
import { getSession } from '../../auth/session';
import { checklistPendiente, obtenerChecklist } from '../../services/checklistService';
import ChecklistApertura from './ChecklistApertura';

// Momentos que se piden solos (el de "antes del corte" lo pide Corte de Caja al iniciar el corte)
const AUTOMATICOS = ['apertura', 'medio-turno'];
const REVISAR_CADA_MS = 5 * 60 * 1000;

/**
 * Checklist obligatorio para el Vendedor / Cajero, en cualquier pantalla:
 * - apertura: al iniciar el día;
 * - medio-turno: desde la mitad del horario de su sucursal.
 * Solo se pide si el momento tiene puntos configurados (Administración → Checklist operativo) y
 * no se puede cerrar hasta guardarlo. Se revisa al cambiar de pantalla y cada 5 minutos.
 */
const ChecklistObligatorio = () => {
  const user = getSession();
  const esVendedor = user?.id_rol === ROLES.CAJERO;
  const { pathname } = useLocation();

  const [pendiente, setPendiente] = useState(null); // checklist a llenar ahora (respuesta del API)
  const [revision, setRevision] = useState(0);
  const [aviso, setAviso] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!esVendedor) return undefined;
    const id = setInterval(() => setRevision((r) => r + 1), REVISAR_CADA_MS);
    return () => clearInterval(id);
  }, [esVendedor]);

  useEffect(() => {
    if (!esVendedor || pendiente) return undefined;
    let vigente = true;
    (async () => {
      try {
        // En orden: primero la apertura y después la de mitad del turno
        for (const momento of AUTOMATICOS) {
          const checklist = await obtenerChecklist(momento);
          if (!vigente) return;
          if (checklistPendiente(checklist)) {
            setPendiente(checklist);
            return;
          }
        }
      } catch (err) {
        if (vigente) setError(mensajeDeError(err, 'No se pudo consultar el checklist.'));
      }
    })();
    return () => {
      vigente = false;
    };
  }, [esVendedor, pathname, revision, pendiente]);

  if (!esVendedor) return null;

  return (
    <>
      {pendiente && (
        <ChecklistApertura
          key={`${pendiente.fecha}-${pendiente.momento}`}
          open
          obligatorio
          momento={pendiente.momento}
          items={pendiente.items}
          sucursal={pendiente.sucursal}
          user={user}
          onSaved={() => {
            setPendiente(null); // vuelve a revisar: puede faltar el siguiente momento
            setAviso(true);
          }}
        />
      )}

      <Aviso aviso={error ? avisoError(error) : null} onClose={() => setError('')} />
      <Aviso aviso={aviso ? avisoExito('Checklist guardado.') : null} onClose={() => setAviso(false)} />
    </>
  );
};

export default ChecklistObligatorio;
