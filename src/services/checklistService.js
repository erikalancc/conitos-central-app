import axiosClient from '../api/axiosClient';

// Momentos del checklist operativo: apertura (al iniciar el día), medio-turno (desde la mitad del
// horario de la sucursal) y cierre (antes del corte de caja)

// GET /checklist/{momento} — { fecha, momento, sucursal, disponible, disponible_desde, items, registro }
export const obtenerChecklist = async (momento) => {
  const { data } = await axiosClient.get(`/checklist/${momento}`);
  return data.data;
};

// POST /checklist/{momento} — payload: { respuestas: [{ id_item, cumplido, valor?, temperaturas? }], comentarios }
export const guardarChecklist = async (momento, payload) => {
  const { data } = await axiosClient.post(`/checklist/${momento}`, payload);
  return data.data;
};

// ¿Hay que llenarlo ahora? Tiene puntos, ya está disponible y hoy no se ha completado
export const checklistPendiente = (checklist) => checklist.items.length > 0 && checklist.disponible && checklist.registro?.estado !== 'COMPLETADO';

// ----- Administración (solo Administrador) -----

// GET /admin/checklist — { items, sucursales }
export const obtenerChecklistAdmin = async () => {
  const { data } = await axiosClient.get('/admin/checklist');
  return data.data;
};

// POST /admin/checklist o PUT /admin/checklist/{id} — responde { id, items, sucursales }
export const guardarPuntoChecklist = async (id, punto) => {
  const { data } = id ? await axiosClient.put(`/admin/checklist/${id}`, punto) : await axiosClient.post('/admin/checklist', punto);
  return data.data;
};

// DELETE /admin/checklist/{id} — 409 si ya tiene checklists registrados (hay que desactivarlo)
export const eliminarPuntoChecklist = async (id) => {
  const { data } = await axiosClient.delete(`/admin/checklist/${id}`);
  return data.data;
};
