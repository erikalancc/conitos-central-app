import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, Typography } from '@mui/material';
import { ArrowBack, InfoOutlined } from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { mensajeDeError } from '../api/axiosClient';
import { ROLES } from '../auth/roles';
import { getSession } from '../auth/session';
import IconTile from '../components/IconTile';
import Panel from '../components/Panel';
import { construirResumen, corteDesdeApi, obtenerCortes } from '../services/corteService';
import { obtenerVentasDelDia, ventaDesdeApi } from '../services/ventasService';
import { COLORS } from '../theme';
import { formatLongDate, formatMoney } from '../utils/format';
import DesglosePagos from './corte/DesglosePagos';
import { estadoDiferencia } from './corte/estilos';
import ResumenTurno from './corte/ResumenTurno';
import VentasDelDia from './corte/VentasDelDia';
import CorteCuadre from './historial/CorteCuadre';
import { useSucursalesHistorial } from './historial/useSucursalesHistorial';

const GAP = { xs: 2, md: 3 };

const chipDiferencia = (titulo, diferencia) => {
  const estado = estadoDiferencia(diferencia);
  const cuadrada = Math.abs(diferencia) < 0.005;
  return {
    label: cuadrada ? `${titulo} cuadrado` : `${titulo} ${estado.label.toLowerCase()} ${formatMoney(Math.abs(diferencia))}`,
    bg: estado.bg,
    color: estado.color,
  };
};

const SIN_CORTES = [];

