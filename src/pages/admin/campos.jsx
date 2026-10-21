import { Alert, Box, Button, InputAdornment, Switch, TextField, Typography } from '@mui/material';
import { SaveOutlined } from '@mui/icons-material';
import { COLORS } from '../../theme';
import { campoSx, limpiarPrecio } from './formato';

export const Etiqueta = ({ children, htmlFor, sx }) => (
  <Typography component="label" htmlFor={htmlFor} sx={[{ display: 'block', mb: 0.5, fontSize: '0.82rem', fontWeight: 600, color: COLORS.ink }, sx]}>
    {children}
  </Typography>
);

export const CampoTexto = ({ id, label, error, sx, ...props }) => (
  <Box sx={sx}>
    {label && <Etiqueta htmlFor={id}>{label}</Etiqueta>}
    <TextField id={id} fullWidth size="small" error={Boolean(error)} helperText={error} sx={campoSx} {...props} />
  </Box>
);

export const CampoPrecio = ({ value, onChange, ...props }) => (
  <CampoTexto
    value={value}
    onChange={(e) => onChange(limpiarPrecio(e.target.value))}
    placeholder="0.00"
    slotProps={{
      htmlInput: { inputMode: 'decimal' },
      input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
    }}
    {...props}
  />
);

export const Interruptor = ({ titulo, descripcion, checked, onChange, sx }) => (
  <Box
    component="label"
    sx={[
      {
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1,
        borderRadius: 2,
        cursor: 'pointer',
        backgroundColor: COLORS.inputBg,
      },
      sx,
    ]}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: COLORS.ink }}>{titulo}</Typography>
      {descripcion && <Typography sx={{ fontSize: '0.75rem', color: COLORS.muted }}>{descripcion}</Typography>}
    </Box>
    <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />
  </Box>
);

// Errores del API que no corresponden a un campo visible del formulario
export const ErroresGenerales = ({ errores, conocidos }) => {
  const otros = Object.entries(errores ?? {}).filter(([campo]) => !conocidos.some((c) => campo === c || campo.startsWith(`${c}.`)));
  if (!otros.length) return null;
  return <Alert severity="error">{otros[0][1]}</Alert>;
};

// Fijo al pie del panel o de la hoja deslizable (compensa su padding) para que Guardar siempre se vea
export const PieFormulario = ({ guardando, onCancelar, etiqueta = 'Guardar' }) => (
  <Box
    sx={{
      position: 'sticky',
      bottom: { xs: -16, sm: -20 },
      zIndex: 1,
      display: 'grid',
      gridTemplateColumns: '1fr 1.4fr',
      gap: 1,
      mx: { xs: -2, sm: -2.5 },
      px: { xs: 2, sm: 2.5 },
      pt: 1.5,
      pb: { xs: 2, sm: 2.5 },
      backgroundColor: COLORS.surface,
      borderTop: `1px solid ${COLORS.border}`,
      boxShadow: '0 -6px 12px rgba(15, 23, 42, 0.05)',
    }}
  >
    <Button
      onClick={onCancelar}
      disabled={guardando}
      sx={{ minHeight: 48, borderRadius: 2.5, textTransform: 'none', fontWeight: 600, color: COLORS.label, backgroundColor: COLORS.inputBg }}
    >
      Cancelar
    </Button>
    <Button
      type="submit"
      variant="contained"
      disableElevation
      disabled={guardando}
      startIcon={<SaveOutlined />}
      sx={{ minHeight: 48, borderRadius: 2.5, textTransform: 'none', fontWeight: 700, backgroundColor: COLORS.red, '&:hover': { backgroundColor: COLORS.redHover } }}
    >
      {guardando ? 'Guardando…' : etiqueta}
    </Button>
  </Box>
);

// Contenedor <form> con espaciado uniforme
export const Formulario = ({ onSubmit, children }) => (
  <Box
    component="form"
    noValidate
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
    sx={{ display: 'grid', gap: 2 }}
  >
    {children}
  </Box>
);
