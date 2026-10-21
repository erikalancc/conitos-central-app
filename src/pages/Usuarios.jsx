import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Close, DeleteOutlined, EditOutlined, PersonAddAltOutlined, Search } from '@mui/icons-material';
import { mensajeDeError } from '../api/axiosClient';
import IconTile from '../components/IconTile';
import Panel from '../components/Panel';
import { actualizarUsuario, crearUsuario, eliminarUsuario, obtenerUsuarios } from '../services/usuariosService';
import { COLORS } from '../theme';
import { coincide } from './admin/recursos';
import SeccionesAdmin from './admin/SeccionesAdmin';
import UsuarioForm from './admin/UsuarioForm';

const filtroSx = {
  minWidth: 0,
  '& .MuiOutlinedInput-root': { minHeight: 48, borderRadius: 2.5, backgroundColor: COLORS.surface, '& fieldset': { borderColor: COLORS.border } },
};

// Color por rol (id_rol de la tabla roles)
const COLOR_ROL = {
  1: { bg: COLORS.redSoft, color: COLORS.redHover },
  2: { bg: COLORS.blueSoft, color: COLORS.blueText },
  3: { bg: COLORS.yellowSoft, color: COLORS.yellowText },
  4: { bg: COLORS.greenSoft, color: COLORS.greenText },
};
const colorRol = (id) => COLOR_ROL[id] ?? { bg: COLORS.inputBg, color: COLORS.label };

const iniciales = (nombre) =>
  nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

