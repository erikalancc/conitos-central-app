import { useMemo, useState } from 'react';
import { Autocomplete, Box, Button, Chip, IconButton, LinearProgress, MenuItem, TextField, Typography } from '@mui/material';
import { Add, DeleteOutlined } from '@mui/icons-material';
import { COLORS } from '../../theme';
import { CampoPrecio, CampoTexto, Etiqueta, ErroresGenerales, Formulario, Interruptor, PieFormulario } from './campos';
import { campoSx, precioATexto } from './formato';
import { estadoVitrina } from './recursos';

let siguienteClave = 1;
const filaRecargo = (r = {}) => ({ clave: siguienteClave++, id_presentacion: r.id_presentacion ?? '', monto: precioATexto(r.monto) });

// Existencias del sabor (solo lectura: se mueven desde producción y vitrina)
const Inventario = ({ inventario }) => {
  const estado = estadoVitrina(inventario);
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.surfaceAlt }}>
      <Typography sx={{ mb: 1, fontSize: '0.72rem', fontWeight: 700, letterSpacing: 0.6, color: COLORS.muted }}>INVENTARIO (SOLO LECTURA)</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: COLORS.label }}>
        <span>Vitrina</span>
        <span>
          {inventario.porciones_actual} / {inventario.porciones_max} porciones
        </span>
      </Box>
      <LinearProgress
        variant="determinate"
        value={estado.porcentaje}
        sx={{ my: 0.75, height: 8, borderRadius: 4, backgroundColor: COLORS.inputBg, '& .MuiLinearProgress-bar': { backgroundColor: estado.vitrinaBaja ? COLORS.red : COLORS.blue } }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: estado.reservaBaja ? COLORS.red : COLORS.label }}>
        <span>Botes en reserva {inventario.empaque ? `(${inventario.empaque})` : ''}</span>
        <span>
          {inventario.botes_reserva} (mínimo {inventario.stock_minimo})
        </span>
      </Box>
    </Box>
  );
};

