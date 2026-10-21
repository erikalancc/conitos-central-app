// Sesión guardada en localStorage: datos del usuario + token del API (POST /auth/login)
const USER_KEY = 'user';
const TOKEN_KEY = 'token';

export const clearSession = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

// Usuario de la sesión, o null si no hay sesión o el token ya venció
export const getSession = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    if (!token || !user) return null;
    if (!user.expira || new Date(user.expira) <= new Date()) {
      clearSession();
      return null;
    }
    return user;
  } catch {
    return null;
  }
};

export const getToken = () => (getSession() ? localStorage.getItem(TOKEN_KEY) : null);

export const saveSession = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, user.token);
};

// Actualiza los datos del usuario guardado (nombre, rol…) sin tocar el token
export const actualizarUsuarioSesion = (cambios) => {
  const actual = getSession();
  if (!actual) return null;
  const usuario = { ...actual, ...cambios };
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  return usuario;
};
