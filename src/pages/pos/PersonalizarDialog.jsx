import { useState } from 'react';
import { Box, Button, ButtonBase, Dialog, IconButton, TextField, Typography, useMediaQuery } from '@mui/material';
import { Add, Close, Remove } from '@mui/icons-material';
import { ESTILO_CATEGORIA, EXTRAS } from '../../data/catalogo';
import { COLORS } from '../../theme';
import { formatMoney } from '../../utils/format';
import { precioUnitario } from './pedido';

const opcionSx = (activa) => ({
  position: 'relative',
  minHeight: 52,
  px: 1.5,
  py: 1,
  borderRadius: 2.5,
  justifyContent: 'flex-start',
  textAlign: 'left',
  fontSize: '0.92rem',
  fontWeight: 600,
  color: activa ? COLORS.blueText : COLORS.label,
  backgroundColor: activa ? COLORS.blueSoft : COLORS.inputBg,
  border: `2px solid ${activa ? COLORS.blue : 'transparent'}`,
});

const Seccion = ({ titulo, ayuda, children }) => (
  <Box component="section" sx={{ mb: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mb: 1.25 }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: COLORS.ink }}>{titulo}</Typography>
      {ayuda}
    </Box>
    {children}
  </Box>
);

const Stepper = ({ value, onChange, min = 1 }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <IconButton aria-label="Restar" onClick={() => onChange(value - 1)} disabled={value <= min} sx={{ width: 44, height: 44, backgroundColor: COLORS.inputBg }}>
      <Remove />
    </IconButton>
    <Typography sx={{ minWidth: 32, textAlign: 'center', fontWeight: 700, fontSize: '1.15rem' }}>{value}</Typography>
    <IconButton aria-label="Sumar" onClick={() => onChange(value + 1)} sx={{ width: 44, height: 44, backgroundColor: COLORS.inputBg }}>
      <Add />
    </IconButton>
  </Box>
);

