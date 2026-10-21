import { useState } from 'react';
import { Box, Button, ButtonBase, Checkbox, FormControlLabel, IconButton, MenuItem, Switch, Tooltip, Typography } from '@mui/material';
import { Add, DeleteOutlined } from '@mui/icons-material';
import { COLORS } from '../../theme';
import { CampoTexto, Etiqueta, ErroresGenerales, Formulario, Interruptor, PieFormulario } from './campos';
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
  const [terminales, setTerminales] = useState(() => (registro ? registro.terminales.map(filaTerminal) : cajas(1)));

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
      ...(registro?.es_matriz ? {} : { activo }),
      terminales: terminales.map((t) => ({ ...(t.id ? { id: t.id } : {}), nombre: t.nombre, tipo: t.tipo, activo: t.activo })),
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

      {registro?.es_matriz ? (
        <Typography sx={{ fontSize: '0.8rem', color: COLORS.muted }}>Es la sucursal matriz: siempre está activa y no se puede eliminar.</Typography>
      ) : (
        <Interruptor titulo="Sucursal operando" descripcion="Desactívala si cierra temporalmente" checked={activo} onChange={setActivo} />
      )}

      <ErroresGenerales errores={errores} conocidos={['nombre', 'codigo', 'direccion', 'telefono', 'correo', 'id_encargado', 'hora_apertura', 'hora_cierre', 'terminales']} />
      <PieFormulario guardando={guardando} onCancelar={onCancelar} etiqueta={registro ? 'Guardar cambios' : 'Guardar y activar sucursal'} />
    </Formulario>
  );
};

export default SucursalForm;
