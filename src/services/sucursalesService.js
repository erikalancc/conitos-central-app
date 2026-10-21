import axiosClient from '../api/axiosClient';

// Sucursales y sus terminales POS (solo Administrador). Cada respuesta trae el listado completo:
// { sucursales, siguiente_codigo, usuarios, resumen } (+ id en las escrituras)

// GET /admin/sucursales
export const obtenerSucursales = async () => {
  const { data } = await axiosClient.get('/admin/sucursales');
  return data.data;
};

// POST /admin/sucursales
export const crearSucursal = async (datos) => {
  const { data } = await axiosClient.post('/admin/sucursales', datos);
  return data.data;
};

// PUT /admin/sucursales/{id} — acepta cambios parciales
export const actualizarSucursal = async (id, datos) => {
  const { data } = await axiosClient.put(`/admin/sucursales/${id}`, datos);
  return data.data;
};

// DELETE /admin/sucursales/{id} — la matriz no se puede borrar
export const eliminarSucursal = async (id) => {
  const { data } = await axiosClient.delete(`/admin/sucursales/${id}`);
  return data.data;
};
