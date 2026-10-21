import axiosClient from '../api/axiosClient';
import { actualizarUsuarioSesion, saveSession } from '../auth/session';

// POST /auth/login — guarda la sesión ({ ...usuario, token, expira }) y la devuelve
export const login = async (usuario, password) => {
  const { data } = await axiosClient.post('/auth/login', { usuario: usuario.trim(), password });
  const sesion = { ...data.data.usuario, token: data.data.token, expira: data.data.expira };
  saveSession(sesion);
  return sesion;
};

// GET /auth/me — actualiza nombre y rol de la sesión guardada (por si un administrador los cambió)
export const refrescarSesion = async () => {
  const { data } = await axiosClient.get('/auth/me');
  return actualizarUsuarioSesion(data.data);
};
