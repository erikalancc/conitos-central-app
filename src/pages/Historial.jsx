import { useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, CircularProgress, Typography } from '@mui/material';
import { ChevronRight, ExpandMore, HistoryOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { mensajeDeError } from '../api/axiosClient';
import IconTile from '../components/IconTile';
import Panel from '../components/Panel';
import { claveDia, corteDesdeApi, obtenerCortes } from '../services/corteService';
import { obtenerResumenVentas } from '../services/ventasService';
import { COLORS } from '../theme';
import { formatMoney } from '../utils/format';
import { COLOR_METODO, estadoDiferencia } from './corte/estilos';
import { agruparPorSemana, armarDias } from './historial/agrupar';

// Semanas que se piden al API por bloque (máximo del API: 366 días)
const SEMANAS_POR_BLOQUE = 8;
const MAX_SEMANAS = 52;

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

const haceDias = (dias) => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return claveDia(fecha);
};

// Monto con etiqueta pequeña encima (se alinea en columnas en escritorio)
const Cifra = ({ label, valor, color = COLORS.ink, fuerte, sx }) => (
  <Box sx={[{ minWidth: 0 }, sx]}>
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: 0.4, color: COLORS.muted }}>{label}</Typography>
    <Typography sx={{ fontWeight: fuerte ? 800 : 700, fontSize: fuerte ? '1.05rem' : '0.95rem', color, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
      {valor}
    </Typography>
  </Box>
);

const EstadoCuadre = ({ titulo, diferencia }) => {
  const estado = estadoDiferencia(diferencia);
  const cuadrada = Math.abs(diferencia) < 0.005;
  return (
    <Chip
      size="small"
      label={cuadrada ? `${titulo} cuadrado` : `${titulo} ${diferencia > 0 ? '+' : ''}${formatMoney(diferencia)}`}
      sx={{ fontWeight: 600, fontSize: '0.72rem', backgroundColor: estado.bg, color: estado.color }}
    />
  );
};

const DiaFila = ({ dia, esHoy, onVer }) => (
  <Box
    sx={{
      display: 'grid',
      alignItems: 'center',
      gap: { xs: 1.25, md: 2 },
      gridTemplateColumns: {
        xs: 'repeat(3, minmax(0, 1fr))',
        md: 'minmax(180px, 1.4fr) repeat(4, minmax(0, 1fr)) auto',
      },
      p: { xs: 1.5, md: 2 },
      borderRadius: 3,
      border: `1px solid ${COLORS.border}`,
      backgroundColor: COLORS.surface,
    }}
  >
    <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' }, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>
        {esHoy && 'Hoy · '}
        {capitalizar(dia.fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', ''))}
      </Typography>
      <Typography noWrap sx={{ fontSize: '0.78rem', color: COLORS.muted }}>
        {dia.vendedores.join(', ')}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
        {dia.cortes.length ? (
          <>
            <EstadoCuadre titulo="Efectivo" diferencia={dia.difEfectivo} />
            <EstadoCuadre titulo="Tarjeta" diferencia={dia.difTarjeta} />
          </>
        ) : (
          <Chip size="small" label="Sin corte de caja" sx={{ fontWeight: 600, fontSize: '0.72rem', backgroundColor: COLORS.inputBg, color: COLORS.muted }} />
        )}
      </Box>
    </Box>
    <Cifra label="TICKETS" valor={dia.tickets} />
    <Cifra label="EFECTIVO" valor={formatMoney(dia.efectivo)} color={COLOR_METODO.efectivo.fuerte} />
    <Cifra label="TARJETA" valor={formatMoney(dia.tarjeta)} color={COLOR_METODO.tarjeta.fuerte} />
    <Cifra label="VENTA NETA" valor={formatMoney(dia.neto)} fuerte sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }} />
    <Button
      onClick={onVer}
      endIcon={<ChevronRight />}
      sx={{
        gridColumn: { xs: '1 / -1', md: 'auto' },
        minHeight: 44,
        px: 2,
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: 700,
        whiteSpace: 'nowrap',
        color: COLORS.blueText,
        backgroundColor: COLORS.blueSoft,
        '&:hover': { backgroundColor: COLORS.blueHover },
      }}
    >
      Ver detalle del día
    </Button>
  </Box>
);

const Historial = () => {
  const navigate = useNavigate();
  const [semanasPedidas, setSemanasPedidas] = useState(SEMANAS_POR_BLOQUE);
  const [diasApi, setDiasApi] = useState(null);
  const [cortes, setCortes] = useState([]);
  const [hayAnteriores, setHayAnteriores] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [abiertas, setAbiertas] = useState(null);
  const [hoy] = useState(() => claveDia(new Date()));

  // Ventas por día y cortes de caja del mismo rango (para el cuadre)
  useEffect(() => {
    let vigente = true;
    const rango = { desde: haceDias(semanasPedidas * 7 - 1), hasta: claveDia(new Date()) };
    Promise.all([obtenerResumenVentas(rango), obtenerCortes(rango)])
      .then(([resumen, cortesApi]) => {
        if (!vigente) return;
        setDiasApi(resumen.dias);
        setHayAnteriores(resumen.hay_anteriores);
        setCortes(cortesApi.map(corteDesdeApi));
      })
      .catch((e) => vigente && setError(mensajeDeError(e, 'No se pudo cargar el historial de ventas.')))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [semanasPedidas]);

  const semanas = useMemo(() => (diasApi ? agruparPorSemana(armarDias(diasApi, cortes)) : []), [diasApi, cortes]);
  // La semana más reciente abierta por defecto
  const semanasAbiertas = abiertas ?? new Set(semanas.slice(0, 1).map((s) => s.clave));

  const alternar = (clave) => {
    const nuevas = new Set(semanasAbiertas);
    if (nuevas.has(clave)) nuevas.delete(clave);
    else nuevas.add(clave);
    setAbiertas(nuevas);
  };

  const cargarMas = () => {
    setCargando(true);
    setSemanasPedidas((n) => Math.min(n + SEMANAS_POR_BLOQUE, MAX_SEMANAS));
  };

  return (
    <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 } }}>
      <Panel sx={{ display: 'flex', alignItems: 'center', gap: 2, p: { xs: 2, md: 3 } }}>
        <IconTile bg={COLORS.blueSoft} color={COLORS.blueText} size={52} sx={{ display: { xs: 'none', sm: 'grid' } }}>
          <HistoryOutlined />
        </IconTile>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1, color: COLORS.blueText }}>HISTORIAL</Typography>
          <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.4rem', md: '1.8rem' }, color: COLORS.ink }}>
            Ventas por día
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: COLORS.label }}>
            Agrupadas por semana · abre un día para ver cada venta, su forma de pago y su detalle
          </Typography>
        </Box>
      </Panel>

      {error && (
        <Alert severity="error" action={<Button onClick={() => window.location.reload()}>Reintentar</Button>}>
          {error}
        </Alert>
      )}

      {!diasApi && cargando && (
        <Panel sx={{ py: 6, textAlign: 'center' }}>
          <CircularProgress />
        </Panel>
      )}

      {diasApi && semanas.length === 0 && (
        <Panel sx={{ py: 6, textAlign: 'center', color: COLORS.muted }}>
          <Typography sx={{ fontWeight: 600 }}>No hay ventas en las últimas {semanasPedidas} semanas</Typography>
          <Typography sx={{ fontSize: '0.85rem' }}>Aparecerán aquí en cuanto se cobre en la Terminal POS</Typography>
        </Panel>
      )}

      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {semanas.map((semana) => (
          <Accordion
            key={semana.clave}
            expanded={semanasAbiertas.has(semana.clave)}
            onChange={() => alternar(semana.clave)}
            disableGutters
            elevation={0}
            sx={{
              borderRadius: '12px !important',
              border: `1px solid ${COLORS.border}`,
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              '&::before': { display: 'none' },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{ px: { xs: 2, md: 3 }, minHeight: 72, '& .MuiAccordionSummary-content': { my: 1.5, minWidth: 0 } }}
            >
              <Box
                sx={{
                  flex: 1,
                  display: 'grid',
                  alignItems: 'center',
                  gap: { xs: 1, md: 2 },
                  gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'minmax(180px, 1.4fr) repeat(3, minmax(0, 1fr))' },
                  pr: 1,
                }}
              >
                <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' } }}>
                  <Typography sx={{ fontWeight: 800, color: COLORS.ink }}>{semana.nombre}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: COLORS.muted }}>
                    {semana.rango} · {semana.dias.length} día{semana.dias.length === 1 ? '' : 's'} con ventas · {semana.tickets} tickets
                  </Typography>
                </Box>
                <Cifra label="EFECTIVO" valor={formatMoney(semana.efectivo)} color={COLOR_METODO.efectivo.fuerte} />
                <Cifra label="TARJETA" valor={formatMoney(semana.tarjeta)} color={COLOR_METODO.tarjeta.fuerte} />
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Cifra label="VENTA NETA" valor={formatMoney(semana.neto)} fuerte />
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ display: 'grid', gap: 1, px: { xs: 1.5, md: 3 }, pb: { xs: 1.5, md: 3 }, pt: 0 }}>
              {semana.dias.map((dia) => (
                <DiaFila key={dia.clave} dia={dia} esHoy={dia.clave === hoy} onVer={() => navigate(`/historial/${dia.clave}`)} />
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {diasApi && hayAnteriores && semanasPedidas < MAX_SEMANAS && (
        <Button onClick={cargarMas} disabled={cargando} sx={{ justifySelf: 'center', minHeight: 44, px: 3, textTransform: 'none', fontWeight: 700 }}>
          {cargando ? 'Cargando…' : `Ver ${SEMANAS_POR_BLOQUE} semanas anteriores`}
        </Button>
      )}
    </Box>
  );
};

export default Historial;
