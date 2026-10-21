import { COLORS } from '../../theme';

export const campoSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    backgroundColor: COLORS.inputBg,
    '& fieldset': { borderColor: 'transparent' },
    '&.Mui-focused fieldset': { borderColor: COLORS.blue },
    '&.Mui-error fieldset': { borderColor: COLORS.red },
  },
};

// Precio capturado como texto (permite borrar y escribir decimales); se convierte al guardar
export const limpiarPrecio = (texto) => texto.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
export const precioATexto = (valor) => (valor === null || valor === undefined ? '' : String(valor));