const ultimoAcceso = (fecha) => {
  if (!fecha) return 'Nunca ha iniciado sesión';
  const f = new Date(fecha);
  const hoy = new Date();
  const mismoDia = f.toDateString() === hoy.toDateString();
  return `Último acceso: ${mismoDia ? 'hoy' : f.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })} a las ${f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
};

const FilaUsuario = ({ usuario, esYo, seleccionado, cambiando, onEditar, onActivo, onEliminar }) => {
  const color = colorRol(usuario.id_rol);
  const bloqueoBorrar = esYo ? 'No puedes eliminar tu propio usuario' : usuario.en_uso ? 'Ya tiene ventas u operaciones: desactívalo en su lugar' : null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        p: { xs: 1.5, md: 2 },
        borderRadius: 3,
        border: `1px solid ${seleccionado ? COLORS.blue : COLORS.border}`,
        boxShadow: seleccionado ? `0 0 0 1px ${COLORS.blue}` : '0 1px 3px rgba(15, 23, 42, 0.04)',
        backgroundColor: COLORS.surface,
        opacity: usuario.activo ? 1 : 0.65,
      }}
    >
      <Avatar sx={{ width: 44, height: 44, fontWeight: 700, backgroundColor: color.bg, color: color.color }}>{iniciales(usuario.nombre)}</Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
          <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>{usuario.nombre}</Typography>
          {esYo && <Chip size="small" label="Tú" sx={{ height: 22, fontWeight: 700, backgroundColor: COLORS.inputBg, color: COLORS.label }} />}
          <Chip size="small" label={usuario.rol} sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, backgroundColor: color.bg, color: color.color }} />
          {!usuario.activo && <Chip size="small" label="Inactivo" sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, backgroundColor: COLORS.inputBg, color: COLORS.muted }} />}
        </Box>
        <Typography sx={{ fontSize: '0.8rem', color: COLORS.muted }}>
          @{usuario.usuario} · {usuario.sucursal?.nombre ?? 'Sin sucursal'} · {ultimoAcceso(usuario.ultimo_acceso)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', ml: { xs: 'auto', sm: 0 }, flexShrink: 0 }}>
        <Tooltip title={esYo ? 'No puedes desactivar tu propio usuario' : usuario.activo ? 'Activo' : 'Inactivo'}>
          <span>
            <Switch checked={usuario.activo} disabled={esYo || cambiando} onChange={(e) => onActivo(e.target.checked)} slotProps={{ input: { 'aria-label': `${usuario.nombre} activo` } }} />
          </span>
        </Tooltip>
        <Tooltip title="Editar">
          <IconButton aria-label={`Editar ${usuario.nombre}`} onClick={onEditar} sx={{ color: COLORS.blueText }}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={bloqueoBorrar ?? 'Eliminar'}>
          <span>
            <IconButton aria-label={`Eliminar ${usuario.nombre}`} disabled={Boolean(bloqueoBorrar)} onClick={onEliminar} sx={{ color: COLORS.red }}>
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

const Usuarios = () => {
  const panelLateral = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const drawerLateral = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  const panelEditorRef = useRef(null);

  const [datos, setDatos] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [rol, setRol] = useState('todos');
  const [estado, setEstado] = useState('activos');
  const [editor, setEditor] = useState(null); // { id } | { id: null } para nuevo
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [cambiandoId, setCambiandoId] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const [aviso, setAviso] = useState('');

  const cargar = () =>
    obtenerUsuarios()
      .then(setDatos)
      .catch((e) => setErrorCarga(mensajeDeError(e, 'No se pudieron cargar los usuarios.')));

  useEffect(() => {
    cargar();
  }, []);

  // En escritorio, al abrir el editor se desplaza lo justo para que quede completo en pantalla
  const editorAbierto = editor ? String(editor.id ?? 'nuevo') : null;
  useEffect(() => {
    if (editorAbierto && panelLateral) panelEditorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [editorAbierto, panelLateral]);

  const usuarios = useMemo(
    () =>
      (datos?.usuarios ?? [])
        .filter((u) => coincide(busqueda.trim(), u.nombre, u.usuario, u.rol, u.sucursal?.nombre ?? ''))
        .filter((u) => rol === 'todos' || u.id_rol === rol)
        .filter((u) => estado === 'todos' || (estado === 'activos' ? u.activo : !u.activo)),
    [datos, busqueda, rol, estado]
  );

  const editado = editor?.id ? datos?.usuarios.find((u) => u.id === editor.id) : null;

  const abrirEditor = (usuario) => {
    setErrores({});
    setEditor({ id: usuario?.id ?? null });
  };
  const cerrarEditor = () => {
    setEditor(null);
    setErrores({});
  };

  const handleGuardar = async (cambios) => {
    setGuardando(true);
    setErrores({});
    try {
      const respuesta = editor.id ? await actualizarUsuario(editor.id, cambios) : await crearUsuario(cambios);
      setDatos(respuesta);
      setEditor({ id: respuesta.id });
      setAviso(editor.id ? 'Usuario actualizado' : 'Usuario creado: ya puede iniciar sesión');
    } catch (error) {
      if (error.response?.status === 400) setErrores(error.response.data?.messages ?? {});
      else setAviso(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  };

  const handleActivo = async (usuario, activo) => {
    setCambiandoId(usuario.id);
    try {
      setDatos(await actualizarUsuario(usuario.id, { activo }));
      setAviso(`${usuario.nombre}: ${activo ? 'activo' : 'desactivado'}`);
    } catch (error) {
      setAviso(mensajeDeError(error));
    } finally {
      setCambiandoId(null);
    }
  };

  const handleEliminar = async () => {
    const usuario = porEliminar;
    setPorEliminar(null);
    try {
      setDatos(await eliminarUsuario(usuario.id));
      if (editor?.id === usuario.id) cerrarEditor();
      setAviso(`${usuario.nombre} eliminado`);
    } catch (error) {
      setAviso(mensajeDeError(error));
    }
  };

  if (!datos) {
    return (
      <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 } }}>
        <SeccionesAdmin />
        <Panel sx={{ py: 8, textAlign: 'center' }}>
          {errorCarga ? (
            <>
              <Alert severity="error" sx={{ maxWidth: 480, mx: 'auto', textAlign: 'left' }}>
                {errorCarga}
              </Alert>
              <Button
                onClick={() => {
                  setErrorCarga('');
                  cargar();
                }}
                sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Reintentar
              </Button>
            </>
          ) : (
            <CircularProgress />
          )}
        </Panel>
      </Box>
    );
  }

  const contenidoEditor = editor && (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2.5, pb: 2, borderBottom: `1px solid ${COLORS.border}` }}>
        <IconTile bg={COLORS.redSoft} color={COLORS.red} size={44}>
          <PersonAddAltOutlined />
        </IconTile>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.15rem', color: COLORS.ink }}>
            {editado ? 'Editar usuario' : 'Nuevo usuario'}
          </Typography>
          <Typography noWrap sx={{ fontSize: '0.8rem', color: COLORS.muted }}>
            {editado ? `@${editado.usuario}` : 'Podrá iniciar sesión con su usuario y contraseña'}
          </Typography>
        </Box>
        <IconButton aria-label="Cerrar editor" onClick={cerrarEditor} sx={{ backgroundColor: COLORS.inputBg }}>
          <Close />
        </IconButton>
      </Box>
      <UsuarioForm key={editor.id ?? 'nuevo'} registro={editado} datos={datos} errores={errores} guardando={guardando} onGuardar={handleGuardar} onCancelar={cerrarEditor} />
    </>
  );

  return (
    <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 } }}>
      <SeccionesAdmin />

      {/* ENCABEZADO: usuarios activos por rol */}
      <Panel sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, gap: 2, p: { xs: 2, md: 3 } }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1, color: COLORS.blueText }}>ADMINISTRACIÓN</Typography>
          <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.4rem', md: '1.7rem' }, color: COLORS.ink }}>
            Usuarios del sistema
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: COLORS.label }}>Quién puede iniciar sesión y qué puede hacer según su rol</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'stretch' }}>
          {datos.roles.map((r) => (
            <Box key={r.id} sx={{ minWidth: 110, px: 2, py: 1.25, borderRadius: 2.5, backgroundColor: colorRol(r.id).bg }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', lineHeight: 1.2, color: colorRol(r.id).color }}>{r.usuarios}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: COLORS.label }}>{r.nombre}</Typography>
            </Box>
          ))}
          <Button
            variant="contained"
            disableElevation
            startIcon={<PersonAddAltOutlined />}
            onClick={() => abrirEditor(null)}
            sx={{ minHeight: 56, px: 2.5, borderRadius: 2.5, textTransform: 'none', fontWeight: 800, backgroundColor: COLORS.red, boxShadow: '0 6px 16px rgba(227, 36, 59, 0.3)', '&:hover': { backgroundColor: COLORS.redHover } }}
          >
            Nuevo usuario
          </Button>
        </Box>
      </Panel>

      <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, alignItems: 'start', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 420px', xl: 'minmax(0, 1fr) 460px' } }}>
        <Box sx={{ display: 'grid', gap: 1.25, minWidth: 0 }}>
          <Box sx={{ display: 'grid', gap: 1, mb: 0.75, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: '2fr 1fr 1fr' } }}>
            <TextField
              placeholder="Buscar por nombre, usuario, rol o sucursal…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              sx={filtroSx}
              slotProps={{
                htmlInput: { 'aria-label': 'Buscar usuarios' },
                input: { startAdornment: <InputAdornment position="start"><Search sx={{ color: COLORS.muted }} /></InputAdornment> },
              }}
            />
            <TextField select value={rol} onChange={(e) => setRol(e.target.value)} sx={filtroSx} slotProps={{ htmlInput: { 'aria-label': 'Filtrar por rol' } }}>
              <MenuItem value="todos">Todos los roles</MenuItem>
              {datos.roles.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.nombre}
                </MenuItem>
              ))}
            </TextField>
            <TextField select value={estado} onChange={(e) => setEstado(e.target.value)} sx={filtroSx} slotProps={{ htmlInput: { 'aria-label': 'Filtrar por estado' } }}>
              <MenuItem value="activos">Activos</MenuItem>
              <MenuItem value="inactivos">Inactivos</MenuItem>
              <MenuItem value="todos">Todos</MenuItem>
            </TextField>
          </Box>

          {usuarios.length ? (
            usuarios.map((u) => (
              <FilaUsuario
                key={u.id}
                usuario={u}
                esYo={u.id === datos.yo}
                seleccionado={editor?.id === u.id}
                cambiando={cambiandoId === u.id}
                onEditar={() => abrirEditor(u)}
                onActivo={(activo) => handleActivo(u, activo)}
                onEliminar={() => setPorEliminar(u)}
              />
            ))
          ) : (
            <Box sx={{ py: 6, textAlign: 'center', color: COLORS.muted, borderRadius: 3, border: `1px dashed ${COLORS.border}` }}>
              <Typography sx={{ fontWeight: 600 }}>Sin resultados</Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>Ajusta la búsqueda o los filtros</Typography>
            </Box>
          )}
        </Box>

        {/* EDITOR: panel fijo en escritorio; el formulario se desplaza por dentro */}
        {panelLateral && (
          <Panel ref={panelEditorRef} sx={{ position: 'sticky', top: 16, maxHeight: 'calc(100dvh - 170px)', overflowY: 'auto', scrollPaddingBottom: 96, p: 2.5, borderTop: `4px solid ${COLORS.red}` }}>
            {contenidoEditor || (
              <Box sx={{ py: 6, textAlign: 'center', color: COLORS.muted }}>
                <Typography sx={{ fontWeight: 600, color: COLORS.label }}>Selecciona un usuario para editarlo</Typography>
                <Typography sx={{ fontSize: '0.85rem' }}>o crea uno nuevo</Typography>
                <Button startIcon={<PersonAddAltOutlined />} onClick={() => abrirEditor(null)} sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}>
                  Nuevo usuario
                </Button>
              </Box>
            )}
          </Panel>
        )}
      </Box>

      {/* EDITOR: hoja deslizable en tablet y celular */}
      {!panelLateral && (
        <Drawer
          anchor={drawerLateral ? 'right' : 'bottom'}
          open={Boolean(editor)}
          onClose={cerrarEditor}
          slotProps={{
            paper: {
              sx: drawerLateral
                ? { width: 460, maxWidth: '100%', p: 2.5, scrollPaddingBottom: 96 }
                : { maxHeight: '92dvh', p: 2, pb: 'max(16px, env(safe-area-inset-bottom))', scrollPaddingBottom: 96, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
            },
          }}
        >
          {contenidoEditor}
        </Drawer>
      )}

      <Dialog open={Boolean(porEliminar)} onClose={() => setPorEliminar(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>¿Eliminar a {porEliminar?.nombre}?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: COLORS.label }}>Se borra de forma permanente. Si solo quieres que ya no entre al sistema, desactívalo con el interruptor.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPorEliminar(null)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" disableElevation onClick={handleEliminar} sx={{ minHeight: 44, textTransform: 'none', fontWeight: 700 }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(aviso)} autoHideDuration={3000} onClose={() => setAviso('')} message={aviso} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
};

export default Usuarios;
