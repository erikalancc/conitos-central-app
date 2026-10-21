import { createTheme } from '@mui/material';

// Paletas de día y de noche. Los componentes usan COLORS (variables CSS), así que
// cambiar de modo solo cambia los valores de las variables, sin re-renderizar estilos.
export const PALETAS = {
  claro: {
    blue: '#1d7cc4',
    blueDark: '#16649f',
    blueText: '#1660a0',
    blueSoft: '#e3eef8',
    blueHover: '#d3e4f4',
    red: '#e3243b',
    redHover: '#c81d32',
    redSoft: '#fde4e7',
    yellow: '#fbe100',
    yellowSoft: '#fdf6c3',
    yellowText: '#5c4a00',
    // Texto sobre el amarillo de la marca: oscuro en ambos modos
    onYellow: '#3d3100',
    green: '#22c55e',
    greenSoft: '#dcfce7',
    greenText: '#15803d',
    amberSoft: '#fef3c7',
    amberText: '#a16207',
    ink: '#0f172a',
    label: '#1e293b',
    muted: '#64748b',
    border: '#e8ecf1',
    inputBg: '#eef1f5',
    hover: '#e2e7ee',
    panelBg: '#f5f7fa',
    surface: '#ffffff',
    surfaceAlt: '#f8fafc',
    // Barra de navegación: azul de la marca Conitos Central
    brand: '#2a8fd0',
    brandText: '#ffffff',
    brandSoft: 'rgba(255, 255, 255, 0.16)',
    brandActive: '#ffffff',
    brandActiveText: '#1660a0',
  },
  oscuro: {
    blue: '#3b97dc',
    blueDark: '#2f86c8',
    blueText: '#3b97dc',
    blueSoft: '#16324a',
    blueHover: '#1d4060',
    red: '#ef4459',
    redHover: '#ff5d71',
    redSoft: '#3d1820',
    yellow: '#fbe100',
    yellowSoft: '#3a3410',
    yellowText: '#f5e27a',
    onYellow: '#3d3100',
    green: '#22c55e',
    greenSoft: '#12301f',
    greenText: '#5fd38b',
    amberSoft: '#3a2a0c',
    amberText: '#f0b34a',
    ink: '#e8eef6',
    label: '#c5cfdb',
    muted: '#8b98aa',
    border: '#263241',
    inputBg: '#1c2531',
    hover: '#253242',
    panelBg: '#0e131a',
    surface: '#151c26',
    surfaceAlt: '#18212c',
    brand: '#1d6fa8',
    brandText: '#ffffff',
    brandSoft: 'rgba(255, 255, 255, 0.12)',
    brandActive: '#ffffff',
    brandActiveText: '#1d6fa8',
  },
};

const variable = (nombre) => `--c-${nombre.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`)}`;

// COLORS.blue === 'var(--c-blue)'
export const COLORS = Object.fromEntries(Object.keys(PALETAS.claro).map((nombre) => [nombre, `var(${variable(nombre)})`]));

const declaraciones = (paleta) => Object.fromEntries(Object.entries(paleta).map(([nombre, valor]) => [variable(nombre), valor]));

// Estilos globales con las variables de ambos modos (el modo activo va en <html data-tema="…">)
export const VARIABLES_CSS = {
  ':root': { ...declaraciones(PALETAS.claro), colorScheme: 'light' },
  ':root[data-tema="oscuro"]': { ...declaraciones(PALETAS.oscuro), colorScheme: 'dark' },
};

// Pantallas bajas (celular o tablet en horizontal con teclado abierto)
export const SHORT_SCREEN = '@media (max-height: 560px)';

// Respeta el notch / barra de gestos de iOS y Android
export const safe = (side, base) => `max(${base}px, env(safe-area-inset-${side}))`;

// Tema de MUI por modo (MUI necesita colores reales para calcular contrastes y estados)
export const crearTema = (modo) => {
  const p = modo === 'oscuro' ? PALETAS.oscuro : PALETAS.claro;
  return createTheme({
    typography: {
      fontFamily: "'Plus Jakarta Sans', system-ui, 'Segoe UI', Roboto, sans-serif",
    },
    palette: {
      mode: modo === 'oscuro' ? 'dark' : 'light',
      primary: { main: p.blue },
      error: { main: p.red },
      background: { default: p.panelBg, paper: p.surface },
      text: { primary: p.ink, secondary: p.muted },
      divider: p.border,
    },
    components: {
      // En modo oscuro MUI aclara diálogos y menús con una capa; se usa el mismo color de superficie
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    },
  });
};
