import { useState } from 'react';
import { Alert, Box, Button, ButtonBase, Dialog, IconButton, TextField, Typography, useMediaQuery } from '@mui/material';
import { Add, Close, Remove } from '@mui/icons-material';
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

const Nota = ({ children }) => (
  <Box component="span" sx={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: COLORS.muted }}>
    {children}
  </Box>
);

// Presentación de la línea que se modifica (por id; las ventas anteriores solo tenían el nombre)
const presentacionDeLinea = (producto, linea) =>
  producto.presentaciones.find((p) => (linea?.idPresentacion ? p.id === linea.idPresentacion : p.nombre === linea?.presentacion)) ??
  producto.presentaciones[0];

const Contenido = ({ producto, linea, onConfirm, onClose }) => {
  const [idPresentacion, setIdPresentacion] = useState(() => presentacionDeLinea(producto, linea).id);
  // { idSabor: veces elegido }
  const [sabores, setSabores] = useState(() =>
    Object.fromEntries(
      (linea?.sabores ?? []).map((s) => [s.id ?? producto.sabores.find((x) => x.nombre === s.nombre)?.id, s.cantidad]).filter(([id]) => id)
    )
  );
  const [extras, setExtras] = useState(() => (linea?.extras ?? []).map((e) => (typeof e === 'object' ? e.id : e)));
  const [notas, setNotas] = useState(linea?.notas ?? '');
  const [cantidad, setCantidad] = useState(linea?.cantidad ?? 1);

  const presentacion = producto.presentaciones.find((p) => p.id === idPresentacion) ?? producto.presentaciones[0];
  const cantidadSabores = producto.requiereSabor ? presentacion.numSabores : 0;
  const elegidos = Object.values(sabores).reduce((a, b) => a + b, 0);
  const faltan = cantidadSabores - elegidos;
  const sinSabores = producto.requiereSabor && producto.sabores.length === 0;

  const elegirPresentacion = (p) => {
    setIdPresentacion(p.id);
    // Si la nueva presentación lleva menos sabores, se vuelven a elegir
    if (producto.requiereSabor && elegidos > p.numSabores) setSabores({});
  };

  const elegirSabor = (id) => {
    if (cantidadSabores === 1) return setSabores({ [id]: 1 });
    if (faltan > 0) setSabores((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  };

  const quitarSabor = (id) =>
    setSabores((prev) => {
      const siguiente = { ...prev, [id]: prev[id] - 1 };
      if (!siguiente[id]) delete siguiente[id];
      return siguiente;
    });

  const toggleExtra = (id) => setExtras((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]));

  const configuracion = {
    idPresentacion: presentacion.id,
    presentacion: producto.presentaciones.length > 1 ? presentacion.nombre : null,
    precioBase: presentacion.precio,
    sabores: producto.sabores
      .filter((s) => sabores[s.id])
      .map((s) => ({ id: s.id, nombre: s.nombre, cantidad: sabores[s.id], extra: presentacion.recargos[s.id] ?? 0 })),
    extras: producto.extras.filter((e) => extras.includes(e.id)).map(({ id, nombre, precio }) => ({ id, nombre, precio })),
    notas: notas.trim(),
  };
  const precio = precioUnitario(configuracion);
  const esPromo = Boolean(producto.idPromocion);

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
          sx={{ width: 52, height: 52, flexShrink: 0, borderRadius: 2.5, display: 'grid', placeItems: 'center', fontSize: '1.8rem', background: producto.fondo }}
        >
          {producto.emoji}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id="personalizar-titulo" component="h2" sx={{ fontWeight: 700, fontSize: '1.15rem', color: COLORS.ink }}>
            {producto.nombre}
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: COLORS.muted }}>
            {esPromo ? producto.descripcion : `${presentacion.nombre} · ${formatMoney(presentacion.precio)}`}
          </Typography>
        </Box>
        <IconButton aria-label="Cerrar" onClick={onClose} sx={{ width: 44, height: 44, backgroundColor: COLORS.inputBg }}>
          <Close />
        </IconButton>
      </Box>

      {/* OPCIONES */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3 }, pt: 2.5 }}>
        {producto.presentaciones.length > 1 && (
          <Seccion titulo="Presentación">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: `repeat(${Math.min(producto.presentaciones.length, 4)}, 1fr)` }, gap: 1 }}>
              {producto.presentaciones.map((p) => (
                <ButtonBase key={p.id} onClick={() => elegirPresentacion(p)} sx={{ ...opcionSx(presentacion.id === p.id), justifyContent: 'center', textAlign: 'center' }}>
                  <Box>
                    {p.nombre}
                    <Nota>{formatMoney(p.precio)}</Nota>
                  </Box>
                </ButtonBase>
              ))}
            </Box>
          </Seccion>
        )}

        {producto.requiereSabor && (
          <Seccion
            titulo={cantidadSabores === 1 ? 'Elige el sabor' : `Elige ${cantidadSabores} sabores`}
            ayuda={
              !sinSabores && (
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: faltan === 0 ? COLORS.greenText : COLORS.red }}>
                  {elegidos} / {cantidadSabores}
                </Typography>
              )
            }
          >
            {sinSabores ? (
              <Alert severity="warning">No hay sabores activos para este producto. Revisa el catálogo en Administración.</Alert>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
                {producto.sabores.map((sabor) => {
                  const veces = sabores[sabor.id] ?? 0;
                  const recargo = presentacion.recargos[sabor.id];
                  return (
                    <Box key={sabor.id} sx={{ position: 'relative' }}>
                      <ButtonBase
                        onClick={() => elegirSabor(sabor.id)}
                        disabled={!veces && faltan <= 0 && cantidadSabores > 1}
                        sx={{ ...opcionSx(veces > 0), width: '100%', pr: veces && cantidadSabores > 1 ? 6 : 1.5, '&.Mui-disabled': { opacity: 0.45 } }}
                      >
                        <Box>
                          {veces > 1 && `${veces}× `}
                          {sabor.nombre}
                          {recargo ? <Nota>+{formatMoney(recargo)}</Nota> : sabor.especial ? <Nota>Especial</Nota> : null}
                        </Box>
                      </ButtonBase>
                      {veces > 0 && cantidadSabores > 1 && (
                        <IconButton
                          aria-label={`Quitar ${sabor.nombre}`}
                          onClick={() => quitarSabor(sabor.id)}
                          size="small"
                          sx={{ position: 'absolute', top: '50%', right: 6, transform: 'translateY(-50%)', backgroundColor: COLORS.surface, width: 36, height: 36 }}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Seccion>
        )}

        {producto.extras.length > 0 && (
          <Seccion titulo="Extras y toppings">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
              {producto.extras.map((extra) => (
                <ButtonBase key={extra.id} onClick={() => toggleExtra(extra.id)} sx={opcionSx(extras.includes(extra.id))}>
                  <Box>
                    {extra.nombre}
                    <Nota>{extra.precio ? `+${formatMoney(extra.precio)}` : 'Sin costo'}</Nota>
                  </Box>
                </ButtonBase>
              ))}
            </Box>
          </Seccion>
        )}

        <Seccion titulo={esPromo ? '¿Qué lleva el combo?' : 'Notas para preparación'}>
          <TextField
            fullWidth
            autoFocus={esPromo}
            placeholder={esPromo ? 'Ej: Papas locas + agua de horchata 1/2 L' : 'Ej: sin chile, poca crema, en vaso aparte…'}
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
          disabled={faltan > 0 || sinSabores}
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
          <span>{faltan > 0 && !sinSabores ? `Elige ${faltan} sabor${faltan > 1 ? 'es' : ''} más` : linea ? 'Guardar cambios' : 'Agregar a la orden'}</span>
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
