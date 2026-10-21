import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
import {
  AccessTime,
  AddBusinessOutlined,
  Close,
  DeleteOutlined,
  EditOutlined,
  PersonOutlined,
  PhoneOutlined,
  PlaceOutlined,
  PointOfSale,
  ReceiptLongOutlined,
  Search,
  StoreMallDirectoryOutlined,
} from '@mui/icons-material';
import { mensajeDeError } from '../api/axiosClient';
import IconTile from '../components/IconTile';
import Panel from '../components/Panel';
import { actualizarSucursal, crearSucursal, eliminarSucursal, obtenerSucursales } from '../services/sucursalesService';
import { COLORS } from '../theme';
import { formatMoney } from '../utils/format';
import { coincide, TIPOS_TERMINAL } from './admin/recursos';
import SeccionesAdmin from './admin/SeccionesAdmin';
import SucursalForm from './admin/SucursalForm';

const filtroSx = {
  minWidth: 0,
  '& .MuiOutlinedInput-root': { minHeight: 48, borderRadius: 2.5, backgroundColor: COLORS.surface, '& fieldset': { borderColor: COLORS.border } },
};

// "2 cajas + 1 tablet"
const resumenTerminales = (terminales) =>
  TIPOS_TERMINAL.map((tipo) => {
    const n = terminales.filter((t) => t.activo && t.tipo === tipo.id).length;
    return n ? `${n} ${tipo.label.toLowerCase()}${n > 1 ? 's' : ''}` : null;
  })
    .filter(Boolean)
    .join(' + ') || 'Sin terminales activas';

const Indicador = ({ icono, bg, color, titulo, valor, detalle }) => (
  <Panel sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
    <IconTile bg={bg} color={color} size={48}>
      {icono}
    </IconTile>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: 0.6, color: COLORS.muted }}>{titulo}</Typography>
      <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: COLORS.ink, lineHeight: 1.2 }}>{valor}</Typography>
      <Typography noWrap sx={{ fontSize: '0.78rem', color: COLORS.label }}>
        {detalle}
      </Typography>
    </Box>
  </Panel>
);

const Dato = ({ icono, titulo, valor }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
    <Box sx={{ color: COLORS.blueText, display: 'grid' }}>{icono}</Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: 0.5, color: COLORS.muted }}>{titulo}</Typography>
      <Typography noWrap sx={{ fontSize: '0.88rem', color: valor ? COLORS.ink : COLORS.muted }}>
        {valor || 'Sin registrar'}
      </Typography>
    </Box>
  </Box>
);

