import axios from 'axios';
import { clearSession, getToken } from '../auth/session';

// Cliente único para el API (conitos-central-api). La URL sale de VITE_API_URL (.env.*)
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token vencido o inválido: se cierra la sesión y se manda a login
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      clearSession();
      window.location.replace(`${import.meta.env.BASE_URL}login`);
    }
    return Promise.reject(error);
  }
);

// Mensaje legible de un error del API ({ messages: { campo|error: texto } }) o de red
export const mensajeDeError = (error, porDefecto = 'Ocurrió un error inesperado. Intenta de nuevo.') => {
  if (!error.response) return 'No hay conexión con el servidor. Revisa tu red e intenta de nuevo.';
  const mensajes = error.response.data?.messages;
  return mensajes ? Object.values(mensajes)[0] : porDefecto;
};

export default axiosClient;