const Contenido = ({ producto, linea, onConfirm, onClose }) => {
  const opciones = producto.opciones ?? {};
  const cantidadSabores = opciones.sabores?.cantidad ?? 0;

  const [presentacion, setPresentacion] = useState(linea?.presentacion ?? opciones.presentaciones?.[0] ?? null);
  const [sabores, setSabores] = useState(() =>
    Object.fromEntries((linea?.sabores ?? []).map((s) => [s.nombre, s.cantidad]))
  );
  const [extras, setExtras] = useState(linea?.extras ?? []);
  const [notas, setNotas] = useState(linea?.notas ?? '');
  const [cantidad, setCantidad] = useState(linea?.cantidad ?? 1);

  const elegidos = Object.values(sabores).reduce((a, b) => a + b, 0);
  const faltan = cantidadSabores - elegidos;

  const elegirSabor = (nombre) => {
    if (cantidadSabores === 1) return setSabores({ [nombre]: 1 });
    if (faltan > 0) setSabores((prev) => ({ ...prev, [nombre]: (prev[nombre] ?? 0) + 1 }));
  };

  const quitarSabor = (nombre) =>
    setSabores((prev) => {
      const siguiente = { ...prev, [nombre]: prev[nombre] - 1 };
      if (!siguiente[nombre]) delete siguiente[nombre];
      return siguiente;
    });

  const toggleExtra = (id) => setExtras((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));

  const configuracion = {
    presentacion,
    sabores: (opciones.sabores?.lista ?? [])
      .filter((s) => sabores[s.nombre])
      .map((s) => ({ nombre: s.nombre, cantidad: sabores[s.nombre], extra: s.extra ?? 0 })),
    extras,
    notas: notas.trim(),
  };
  const precio = precioUnitario({ precioBase: producto.precio, ...configuracion });

  return (
    <>
      {/* ENCABEZADO */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: { xs: 2, sm: 3 },
          pt: { xs: 'max(16px, env(safe-area-inset-top))', sm: 2.5 },
          pb: 2,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <Box
          aria-hidden
          sx={{
            width: 52,
            height: 52,
            flexShrink: 0,
            borderRadius: 2.5,
            display: 'grid',
            placeItems: 'center',
            fontSize: '1.8rem',
            background: ESTILO_CATEGORIA[producto.categoria],
          }}
        >
          {producto.emoji}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id="personalizar-titulo" component="h2" sx={{ fontWeight: 700, fontSize: '1.15rem', color: COLORS.ink }}>
            {producto.nombre}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: COLORS.muted }}>Precio base {formatMoney(producto.precio)}</Typography>
        </Box>
        <IconButton aria-label="Cerrar" onClick={onClose} sx={{ width: 44, height: 44, backgroundColor: COLORS.inputBg }}>
          <Close />
        </IconButton>
      </Box>

      {/* OPCIONES */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3 }, pt: 2.5 }}>
        {opciones.presentaciones && (
          <Seccion titulo="Presentación">
            <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${opciones.presentaciones.length}, 1fr)`, gap: 1 }}>
              {opciones.presentaciones.map((p) => (
                <ButtonBase key={p} onClick={() => setPresentacion(p)} sx={{ ...opcionSx(presentacion === p), justifyContent: 'center' }}>
                  {p}
                </ButtonBase>
              ))}
            </Box>
          </Seccion>
        )}

        {opciones.sabores && (
          <Seccion
            titulo={cantidadSabores === 1 ? 'Elige el sabor' : `Elige ${cantidadSabores} sabores`}
            ayuda={
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: faltan === 0 ? '#15803d' : COLORS.red }}>
                {elegidos} / {cantidadSabores}
              </Typography>
            }
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
              {opciones.sabores.lista.map((sabor) => {
                const veces = sabores[sabor.nombre] ?? 0;
                return (
                  <Box key={sabor.nombre} sx={{ position: 'relative' }}>
                    <ButtonBase
                      onClick={() => elegirSabor(sabor.nombre)}
                      disabled={!veces && faltan <= 0 && cantidadSabores > 1}
                      sx={{ ...opcionSx(veces > 0), width: '100%', pr: veces && cantidadSabores > 1 ? 6 : 1.5, '&.Mui-disabled': { opacity: 0.45 } }}
                    >
                      <Box>
                        {veces > 1 && `${veces}× `}
                        {sabor.nombre}
                        {sabor.extra ? (
                          <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: COLORS.muted }}>
                            +{formatMoney(sabor.extra)}
                          </Box>
                        ) : null}
                      </Box>
                    </ButtonBase>
                    {veces > 0 && cantidadSabores > 1 && (
                      <IconButton
                        aria-label={`Quitar ${sabor.nombre}`}
                        onClick={() => quitarSabor(sabor.nombre)}
                        size="small"
                        sx={{ position: 'absolute', top: '50%', right: 6, transform: 'translateY(-50%)', backgroundColor: '#fff', width: 36, height: 36 }}
                      >
                        <Remove fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Seccion>
        )}

        {opciones.extras && (
          <Seccion titulo="Extras y toppings">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
              {opciones.extras.map((id) => (
                <ButtonBase key={id} onClick={() => toggleExtra(id)} sx={opcionSx(extras.includes(id))}>
                  <Box>
                    {EXTRAS[id].nombre}
                    <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', color: COLORS.muted }}>
                      {EXTRAS[id].precio ? `+${formatMoney(EXTRAS[id].precio)}` : 'Sin costo'}
                    </Box>
                  </Box>
                </ButtonBase>
              ))}
            </Box>
          </Seccion>
        )}

        <Seccion titulo="Notas para preparación">
          <TextField
            fullWidth
            placeholder="Ej: sin chile, poca crema, en vaso aparte…"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { backgroundColor: COLORS.inputBg, borderRadius: 2, fontSize: '1rem', '& fieldset': { borderColor: 'transparent' } } }}
          />
        </Seccion>
      </Box>

      {/* PIE */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          px: { xs: 2, sm: 3 },
          pt: 2,
          pb: { xs: 'max(16px, env(safe-area-inset-bottom))', sm: 2.5 },
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        <Stepper value={cantidad} onChange={setCantidad} />
        <Button
          variant="contained"
          disableElevation
          disabled={faltan > 0}
          onClick={() => onConfirm(configuracion, cantidad)}
          sx={{
            flex: 1,
            minWidth: 220,
            minHeight: 54,
            borderRadius: 2.5,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '1rem',
            justifyContent: 'space-between',
            px: 2.5,
            backgroundColor: COLORS.red,
            '&:hover': { backgroundColor: COLORS.redHover },
          }}
        >
          <span>{faltan > 0 ? `Elige ${faltan} sabor${faltan > 1 ? 'es' : ''} más` : linea ? 'Guardar cambios' : 'Agregar a la orden'}</span>
          <span>{formatMoney(precio * cantidad)}</span>
        </Button>
      </Box>
    </>
  );
};

// producto: el producto a personalizar. linea: si se está modificando una línea existente.
const PersonalizarDialog = ({ producto, linea, onConfirm, onClose }) => {
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={Boolean(producto)}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      aria-labelledby="personalizar-titulo"
      slotProps={{ paper: { sx: { borderRadius: { xs: 0, sm: 4 }, display: 'flex', flexDirection: 'column', maxHeight: { sm: '90dvh' } } } }}
    >
      {producto && (
        <Contenido key={`${producto.id}-${linea?.lineId ?? 'nuevo'}`} producto={producto} linea={linea} onConfirm={onConfirm} onClose={onClose} />
      )}
    </Dialog>
  );
};

export default PersonalizarDialog;
