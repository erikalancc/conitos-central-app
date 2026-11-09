import { useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

// Los errores se quedan más tiempo en pantalla para alcanzar a leerlos
const DURACION = { success: 3000, info: 4500, error: 6000 };

/**
 * Mensaje de resultado, siempre arriba al centro: verde = éxito, rojo = error, azul = aviso informativo.
 * aviso: { texto, tipo } (con avisoExito / avisoError / avisoInfo de utils/aviso) o null para ocultarlo.
 */
const Aviso = ({ aviso, onClose }) => {
  // Mientras se oculta (animación de salida) se sigue mostrando el último mensaje
  const [ultimo, setUltimo] = useState(aviso);
  if (aviso && (aviso.texto !== ultimo?.texto || aviso.tipo !== ultimo?.tipo)) setUltimo(aviso);
  const visible = aviso ?? ultimo;

  const cerrar = (_evento, motivo) => {
    if (motivo !== 'clickaway') onClose();
  };

  if (!visible) return null;

  return (
    <Snackbar
      open={Boolean(aviso)}
      autoHideDuration={DURACION[visible.tipo] ?? 4000}
      onClose={cerrar}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ top: { xs: 72, sm: 80 } }}
    >
      <Alert severity={visible.tipo} variant="filled" onClose={onClose} sx={{ width: '100%', maxWidth: 560, boxShadow: 6, fontWeight: 600 }}>
        {visible.texto}
      </Alert>
    </Snackbar>
  );
};

export default Aviso;
