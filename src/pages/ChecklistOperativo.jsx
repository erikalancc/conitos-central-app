import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, CircularProgress, Dialog, IconButton, MenuItem, Snackbar, Switch, Tooltip, Typography } from '@mui/material';
import { Add, AddCircleOutlined, DeleteOutlined, EditOutlined, FactCheckOutlined, LockOutlined } from '@mui/icons-material';
import { mensajeDeError } from '../api/axiosClient';
import IconTile from '../components/IconTile';
import Panel from '../components/Panel';
import { eliminarPuntoChecklist, guardarPuntoChecklist, obtenerChecklistAdmin } from '../services/checklistService';
import { COLORS } from '../theme';
import { CampoTexto, Etiqueta, ErroresGenerales, Formulario, Interruptor, PieFormulario } from './admin/campos';
import SeccionesAdmin from './admin/SeccionesAdmin';

const MOMENTOS = [
  { id: 'apertura', label: 'Apertura', ayuda: 'Se pide al iniciar el día, antes de vender.' },
  { id: 'medio-turno', label: 'Mitad del turno', ayuda: 'Se pide a partir de la mitad del horario de la sucursal (p. ej. 10:00 a 21:00 → desde las 15:30).' },
  { id: 'cierre', label: 'Antes del corte', ayuda: 'Se pide al iniciar el corte de caja; sin completarlo no se puede cerrar el turno.' },
];
const TIPOS = [
  { id: 'BOOLEAN', label: 'Marcar como hecho' },
  { id: 'SELECT', label: 'Elegir una opción' },
  { id: 'TEXT', label: 'Marcar y escribir una nota' },
];
const NIVELES = [
  { id: 'ok', label: 'Conforme' },
  { id: 'aviso', label: 'Con observación' },
  { id: 'error', label: 'Incidencia' },
];
const OPCIONES_INICIALES = [
  { texto: 'Conforme', nivel: 'ok' },
  { texto: 'Con observaciones', nivel: 'aviso' },
];

// Cuerpo del PUT/POST a partir de un punto (para cambios rápidos como activar/desactivar)
const aPayload = (p) => ({
  titulo: p.titulo,
  descripcion: p.descripcion ?? '',
  etiqueta_ok: p.etiqueta_ok ?? '',
  momento: p.momento,
  tipo_campo: p.tipo_campo,
  opciones: (p.config?.opciones ?? []).map(({ texto, nivel }) => ({ texto, nivel })),
  sucursales: p.sucursales,
  es_obligatorio: p.es_obligatorio,
  activo: p.activo,
});

