// Mensajes de resultado para <Aviso>: verde = éxito, rojo = error, azul = aviso informativo
export const avisoExito = (texto) => ({ texto, tipo: 'success' });
export const avisoError = (texto) => ({ texto, tipo: 'error' });
export const avisoInfo = (texto) => ({ texto, tipo: 'info' });
