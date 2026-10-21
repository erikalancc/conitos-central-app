import axiosClient from '../api/axiosClient';

// Recursos: categorias | productos | sabores | extras | promociones (solo Administrador)

// GET /admin/catalogo — catálogo completo, incluido lo inactivo
export const obtenerCatalogoAdmin = async () => {
  const { data } = await axiosClient.get('/admin/catalogo');
  return data.data;
};

// POST /admin/{recurso} — responde { id, catalogo }
export const crearRegistro = async (recurso, datos) => {
  const { data } = await axiosClient.post(`/admin/${recurso}`, datos);
  return data.data;
};

// PUT /admin/{recurso}/{id} — acepta cambios parciales; responde { id, catalogo }
export const actualizarRegistro = async (recurso, id, datos) => {
  const { data } = await axiosClient.put(`/admin/${recurso}/${id}`, datos);
  return data.data;
};

// DELETE /admin/{recurso}/{id} — 409 si ya tiene ventas (hay que desactivarlo)
export const eliminarRegistro = async (recurso, id) => {
  const { data } = await axiosClient.delete(`/admin/${recurso}/${id}`);
  return data.data;
};