const SucursalCard = ({ sucursal, seleccionada, cambiando, onEditar, onActivo, onEliminar }) => (
  <Panel
    sx={{
      p: { xs: 2, md: 2.5 },
      borderLeft: `4px solid ${sucursal.es_matriz ? COLORS.red : sucursal.activo ? COLORS.blueText : COLORS.border}`,
      borderColor: seleccionada ? COLORS.blue : undefined,
      boxShadow: seleccionada ? `0 0 0 1px ${COLORS.blue}` : undefined,
      opacity: sucursal.activo ? 1 : 0.75,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Chip size="small" label={sucursal.codigo} sx={{ fontWeight: 800, borderRadius: 1.5, color: COLORS.surface, backgroundColor: COLORS.blueText }} />
          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: COLORS.ink }}>{sucursal.nombre}</Typography>
          {sucursal.es_matriz && <Chip size="small" label="Matriz" sx={{ fontWeight: 700, backgroundColor: COLORS.redSoft, color: COLORS.redHover }} />}
          <Chip
            size="small"
            icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: sucursal.activo ? '#eab308' : COLORS.muted }} />}
            label={sucursal.activo ? 'Operando' : 'Inactiva'}
            sx={{ pl: 0.5, fontWeight: 600, backgroundColor: sucursal.activo ? COLORS.yellowSoft : COLORS.inputBg, color: sucursal.activo ? COLORS.yellowText : COLORS.muted }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75, color: sucursal.direccion ? COLORS.label : COLORS.muted }}>
          <PlaceOutlined fontSize="small" sx={{ color: COLORS.red }} />
          <Typography sx={{ fontSize: '0.92rem' }}>{sucursal.direccion || 'Sin dirección registrada'}</Typography>
        </Box>
      </Box>
      <Chip
        icon={<PointOfSale sx={{ fontSize: 18 }} />}
        label={resumenTerminales(sucursal.terminales)}
        sx={{ display: { xs: 'none', sm: 'inline-flex' }, fontWeight: 600, backgroundColor: COLORS.inputBg, color: COLORS.label }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={sucursal.es_matriz ? 'La matriz siempre está activa' : sucursal.activo ? 'Operando' : 'Inactiva'}>
          <span>
            <Switch checked={sucursal.activo} disabled={sucursal.es_matriz || cambiando} onChange={(e) => onActivo(e.target.checked)} slotProps={{ input: { 'aria-label': `${sucursal.nombre} activa` } }} />
          </span>
        </Tooltip>
        <Tooltip title="Editar">
          <IconButton aria-label={`Editar ${sucursal.nombre}`} onClick={onEditar} sx={{ color: COLORS.blueText }}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={sucursal.es_matriz ? 'La matriz no se puede eliminar' : 'Eliminar'}>
          <span>
            <IconButton aria-label={`Eliminar ${sucursal.nombre}`} disabled={sucursal.es_matriz} onClick={onEliminar} sx={{ color: COLORS.red }}>
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>

    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' },
        gap: 1.5,
        mt: 1.5,
        p: 1.5,
        borderRadius: 2.5,
        backgroundColor: COLORS.surfaceAlt,
      }}
    >
      <Dato icono={<PersonOutlined />} titulo="ENCARGADO" valor={sucursal.encargado?.nombre} />
      <Dato icono={<AccessTime />} titulo="HORARIO" valor={sucursal.hora_apertura && sucursal.hora_cierre ? `${sucursal.hora_apertura} – ${sucursal.hora_cierre} hrs` : null} />
      <Dato icono={<PhoneOutlined />} titulo="TELÉFONO" valor={sucursal.telefono} />
    </Box>

    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mt: 1.5 }}>
      <Typography sx={{ fontSize: '0.8rem', color: COLORS.muted, mr: 0.25 }}>Terminales:</Typography>
      {sucursal.terminales.map((t) => (
        <Chip
          key={t.id}
          size="small"
          icon={<Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: t.activo ? '#eab308' : COLORS.muted }} />}
          label={t.nombre}
          sx={{ pl: 0.5, borderRadius: 1.5, fontSize: '0.75rem', backgroundColor: COLORS.yellowSoft, color: t.activo ? COLORS.label : COLORS.muted, textDecoration: t.activo ? 'none' : 'line-through' }}
        />
      ))}
    </Box>
  </Panel>
);