// Detalle de un día: sus ventas y los cortes de caja de los turnos abiertos ese día
const HistorialDia = () => {
  const { fecha } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rol = getSession()?.id_rol;
  const esVendedor = rol === ROLES.CAJERO;
  const esAdmin = rol === ROLES.ADMIN;
  // Sucursal del día: el administrador la elige en el historial (?sucursal=); los demás ven la suya
  const idSucursal = esAdmin ? Number(params.get('sucursal')) || undefined : undefined;
  const rutaHistorial = idSucursal ? `/historial?sucursal=${idSucursal}` : '/historial';
  const sucursales = useSucursalesHistorial(esAdmin);
  const nombreSucursal = sucursales?.find((s) => s.id === (idSucursal ?? getSession()?.id_sucursal))?.nombre;
  const [estado, setEstado] = useState({ clave: null, ventas: null, visibles: null, cortes: SIN_CORTES, error: '' });

  useEffect(() => {
    let vigente = true;
    // El vendedor no consulta cortes (solo ve sus últimas ventas de hoy)
    Promise.all([obtenerVentasDelDia(fecha, idSucursal), esVendedor ? SIN_CORTES : obtenerCortes({ desde: fecha, hasta: fecha, idSucursal })])
      // Del primer turno al último
      .then(([{ ventas, visibles }, cortes]) =>
        vigente && setEstado({ clave: `${fecha}|${idSucursal ?? ''}`, ventas: ventas.map(ventaDesdeApi), visibles, cortes: cortes.map(corteDesdeApi).reverse(), error: '' })
      )
      .catch((e) => vigente && setEstado({ clave: `${fecha}|${idSucursal ?? ''}`, ventas: null, visibles: null, cortes: SIN_CORTES, error: mensajeDeError(e, 'No se pudieron cargar las ventas del día.') }));
    return () => {
      vigente = false;
    };
  }, [fecha, esVendedor, idSucursal]);

  // Datos vigentes solo si son de la fecha y sucursal que se muestran
  const clave = `${fecha}|${idSucursal ?? ''}`;
  const ventas = estado.clave === clave ? estado.ventas : null;
  const cortes = estado.clave === clave ? estado.cortes : SIN_CORTES;

  const resumen = useMemo(
    () =>
      ventas
        ? construirResumen({
            ventas,
            movimientos: cortes.flatMap((c) => c.resumen.movimientos),
            fondo: cortes[0]?.efectivo.fondo ?? 0,
            desde: ventas[0]?.fecha ?? `${fecha}T00:00:00`,
          })
        : null,
    [ventas, cortes, fecha]
  );

  const volver = (
    <IconButton aria-label="Volver al historial" onClick={() => navigate(rutaHistorial)} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, backgroundColor: COLORS.inputBg }}>
      <ArrowBack />
    </IconButton>
  );

  if (estado.error && estado.clave === clave) {
    return (
      <Panel sx={{ py: 6, textAlign: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 480, mx: 'auto', textAlign: 'left' }}>
          {estado.error}
        </Alert>
        <Button onClick={() => navigate(rutaHistorial)} startIcon={<ArrowBack />} sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}>
          Volver al historial
        </Button>
      </Panel>
    );
  }

  if (!resumen) {
    return (
      <Panel sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Panel>
    );
  }

  if (!ventas.length) {
    return (
      <Panel sx={{ py: 6, textAlign: 'center' }}>
        <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>No hay ventas registradas el {formatLongDate(new Date(`${fecha}T12:00:00`)).toLowerCase()}</Typography>
        <Button onClick={() => navigate(rutaHistorial)} startIcon={<ArrowBack />} sx={{ mt: 2, textTransform: 'none', fontWeight: 600 }}>
          Volver al historial
        </Button>
      </Panel>
    );
  }

  // Vendedor: solo la lista de sus últimas ventas, sin totales ni cortes
  if (estado.visibles != null) {
    return (
      <Box sx={{ display: 'grid', gap: GAP }}>
        <Typography component="h1" sx={{ fontWeight: 800, fontSize: '1.3rem', color: COLORS.ink }}>
          Ventas de hoy · {formatLongDate(new Date(`${fecha}T12:00:00`))}
        </Typography>
        <VentasDelDia resumen={{ ...resumen, visibles: estado.visibles }} />
      </Box>
    );
  }

  const vendedores = [...new Set(ventas.map((v) => v.vendedor))];
  const chips = cortes.length
    ? [
        chipDiferencia('Efectivo', cortes.reduce((suma, c) => suma + c.efectivo.diferencia, 0)),
        chipDiferencia('Tarjeta', cortes.reduce((suma, c) => suma + c.tarjeta.diferencia, 0)),
      ]
    : [{ label: 'Sin corte de caja', bg: COLORS.inputBg, color: COLORS.muted }];

  return (
    <Box sx={{ display: 'grid', gap: GAP }}>
      <ResumenTurno
        resumen={resumen}
        inicio={volver}
        etiqueta="HISTORIAL · DETALLE DEL DÍA"
        titulo={formatLongDate(new Date(`${fecha}T12:00:00`))}
        subtitulo={`${nombreSucursal ? `${nombreSucursal} · ` : ''}${ventas.length} venta${ventas.length === 1 ? '' : 's'} · Vendió: ${vendedores.join(', ')}`}
        etiquetaNeto="VENTAS NETAS DEL DÍA"
        chips={chips}
      />

      <Box
        sx={{
          display: 'grid',
          gap: GAP,
          alignItems: 'start',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) 420px', xl: 'minmax(0, 1fr) 480px' },
        }}
      >
        {/* Se estira al alto de la fila para que las ventas puedan acompañar el scroll */}
        <Box sx={{ display: 'grid', gap: GAP, minWidth: 0, alignSelf: 'stretch', alignContent: 'start' }}>
          <DesglosePagos resumen={resumen} />
          <VentasDelDia resumen={resumen} sx={{ position: { lg: 'sticky' }, top: { lg: 16 }, zIndex: 1 }} />
        </Box>

        <Box component="aside" sx={{ display: 'grid', gap: GAP, minWidth: 0 }}>
          {cortes.length ? (
            cortes.map((corte) => <CorteCuadre key={corte.id} corte={corte} />)
          ) : (
            <Panel sx={{ display: 'flex', gap: 1.5, p: { xs: 2, md: 2.5 } }}>
              <IconTile bg={COLORS.inputBg} color={COLORS.muted} size={40}>
                <InfoOutlined />
              </IconTile>
              <Box>
                <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>Sin corte de caja</Typography>
                <Typography sx={{ mt: 0.5, fontSize: '0.85rem', color: COLORS.label }}>
                  Ningún turno de caja abierto este día se ha cerrado todavía. El conteo de billetes y los cuadres de efectivo y tarjeta
                  aparecen aquí cuando se hace el corte en Corte de Caja.
                </Typography>
              </Box>
            </Panel>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default HistorialDia;
