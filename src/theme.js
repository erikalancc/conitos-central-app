import { createTheme } from '@mui/material';

export const COLORS = {
  blue: '#1d7cc4',
  blueDark: '#16649f',
  blueText: '#1660a0',
  blueSoft: '#e3eef8',
  red: '#e3243b',
  redHover: '#c81d32',
  redSoft: '#fde4e7',
  yellow: '#fbe100',
  yellowSoft: '#fdf6c3',
  ink: '#0f172a',
  label: '#1e293b',
  muted: '#64748b',
  border: '#e8ecf1',
  inputBg: '#eef1f5',
  panelBg: '#f5f7fa',
  green: '#22c55e',
};

// Pantallas bajas (celular o tablet en horizontal con teclado abierto)
export const SHORT_SCREEN = '@media (max-height: 560px)';

// Respeta el notch / barra de gestos de iOS y Android
export const safe = (side, base) => `max(${base}px, env(safe-area-inset-${side}))`;

export const theme = createTheme({
  typography: {
    fontFamily: "'Plus Jakarta Sans', system-ui, 'Segoe UI', Roboto, sans-serif",
  },
  palette: {
    primary: { main: COLORS.blue },
    error: { main: COLORS.red },
    background: { default: COLORS.panelBg },
  },
});