const PuntoForm = ({ punto, sucursales, momentoInicial, errores, guardando, onGuardar, onCancelar }) => {
  const [titulo, setTitulo] = useState(punto?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(punto?.descripcion ?? '');
  const [momento, setMomento] = useState(punto?.momento ?? momentoInicial);
  const [tipo, setTipo] = useState(punto?.tipo_campo ?? 'BOOLEAN');
  const [opciones, setOpciones] = useState(() => (punto?.config?.opciones ?? OPCIONES_INICIALES).map(({ texto, nivel }) => ({ texto, nivel })));
  const [etiquetaOk, setEtiquetaOk] = useState(punto?.etiqueta_ok ?? '');
  const [elegidas, setElegidas] = useState(punto?.sucursales ?? []); // vacío = todas
  const [obligatorio, setObligatorio] = useState(punto?.es_obligatorio ?? true);
  const [activo, setActivo] = useState(punto?.activo ?? true);

  const cambiarOpcion = (i, cambios) => setOpciones((lista) => lista.map((o, j) => (j === i ? { ...o, ...cambios } : o)));
  const toggleSucursal = (id) => setElegidas((lista) => (lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]));

  return (
    <Formulario
      onSubmit={() =>
        onGuardar({ titulo, descripcion, etiqueta_ok: etiquetaOk, momento, tipo_campo: tipo, opciones: tipo === 'SELECT' ? opciones : [], sucursales: elegidas, es_obligatorio: obligatorio, activo })
      }
    >
      <CampoTexto id="punto-titulo" label="¿Qué se revisa? *" autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} error={errores.titulo} placeholder="Ej. Limpieza de baños" slotProps={{ htmlInput: { maxLength: 150 } }} />
      <CampoTexto id="punto-descripcion" label="Instrucciones" multiline minRows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} error={errores.descripcion} placeholder="Qué debe verificar el vendedor" slotProps={{ htmlInput: { maxLength: 500 } }} />

      <CampoTexto id="punto-momento" label="¿Cuándo se pide? *" select value={momento} onChange={(e) => setMomento(e.target.value)} error={errores.momento} helperText={errores.momento ?? MOMENTOS.find((m) => m.id === momento)?.ayuda}>
        {MOMENTOS.map((m) => (
          <MenuItem key={m.id} value={m.id}>
            {m.label}
          </MenuItem>
        ))}
      </CampoTexto>

      <CampoTexto id="punto-tipo" label="Tipo de respuesta *" select value={tipo} onChange={(e) => setTipo(e.target.value)} error={errores.tipo_campo}>
        {TIPOS.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {t.label}
          </MenuItem>
        ))}
      </CampoTexto>

      {tipo === 'SELECT' && (
        <Box>
          <Etiqueta>Opciones *</Etiqueta>
          <Typography sx={{ mb: 1, fontSize: '0.75rem', color: COLORS.muted }}>Si se elige una opción con observación o incidencia, se pedirá describirla.</Typography>
          <Box sx={{ display: 'grid', gap: 0.75 }}>
            {opciones.map((o, i) => (
              <Box key={i} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) auto', gap: 0.75, alignItems: 'start' }}>
                <CampoTexto value={o.texto} onChange={(e) => cambiarOpcion(i, { texto: e.target.value })} error={errores[`opciones.${i}.texto`]} placeholder={`Opción ${i + 1}`} slotProps={{ htmlInput: { maxLength: 60, 'aria-label': `Texto de la opción ${i + 1}` } }} />
                <CampoTexto select value={o.nivel} onChange={(e) => cambiarOpcion(i, { nivel: e.target.value })} slotProps={{ htmlInput: { 'aria-label': `Nivel de la opción ${i + 1}` } }}>
                  {NIVELES.map((n) => (
                    <MenuItem key={n.id} value={n.id}>
                      {n.label}
                    </MenuItem>
                  ))}
                </CampoTexto>
                <IconButton aria-label={`Quitar opción ${i + 1}`} disabled={opciones.length <= 2} onClick={() => setOpciones((lista) => lista.filter((_, j) => j !== i))} sx={{ mt: 0.25, color: COLORS.red }}>
                  <DeleteOutlined fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
          {errores.opciones && <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: COLORS.red }}>{errores.opciones}</Typography>}
          <Button startIcon={<Add />} onClick={() => setOpciones((lista) => [...lista, { texto: '', nivel: 'error' }])} sx={{ mt: 1, textTransform: 'none', fontWeight: 600 }}>
            Agregar opción
          </Button>
        </Box>
      )}

      <CampoTexto id="punto-etiqueta" label="Texto cuando se cumple" value={etiquetaOk} onChange={(e) => setEtiquetaOk(e.target.value)} error={errores.etiqueta_ok} placeholder="Ej. Limpio (por defecto: Listo)" slotProps={{ htmlInput: { maxLength: 30 } }} />

      <Box>
        <Etiqueta>Sucursales donde aplica</Etiqueta>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          <Chip label="Todas" onClick={() => setElegidas([])} sx={{ fontWeight: 600, backgroundColor: elegidas.length ? COLORS.inputBg : COLORS.blueSoft, color: elegidas.length ? COLORS.label : COLORS.blueText }} />
          {sucursales.map((s) => {
            const activa = elegidas.includes(s.id);
            return <Chip key={s.id} label={s.nombre} onClick={() => toggleSucursal(s.id)} aria-pressed={activa} sx={{ fontWeight: 600, backgroundColor: activa ? COLORS.blueSoft : COLORS.inputBg, color: activa ? COLORS.blueText : COLORS.label }} />;
          })}
        </Box>
        {errores.sucursales && <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: COLORS.red }}>{errores.sucursales}</Typography>}
      </Box>

      <Interruptor titulo="Obligatorio" descripcion="Si está activo, no se puede guardar el checklist sin marcarlo" checked={obligatorio} onChange={setObligatorio} />
      <Interruptor titulo="Activo" descripcion="Desactívalo para dejar de pedirlo sin borrarlo" checked={activo} onChange={setActivo} />

      <ErroresGenerales errores={errores} conocidos={['titulo', 'descripcion', 'momento', 'tipo_campo', 'opciones', 'etiqueta_ok', 'sucursales']} />
      <PieFormulario guardando={guardando} onCancelar={onCancelar} etiqueta={punto ? 'Guardar cambios' : 'Agregar punto'} />
    </Formulario>
  );
};

