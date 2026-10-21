import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { AcUnit, ArrowForward, BadgeOutlined, Close, DeviceThermostat, FactCheckOutlined } from '@mui/icons-material';
import { mensajeDeError } from '../../api/axiosClient';
import { TURNO } from '../../data/dummy';
import { guardarChecklist, omitirChecklist } from '../../services/checklistService';
import { COLORS } from '../../theme';

// items vienen de GET /checklist/apertura. Según tipo_campo, además del check se captura:
//   SELECT -> una opción de config.opciones ({ valor, texto, nivel: ok|aviso|error })
//   TEMPERATURE_PAIR -> una lectura por sensor de config.sensores ({ clave, nombre, min, max })
//   TEXT -> texto libre
const estadoInicial = (items) => ({
  items: Object.fromEntries(items.map((item) => [item.id, false])),
  valores: Object.fromEntries(
    items.map((item) => [item.id, item.tipo_campo === 'SELECT' ? (item.config?.opciones?.[0]?.valor ?? '') : ''])
  ),
  temperaturas: Object.fromEntries(
    items
      .filter((item) => item.tipo_campo === 'TEMPERATURE_PAIR')
      .map((item) => [item.id, Object.fromEntries((item.config?.sensores ?? []).map((s) => [s.clave, '']))])
  ),
  comentarios: '',
});

const opcionElegida = (item, form) => item.config?.opciones?.find((o) => o.valor === form.valores[item.id]);

const sensores = (item) => (item.tipo_campo === 'TEMPERATURE_PAIR' ? (item.config?.sensores ?? []) : []);

const CHIP_COLORES = {
  ok: { bg: COLORS.greenSoft, color: COLORS.greenText },
  aviso: { bg: COLORS.yellowSoft, color: COLORS.yellowText },
  error: { bg: COLORS.redSoft, color: COLORS.redHover },
  pendiente: { bg: COLORS.inputBg, color: COLORS.muted },
};

const fueraDeRango = (valor, { min, max }) => valor !== '' && (Number(valor) < min || Number(valor) > max);

const temperaturaFueraDeRango = (item, form) => sensores(item).some((s) => fueraDeRango(form.temperaturas[item.id][s.clave], s));

const validar = (form, items) => {
  const errores = {};
  const pendientes = items.filter((item) => item.es_obligatorio && !form.items[item.id]).map((item) => item.id);
  if (pendientes.length) errores.items = pendientes;

  items.forEach((item) =>
    sensores(item).forEach((s) => {
      const valor = form.temperaturas[item.id][s.clave];
      if (valor === '' || Number.isNaN(Number(valor))) errores[`temp-${item.id}-${s.clave}`] = 'Captura la temperatura';
    })
  );

  const hayIncidencia = items.some(
    (item) => (opcionElegida(item, form)?.nivel ?? 'ok') !== 'ok' || temperaturaFueraDeRango(item, form)
  );
  if (hayIncidencia && !form.comentarios.trim()) {
    errores.comentarios = 'Describe la incidencia (lote o temperatura fuera de rango)';
  }
  return errores;
};

// Cuerpo de POST /checklist/apertura
const armarPayload = (form, items) => ({
  respuestas: items.map((item) => ({
    id_item: item.id,
    cumplido: form.items[item.id],
    ...(item.tipo_campo === 'SELECT' || item.tipo_campo === 'TEXT' ? { valor: form.valores[item.id] } : {}),
    ...(item.tipo_campo === 'TEMPERATURE_PAIR'
      ? { temperaturas: Object.fromEntries(sensores(item).map((s) => [s.clave, Number(form.temperaturas[item.id][s.clave])])) }
      : {}),
  })),
  comentarios: form.comentarios.trim(),
});

const ItemChip = ({ label, tipo }) => (
  <Chip
    size="small"
    label={label}
    sx={{ borderRadius: 1.5, fontWeight: 600, backgroundColor: CHIP_COLORES[tipo].bg, color: CHIP_COLORES[tipo].color }}
  />
);

