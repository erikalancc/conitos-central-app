import { useState } from 'react';
import { Box, Button, ButtonBase, Checkbox, FormControlLabel, IconButton, MenuItem, Switch, Tooltip, Typography } from '@mui/material';
import { Add, DeleteOutlined } from '@mui/icons-material';
import CampoTemperatura from '../../components/CampoTemperatura';
import { COLORS } from '../../theme';
import { CampoTexto, Etiqueta, ErroresGenerales, Formulario, Interruptor, PieFormulario } from './campos';
import { campoSx } from './formato';
import { TIPOS_TERMINAL } from './recursos';


const MODALIDADES = [
  { id: 'mostrador', label: 'Punto de venta mostrador' },
  { id: 'para_llevar', label: 'Para llevar / Pick-up' },
  { id: 'apps_delivery', label: 'Rappi y Uber Eats' },
  { id: 'drive_thru', label: 'Drive-thru / Auto' },
];

let siguienteClave = 1;
const filaTerminal = (t = {}) => ({ clave: siguienteClave++, id: t.id, nombre: t.nombre ?? '', tipo: t.tipo ?? 'caja', activo: t.activo ?? true });
const cajas = (n) => Array.from({ length: n }, (_, i) => filaTerminal({ nombre: `Caja #${String(i + 1).padStart(2, '0')}` }));

// Congeladores y refrigeradores: rango permitido en °C (admite negativos)
const TIPOS_EQUIPO = [
  { id: 'congelador', label: 'Congelador', min: -30, max: -15 },
  { id: 'refrigerador', label: 'Refrigerador', min: 0, max: 5 },
];
const texto = (n) => (n === undefined || n === null ? '' : String(n));
const filaEquipo = (e = {}) => ({
  clave: siguienteClave++,
  id: e.id,
  nombre: e.nombre ?? '',
  tipo: e.tipo ?? 'congelador',
  min: texto(e.temp_min),
  max: texto(e.temp_max),
  activo: e.activo ?? true,
});
// Una sucursal nueva arranca con un congelador y un refrigerador con su rango típico
const equiposIniciales = () => TIPOS_EQUIPO.map((t) => filaEquipo({ nombre: t.label, tipo: t.id, temp_min: t.min, temp_max: t.max }));