const SaborForm = ({ registro, catalogo, errores, guardando, onGuardar, onCancelar }) => {
  const [nombre, setNombre] = useState(registro?.nombre ?? '');
  // Tipos a los que aplica el sabor (varios): Helado, Paleta Agua, Agua Fresca…
  const [tipos, setTipos] = useState(registro?.tipos ?? []);
  const [tipoEscrito, setTipoEscrito] = useState('');
  const [especial, setEspecial] = useState(registro?.es_especial ?? false);
  const [activo, setActivo] = useState(registro?.activo ?? true);
  const [recargos, setRecargos] = useState(() => (registro?.recargos ?? []).map(filaRecargo));

  // Los recargos aplican a presentaciones de productos que piden sabor
  const presentaciones = useMemo(
    () =>
      catalogo.productos
        .filter((p) => p.requiere_sabor)
        .flatMap((p) => p.presentaciones.map((pr) => ({ id: pr.id, nombre: `${p.nombre} · ${pr.nombre}`, precio: pr.precio_base }))),
    [catalogo.productos]
  );

  const cambiar = (clave, cambios) => setRecargos((lista) => lista.map((r) => (r.clave === clave ? { ...r, ...cambios } : r)));

  // No se permiten sabores repetidos: misma regla que la BD (sin mayúsculas, acentos ni espacios de más)
  const [errorNombre, setErrorNombre] = useState('');
  const sinFormato = (texto) => texto.normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const saborRepetido = (texto) => catalogo.sabores.find((s) => s.id !== registro?.id && sinFormato(s.nombre) === sinFormato(texto));

  // Si quedó un tipo nuevo escrito sin presionar Enter, también se guarda
  const guardar = () => {
    const repetido = nombre.trim() ? saborRepetido(nombre) : null;
    setErrorNombre(repetido ? `Ya existe el sabor "${repetido.nombre}". No se pueden repetir sabores.` : '');
    if (repetido) return;

    onGuardar({
      nombre,
      tipos: tipoEscrito.trim() ? [...tipos, tipoEscrito.trim()] : tipos,
      es_especial: especial,
      activo,
      recargos: recargos.map((r) => ({ id_presentacion: r.id_presentacion, monto: r.monto === '' ? 0 : Number(r.monto) })),
    });
  };

  return (
    <Formulario onSubmit={guardar}>
      <CampoTexto id="sabor-nombre" label="Nombre del sabor *" autoFocus value={nombre} onChange={(e) => { setNombre(e.target.value); setErrorNombre(''); }} error={errorNombre || errores.nombre} placeholder="Ej. Maracuyá con chile" slotProps={{ htmlInput: { maxLength: 50 } }} />

      <Box>
        <Etiqueta htmlFor="sabor-tipo">Aplica para *</Etiqueta>
        <Autocomplete
          multiple
          freeSolo
          disableCloseOnSelect
          options={catalogo.tipos_sabor}
          value={tipos}
          onChange={(_, valor) => {
            // Sin vacíos ni repetidos (sin distinguir mayúsculas)
            const limpios = [];
            valor.map((t) => t.trim()).filter(Boolean).forEach((t) => {
              if (!limpios.some((x) => x.toLowerCase() === t.toLowerCase())) limpios.push(t);
            });
            setTipos(limpios);
          }}
          inputValue={tipoEscrito}
          onInputChange={(_, valor, motivo) => motivo !== 'reset' && setTipoEscrito(valor)}
          onBlur={() => {
            const nuevo = tipoEscrito.trim();
            if (nuevo && !tipos.some((x) => x.toLowerCase() === nuevo.toLowerCase())) setTipos([...tipos, nuevo]);
            setTipoEscrito('');
          }}
          renderValue={(valor, getItemProps) =>
            valor.map((t, index) => {
              const { key, ...props } = getItemProps({ index });
              return <Chip key={key} size="small" label={t} {...props} sx={{ fontWeight: 600, backgroundColor: COLORS.blueSoft, color: COLORS.blueText }} />;
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              id="sabor-tipo"
              size="small"
              placeholder={tipos.length ? '' : 'Helado, Paleta Agua, Agua Fresca…'}
              error={Boolean(errores.tipos)}
              helperText={errores.tipos ?? 'Elige uno o varios; para uno nuevo escríbelo y presiona Enter'}
              sx={campoSx}
            />
          )}
        />
      </Box>

      <Interruptor titulo="Sabor especial" descripcion="Para sabores premium (p. ej. Piñón) que llevan recargo" checked={especial} onChange={setEspecial} />

      {/* Recargos por presentación */}
      <Box>
        <Etiqueta>Recargo por presentación</Etiqueta>
        <Typography sx={{ mb: 1, fontSize: '0.75rem', color: COLORS.muted }}>Monto extra que se suma al precio cuando se elige este sabor</Typography>
        <Box sx={{ display: 'grid', gap: 1 }}>
          {recargos.map((r, i) => (
            <Box key={r.clave} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr) auto', alignItems: 'start', gap: 0.75 }}>
              <CampoTexto
                select
                value={r.id_presentacion}
                onChange={(e) => cambiar(r.clave, { id_presentacion: e.target.value })}
                error={errores[`recargos.${i}.id_presentacion`]}
                slotProps={{ htmlInput: { 'aria-label': `Presentación del recargo ${i + 1}` } }}
              >
                {presentaciones.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.nombre}
                  </MenuItem>
                ))}
              </CampoTexto>
              <CampoPrecio
                value={r.monto}
                onChange={(monto) => cambiar(r.clave, { monto })}
                error={errores[`recargos.${i}.monto`]}
                slotProps={{ htmlInput: { inputMode: 'decimal', 'aria-label': `Monto del recargo ${i + 1}` } }}
              />
              <IconButton aria-label={`Quitar recargo ${i + 1}`} onClick={() => setRecargos((lista) => lista.filter((x) => x.clave !== r.clave))} sx={{ mt: 0.25, color: COLORS.red }}>
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
        <Button startIcon={<Add />} onClick={() => setRecargos((lista) => [...lista, filaRecargo()])} sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}>
          Agregar recargo
        </Button>
      </Box>

      <Interruptor titulo="Disponible en el POS" descripcion="Desactívalo si se descontinúa; se conserva en el historial" checked={activo} onChange={setActivo} />

      {registro?.inventario && <Inventario inventario={registro.inventario} />}

      <ErroresGenerales errores={errores} conocidos={['nombre', 'tipos', 'recargos']} />
      <PieFormulario guardando={guardando} onCancelar={onCancelar} etiqueta={registro ? 'Guardar cambios' : 'Crear sabor'} />
    </Formulario>
  );
};

export default SaborForm;
