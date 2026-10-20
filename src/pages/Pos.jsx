import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  ButtonBase,
  Drawer,
  InputAdornment,
  ListItemText,
  Menu,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Close, FilterList, KeyboardArrowUp, LocalOfferOutlined, Search, Star, StarBorder } from '@mui/icons-material';
import { getSession } from '../auth/session';
import useAnchoAjustable from '../hooks/useAnchoAjustable';
import { CATEGORIAS, METODOS_PAGO_ACTIVOS, PRODUCTOS } from '../data/catalogo';
import { registrarVenta, guardarOrden } from '../services/ventasService';
import { COLORS } from '../theme';
import { formatMoney } from '../utils/format';
import OrdenPanel from './pos/OrdenPanel';
import PersonalizarDialog from './pos/PersonalizarDialog';
import ProductoCard from './pos/ProductoCard';
import VentaCompletadaDialog from './pos/VentaCompletadaDialog';
import { usePedido } from './pos/pedido';

const ORDENAMIENTOS = [
  { id: 'popular', label: 'Más vendidos', comparar: (a, b) => b.popularidad - a.popularidad },
  { id: 'precio-asc', label: 'Precio: menor a mayor', comparar: (a, b) => a.precio - b.precio },
  { id: 'precio-desc', label: 'Precio: mayor a menor', comparar: (a, b) => b.precio - a.precio },
  { id: 'nombre', label: 'Nombre (A-Z)', comparar: (a, b) => a.nombre.localeCompare(b.nombre) },
];

const ATAJOS_PAGO = Object.fromEntries(METODOS_PAGO_ACTIVOS.map((m) => [m.atajo, m.id]));

// Búsqueda sin acentos ni mayúsculas
const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const toolbarButtonSx = (activo) => ({
  minHeight: 52,
  px: { xs: 1.5, md: 2 },
  minWidth: 52,
  borderRadius: 3,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  color: activo ? COLORS.blueText : COLORS.label,
  backgroundColor: activo ? COLORS.blueSoft : '#fff',
  border: `1px solid ${activo ? COLORS.blue : COLORS.border}`,
  whiteSpace: 'nowrap',
  '& .MuiButton-startIcon': { mr: { xs: 0, md: 1 }, ml: 0 },
});