const SucursalForm = ({ registro, datos, errores, guardando, onGuardar, onCancelar }) => {
  const [nombre, setNombre] = useState(registro?.nombre ?? '');
  const [codigo, setCodigo] = useState(registro?.codigo ?? datos.siguiente_codigo);
  const [direccion, setDireccion] = useState(registro?.direccion ?? '');
  const [telefono, setTelefono] = useState(registro?.telefono ?? '');
  const [correo, setCorreo] = useState(registro?.correo ?? '');
  const [encargado, setEncargado] = useState(registro?.encargado?.id ?? '');
  const [apertura, setApertura] = useState(registro?.hora_apertura ?? '10:00');
  const [cierre, setCierre] = useState(registro?.hora_cierre ?? '21:00');
  const [modalidades, setModalidades] = useState(
    registro?.modalidades ?? { mostrador: true, para_llevar: true, apps_delivery: false, drive_thru: false }
  );
  const [activo, setActivo] = useState(registro?.activo ?? true);
  // Cuántas de las últimas ventas ve el Vendedor / Cajero en el historial del día y en el corte
  const [ventasVisibles, setVentasVisibles] = useState(String(registro?.ventas_visibles_vendedor ?? 5));
  const [terminales, setTerminales] = useState(() => (registro ? registro.terminales.map(filaTerminal) : cajas(1)));

  const [equipos, setEquipos] = useState(() => (registro ? (registro.equipos_frio ?? []).map(filaEquipo) : equiposIniciales()));
  const cambiarEquipo = (clave, cambios) => setEquipos((lista) => lista.map((e) => (e.clave === clave ? { ...e, ...cambios } : e)));
  // Al cambiar el tipo de un equipo sin rango capturado, se sugiere el rango típico
  const cambiarTipoEquipo = (e, tipo) => {
    const sugerido = TIPOS_EQUIPO.find((t) => t.id === tipo);
    cambiarEquipo(e.clave, { tipo, ...(e.min === '' && e.max === '' ? { min: texto(sugerido.min), max: texto(sugerido.max) } : {}) });
  };

  const cambiar = (clave, cambios) => setTerminales((lista) => lista.map((t) => (t.clave === clave ? { ...t, ...cambios } : t)));
  const soloCajasNuevas = !registro && terminales.every((t) => t.tipo === 'caja' && /^Caja #\d+$/.test(t.nombre));

  const guardar = () =>
    onGuardar({
      nombre,
      codigo,
      direccion,
      telefono,
      correo,
      id_encargado: encargado || null,
      hora_apertura: apertura || null,
      hora_cierre: cierre || null,
      modalidades,
      ventas_visibles_vendedor: ventasVisibles === '' ? 0 : Number(ventasVisibles),
      ...(registro?.es_matriz ? {} : { activo }),
      terminales: terminales.map((t) => ({ ...(t.id ? { id: t.id } : {}), nombre: t.nombre, tipo: t.tipo, activo: t.activo })),
      equipos_frio: equipos.map((e) => ({
        ...(e.id ? { id: e.id } : {}),
        nombre: e.nombre,
        tipo: e.tipo,
        temp_min: e.min === '' || e.min === '-' ? null : Number(e.min),
        temp_max: e.max === '' || e.max === '-' ? null : Number(e.max),
        activo: e.activo,
      })),
    });

  return (
    <Formulario onSubmit={guardar}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 1.5 }}>
        <CampoTexto id="sucursal-nombre" label="Nombre comercial *" autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} placeholder="Ej. Sucursal Del Valle Sur" slotProps={{ htmlInput: { maxLength: 100 } }} />
        <CampoTexto id="sucursal-codigo" label="Código *" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} error={errores.codigo} slotProps={{ htmlInput: { maxLength: 20 } }} />
      </Box>

      <CampoTexto id="sucursal-direccion" label="Dirección completa *" value={direccion} onChange={(e) => setDireccion(e.target.value)} error={errores.direccion} placeholder="Calle, número, colonia, alcaldía o municipio" slotProps={{ htmlInput: { maxLength: 255 } }} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
        <CampoTexto id="sucursal-telefono" label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} error={errores.telefono} placeholder="55 5543 9012" slotProps={{ htmlInput: { inputMode: 'tel', maxLength: 20 } }} />
        <CampoTexto id="sucursal-correo" label="Correo de la tienda" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errores.correo} placeholder="sucursal@conitos.mx" slotProps={{ htmlInput: { inputMode: 'email', maxLength: 120 } }} />
      </Box>

      <CampoTexto id="sucursal-encargado" label="Encargado" select value={encargado} onChange={(e) => setEncargado(e.target.value)} error={errores.id_encargado} slotProps={{ select: { displayEmpty: true } }}>
        <MenuItem value="">Sin asignar</MenuItem>
        {datos.usuarios.map((u) => (
          <MenuItem key={u.id} value={u.id}>
            {u.nombre} ({u.rol})
          </MenuItem>
        ))}
      </CampoTexto>

      <Box>
        <Etiqueta>Horario de operación</Etiqueta>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto minmax(0, 1fr)', alignItems: 'start', gap: 1 }}>
          <CampoTexto type="time" value={apertura} onChange={(e) => setApertura(e.target.value)} error={errores.hora_apertura} slotProps={{ htmlInput: { 'aria-label': 'Hora de apertura' } }} />
          <Typography sx={{ mt: 1, color: COLORS.muted }}>a</Typography>
          <CampoTexto type="time" value={cierre} onChange={(e) => setCierre(e.target.value)} error={errores.hora_cierre} slotProps={{ htmlInput: { 'aria-label': 'Hora de cierre' } }} />
        </Box>
      </Box>

      <Box>
        <Etiqueta>Modalidades de venta</Etiqueta>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' }, px: 1, py: 0.5, borderRadius: 2, backgroundColor: COLORS.inputBg }}>
          {MODALIDADES.map((m) => (
            <FormControlLabel
              key={m.id}
              control={<Checkbox checked={modalidades[m.id]} onChange={(e) => setModalidades((prev) => ({ ...prev, [m.id]: e.target.checked }))} />}
              label={m.label}
              sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.88rem' } }}
            />
          ))}
        </Box>
      </Box>

      <CampoTexto
        id="sucursal-ventas-visibles"
        label="Últimas ventas visibles para el vendedor"
        value={ventasVisibles}
        onChange={(e) => setVentasVisibles(e.target.value.replace(/\D/g, '').slice(0, 3))}
        error={errores.ventas_visibles_vendedor}
        helperText={errores.ventas_visibles_vendedor ?? 'El vendedor solo ve estas últimas ventas en el historial del día y en el corte de caja (0 = ninguna, máx. 100).'}
        slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 3 } }}
        sx={{ maxWidth: 360 }}
      />

      {/* Terminales POS */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
          <Etiqueta sx={{ mb: 0 }}>Terminales POS *</Etiqueta>
          {soloCajasNuevas && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {[1, 2, 3].map((n) => (
                <ButtonBase
                  key={n}
                  onClick={() => setTerminales(cajas(n))}
                  sx={{
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 1.5,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: terminales.length === n ? '#fff' : COLORS.label,
                    backgroundColor: terminales.length === n ? COLORS.blueText : COLORS.inputBg,
                  }}
                >
                  {n} caja{n > 1 ? 's' : ''}
                </ButtonBase>
              ))}
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'grid', gap: 1 }}>
          {terminales.map((t, i) => (
            <Box key={t.clave} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) auto auto', alignItems: 'start', gap: 0.75 }}>
              <CampoTexto
                value={t.nombre}
                onChange={(e) => cambiar(t.clave, { nombre: e.target.value })}
                placeholder="Ej. Caja #01 Principal"
                error={errores[`terminales.${i}.nombre`]}
                slotProps={{ htmlInput: { maxLength: 50, 'aria-label': `Nombre de la terminal ${i + 1}` } }}
              />
              <CampoTexto select value={t.tipo} onChange={(e) => cambiar(t.clave, { tipo: e.target.value })} slotProps={{ htmlInput: { 'aria-label': `Tipo de la terminal ${i + 1}` } }}>
                {TIPOS_TERMINAL.map((tipo) => (
                  <MenuItem key={tipo.id} value={tipo.id}>
                    {tipo.label}
                  </MenuItem>
                ))}
              </CampoTexto>
              <Tooltip title={t.activo ? 'Activa' : 'Inactiva'}>
                <Switch checked={t.activo} onChange={(e) => cambiar(t.clave, { activo: e.target.checked })} slotProps={{ input: { 'aria-label': `Terminal ${i + 1} activa` } }} />
              </Tooltip>
              <Tooltip title={terminales.length === 1 ? 'Debe quedar al menos una' : 'Quitar'}>
                <span>
                  <IconButton aria-label={`Quitar terminal ${i + 1}`} disabled={terminales.length === 1} onClick={() => setTerminales((lista) => lista.filter((x) => x.clave !== t.clave))} sx={{ mt: 0.25, color: COLORS.red }}>
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          ))}
        </Box>
        {errores.terminales && <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: COLORS.red }}>{errores.terminales}</Typography>}
        <Button
          startIcon={<Add />}
          onClick={() => setTerminales((lista) => [...lista, filaTerminal({ nombre: `Caja #${String(lista.length + 1).padStart(2, '0')}` })])}
          sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}
        >
          Agregar terminal
        </Button>
      </Box>

      {/* Congeladores y refrigeradores: se revisan en el checklist de apertura de esta sucursal */}
      <Box>
        <Etiqueta>Congeladores y refrigeradores</Etiqueta>
        <Typography sx={{ mb: 1, fontSize: '0.75rem', color: COLORS.muted }}>
          Se revisan en el checklist de apertura. Indica entre cuántos grados debe estar cada uno; usa ± para temperaturas bajo cero.
        </Typography>
        <Box sx={{ display: 'grid', gap: 1 }}>
          {equipos.map((e, i) => (
            <Box key={e.clave} sx={{ display: 'grid', gap: 0.75, p: 1, borderRadius: 2, border: `1px solid ${COLORS.border}`, opacity: e.activo ? 1 : 0.7 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) auto auto', alignItems: 'start', gap: 0.75 }}>
                <CampoTexto
                  value={e.nombre}
                  onChange={(ev) => cambiarEquipo(e.clave, { nombre: ev.target.value })}
                  placeholder="Ej. Congelador vitrina 1"
                  error={errores[`equipos_frio.${i}.nombre`]}
                  slotProps={{ htmlInput: { maxLength: 60, 'aria-label': `Nombre del equipo ${i + 1}` } }}
                />
                <CampoTexto select value={e.tipo} onChange={(ev) => cambiarTipoEquipo(e, ev.target.value)} error={errores[`equipos_frio.${i}.tipo`]} slotProps={{ htmlInput: { 'aria-label': `Tipo del equipo ${i + 1}` } }}>
                  {TIPOS_EQUIPO.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.label}
                    </MenuItem>
                  ))}
                </CampoTexto>
                <Tooltip title={e.activo ? 'Se revisa en el checklist' : 'No se revisa (inactivo)'}>
                  <Switch checked={e.activo} onChange={(ev) => cambiarEquipo(e.clave, { activo: ev.target.checked })} slotProps={{ input: { 'aria-label': `Equipo ${i + 1} activo` } }} />
                </Tooltip>
                <Tooltip title="Quitar">
                  <IconButton aria-label={`Quitar equipo ${i + 1}`} onClick={() => setEquipos((lista) => lista.filter((x) => x.clave !== e.clave))} sx={{ mt: 0.25, color: COLORS.red }}>
                    <DeleteOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.75 }}>
                {[
                  { campo: 'min', api: 'temp_min', label: 'Mínima' },
                  { campo: 'max', api: 'temp_max', label: 'Máxima' },
                ].map(({ campo, api, label }) => (
                  <Box key={campo}>
                    <Typography sx={{ mb: 0.25, fontSize: '0.72rem', fontWeight: 600, color: COLORS.label }}>{label}</Typography>
                    <CampoTemperatura
                      fullWidth
                      size="small"
                      value={e[campo]}
                      onChange={(valor) => cambiarEquipo(e.clave, { [campo]: valor })}
                      placeholder={campo === 'min' ? '-30' : '-15'}
                      error={Boolean(errores[`equipos_frio.${i}.${api}`])}
                      helperText={errores[`equipos_frio.${i}.${api}`]}
                      sx={campoSx}
                      slotProps={{ htmlInput: { 'aria-label': `Temperatura ${label.toLowerCase()} del equipo ${i + 1}` } }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
        {!equipos.length && <Typography sx={{ fontSize: '0.8rem', color: COLORS.muted }}>Sin equipos: el checklist no pedirá temperaturas en esta sucursal.</Typography>}
        {errores.equipos_frio && <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: COLORS.red }}>{errores.equipos_frio}</Typography>}
        <Button startIcon={<Add />} onClick={() => setEquipos((lista) => [...lista, filaEquipo({ nombre: '', tipo: 'congelador', temp_min: -30, temp_max: -15 })])} sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}>
          Agregar congelador o refrigerador
        </Button>
      </Box>

      {registro?.es_matriz ? (
        <Typography sx={{ fontSize: '0.8rem', color: COLORS.muted }}>Es la sucursal matriz: siempre está activa y no se puede eliminar.</Typography>
      ) : (
        <Interruptor titulo="Sucursal operando" descripcion="Desactívala si cierra temporalmente" checked={activo} onChange={setActivo} />
      )}

      <ErroresGenerales errores={errores} conocidos={['nombre', 'codigo', 'direccion', 'telefono', 'correo', 'id_encargado', 'hora_apertura', 'hora_cierre', 'terminales', 'equipos_frio', 'ventas_visibles_vendedor']} />
      <PieFormulario guardando={guardando} onCancelar={onCancelar} etiqueta={registro ? 'Guardar cambios' : 'Guardar y activar sucursal'} />
    </Formulario>
  );
};

export default SucursalForm;
