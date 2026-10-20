import { useCallback, useState } from 'react';

const leerGuardado = (clave, inicial) => {
  try {
    const valor = Number(localStorage.getItem(clave));
    return valor > 0 ? valor : inicial;
  } catch {
    return inicial;
  }
};

// Ancho de un panel lateral (anclado a la derecha) que se ajusta arrastrando su borde izquierdo.
// El ancho elegido se recuerda en la terminal.
const useAnchoAjustable = ({ clave, inicial, min, maxProporcion = 0.6 }) => {
  const [ancho, setAncho] = useState(() => leerGuardado(clave, inicial));

  const limitar = useCallback(
    (valor) => Math.round(Math.min(Math.max(valor, min), window.innerWidth * maxProporcion)),
    [min, maxProporcion]
  );

  const guardar = useCallback(
    (valor) => {
      try {
        localStorage.setItem(clave, String(valor));
      } catch {
        // Sin almacenamiento: el ancho solo dura la sesión actual
      }
    },
    [clave]
  );

  const iniciarArrastre = useCallback(
    (e) => {
      e.preventDefault();
      const inicioX = e.clientX;
      const anchoInicial = ancho;
      let ultimo = anchoInicial;

      const mover = (ev) => {
        ultimo = limitar(anchoInicial + (inicioX - ev.clientX));
        setAncho(ultimo);
      };
      const soltar = () => {
        window.removeEventListener('pointermove', mover);
        window.removeEventListener('pointerup', soltar);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        guardar(ultimo);
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', mover);
      window.addEventListener('pointerup', soltar);
    },
    [ancho, limitar, guardar]
  );

  // Teclado (accesibilidad): flechas ajustan 20px
  const ajustarConTeclado = useCallback(
    (e) => {
      const delta = { ArrowLeft: 20, ArrowRight: -20 }[e.key];
      if (!delta) return;
      e.preventDefault();
      const nuevo = limitar(ancho + delta);
      setAncho(nuevo);
      guardar(nuevo);
    },
    [ancho, limitar, guardar]
  );

  const restablecer = useCallback(() => {
    setAncho(inicial);
    guardar(inicial);
  }, [inicial, guardar]);

  return { ancho: limitar(ancho), iniciarArrastre, ajustarConTeclado, restablecer };
};

export default useAnchoAjustable;