const Punto = ({ punto, sucursales, onEditar, onActivo, onEliminar }) => {
  const nombres = punto.sucursales.map((id) => sucursales.find((s) => s.id === id)?.nombre).filter(Boolean);
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, borderRadius: 2.5, border: `1px solid ${COLORS.border}`, opacity: punto.activo ? 1 : 0.6 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>{punto.titulo}</Typography>
        {punto.descripcion && <Typography sx={{ fontSize: '0.8rem', color: COLORS.muted }}>{punto.descripcion}</Typography>}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
          {punto.es_fijo && <Chip size="small" icon={<LockOutlined />} label="Fijo · equipos de frío de cada sucursal" sx={{ fontWeight: 600, backgroundColor: COLORS.yellowSoft, color: COLORS.yellowText }} />}
          {!punto.es_fijo && <Chip size="small" label={TIPOS.find((t) => t.id === punto.tipo_campo)?.label} sx={{ fontWeight: 600 }} />}
          <Chip size="small" label={nombres.length ? nombres.join(', ') : 'Todas las sucursales'} sx={{ fontWeight: 600, backgroundColor: COLORS.blueSoft, color: COLORS.blueText }} />
          {!punto.es_obligatorio && <Chip size="small" label="Opcional" sx={{ fontWeight: 600 }} />}
          {!punto.activo && <Chip size="small" label="Inactivo" sx={{ fontWeight: 600, backgroundColor: COLORS.redSoft, color: COLORS.redHover }} />}
        </Box>
      </Box>
      {!punto.es_fijo && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={punto.activo ? 'Se pide en el checklist' : 'No se pide (inactivo)'}>
            <Switch checked={punto.activo} onChange={(e) => onActivo(punto, e.target.checked)} slotProps={{ input: { 'aria-label': `${punto.titulo} activo` } }} />
          </Tooltip>
          <IconButton aria-label={`Editar ${punto.titulo}`} onClick={() => onEditar(punto)}>
            <EditOutlined fontSize="small" />
          </IconButton>
          <Tooltip title={punto.usado ? 'Ya tiene checklists registrados: desactívalo en lugar de borrarlo' : 'Borrar'}>
            <span>
              <IconButton aria-label={`Borrar ${punto.titulo}`} disabled={punto.usado} onClick={() => onEliminar(punto)} sx={{ color: COLORS.red }}>
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

/**
 * Administración → Checklist operativo: puntos que revisa el vendedor en cada momento del día
 * (apertura, mitad del turno y antes del corte), por sucursal.
 */
const ChecklistOperativo = () => {
  const [datos, setDatos] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [editor, setEditor] = useState(null); // { punto } | { punto: null, momento }
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    obtenerChecklistAdmin().then(setDatos).catch((e) => setErrorCarga(mensajeDeError(e)));
  }, []);

  const guardar = async (id, punto, mensaje) => {
    setGuardando(true);
    setErrores({});
    try {
      setDatos(await guardarPuntoChecklist(id, punto));
      setEditor(null);
      setAviso(mensaje);
    } catch (e) {
      if (e.response?.status === 400) setErrores(e.response.data?.messages ?? {});
      else setAviso(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (punto) => {
    try {
      setDatos(await eliminarPuntoChecklist(punto.id));
      setAviso(`"${punto.titulo}" borrado`);
    } catch (e) {
      setAviso(mensajeDeError(e));
    }
  };

  if (!datos) {
    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
        <SeccionesAdmin />
        <Panel sx={{ py: 8, textAlign: 'center' }}>{errorCarga ? <Alert severity="error">{errorCarga}</Alert> : <CircularProgress />}</Panel>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 } }}>
      <SeccionesAdmin />

      <Panel sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <IconTile bg={COLORS.redSoft} color={COLORS.red} size={48}>
          <FactCheckOutlined />
        </IconTile>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography component="h1" sx={{ fontWeight: 800, fontSize: '1.3rem', color: COLORS.ink }}>
            Checklist operativo
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: COLORS.label }}>
            Lo que el vendedor revisa en cada momento del día. Se le pide de forma obligatoria y solo se muestra lo que aplica a su sucursal.
          </Typography>
        </Box>
      </Panel>

      {MOMENTOS.map((m) => {
        const puntos = datos.items.filter((p) => p.momento === m.id);
        return (
          <Panel key={m.id} sx={{ display: 'grid', gap: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.1rem', color: COLORS.ink }}>
                  {m.label} ({puntos.length})
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: COLORS.muted }}>{m.ayuda}</Typography>
              </Box>
              <Button startIcon={<AddCircleOutlined />} onClick={() => { setErrores({}); setEditor({ punto: null, momento: m.id }); }} sx={{ textTransform: 'none', fontWeight: 700 }}>
                Agregar punto
              </Button>
            </Box>
            {puntos.length ? (
              puntos.map((p) => (
                <Punto
                  key={p.id}
                  punto={p}
                  sucursales={datos.sucursales}
                  onEditar={(punto) => { setErrores({}); setEditor({ punto }); }}
                  onActivo={(punto, activo) => guardar(punto.id, { ...aPayload(punto), activo }, `${punto.titulo}: ${activo ? 'se pedirá' : 'ya no se pedirá'}`)}
                  onEliminar={eliminar}
                />
              ))
            ) : (
              <Typography sx={{ py: 1, fontSize: '0.85rem', color: COLORS.muted }}>Sin puntos: en este momento no se pide checklist.</Typography>
            )}
          </Panel>
        );
      })}

      <Dialog open={Boolean(editor)} onClose={() => !guardando && setEditor(null)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: 4, p: { xs: 2, sm: 3 } } } }}>
        {editor && (
          <>
            <Typography component="h2" sx={{ mb: 2, fontWeight: 800, fontSize: '1.2rem', color: COLORS.ink }}>
              {editor.punto ? 'Editar punto del checklist' : 'Nuevo punto del checklist'}
            </Typography>
            <PuntoForm
              punto={editor.punto}
              sucursales={datos.sucursales}
              momentoInicial={editor.momento ?? 'apertura'}
              errores={errores}
              guardando={guardando}
              onGuardar={(punto) => guardar(editor.punto?.id, punto, editor.punto ? 'Cambios guardados' : 'Punto agregado')}
              onCancelar={() => setEditor(null)}
            />
          </>
        )}
      </Dialog>

      <Snackbar open={Boolean(aviso)} autoHideDuration={2500} onClose={() => setAviso('')} message={aviso} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
};

export default ChecklistOperativo;
