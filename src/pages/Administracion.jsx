import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
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
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { AddCircleOutlined, Close, Search, StorefrontOutlined, TuneOutlined } from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { mensajeDeError } from '../api/axiosClient';
import IconTile from '../components/IconTile';
import Panel from '../components/Panel';
import { actualizarRegistro, crearRegistro, eliminarRegistro, obtenerCatalogoAdmin } from '../services/catalogoAdminService';
import { COLORS } from '../theme';
import { CategoriaForm, ExtraForm, PromocionForm } from './admin/FormulariosSimples';
import ListaRegistros from './admin/ListaRegistros';
import ProductoForm from './admin/ProductoForm';
import { coincide, estadoVitrina, RECURSOS, recursoPorId } from './admin/recursos';
import SaborForm from './admin/SaborForm';
import SeccionesAdmin from './admin/SeccionesAdmin';

const FORMULARIOS = {
  productos: ProductoForm,
  sabores: SaborForm,
  categorias: CategoriaForm,
  extras: ExtraForm,
  promociones: PromocionForm,
};

const filtroSx = {
  minWidth: 0,
  '& .MuiOutlinedInput-root': { minHeight: 48, borderRadius: 2.5, backgroundColor: COLORS.surface, '& fieldset': { borderColor: COLORS.border } },
};

const Indicador = ({ valor, titulo, alerta, onClick }) => (
  <ButtonBase
    onClick={onClick}
    disabled={!onClick}
    sx={{
      flexDirection: 'column',
      alignItems: 'flex-start',
      minWidth: 120,
      px: 2,
      py: 1.25,
      borderRadius: 2.5,
      textAlign: 'left',
      backgroundColor: alerta ? COLORS.redSoft : COLORS.inputBg,
      color: alerta ? COLORS.redHover : COLORS.ink,
    }}
  >
    <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', lineHeight: 1.2 }}>{valor}</Typography>
    <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, color: alerta ? COLORS.redHover : COLORS.label }}>{titulo}</Typography>
  </ButtonBase>
);

