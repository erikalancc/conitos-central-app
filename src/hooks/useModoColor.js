import { createContext, useContext } from 'react';

const CLAVE = 'conitos.tema';

// Modo inicial: el que se eligió antes en este equipo, o el del sistema operativo
export const modoInicial = () => {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === 'claro' || guardado === 'oscuro') return guardado;
  } catch {
    // Sin almacenamiento: se usa el del sistema
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
};

export const guardarModo = (modo) => {
  try {
    localStorage.setItem(CLAVE, modo);
  } catch {
    // Sin almacenamiento: el modo dura solo esta sesión
  }
};

export const ModoColorContext = createContext({ modo: 'claro', alternar: () => {} });

// { modo: 'claro' | 'oscuro', alternar }
const useModoColor = () => useContext(ModoColorContext);

export default useModoColor;
