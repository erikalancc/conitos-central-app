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

// POST /admin/productos/{id}/imagen — multipart (JPG/JPEG/PNG, máx. 5 MB); responde { id, catalogo }
export const subirImagenProducto = async (id, archivo) => {
  const formulario = new FormData();
  formulario.append('imagen', archivo);
  const { data } = await axiosClient.post(`/admin/productos/${id}/imagen`, formulario, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

// DELETE /admin/productos/{id}/imagen — quita la imagen; responde { id, catalogo }
export const quitarImagenProducto = async (id) => {
  const { data } = await axiosClient.delete(`/admin/productos/${id}/imagen`);
  return data.data;
};

// DELETE /admin/{recurso}/{id} — 409 si ya tiene ventas (hay que desactivarlo)
export const eliminarRegistro = async (recurso, id) => {
  const { data } = await axiosClient.delete(`/admin/${recurso}/${id}`);
  return data.data;
};
