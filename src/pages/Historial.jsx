import { useMemo, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Typography } from '@mui/material';
import { ChevronRight, ExpandMore, HistoryOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import IconTile from '../components/IconTile';
import Panel from '../components/Panel';
import { obtenerHistorial } from '../services/corteService';
import { COLORS } from '../theme';
import { formatMoney } from '../utils/format';
import { COLOR_METODO, estadoDiferencia } from './corte/estilos';
import { agruparPorSemana } from './historial/agrupar';

const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

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

const DiaFila = ({ dia, onVer }) => (
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
      backgroundColor: '#fff',
    }}
  >
    <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' }, minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 700, color: COLORS.ink }}>
          {capitalizar(dia.fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', ''))}
        </Typography>
        {dia.demo && <Chip size="small" label="Ejemplo" sx={{ height: 20, fontSize: '0.65rem', backgroundColor: COLORS.inputBg, color: COLORS.muted }} />}
      </Box>
      <Typography noWrap sx={{ fontSize: '0.78rem', color: COLORS.muted }}>
        {dia.cortes.length > 1 ? `${dia.cortes.length} cortes · ` : ''}
        {dia.cajeros.join(', ') || 'Cajero no registrado'}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
        <EstadoCuadre titulo="Efectivo" diferencia={dia.difEfectivo} />
        <EstadoCuadre titulo="Tarjeta" diferencia={dia.difTarjeta} />
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
        '&:hover': { backgroundColor: '#d3e4f4' },
      }}
    >
      Ver detalle del día
    </Button>
  </Box>
);

const Historial = () => {
  const navigate = useNavigate();
  const semanas = useMemo(() => agruparPorSemana(obtenerHistorial()), []);
  // La semana más reciente abierta por defecto
  const [abiertas, setAbiertas] = useState(() => new Set(semanas.slice(0, 1).map((s) => s.clave)));

  const alternar = (clave) =>
    setAbiertas((actuales) => {
      const nuevas = new Set(actuales);
      if (nuevas.has(clave)) nuevas.delete(clave);
      else nuevas.add(clave);
      return nuevas;
    });

  return (
    <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 } }}>
      <Panel sx={{ display: 'flex', alignItems: 'center', gap: 2, p: { xs: 2, md: 3 } }}>
        <IconTile bg={COLORS.blueSoft} color={COLORS.blueText} size={52} sx={{ display: { xs: 'none', sm: 'grid' } }}>
          <HistoryOutlined />
        </IconTile>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: 1, color: COLORS.blueText }}>HISTORIAL</Typography>
          <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.4rem', md: '1.8rem' }, color: COLORS.ink }}>
            Cortes de caja anteriores
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: COLORS.label }}>Agrupados por semana · abre un día para ver cada venta y su cuadre</Typography>
        </Box>
      </Panel>

      {semanas.length === 0 && (
        <Panel sx={{ py: 6, textAlign: 'center', color: COLORS.muted }}>
          <Typography sx={{ fontWeight: 600 }}>Aún no hay cortes registrados</Typography>
          <Typography sx={{ fontSize: '0.85rem' }}>Aparecerán aquí al cerrar el turno en Corte de Caja</Typography>
        </Panel>
      )}

      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {semanas.map((semana) => (
          <Accordion
            key={semana.clave}
            expanded={abiertas.has(semana.clave)}
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
                    {semana.rango} · {semana.dias.length} día{semana.dias.length === 1 ? '' : 's'} · {semana.tickets} tickets
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
                <DiaFila key={dia.clave} dia={dia} onVer={() => navigate(`/historial/${dia.clave}`)} />
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

export default Historial;