const TemperaturaInput = ({ id, label, icon, value, onChange, rango, error }) => {
  const fuera = fueraDeRango(value, rango);
  return (
    <TextField
      id={id}
      type="number"
      value={value}
      onChange={onChange}
      error={Boolean(error) || fuera}
      helperText={error || (fuera ? `Fuera de rango (${rango.min} a ${rango.max} °C)` : ' ')}
      placeholder="0.0"
      sx={{
        '& .MuiOutlinedInput-root': { backgroundColor: COLORS.surface, borderRadius: 2, fontSize: '1rem', fontWeight: 700 },
        '& .MuiFormHelperText-root': { mx: 0.5 },
      }}
      slotProps={{
        htmlInput: { step: 0.1, inputMode: 'decimal', 'aria-label': label },
        input: {
          startAdornment: (
            <InputAdornment position="start" sx={{ gap: 1, color: COLORS.blue }}>
              {icon}
              <Typography component="span" sx={{ color: COLORS.muted, fontSize: '0.92rem' }}>
                {label}:
              </Typography>
            </InputAdornment>
          ),
          endAdornment: <InputAdornment position="end">°C</InputAdornment>,
        },
      }}
    />
  );
};

const ChecklistApertura = ({ open, items, user, onClose, onSaved }) => {
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const [form, setForm] = useState(() => estadoInicial(items));
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');

  const errores = intentado ? validar(form, items) : {};
  const setComentarios = (e) => setForm((prev) => ({ ...prev, comentarios: e.target.value }));
  const setValor = (id) => (e) => setForm((prev) => ({ ...prev, valores: { ...prev.valores, [id]: e.target.value } }));
  const setTemperatura = (id, clave) => (e) =>
    setForm((prev) => ({ ...prev, temperaturas: { ...prev.temperaturas, [id]: { ...prev.temperaturas[id], [clave]: e.target.value } } }));
  const toggleItem = (id) => setForm((prev) => ({ ...prev, items: { ...prev.items, [id]: !prev.items[id] } }));

  const chipDeItem = (item) => {
    if (!form.items[item.id]) return { label: 'Pendiente', tipo: 'pendiente' };
    const opcion = opcionElegida(item, form);
    if (opcion && opcion.nivel !== 'ok') return { label: opcion.texto, tipo: opcion.nivel };
    if (temperaturaFueraDeRango(item, form)) return { label: 'Fuera de rango', tipo: 'error' };
    return { label: item.etiqueta_ok ?? 'Listo', tipo: 'ok' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIntentado(true);
    setErrorGuardado('');
    if (Object.keys(validar(form, items)).length) return;

    setGuardando(true);
    try {
      const registro = await guardarChecklist(armarPayload(form, items));
      onSaved(registro);
    } catch (err) {
      setErrorGuardado(mensajeDeError(err, 'No se pudo guardar el checklist. Intenta de nuevo.'));
    } finally {
      setGuardando(false);
    }
  };

  const handleOmitir = async () => {
    setErrorGuardado('');
    setGuardando(true);
    try {
      await omitirChecklist();
      onClose();
    } catch (err) {
      setErrorGuardado(mensajeDeError(err, 'No se pudo omitir el checklist. Intenta de nuevo.'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog
      open={open}
      fullScreen={fullScreen}
      maxWidth="md"
      fullWidth
      scroll="paper"
      // Obligatorio: no se cierra con clic fuera ni con Esc
      onClose={() => {}}
      aria-labelledby="checklist-titulo"
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit,
          noValidate: true,
          sx: { borderRadius: { xs: 0, sm: 4 }, maxWidth: { sm: 840 }, overflow: 'hidden' },
        },
      }}
    >
      {/* ENCABEZADO */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: { xs: 2, sm: 3.5 },
          pt: { xs: 'max(20px, env(safe-area-inset-top))', sm: 3 },
          pb: 3,
          color: '#fff',
          background: `linear-gradient(90deg, ${COLORS.red} 0%, #ee3a4f 100%)`,
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            flexShrink: 0,
            borderRadius: 2.5,
            display: { xs: 'none', sm: 'grid' },
            placeItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <FactCheckOutlined sx={{ fontSize: 30 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.5 }}>
            <Typography id="checklist-titulo" component="h2" sx={{ fontWeight: 800, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>
              Checklist Operativo de Apertura
            </Typography>
            <Chip
              size="small"
              label="OBLIGATORIO"
              sx={{ height: 22, fontWeight: 800, fontSize: '0.68rem', letterSpacing: 0.5, backgroundColor: COLORS.yellow, color: COLORS.onYellow }}
            />
          </Box>
          <Typography sx={{ mt: 0.25, fontSize: { xs: '0.8rem', sm: '0.9rem' }, opacity: 0.92 }}>
            Control diario de calidad y preparación • Turno {TURNO.nombre}
          </Typography>
        </Box>
        <IconButton
          aria-label="Cerrar checklist"
          onClick={onClose}
          sx={{ width: 48, height: 48, flexShrink: 0, color: COLORS.surface, backgroundColor: 'rgba(0, 0, 0, 0.15)', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.25)' } }}
        >
          <Close />
        </IconButton>
      </Box>

      {/* CONTENIDO */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3.5 }, py: 3, display: 'grid', gap: 2 }}>
        {items.map((item, index) => {
          const chip = chipDeItem(item);
          const pendiente = errores.items?.includes(item.id);
          return (
            <Box
              key={item.id}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 3,
                border: `1px solid ${pendiente ? COLORS.red : COLORS.border}`,
                backgroundColor: pendiente ? '#fff7f8' : COLORS.surfaceAlt,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, sm: 1.5 } }}>
                <Checkbox
                  id={`check-${item.id}`}
                  checked={form.items[item.id]}
                  onChange={() => toggleItem(item.id)}
                  color="error"
                  sx={{ p: 1, mt: -0.75, '& .MuiSvgIcon-root': { fontSize: 30 } }}
                />
                <Box component="label" htmlFor={`check-${item.id}`} sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 1, rowGap: 0.5 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.98rem', sm: '1.05rem' }, color: COLORS.ink }}>
                      {index + 1}. {item.titulo}
                    </Typography>
                    {item.etiqueta && (
                      <Chip
                        size="small"
                        label={item.etiqueta.toUpperCase()}
                        sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, backgroundColor: '#ffedd5', color: '#c2410c' }}
                      />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: '0.83rem', color: COLORS.muted }}>{item.descripcion}</Typography>
                </Box>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <ItemChip {...chip} />
                </Box>
              </Box>

              {/* Estado del chip en celular, debajo del texto */}
              <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 1, ml: 6 }}>
                <ItemChip {...chip} />
              </Box>

              {item.tipo_campo === 'SELECT' && (
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mt: 1.5, ml: { xs: 0, sm: 6.5 } }}>
                  <Typography component="label" htmlFor={`opcion-${item.id}`} sx={{ fontSize: '0.88rem', color: COLORS.muted }}>
                    {item.config?.etiqueta ?? 'Estado'}:
                  </Typography>
                  <TextField
                    id={`opcion-${item.id}`}
                    select
                    size="small"
                    value={form.valores[item.id]}
                    onChange={setValor(item.id)}
                    slotProps={{ select: { native: true } }}
                    sx={{
                      minWidth: 230,
                      flex: { xs: 1, sm: 'none' },
                      '& .MuiOutlinedInput-root': { backgroundColor: COLORS.surface, borderRadius: 2, fontSize: '1rem', minHeight: 44 },
                    }}
                  >
                    {(item.config?.opciones ?? []).map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>
                        {opcion.texto}
                      </option>
                    ))}
                  </TextField>
                </Box>
              )}

              {item.tipo_campo === 'TEMPERATURE_PAIR' && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    columnGap: 2,
                    mt: 1.5,
                    ml: { xs: 0, sm: 6.5 },
                  }}
                >
                  {sensores(item).map((sensor, i) => (
                    <TemperaturaInput
                      key={sensor.clave}
                      id={`temp-${item.id}-${sensor.clave}`}
                      label={sensor.nombre}
                      icon={i === 0 ? <AcUnit fontSize="small" /> : <DeviceThermostat fontSize="small" />}
                      value={form.temperaturas[item.id][sensor.clave]}
                      onChange={setTemperatura(item.id, sensor.clave)}
                      rango={sensor}
                      error={errores[`temp-${item.id}-${sensor.clave}`]}
                    />
                  ))}
                </Box>
              )}

              {item.tipo_campo === 'TEXT' && (
                <TextField
                  id={`texto-${item.id}`}
                  fullWidth
                  size="small"
                  value={form.valores[item.id]}
                  onChange={setValor(item.id)}
                  slotProps={{ htmlInput: { maxLength: 255, 'aria-label': item.titulo } }}
                  sx={{ mt: 1.5, ml: { xs: 0, sm: 6.5 }, width: { sm: 'calc(100% - 52px)' }, '& .MuiOutlinedInput-root': { backgroundColor: COLORS.surface, borderRadius: 2, fontSize: '1rem' } }}
                />
              )}
            </Box>
          );
        })}

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography component="label" htmlFor="comentarios-turno" sx={{ fontWeight: 600, fontSize: '0.9rem', color: COLORS.ink }}>
              Comentarios u observaciones del turno
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: COLORS.muted }}>(Opcional)</Typography>
          </Box>
          <TextField
            id="comentarios-turno"
            fullWidth
            multiline
            minRows={2}
            maxRows={5}
            placeholder="Reportar faltantes, detalles en equipo o avisos para el siguiente turno..."
            value={form.comentarios}
            onChange={setComentarios}
            error={Boolean(errores.comentarios)}
            helperText={errores.comentarios}
            sx={{ '& .MuiOutlinedInput-root': { backgroundColor: COLORS.surfaceAlt, borderRadius: 2, fontSize: '1rem' } }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            py: 1.5,
            px: 2,
            borderRadius: 2,
            border: '1px solid #fde68a',
            backgroundColor: '#fffbeb',
            fontSize: '0.88rem',
            color: '#78350f',
          }}
        >
          <BadgeOutlined sx={{ fontSize: 20, color: '#d97706' }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            Registrado por: <strong>{user.nombre}</strong> • {user.rol}
          </Box>
          <Box component="span" sx={{ color: '#b45309', whiteSpace: 'nowrap' }}>
            Turno {TURNO.numero}
          </Box>
        </Box>
      </Box>

      {/* PIE */}
      <Box
        sx={{
          flexShrink: 0,
          borderTop: `1px solid ${COLORS.border}`,
          px: { xs: 2, sm: 3.5 },
          pt: 2,
          pb: { xs: 'max(16px, env(safe-area-inset-bottom))', sm: 3 },
          backgroundColor: COLORS.surface,
        }}
      >
        {(errorGuardado || Object.keys(errores).length > 0) && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {errorGuardado || 'Completa todos los puntos del checklist antes de continuar.'}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, alignItems: 'center', gap: 1.5 }}>
          <Button
            onClick={handleOmitir}
            disabled={guardando}
            sx={{ minHeight: 48, mr: { sm: 'auto' }, textTransform: 'none', fontWeight: 500, color: COLORS.label }}
          >
            Omitir por ahora (Requerirá autorización)
          </Button>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={guardando}
            endIcon={<ArrowForward />}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minHeight: 52,
              px: 3.5,
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              backgroundColor: COLORS.red,
              boxShadow: '0 6px 16px rgba(227, 36, 59, 0.3)',
              '&:hover': { backgroundColor: COLORS.redHover },
              '&.Mui-disabled': { backgroundColor: COLORS.red, color: COLORS.surface, opacity: 0.7 },
            }}
          >
            {guardando ? 'Guardando…' : 'Guardar y Continuar a Caja'}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default ChecklistApertura;
