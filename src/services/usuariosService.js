import axiosClient from '../api/axiosClient';

// Catálogo de usuarios (solo Administrador). Cada respuesta trae el listado completo:
// { usuarios, yo, roles, sucursales } (+ id en las escrituras)

// GET /admin/usuarios
export const obtenerUsuarios = async () => {
  const { data } = await axiosClient.get('/admin/usuarios');
  return data.data;
};

// POST /admin/usuarios
export const crearUsuario = async (datos) => {
  const { data } = await axiosClient.post('/admin/usuarios', datos);
  return data.data;
};

// PUT /admin/usuarios/{id} — cambios parciales; sin "password" se conserva la actual
export const actualizarUsuario = async (id, datos) => {
  const { data } = await axiosClient.put(`/admin/usuarios/${id}`, datos);
  return data.data;
};

// DELETE /admin/usuarios/{id} — solo si nunca ha operado
export const eliminarUsuario = async (id) => {
  const { data } = await axiosClient.delete(`/admin/usuarios/${id}`);
  return data.data;
};
