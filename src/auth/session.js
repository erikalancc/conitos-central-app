// Sesión guardada en localStorage. Cuando exista el API, el token vendrá del login real.
const USER_KEY = 'user';
const TOKEN_KEY = 'token';

export const getSession = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    return token && user ? user : null;
  } catch {
    return null;
  }
};

export const saveSession = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, user.token);
};

export const clearSession = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
};
