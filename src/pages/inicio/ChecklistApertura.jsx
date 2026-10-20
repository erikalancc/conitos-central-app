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
import { CHECKLIST_APERTURA, ESTADOS_LOTE, RANGOS_TEMPERATURA, TURNO } from '../../data/dummy';
import { guardarChecklist, omitirChecklist } from '../../services/checklistService';
import { COLORS } from '../../theme';

const ESTADO_INICIAL = {
  items: Object.fromEntries(CHECKLIST_APERTURA.map((item) => [item.id, false])),
  estadoLote: 'conforme',
  congelador: '',
  refrigerador: '',
  comentarios: '',
};

const CHIP_COLORES = {
  ok: { bg: '#dcfce7', color: '#15803d' },
  aviso: { bg: COLORS.yellowSoft, color: '#8a6d00' },
  error: { bg: COLORS.redSoft, color: COLORS.redHover },
  pendiente: { bg: COLORS.inputBg, color: COLORS.muted },
};

const fueraDeRango = (valor, { min, max }) => valor !== '' && (Number(valor) < min || Number(valor) > max);

const validar = (form) => {
  const errores = {};
  const pendientes = CHECKLIST_APERTURA.filter((item) => !form.items[item.id]).map((item) => item.id);
  if (pendientes.length) errores.items = pendientes;

  ['congelador', 'refrigerador'].forEach((campo) => {
    if (form[campo] === '' || Number.isNaN(Number(form[campo]))) errores[campo] = 'Captura la temperatura';
  });

  const hayIncidencia =
    form.estadoLote !== 'conforme' ||
    fueraDeRango(form.congelador, RANGOS_TEMPERATURA.congelador) ||
    fueraDeRango(form.refrigerador, RANGOS_TEMPERATURA.refrigerador);
  if (hayIncidencia && !form.comentarios.trim()) {
    errores.comentarios = 'Describe la incidencia (lote o temperatura fuera de rango)';
  }
  return errores;
};

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
        '& .MuiOutlinedInput-root': { backgroundColor: '#fff', borderRadius: 2, fontSize: '1rem', fontWeight: 700 },
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

const ChecklistApertura = ({ open, user, onClose, onSaved }) => {
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [intentado, setIntentado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState('');

  const errores = intentado ? validar(form) : {};
  const setCampo = (campo) => (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));
  const toggleItem = (id) => setForm((prev) => ({ ...prev, items: { ...prev.items, [id]: !prev.items[id] } }));

  const chipDeItem = (item) => {
    if (!form.items[item.id]) return { label: 'Pendiente', tipo: 'pendiente' };
    if (item.id === 'vitrina' && form.estadoLote !== 'conforme') {
      return form.estadoLote === 'rechazado' ? { label: 'Rechazado', tipo: 'error' } : { label: 'Con observaciones', tipo: 'aviso' };
    }
    if (
      item.id === 'refrigeracion' &&
      (fueraDeRango(form.congelador, RANGOS_TEMPERATURA.congelador) ||
        fueraDeRango(form.refrigerador, RANGOS_TEMPERATURA.refrigerador))
    ) {
      return { label: 'Fuera de rango', tipo: 'error' };
    }
    return { label: item.etiquetaOk, tipo: 'ok' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIntentado(true);
    setErrorGuardado('');
    if (Object.keys(validar(form)).length) return;

    setGuardando(true);
    try {
      const registro = await guardarChecklist({
        usuarioId: user.id,
        turno: TURNO.numero,
        items: form.items,
        estadoLote: form.estadoLote,
        temperaturas: { congelador: Number(form.congelador), refrigerador: Number(form.refrigerador) },
        comentarios: form.comentarios.trim(),
      });
      onSaved(registro);
    } catch {
      setErrorGuardado('No se pudo guardar el checklist. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const handleOmitir = async () => {
    await omitirChecklist(user.id);
    onClose();
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
              sx={{ height: 22, fontWeight: 800, fontSize: '0.68rem', letterSpacing: 0.5, backgroundColor: COLORS.yellow, color: '#3d3100' }}
            />
          </Box>
          <Typography sx={{ mt: 0.25, fontSize: { xs: '0.8rem', sm: '0.9rem' }, opacity: 0.92 }}>
            Control diario de calidad y preparación • Turno {TURNO.nombre}
          </Typography>
        </Box>
        <IconButton
          aria-label="Cerrar checklist"
          onClick={onClose}
          sx={{ width: 48, height: 48, flexShrink: 0, color: '#fff', backgroundColor: 'rgba(0, 0, 0, 0.15)', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.25)' } }}
        >
          <Close />
        </IconButton>
      </Box>

      {/* CONTENIDO */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, sm: 3.5 }, py: 3, display: 'grid', gap: 2 }}>
        {CHECKLIST_APERTURA.map((item, index) => {
          const chip = chipDeItem(item);
          const pendiente = errores.items?.includes(item.id);
          return (
            <Box
              key={item.id}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 3,
                border: `1px solid ${pendiente ? COLORS.red : COLORS.border}`,
                backgroundColor: pendiente ? '#fff7f8' : '#fafbfc',
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
                    {item.tag && (
                      <Chip
                        size="small"
                        label={item.tag.toUpperCase()}
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

              {item.id === 'vitrina' && (
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mt: 1.5, ml: { xs: 0, sm: 6.5 } }}>
                  <Typography component="label" htmlFor="estado-lote" sx={{ fontSize: '0.88rem', color: COLORS.muted }}>
                    Estado de lote:
                  </Typography>
                  <TextField
                    id="estado-lote"
                    select
                    size="small"
                    value={form.estadoLote}
                    onChange={setCampo('estadoLote')}
                    slotProps={{ select: { native: true } }}
                    sx={{
                      minWidth: 230,
                      flex: { xs: 1, sm: 'none' },
                      '& .MuiOutlinedInput-root': { backgroundColor: '#fff', borderRadius: 2, fontSize: '1rem', minHeight: 44 },
                    }}
                  >
                    {ESTADOS_LOTE.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </TextField>
                </Box>
              )}

              {item.id === 'refrigeracion' && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    columnGap: 2,
                    mt: 1.5,
                    ml: { xs: 0, sm: 6.5 },
                  }}
                >
                  <TemperaturaInput
                    id="temp-congelador"
                    label="Congelador"
                    icon={<AcUnit fontSize="small" />}
                    value={form.congelador}
                    onChange={setCampo('congelador')}
                    rango={RANGOS_TEMPERATURA.congelador}
                    error={errores.congelador}
                  />
                  <TemperaturaInput
                    id="temp-refrigerador"
                    label="Refrigerador"
                    icon={<DeviceThermostat fontSize="small" />}
                    value={form.refrigerador}
                    onChange={setCampo('refrigerador')}
                    rango={RANGOS_TEMPERATURA.refrigerador}
                    error={errores.refrigerador}
                  />
                </Box>
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
            onChange={setCampo('comentarios')}
            error={Boolean(errores.comentarios)}
            helperText={errores.comentarios}
            sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fafbfc', borderRadius: 2, fontSize: '1rem' } }}
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
          backgroundColor: '#fff',
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
              '&.Mui-disabled': { backgroundColor: COLORS.red, color: '#fff', opacity: 0.7 },
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