const Sucursales = () => {
  const panelLateral = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const drawerLateral = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  const panelEditorRef = useRef(null);

  const [datos, setDatos] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todas');
  const [editor, setEditor] = useState(null); // { id } | { id: null } para nueva
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [cambiandoId, setCambiandoId] = useState(null);
  const [porEliminar, setPorEliminar] = useState(null);
  const [aviso, setAviso] = useState('');

  const cargar = () =>
    obtenerSucursales()
      .then(setDatos)
      .catch((e) => setErrorCarga(mensajeDeError(e, 'No se pudieron cargar las sucursales.')));

  useEffect(() => {
    cargar();
  }, []);

  // En escritorio, al abrir el editor se desplaza lo justo para que quede completo en pantalla
  const editorAbierto = editor ? String(editor.id ?? 'nueva') : null;
  useEffect(() => {
    if (editorAbierto && panelLateral) panelEditorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [editorAbierto, panelLateral]);

  const sucursales = useMemo(
    () =>
      (datos?.sucursales ?? [])
        .filter((s) => coincide(busqueda.trim(), s.codigo, s.nombre, s.direccion ?? '', s.encargado?.nombre ?? ''))
        .filter((s) => estado === 'todas' || (estado === 'activas' ? s.activo : !s.activo)),
    [datos, busqueda, estado]
  );

  const editada = editor?.id ? datos?.sucursales.find((s) => s.id === editor.id) : null;

  const abrirEditor = (sucursal) => {
    setErrores({});
    setEditor({ id: sucursal?.id ?? null });
  };
  const cerrarEditor = () => {
    setEditor(null);
    setErrores({});
  };

  const handleGuardar = async (cambios) => {
    setGuardando(true);
    setErrores({});
    try {
      const respuesta = editor.id ? await actualizarSucursal(editor.id, cambios) : await crearSucursal(cambios);
      setDatos(respuesta);
      setEditor({ id: respuesta.id });
      setAviso(editor.id ? 'Sucursal actualizada' : 'Sucursal registrada y activa');
    } catch (error) {
      if (error.response?.status === 400) setErrores(error.response.data?.messages ?? {});
      else setAviso(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  };

  const handleActivo = async (sucursal, activo) => {
    setCambiandoId(sucursal.id);
    try {
      setDatos(await actualizarSucursal(sucursal.id, { activo }));
      setAviso(`${sucursal.nombre}: ${activo ? 'operando' : 'inactiva'}`);
    } catch (error) {
      setAviso(mensajeDeError(error));
    } finally {
      setCambiandoId(null);
    }
  };

  const handleEliminar = async () => {
    const sucursal = porEliminar;
    setPorEliminar(null);
    try {
      setDatos(await eliminarSucursal(sucursal.id));
      if (editor?.id === sucursal.id) cerrarEditor();
      setAviso(`${sucursal.nombre} eliminada`);
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

  const { resumen } = datos;
  const contenidoEditor = editor && (
    <>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2.5, pb: 2, borderBottom: `1px solid ${COLORS.border}` }}>
        <IconTile bg={COLORS.redSoft} color={COLORS.red} size={44}>
          <AddBusinessOutlined />
        </IconTile>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.15rem', color: COLORS.ink }}>
            {editada ? 'Editar sucursal' : 'Registrar nueva sucursal'}
          </Typography>
          <Typography noWrap sx={{ fontSize: '0.8rem', color: COLORS.muted }}>
            {editada ? `${editada.codigo} · ${editada.nombre}` : 'Se vincula a la red central de Conitos POS'}
          </Typography>
        </Box>
        <IconButton aria-label="Cerrar editor" onClick={cerrarEditor} sx={{ backgroundColor: COLORS.inputBg }}>
          <Close />
        </IconButton>
      </Box>
      <SucursalForm key={editor.id ?? 'nueva'} registro={editada} datos={datos} errores={errores} guardando={guardando} onGuardar={handleGuardar} onCancelar={cerrarEditor} />
    </>
  );

  return (
    <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 } }}>
      <SeccionesAdmin />

      {/* ENCABEZADO */}
      <Box sx={{ display: 'grid', gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr)) auto' }, alignItems: 'stretch' }}>
        <Indicador icono={<StoreMallDirectoryOutlined />} bg={COLORS.blueSoft} color={COLORS.blueText} titulo="SUCURSALES ACTIVAS" valor={resumen.sucursales_activas} detalle={`${datos.sucursales.length} registradas`} />
        <Indicador icono={<PointOfSale />} bg={COLORS.yellow} color="#5c4a00" titulo="TERMINALES POS" valor={resumen.terminales_activas} detalle="Cajas, tablets y kioskos activos" />
        <Indicador
          icono={<ReceiptLongOutlined />}
          bg={COLORS.redSoft}
          color={COLORS.red}
          titulo="VENTAS HOY"
          valor={resumen.ventas_hoy}
          detalle={`${formatMoney(resumen.total_hoy)} · promedio ${formatMoney(resumen.ticket_promedio_hoy)}`}
        />
        <Button
          variant="contained"
          disableElevation
          startIcon={<AddBusinessOutlined />}
          onClick={() => abrirEditor(null)}
          sx={{
            gridColumn: { xs: '1 / -1', lg: 'auto' },
            alignSelf: 'center',
            minHeight: 56,
            px: 3,
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 800,
            fontSize: '1rem',
            backgroundColor: COLORS.red,
            boxShadow: '0 6px 16px rgba(227, 36, 59, 0.3)',
            '&:hover': { backgroundColor: COLORS.redHover },
          }}
        >
          Nueva sucursal
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, alignItems: 'start', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 440px', xl: 'minmax(0, 1fr) 480px' } }}>
        <Box sx={{ display: 'grid', gap: 2, minWidth: 0 }}>
          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: '2fr 1fr' } }}>
            <TextField
              placeholder="Buscar por nombre, código, dirección o encargado…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              sx={filtroSx}
              slotProps={{
                htmlInput: { 'aria-label': 'Buscar sucursales' },
                input: { startAdornment: <InputAdornment position="start"><Search sx={{ color: COLORS.muted }} /></InputAdornment> },
              }}
            />
            <TextField select value={estado} onChange={(e) => setEstado(e.target.value)} sx={filtroSx} slotProps={{ htmlInput: { 'aria-label': 'Filtrar por estado' } }}>
              <MenuItem value="todas">Todas las sucursales</MenuItem>
              <MenuItem value="activas">Operando</MenuItem>
              <MenuItem value="inactivas">Inactivas</MenuItem>
            </TextField>
          </Box>

          {sucursales.length ? (
            sucursales.map((s) => (
              <SucursalCard
                key={s.id}
                sucursal={s}
                seleccionada={editor?.id === s.id}
                cambiando={cambiandoId === s.id}
                onEditar={() => abrirEditor(s)}
                onActivo={(activo) => handleActivo(s, activo)}
                onEliminar={() => setPorEliminar(s)}
              />
            ))
          ) : (
            <Box sx={{ py: 6, textAlign: 'center', color: COLORS.muted, borderRadius: 3, border: `1px dashed ${COLORS.border}` }}>
              <Typography sx={{ fontWeight: 600 }}>Sin resultados</Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>Ajusta la búsqueda o el filtro</Typography>
            </Box>
          )}
        </Box>

        {/* EDITOR: panel fijo en escritorio; el formulario se desplaza por dentro */}
        {panelLateral && (
          <Panel ref={panelEditorRef} sx={{ position: 'sticky', top: 16, maxHeight: 'calc(100dvh - 170px)', overflowY: 'auto', scrollPaddingBottom: 96, p: 2.5, borderTop: `4px solid ${COLORS.red}` }}>
            {contenidoEditor || (
              <Box sx={{ py: 6, textAlign: 'center', color: COLORS.muted }}>
                <Typography sx={{ fontWeight: 600, color: COLORS.label }}>Selecciona una sucursal para editarla</Typography>
                <Typography sx={{ fontSize: '0.85rem' }}>o registra una nueva</Typography>
                <Button startIcon={<AddBusinessOutlined />} onClick={() => abrirEditor(null)} sx={{ mt: 2, textTransform: 'none', fontWeight: 700 }}>
                  Nueva sucursal
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
                ? { width: 480, maxWidth: '100%', p: 2.5, scrollPaddingBottom: 96 }
                : { maxHeight: '92dvh', p: 2, pb: 'max(16px, env(safe-area-inset-bottom))', scrollPaddingBottom: 96, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
            },
          }}
        >
          {contenidoEditor}
        </Drawer>
      )}

      <Dialog open={Boolean(porEliminar)} onClose={() => setPorEliminar(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>¿Eliminar {porEliminar?.nombre}?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: COLORS.label }}>
            Se borra la sucursal con sus terminales. Si solo cerró temporalmente, mejor desactívala con el interruptor.
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

export default Sucursales;
