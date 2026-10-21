import axiosClient from '../api/axiosClient';

// GET /checklist/apertura — { fecha, items, registro } (registro es null si hoy no se ha hecho)
export const obtenerChecklistApertura = async () => {
  const { data } = await axiosClient.get('/checklist/apertura');
  return data.data;
};

// POST /checklist/apertura — payload: { respuestas: [{ id_item, cumplido, valor?, temperaturas? }], comentarios }
export const guardarChecklist = async (payload) => {
  const { data } = await axiosClient.post('/checklist/apertura', payload);
  return data.data;
};

// POST /checklist/apertura/omitir — queda pendiente de autorización de un supervisor
export const omitirChecklist = async () => {
  const { data } = await axiosClient.post('/checklist/apertura/omitir');
  return data.data;
};
