import { Box, Button, Chip, Divider, Typography } from '@mui/material';
import { CreditCard, InventoryOutlined, PictureAsPdfOutlined } from '@mui/icons-material';
import IconTile from '../../components/IconTile';
import Panel from '../../components/Panel';
import { DENOMINACIONES } from '../../data/catalogo';
import { COLORS } from '../../theme';
import { formatMoney } from '../../utils/format';
import { COLOR_METODO, estadoDiferencia, tituloSeccionSx } from '../corte/estilos';
import { descargarTicketCorte } from '../corte/ticketCorte';

const hora = (iso) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
const etiqueta = (valor) => (valor < 1 ? `${valor * 100}¢` : `$${valor}`);

const Renglon = ({ label, value, color = COLORS.label, fuerte }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 0.35, fontSize: '0.88rem', fontWeight: fuerte ? 700 : 500, color }}>
    <span>{label}</span>
    <Box component="span" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </Box>
  </Box>
);

const Diferencia = ({ valor }) => {
  const estado = estadoDiferencia(valor);
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75, px: 1.25, py: 0.75, borderRadius: 2, fontWeight: 700, backgroundColor: estado.bg, color: estado.color }}>
      <span>{estado.label}</span>
      <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {valor > 0 ? '+' : ''}
        {formatMoney(valor)}
      </Box>
    </Box>
  );
};

const Seccion = ({ icono, bg, color, titulo, children }) => (
  <Box sx={{ mt: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
      <IconTile bg={bg} color={color} size={28} sx={{ borderRadius: 1.5, '& svg': { fontSize: 16 } }}>
        {icono}
      </IconTile>
      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: COLORS.ink }}>{titulo}</Typography>
    </Box>
    {children}
  </Box>
);

// Resultado de un corte cerrado: conteo de billetes, cuadre de efectivo y conciliación de tarjeta
const CorteCuadre = ({ corte }) => {
  const { efectivo, tarjeta, resumen } = corte;
  const piezas = [...DENOMINACIONES.billetes, ...DENOMINACIONES.monedas].filter((valor) => efectivo.conteo?.[valor]);

  const descargar = () =>
    descargarTicketCorte({
      tipo: 'Z',
      folio: corte.id,
      fecha: new Date(corte.fecha),
      resumen,
      conteo: efectivo.conteo ?? {},
      terminal: { monto: tarjeta.terminal, vouchers: tarjeta.vouchers },
      observaciones: corte.observaciones,
      user: { nombre: corte.usuarioNombre ?? '-' },
    });

  return (
    <Panel sx={{ p: { xs: 2, md: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" sx={tituloSeccionSx}>
            Corte Z · {hora(corte.desde)} a {hora(corte.fecha)} hrs
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: COLORS.muted }}>
            {corte.usuarioNombre ?? 'Cajero no registrado'} · {resumen.tickets} tickets · {formatMoney(resumen.neto)}
          </Typography>
        </Box>
        {corte.demo && <Chip size="small" label="Ejemplo" sx={{ backgroundColor: COLORS.inputBg, color: COLORS.muted }} />}
      </Box>

      <Seccion icono={<InventoryOutlined />} bg={COLOR_METODO.efectivo.suave} color={COLOR_METODO.efectivo.fuerte} titulo="Efectivo">
        <Box sx={{ p: 1.25, borderRadius: 2, backgroundColor: '#f8fafc', border: `1px solid ${COLORS.border}` }}>
          <Typography sx={{ mb: 0.5, fontSize: '0.72rem', fontWeight: 700, letterSpacing: 0.6, color: COLORS.muted }}>CONTEO DE GAVETA</Typography>
          {piezas.length ? (
            piezas.map((valor) => (
              <Renglon key={valor} label={`${etiqueta(valor)} × ${efectivo.conteo[valor]}`} value={formatMoney(valor * efectivo.conteo[valor])} />
            ))
          ) : (
            <Typography sx={{ fontSize: '0.85rem', color: COLORS.muted }}>Sin conteo registrado</Typography>
          )}
          <Divider sx={{ my: 0.5 }} />
          <Renglon label="Total contado" value={formatMoney(efectivo.contado)} color={COLORS.ink} fuerte />
        </Box>
        <Box sx={{ mt: 1 }}>
          <Renglon label="Fondo inicial" value={formatMoney(efectivo.fondo)} />
          <Renglon label="Ventas en efectivo" value={`+${formatMoney(resumen.efectivo)}`} color={COLOR_METODO.efectivo.fuerte} />
          {resumen.movimientos.map((m) => (
            <Renglon
              key={m.id}
              label={`${m.tipo === 'retiro' ? 'Retiro' : 'Entrada'}: ${m.concepto}`}
              value={`${m.tipo === 'retiro' ? '-' : '+'}${formatMoney(m.monto)}`}
              color={m.tipo === 'retiro' ? COLORS.red : COLOR_METODO.efectivo.fuerte}
            />
          ))}
          <Renglon label="Esperado en gaveta" value={formatMoney(efectivo.esperado)} color={COLORS.ink} fuerte />
          <Renglon label="Contado" value={formatMoney(efectivo.contado)} />
          <Diferencia valor={efectivo.diferencia} />
        </Box>
      </Seccion>

      <Seccion icono={<CreditCard />} bg={COLOR_METODO.tarjeta.suave} color={COLOR_METODO.tarjeta.fuerte} titulo="Tarjeta">
        <Renglon label="Cobrado en sistema" value={formatMoney(tarjeta.sistema)} color={COLOR_METODO.tarjeta.fuerte} />
        <Renglon label="Cierre de lote terminal" value={formatMoney(tarjeta.terminal)} />
        <Renglon label="Ventas / vouchers" value={`${resumen.porMetodo.find((m) => m.id === 'tarjeta')?.transacciones ?? 0} / ${tarjeta.vouchers || '—'}`} />
        <Diferencia valor={tarjeta.diferencia} />
      </Seccion>

      {corte.observaciones && (
        <Box sx={{ mt: 2, p: 1.25, borderRadius: 2, backgroundColor: COLORS.inputBg }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: 0.6, color: COLORS.muted }}>OBSERVACIONES</Typography>
          <Typography sx={{ fontSize: '0.88rem', color: COLORS.label }}>{corte.observaciones}</Typography>
        </Box>
      )}

      <Button
        fullWidth
        startIcon={<PictureAsPdfOutlined />}
        onClick={descargar}
        sx={{
          mt: 2,
          minHeight: 48,
          borderRadius: 2.5,
          textTransform: 'none',
          fontWeight: 700,
          color: COLORS.ink,
          backgroundColor: COLORS.inputBg,
          '&:hover': { backgroundColor: '#e2e7ee' },
        }}
      >
        Descargar ticket del corte (PDF)
      </Button>
    </Panel>
  );
};

export default CorteCuadre;