const Pos = () => {
  const user = getSession();
  const orden = usePedido();
  const { pedido, totales } = orden;
  const panelAncho = useAnchoAjustable({ clave: 'conitos.pos.anchoOrden', inicial: 400, min: 340 });
  const panelLateral = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const drawerLateral = useMediaQuery((theme) => theme.breakpoints.up('sm'));

  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [ordenamiento, setOrdenamiento] = useState('popular');
  const [filtrosAnchor, setFiltrosAnchor] = useState(null);
  const [personalizar, setPersonalizar] = useState(null);
  const [metodo, setMetodo] = useState('efectivo');
  const [recibido, setRecibido] = useState(null);
  const [cobrando, setCobrando] = useState(false);
  const [venta, setVenta] = useState(null);
  const [ordenAbierta, setOrdenAbierta] = useState(false);
  const [aviso, setAviso] = useState('');

  // El monto recibido solo vale si cubre el total actual
  const recibidoValido = recibido !== null && recibido >= totales.total ? recibido : null;

  const productos = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    const comparar = ORDENAMIENTOS.find((o) => o.id === ordenamiento).comparar;
    return PRODUCTOS.filter((p) => categoria === 'todos' || p.categoria === categoria)
      .filter((p) => !soloFavoritos || p.favorito)
      .filter((p) => !termino || normalizar(`${p.nombre} ${p.descripcion}`).includes(termino))
      .sort(comparar);
  }, [busqueda, categoria, soloFavoritos, ordenamiento]);

  const cantidadEnOrden = useMemo(() => {
    const conteo = {};
    pedido.lineas.forEach((l) => {
      conteo[l.productoId] = (conteo[l.productoId] ?? 0) + l.cantidad;
    });
    return conteo;
  }, [pedido.lineas]);

  // Atajos de teclado: F4/F5 método de pago
  useEffect(() => {
    const handleKey = (e) => {
      if (ATAJOS_PAGO[e.key]) {
        e.preventDefault();
        setMetodo(ATAJOS_PAGO[e.key]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const agregarProducto = (producto) => {
    if (producto.opciones) setPersonalizar({ producto });
    else orden.agregar(producto);
  };

  const handleConfirmarPersonalizacion = (configuracion, cantidad) => {
    const { producto, linea } = personalizar;
    if (linea) orden.actualizar(linea.lineId, { ...configuracion, cantidad });
    else orden.agregar(producto, configuracion, cantidad);
    setPersonalizar(null);
  };

  const handleModificar = (linea) => {
    const producto = PRODUCTOS.find((p) => p.id === linea.productoId);
    if (producto) setPersonalizar({ producto, linea });
  };

  // Lector de código de barras / Enter: agrega si hay un único resultado
  const handleBusquedaKeyDown = (e) => {
    if (e.key === 'Enter' && productos.length === 1) {
      agregarProducto(productos[0]);
      setBusqueda('');
    }
  };

  const handleCobrar = async () => {
    setCobrando(true);
    try {
      const pagado = metodo === 'efectivo' ? (recibidoValido ?? totales.total) : totales.total;
      const registro = await registrarVenta({
        folio: pedido.folio,
        usuarioId: user.id,
        cliente: pedido.cliente,
        servicio: pedido.servicio,
        lineas: pedido.lineas,
        descuento: pedido.descuento,
        totales,
        metodo,
        recibido: pagado,
        cambio: pagado - totales.total,
      });
      setOrdenAbierta(false);
      setVenta(registro);
    } catch {
      setAviso('No se pudo registrar la venta. Intenta de nuevo.');
    } finally {
      setCobrando(false);
    }
  };

  const handleNuevaVenta = () => {
    orden.nuevaOrden();
    setVenta(null);
    setRecibido(null);
    setMetodo('efectivo');
  };

  const handleGuardar = async () => {
    await guardarOrden({ ...pedido, totales, usuarioId: user.id });
    setAviso(`Orden #${pedido.folio} guardada en espera`);
    setOrdenAbierta(false);
    orden.nuevaOrden();
  };

  const panelProps = {
    orden,
    metodo,
    onMetodo: setMetodo,
    recibido: recibidoValido,
    onRecibido: setRecibido,
    cobrando,
    onCobrar: handleCobrar,
    onGuardar: handleGuardar,
    onPrecuenta: () => setAviso('Pre-cuenta enviada a la impresora (simulación)'),
    onModificar: handleModificar,
  };

  const categorias = [{ id: 'todos', label: 'Todos' }, ...CATEGORIAS];

  return (
    <Box sx={{ display: 'flex', height: { md: '100%' }, minHeight: 0 }}>
      {/* CATÁLOGO */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: { md: 'hidden' } }}>
        <Box
          sx={{
            position: { xs: 'sticky', md: 'static' },
            top: 0,
            zIndex: 2,
            backgroundColor: COLORS.panelBg,
            px: { xs: 1.5, sm: 2, lg: 3 },
            pt: { xs: 1.5, md: 2 },
            pb: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              type="search"
              placeholder="Buscar helados, paletas, sabores…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={handleBusquedaKeyDown}
              sx={{
                '& .MuiOutlinedInput-root': {
                  minHeight: 52,
                  borderRadius: 3,
                  backgroundColor: '#fff',
                  fontSize: '1rem',
                  '& fieldset': { borderColor: COLORS.border },
                },
              }}
              slotProps={{
                htmlInput: { 'aria-label': 'Buscar productos' },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: COLORS.muted }} />
                    </InputAdornment>
                  ),
                  endAdornment: busqueda && (
                    <InputAdornment position="end">
                      <Button onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda" sx={{ minWidth: 40, color: COLORS.muted }}>
                        <Close />
                      </Button>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              onClick={(e) => setFiltrosAnchor(e.currentTarget)}
              startIcon={<FilterList />}
              aria-label="Ordenar productos"
              sx={toolbarButtonSx(ordenamiento !== 'popular')}
            >
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                Filtros
              </Box>
            </Button>
            <Button
              onClick={() => setSoloFavoritos((v) => !v)}
              aria-pressed={soloFavoritos}
              aria-label="Solo favoritos"
              startIcon={soloFavoritos ? <Star sx={{ color: '#f59e0b' }} /> : <StarBorder sx={{ color: COLORS.red }} />}
              sx={toolbarButtonSx(soloFavoritos)}
            >
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                Favoritos
              </Box>
            </Button>
          </Box>

          {/* Categorías */}
          <Box
            role="tablist"
            aria-label="Categorías"
            sx={{ display: 'flex', gap: 1, mt: 1.5, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}
          >
            {categorias.map((c) => {
              const activa = categoria === c.id;
              const esPromo = c.id === 'promociones';
              return (
                <ButtonBase
                  key={c.id}
                  role="tab"
                  aria-selected={activa}
                  onClick={() => setCategoria(c.id)}
                  sx={{
                    flexShrink: 0,
                    minHeight: 44,
                    px: 2.25,
                    gap: 1,
                    borderRadius: 6,
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: activa ? '#fff' : esPromo ? COLORS.red : COLORS.label,
                    backgroundColor: activa ? COLORS.blueText : '#fff',
                    border: `1px solid ${activa ? COLORS.blueText : COLORS.border}`,
                  }}
                >
                  {esPromo && <LocalOfferOutlined sx={{ fontSize: 18 }} />}
                  {c.label}
                  {activa && (
                    <Box component="span" sx={{ px: 0.75, borderRadius: 2, fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.25)' }}>
                      {productos.length}
                    </Box>
                  )}
                </ButtonBase>
              );
            })}
          </Box>
        </Box>

        {/* Productos */}
        <Box sx={{ flex: 1, overflowY: { md: 'auto' }, px: { xs: 1.5, sm: 2, lg: 3 }, pb: 2 }}>
          {productos.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center', color: COLORS.muted }}>
              <Search sx={{ fontSize: 48, opacity: 0.5 }} />
              <Typography sx={{ mt: 1, fontWeight: 600 }}>Sin resultados</Typography>
              <Typography sx={{ fontSize: '0.9rem' }}>Prueba con otro término o categoría</Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: { xs: 1.25, md: 1.5 },
                gridTemplateColumns: {
                  xs: 'repeat(auto-fill, minmax(150px, 1fr))',
                  sm: 'repeat(auto-fill, minmax(180px, 1fr))',
                  xl: 'repeat(auto-fill, minmax(210px, 1fr))',
                },
              }}
            >
              {productos.map((producto) => (
                <ProductoCard key={producto.id} producto={producto} enOrden={cantidadEnOrden[producto.id] ?? 0} onAgregar={agregarProducto} />
              ))}
            </Box>
          )}
        </Box>

        {/* Barra de orden (tablet vertical y celular) */}
        {!panelLateral && (
          <Box
            sx={{
              position: 'sticky',
              bottom: 0,
              zIndex: 2,
              px: { xs: 1.5, sm: 2 },
              pt: 1.5,
              pb: 'max(12px, env(safe-area-inset-bottom))',
              backgroundColor: '#fff',
              borderTop: `1px solid ${COLORS.border}`,
              boxShadow: '0 -6px 16px rgba(15, 23, 42, 0.08)',
            }}
          >
            <ButtonBase
              onClick={() => setOrdenAbierta(true)}
              sx={{
                width: '100%',
                minHeight: 60,
                px: 2,
                gap: 1.5,
                borderRadius: 3,
                color: '#fff',
                backgroundColor: totales.articulos ? COLORS.red : COLORS.blueText,
                boxShadow: totales.articulos ? '0 6px 16px rgba(227, 36, 59, 0.3)' : 'none',
              }}
            >
              <Badge badgeContent={totales.articulos} color="warning" sx={{ '& .MuiBadge-badge': { fontWeight: 800 } }}>
                <KeyboardArrowUp />
              </Badge>
              <Box sx={{ flex: 1, textAlign: 'left', fontWeight: 700, fontSize: '1rem' }}>
                {totales.articulos ? 'Ver orden y cobrar' : 'Orden vacía'}
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.25rem' }}>{formatMoney(totales.total)}</Typography>
            </ButtonBase>
          </Box>
        )}
      </Box>

      {/* ORDEN: panel lateral (tablet horizontal / escritorio) */}
      {panelLateral && (
        <Box
          component="aside"
          sx={{
            position: 'relative',
            width: panelAncho.ancho,
            flexShrink: 0,
            borderLeft: `1px solid ${COLORS.border}`,
            boxShadow: '-6px 0 16px rgba(15, 23, 42, 0.04)',
          }}
        >
          {/* Agarradera para ajustar el ancho (doble clic = ancho original) */}
          <Box
            role="separator"
            aria-orientation="vertical"
            aria-label="Ajustar ancho de la orden"
            aria-valuenow={panelAncho.ancho}
            tabIndex={0}
            title="Arrastra para ajustar el ancho · doble clic para restablecer"
            onPointerDown={panelAncho.iniciarArrastre}
            onKeyDown={panelAncho.ajustarConTeclado}
            onDoubleClick={panelAncho.restablecer}
            sx={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: -8,
              width: 16,
              zIndex: 3,
              cursor: 'col-resize',
              touchAction: 'none',
              display: 'grid',
              placeItems: 'center',
              '&::after': {
                content: '""',
                width: 6,
                height: 48,
                borderRadius: 3,
                backgroundColor: COLORS.border,
                transition: 'background-color 0.15s, height 0.15s',
              },
              '&:hover::after, &:focus-visible::after, &:active::after': {
                height: 72,
                backgroundColor: COLORS.blue,
              },
              '&:focus-visible': { outline: 'none' },
            }}
          />
          <OrdenPanel {...panelProps} />
        </Box>
      )}

      {/* ORDEN: hoja deslizable (tablet vertical / celular) */}
      {!panelLateral && (
        <Drawer
          anchor={drawerLateral ? 'right' : 'bottom'}
          open={ordenAbierta}
          onClose={() => setOrdenAbierta(false)}
          slotProps={{
            paper: {
              sx: drawerLateral
                ? { width: 440, maxWidth: '100%' }
                : { height: '92dvh', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
            },
          }}
        >
          <OrdenPanel {...panelProps} onClose={() => setOrdenAbierta(false)} />
        </Drawer>
      )}

      <Menu anchorEl={filtrosAnchor} open={Boolean(filtrosAnchor)} onClose={() => setFiltrosAnchor(null)}>
        <Typography sx={{ px: 2, pt: 1, pb: 0.5, fontSize: '0.72rem', fontWeight: 700, color: COLORS.muted, letterSpacing: 0.6 }}>
          ORDENAR POR
        </Typography>
        {ORDENAMIENTOS.map((o) => (
          <MenuItem
            key={o.id}
            selected={ordenamiento === o.id}
            onClick={() => {
              setOrdenamiento(o.id);
              setFiltrosAnchor(null);
            }}
            sx={{ minHeight: 48 }}
          >
            <ListItemText primary={o.label} />
          </MenuItem>
        ))}
      </Menu>

      <PersonalizarDialog
        producto={personalizar?.producto}
        linea={personalizar?.linea}
        onConfirm={handleConfirmarPersonalizacion}
        onClose={() => setPersonalizar(null)}
      />

      <VentaCompletadaDialog
        venta={venta}
        onImprimir={() => setAviso('Ticket enviado a la impresora (simulación)')}
        onNuevaVenta={handleNuevaVenta}
      />

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={2500}
        onClose={() => setAviso('')}
        message={aviso}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </Box>
  );
};

export default Pos;
