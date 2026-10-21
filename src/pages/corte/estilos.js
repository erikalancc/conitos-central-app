import { COLORS } from '../../theme';

// Colores por forma de pago: el efectivo en verde y la tarjeta en azul para distinguirlos de un vistazo
export const COLOR_METODO = {
  efectivo: { fuerte: COLORS.greenText, suave: COLORS.greenSoft, barra: COLORS.greenText },
  tarjeta: { fuerte: COLORS.blueText, suave: COLORS.blueSoft, barra: COLORS.blue },
  spei: { fuerte: COLORS.yellowText, suave: COLORS.yellowSoft, barra: '#eab308' },
};

// Estado de una diferencia de cuadre (contado - esperado)
export const estadoDiferencia = (diferencia) => {
  if (Math.abs(diferencia) < 0.005) return { label: 'Cuadrada', color: COLORS.greenText, bg: COLORS.greenSoft };
  if (diferencia > 0) return { label: 'Sobrante', color: COLORS.amberText, bg: COLORS.amberSoft };
  return { label: 'Faltante', color: COLORS.redHover, bg: COLORS.redSoft };
};

export const tituloSeccionSx = { fontWeight: 700, fontSize: { xs: '1.05rem', md: '1.15rem' }, color: COLORS.ink };

export const subtituloSx = { fontSize: '0.8rem', color: COLORS.muted };

export const botonSuaveSx = {
  minHeight: 44,
  px: 2,
  borderRadius: 2,
  textTransform: 'none',
  fontWeight: 600,
  color: COLORS.blueText,
  backgroundColor: COLORS.inputBg,
  '&:hover': { backgroundColor: COLORS.hover },
};

// Total del conteo físico: { denominación: piezas }
export const totalContado = (conteo) =>
  Math.round(Object.entries(conteo).reduce((suma, [denominacion, piezas]) => suma + Number(denominacion) * piezas, 0) * 100) / 100;
