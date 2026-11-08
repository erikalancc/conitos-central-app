import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';

/**
 * Campo de temperatura en °C que acepta negativos.
 * - Se puede escribir "-" con teclado físico.
 * - El botón ± cambia el signo (el teclado numérico de celulares y tablets no trae "-").
 * value / onChange trabajan con texto ("-18.5", "", "-"), para no perder lo que se está escribiendo.
 */
const limpiarTemperatura = (texto) => {
  const negativo = texto.trim().startsWith('-');
  let numero = texto.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const punto = numero.indexOf('.');
  if (punto !== -1) numero = numero.slice(0, punto + 1) + numero.slice(punto + 1).replace(/\./g, '').slice(0, 2);
  return (negativo ? '-' : '') + numero.slice(0, 6);
};

const cambiarSigno = (texto) => (texto.startsWith('-') ? texto.slice(1) : `-${texto}`);

const CampoTemperatura = ({ value, onChange, inicio, slotProps, ...props }) => (
  <TextField
    {...props}
    value={value}
    onChange={(e) => onChange(limpiarTemperatura(e.target.value))}
    slotProps={{
      ...slotProps,
      htmlInput: { inputMode: 'decimal', autoComplete: 'off', ...slotProps?.htmlInput },
      input: {
        startAdornment: (
          <InputAdornment position="start" sx={{ gap: 0.5, mr: 0.5 }}>
            <Tooltip title="Cambiar signo (+/−)">
              <IconButton
                size="small"
                edge="start"
                aria-label="Cambiar signo de la temperatura"
                onMouseDown={(e) => e.preventDefault()} // no quita el foco del campo
                onClick={() => onChange(cambiarSigno(value ?? ''))}
                sx={{ width: 30, height: 30, fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}
              >
                ±
              </IconButton>
            </Tooltip>
            {inicio}
          </InputAdornment>
        ),
        endAdornment: <InputAdornment position="end">°C</InputAdornment>,
        ...slotProps?.input,
      },
    }}
  />
);

export default CampoTemperatura;
