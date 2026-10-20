import { TERMINAL, TURNO } from '../data/dummy';

// Simulación del API: guarda en localStorage. Cuando exista el backend,
// reemplazar el cuerpo de cada función por la llamada con axiosClient.
const STORAGE_KEY = 'checklistApertura';

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Identifica el checklist del día/turno/terminal actual (fecha local AAAA-MM-DD)
const claveTurno = () => `${new Date().toLocaleDateString('en-CA')}-T${TURNO.numero}-${TERMINAL.numero}`;

const leer = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

// Devuelve el registro (guardado u omitido) del turno actual, o null si no existe
export const obtenerChecklistDelTurno = () => {
  const registro = leer();
  return registro?.clave === claveTurno() ? registro : null;
};

// TODO API: axiosClient.post('/checklist-apertura', payload)
export const guardarChecklist = async (payload) => {
  await esperar(700);
  const registro = { ...payload, clave: claveTurno(), estado: 'completado', guardadoEn: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registro));
  return registro;
};

// TODO API: registrar la omisión para que un supervisor la autorice
export const omitirChecklist = async (usuarioId) => {
  const registro = { clave: claveTurno(), estado: 'omitido', usuarioId, guardadoEn: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registro));
  return registro;
};
