import { Box, Chip, IconButton, InputBase, Typography } from '@mui/material';
import { Add, InventoryOutlined, Remove } from '@mui/icons-material';
import IconTile from '../../components/IconTile';
import Panel from '../../components/Panel';
import { DENOMINACIONES } from '../../data/catalogo';
import { COLORS } from '../../theme';
import { formatMoney } from '../../utils/format';
import { estadoDiferencia, subtituloSx, tituloSeccionSx, totalContado } from './estilos';

// Color aproximado de cada billete mexicano para ubicarlo rápido (igual en modo día y noche)
const COLOR_BILLETE = {
  1000: { bg: '#ede9fe', color: '#5b21b6' },
  500: { bg: '#dbeafe', color: '#1e40af' },
  200: { bg: '#dcfce7', color: '#166534' },
  100: { bg: '#fee2e2', color: '#991b1b' },
  50: { bg: '#fce7f3', color: '#9d174d' },
  20: { bg: '#cffafe', color: '#155e75' },
};
const COLOR_MONEDA = { bg: '#fef9c3', color: '#713f12' };

const etiqueta = (valor) => (valor < 1 ? `${valor * 100}¢` : `$${valor}`);

const FilaDenominacion = ({ valor, piezas, onCambiar, colores }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(56px, 1fr) auto minmax(84px, 1fr)', alignItems: 'center', gap: 1, py: 0.6 }}>
    <Box
      sx={{
        justifySelf: 'start',
        px: 1,
        py: 0.4,
        borderRadius: 1.5,
        fontWeight: 800,
        fontSize: '0.9rem',
        backgroundColor: colores.bg,
        color: colores.color,
      }}
    >
      {etiqueta(valor)}
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <IconButton
        aria-label={`Quitar una pieza de ${etiqueta(valor)}`}
        disabled={!piezas}
        onClick={() => onCambiar(piezas - 1)}
        sx={{ width: 40, height: 40, borderRadius: 2, backgroundColor: COLORS.inputBg }}
      >
        <Remove fontSize="small" />
      </IconButton>
      <InputBase
        value={piezas || ''}
        placeholder="0"
        onChange={(e) => onCambiar(Number(e.target.value.replace(/\D/g, '').slice(0, 5)) || 0)}
        onFocus={(e) => e.target.select()}
        slotProps={{ input: { inputMode: 'numeric', 'aria-label': `Piezas de ${etiqueta(valor)}`, style: { textAlign: 'center' } } }}
        sx={{
          width: 56,
          height: 40,
          borderRadius: 2,
          border: `1px solid ${COLORS.border}`,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          '&.Mui-focused': { borderColor: COLORS.blue },
        }}
      />
      <IconButton
        aria-label={`Agregar una pieza de ${etiqueta(valor)}`}
        onClick={() => onCambiar(piezas + 1)}
        sx={{ width: 40, height: 40, borderRadius: 2, backgroundColor: COLORS.inputBg }}
      >
        <Add fontSize="small" />
      </IconButton>
    </Box>
    <Typography sx={{ textAlign: 'right', fontWeight: 700, color: piezas ? COLORS.ink : COLORS.muted, fontVariantNumeric: 'tabular-nums' }}>
      {formatMoney(valor * piezas)}
    </Typography>
  </Box>
);

const Grupo = ({ titulo, total }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      mt: 1,
      mb: 0.5,
      px: 1.25,
      py: 0.6,
      borderRadius: 1.5,
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: 0.6,
      color: COLORS.label,
      backgroundColor: COLORS.inputBg,
    }}
  >
    <span>{titulo}</span>
    <span>{formatMoney(total)}</span>
  </Box>
);

const ConteoEfectivo = ({ conteo, onConteo, esperado }) => {
  const contado = totalContado(conteo);
  const diferencia = Math.round((contado - esperado) * 100) / 100;
  const estado = estadoDiferencia(diferencia);
  const iniciado = contado > 0;

  const cambiar = (valor) => (piezas) => onConteo({ ...conteo, [valor]: Math.max(0, piezas) });
  const subtotal = (lista) => lista.reduce((suma, valor) => suma + valor * (conteo[valor] ?? 0), 0);

  return (
    <Panel sx={{ p: { xs: 2, md: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <IconTile bg="#dcfce7" color="#15803d" size={44}>
          <InventoryOutlined />
        </IconTile>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="h2" sx={tituloSeccionSx}>
            Conteo físico de efectivo
          </Typography>
          <Typography sx={subtituloSx}>Cuenta billetes y monedas de la gaveta</Typography>
        </Box>
        <Chip
          size="small"
          label={iniciado ? 'En progreso' : 'Pendiente'}
          sx={{ fontWeight: 600, backgroundColor: iniciado ? COLORS.blueSoft : COLORS.inputBg, color: iniciado ? COLORS.blueText : COLORS.label }}
        />
      </Box>

      <Grupo titulo="BILLETES" total={subtotal(DENOMINACIONES.billetes)} />
      {DENOMINACIONES.billetes.map((valor) => (
        <FilaDenominacion key={valor} valor={valor} piezas={conteo[valor] ?? 0} onCambiar={cambiar(valor)} colores={COLOR_BILLETE[valor]} />
      ))}

      <Grupo titulo="MONEDAS" total={subtotal(DENOMINACIONES.monedas)} />
      {DENOMINACIONES.monedas.map((valor) => (
        <FilaDenominacion key={valor} valor={valor} piezas={conteo[valor] ?? 0} onCambiar={cambiar(valor)} colores={COLOR_MONEDA} />
      ))}

      {/* Cuadre de efectivo */}
      <Box sx={{ mt: 2, p: 2, borderRadius: 3, backgroundColor: COLORS.surfaceAlt, border: `1px solid ${COLORS.border}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: COLORS.label }}>
          <span>Efectivo esperado (sistema)</span>
          <Typography component="span" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {formatMoney(esperado)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.75, color: COLORS.label }}>
          <span>Efectivo contado (físico)</span>
          <Typography component="span" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {formatMoney(contado)}
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1.5,
            px: 1.5,
            py: 1.25,
            borderRadius: 2,
            backgroundColor: iniciado ? estado.bg : COLORS.inputBg,
            color: iniciado ? estado.color : COLORS.muted,
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>{iniciado ? `Efectivo ${estado.label.toLowerCase()}` : 'Sin contar'}</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', fontVariantNumeric: 'tabular-nums' }}>
            {diferencia > 0 ? '+' : ''}
            {formatMoney(diferencia)}
          </Typography>
        </Box>
      </Box>
    </Panel>
  );
};

export default ConteoEfectivo;