const Administracion = () => {
  const [params, setParams] = useSearchParams();
  const recurso = recursoPorId(params.get('tab'));
  const panelLateral = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const drawerLateral = useMediaQuery((theme) => theme.breakpoints.up('sm'));

  const [catalogo, setCatalogo] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todos');
  const [categoria, setCategoria] = useState('todas');
  const [editor, setEditor] = useState(null); // { id } | { id: null } para nuevo
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [cambiandoId, setCambiandoId] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const [aviso, setAviso] = useState('');
  const panelEditorRef = useRef(null);

  const cargar = () =>
    obtenerCatalogoAdmin()
      .then(setCatalogo)
      .catch((error) => setErrorCarga(mensajeDeError(error)));

  useEffect(() => {
    cargar();
  }, []);

  // En escritorio, al abrir el editor se desplaza lo justo para que quede completo (con Guardar) en pantalla
  const editorAbierto = editor ? `${recurso.id}-${editor.id ?? 'nuevo'}` : null;
  useEffect(() => {
    if (editorAbierto && panelLateral) panelEditorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [editorAbierto, panelLateral]);

  const cambiarPestana = (id) => {
    setParams({ tab: id }, { replace: true });
    setEditor(null);
    setErrores({});
    setBusqueda('');
    setEstado('todos');
    setCategoria('todas');
  };

  const registros = useMemo(() => {
    if (!catalogo) return [];
    return catalogo[recurso.id]
      .filter((r) => coincide(busqueda.trim(), recurso.texto(r, catalogo)))
      .filter((r) => {
        if (estado === 'activos') return r[recurso.campoActivo];
        if (estado === 'inactivos') return !r[recurso.campoActivo];
        if (estado === 'alerta') return estadoVitrina(r.inventario)?.critico;
        return true;
      })
      .filter((r) => recurso.id !== 'productos' || categoria === 'todas' || r.id_categoria === categoria);
  }, [catalogo, recurso, busqueda, estado, categoria]);

  const alertasVitrina = catalogo?.sabores.filter((s) => s.activo && estadoVitrina(s.inventario)?.critico).length ?? 0;
  const registroEditado = editor?.id ? catalogo?.[recurso.id].find((r) => r.id === editor.id) : null;

  const abrirEditor = (registro) => {
    setErrores({});
    setEditor({ id: registro?.id ?? null });
  };

  const cerrarEditor = () => {
    setEditor(null);
    setErrores({});
  };

  const handleGuardar = async (datos) => {
    setGuardando(true);
    setErrores({});
    try {
      const respuesta = editor.id ? await actualizarRegistro(recurso.id, editor.id, datos) : await crearRegistro(recurso.id, datos);
      setCatalogo(respuesta.catalogo);
      setEditor({ id: respuesta.id });
      setAviso(editor.id ? 'Cambios guardados' : `${recurso.singular.charAt(0).toUpperCase()}${recurso.singular.slice(1)} creado`);
    } catch (error) {
      if (error.response?.status === 400) setErrores(error.response.data?.messages ?? {});
      else setAviso(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  };

  const handleActivo = async (registro, valor) => {
    setCambiandoId(registro.id);
    try {
      const respuesta = await actualizarRegistro(recurso.id, registro.id, { [recurso.campoActivo]: valor });
      setCatalogo(respuesta.catalogo);
      setAviso(`${registro.nombre}: ${valor ? 'visible' : 'oculto'} en el POS`);
    } catch (error) {
      setAviso(mensajeDeError(error));
    } finally {
      setCambiandoId(null);
    }
  };

  const handleEliminar = async () => {
    const registro = porEliminar;
    setPorEliminar(null);
    try {
      const respuesta = await eliminarRegistro(recurso.id, registro.id);
      setCatalogo(respuesta.catalogo);
      if (editor?.id === registro.id) cerrarEditor();
      setAviso(`${registro.nombre} eliminado`);
    } catch (error) {
      setAviso(mensajeDeError(error));
    }
  };

  if (!catalogo) {
    return (
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
    );
  }

  const Formulario = FORMULARIOS[recurso.id];
  const contenidoEditor = editor && (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2.5, pb: 2, borderBottom: `1px solid ${COLORS.border}` }}>
        <IconTile bg={COLORS.redSoft} color={COLORS.red} size={44}>
          <AddCircleOutlined />
        </IconTile>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.15rem', color: COLORS.ink }}>
            {registroEditado ? `Editar ${recurso.singular}` : recurso.nuevo}
          </Typography>
          <Typography noWrap sx={{ fontSize: '0.8rem', color: COLORS.muted }}>
            {registroEditado ? registroEditado.nombre : 'Se agrega directo al catálogo del POS'}
          </Typography>
        </Box>
        <IconButton aria-label="Cerrar editor" onClick={cerrarEditor} sx={{ backgroundColor: COLORS.inputBg }}>
          <Close />
        </IconButton>
      </Box>
      <Formulario
        key={`${recurso.id}-${editor.id ?? 'nuevo'}`}
        registro={registroEditado}
        catalogo={catalogo}
        errores={errores}
        guardando={guardando}
        onGuardar={handleGuardar}
        onCancelar={cerrarEditor}
      />
    </>
  );

  return (
    <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 } }}>
      <SeccionesAdmin />

      {/* ENCABEZADO */}
      <Panel sx={{ display: 'flex', flexDirection: { xs: 'column', xl: 'row' }, alignItems: { xl: 'center' }, gap: 2, p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
          <IconTile bg={COLORS.redSoft} color={COLORS.red} size={52} sx={{ display: { xs: 'none', sm: 'grid' } }}>
            <StorefrontOutlined />
          </IconTile>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1, color: COLORS.blueText }}>ADMINISTRACIÓN</Typography>
            <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.4rem', md: '1.7rem' }, color: COLORS.ink }}>
              Productos, sabores y precios
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: COLORS.label }}>Lo que se desactiva deja de verse en el POS sin perder el historial</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'stretch' }}>
          <Indicador valor={`${catalogo.productos.filter((p) => p.activo).length}/${catalogo.productos.length}`} titulo="Productos activos" />
          <Indicador valor={catalogo.sabores.filter((s) => s.activo).length} titulo="Sabores activos" />
          <Indicador valor={catalogo.categorias.filter((c) => c.activo).length} titulo="Categorías" />
          <Indicador
            valor={alertasVitrina}
            titulo="Alertas de vitrina"
            alerta={alertasVitrina > 0}
            onClick={
              alertasVitrina
                ? () => {
                    cambiarPestana('sabores');
                    setEstado('alerta');
                  }
                : undefined
            }
          />
          <Button
            variant="contained"
            disableElevation
            startIcon={<AddCircleOutlined />}
            onClick={() => abrirEditor(null)}
            sx={{
              minHeight: 56,
              px: 2.5,
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 800,
              backgroundColor: COLORS.red,
              boxShadow: '0 6px 16px rgba(227, 36, 59, 0.3)',
              '&:hover': { backgroundColor: COLORS.redHover },
            }}
          >
            {recurso.nuevo}
          </Button>
        </Box>
      </Panel>

      {/* PESTAÑAS */}
      <Tabs
        value={recurso.id}
        onChange={(_, id) => cambiarPestana(id)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 48,
          '& .MuiTabs-indicator': { display: 'none' },
          '& .MuiTabs-flexContainer': { gap: 1 },
          '& .MuiTab-root': {
            minHeight: 48,
            px: 2,
            borderRadius: 2.5,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            color: COLORS.label,
            backgroundColor: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
          },
          '& .Mui-selected': { color: `${COLORS.surface} !important`, backgroundColor: COLORS.blueText, borderColor: COLORS.blueText },
        }}
      >
        {RECURSOS.map((r) => (
          <Tab key={r.id} value={r.id} label={`${r.label} (${catalogo[r.id].length})`} />
        ))}
      </Tabs>

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, md: 3 },
          alignItems: 'start',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 420px', xl: 'minmax(0, 1fr) 460px' },
        }}
      >
        <Box sx={{ display: 'grid', gap: 2, minWidth: 0 }}>
          {/* FILTROS */}
          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: recurso.id === 'productos' ? '2fr 1fr 1fr' : '2fr 1fr' } }}>
            <TextField
              placeholder={`Buscar ${recurso.label.toLowerCase()}…`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              sx={filtroSx}
              slotProps={{
                htmlInput: { 'aria-label': `Buscar ${recurso.label.toLowerCase()}` },
                input: { startAdornment: <InputAdornment position="start"><Search sx={{ color: COLORS.muted }} /></InputAdornment> },
              }}
            />
            {recurso.id === 'productos' && (
              <TextField select value={categoria} onChange={(e) => setCategoria(e.target.value)} sx={filtroSx} slotProps={{ htmlInput: { 'aria-label': 'Filtrar por categoría' } }}>
                <MenuItem value="todas">Todas las categorías</MenuItem>
                {catalogo.categorias.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nombre}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              sx={filtroSx}
              slotProps={{ htmlInput: { 'aria-label': 'Filtrar por estado' }, input: { startAdornment: <InputAdornment position="start"><TuneOutlined fontSize="small" /></InputAdornment> } }}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="activos">Activos (en POS)</MenuItem>
              <MenuItem value="inactivos">Inactivos</MenuItem>
              {recurso.id === 'sabores' && <MenuItem value="alerta">Con alerta de vitrina</MenuItem>}
            </TextField>
          </Box>

          <Typography sx={{ fontSize: '0.85rem', color: COLORS.muted }}>
            Mostrando {registros.length} de {catalogo[recurso.id].length} {recurso.label.toLowerCase()}
          </Typography>

          <ListaRegistros
            recurso={recurso}
            registros={registros}
            catalogo={catalogo}
            seleccionadoId={editor?.id}
            cambiandoId={cambiandoId}
            onEditar={abrirEditor}
            onActivo={handleActivo}
            onEliminar={setPorEliminar}
          />
        </Box>

        {/* EDITOR: panel fijo en escritorio */}
        {panelLateral && (
          // Alto limitado a la pantalla: el formulario se desplaza por dentro y Guardar queda siempre visible
          <Panel ref={panelEditorRef} sx={{ position: 'sticky', top: 16, maxHeight: 'calc(100dvh - 170px)', overflowY: 'auto', scrollPaddingBottom: 96, p: 2.5, borderTop: `4px solid ${COLORS.red}` }}>
            {contenidoEditor || (
              <Box sx={{ py: 6, textAlign: 'center', color: COLORS.muted }}>
                <Typography sx={{ fontWeight: 600, color: COLORS.label }}>Selecciona un registro para editarlo</Typography>
                <Typography sx={{ fontSize: '0.85rem' }}>o crea uno nuevo</Typography>
                <Button startIcon={<AddCircleOutlined />} onClick={() => abrirEditor(null)} sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}>
                  {recurso.nuevo}
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

      {/* CONFIRMAR ELIMINACIÓN */}
      <Dialog open={Boolean(porEliminar)} onClose={() => setPorEliminar(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>¿Eliminar {porEliminar?.nombre}?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: COLORS.label }}>
            Se borra del catálogo de forma permanente. Si solo quieres ocultarlo del POS, desactívalo con el interruptor.
          </Typography>
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

export default Administracion;
