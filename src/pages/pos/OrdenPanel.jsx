import { useState } from 'react';
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  Close,
  ConfirmationNumberOutlined,
  CreditCard,
  DeleteOutlined,
  DeleteSweepOutlined,
  EditOutlined,
  MoreVert,
  PauseCircleOutlined,
  PaymentsOutlined,
  PersonOutlined,
  PointOfSale,
  PrintOutlined,
  QrCode2,
  Remove,
  ShoppingBagOutlined,
} from '@mui/icons-material';
import { DESCUENTOS, METODOS_PAGO_ACTIVOS } from '../../data/catalogo';
import { COLORS } from '../../theme';
import { formatMoney } from '../../utils/format';
import { describirLinea, importeLinea, montosSugeridos } from './pedido';

const ICONOS_PAGO = { efectivo: <PaymentsOutlined />, tarjeta: <CreditCard />, spei: <QrCode2 /> };

// Pantallas bajas: se ocultan acciones secundarias (siguen en el menú ⋮)
const PANTALLA_BAJA = '@media (max-height: 820px)';

const OrdenLinea = ({ linea, onCantidad, onQuitar, onModificar }) => (
  <Box sx={{ p: 1.5, borderRadius: 3, backgroundColor: '#f8fafc', border: `1px solid ${COLORS.border}` }}>
    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
      <Box
        sx={{
          minWidth: 32,
          height: 26,
          px: 0.75,
          borderRadius: 1.5,
          display: 'grid',
          placeItems: 'center',
          fontSize: '0.8rem',
          fontWeight: 700,
          color: COLORS.blueText,
          backgroundColor: COLORS.blueSoft,
        }}
      >
        {linea.cantidad}×
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: '0.98rem', lineHeight: 1.3, color: COLORS.ink }}>{linea.nombre}</Typography>
        {describirLinea(linea) && (
          <Typography sx={{ mt: 0.25, fontSize: '0.8rem', color: COLORS.muted }}>{describirLinea(linea)}</Typography>
        )}
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '0.98rem', whiteSpace: 'nowrap', color: COLORS.ink }}>
        {formatMoney(importeLinea(linea))}
      </Typography>
    </Box>
    <Divider sx={{ my: 1 }} />
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Button
        onClick={onModificar}
        startIcon={<EditOutlined fontSize="small" />}
        sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600, color: COLORS.blueText }}
      >
        Modificar
      </Button>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {linea.cantidad === 1 ? (
          <IconButton aria-label={`Quitar ${linea.nombre}`} onClick={onQuitar} sx={{ width: 40, height: 40, color: COLORS.red, backgroundColor: COLORS.redSoft }}>
            <DeleteOutlined fontSize="small" />
          </IconButton>
        ) : (
          <IconButton aria-label="Restar uno" onClick={() => onCantidad(-1)} sx={{ width: 40, height: 40, backgroundColor: COLORS.inputBg }}>
            <Remove fontSize="small" />
          </IconButton>
        )}
        <Typography sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>{linea.cantidad}</Typography>
        <IconButton aria-label="Sumar uno" onClick={() => onCantidad(1)} sx={{ width: 40, height: 40, backgroundColor: COLORS.inputBg }}>
          <Add fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  </Box>
);

const Fila = ({ label, value, color = COLORS.muted, sx }) => (
  <Box sx={[{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color }, sx]}>
    <span>{label}</span>
    <span>{value}</span>
  </Box>
);

const OrdenPanel = ({
  orden,
  metodo,
  onMetodo,
  recibido,
  onRecibido,
  cobrando,
  onCobrar,
  onGuardar,
  onPrecuenta,
  onModificar,
  onClose,
}) => {
  const { pedido, totales } = orden;
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [clienteDialog, setClienteDialog] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const vacia = pedido.lineas.length === 0;
  const sugeridos = montosSugeridos(totales.total);
  const cambio = metodo === 'efectivo' && recibido > totales.total ? recibido - totales.total : 0;

  const cerrarMenu = () => setMenuAnchor(null);

  const asignarCliente = () => {
    orden.setCliente(clienteNombre.trim() || null);
    setClienteDialog(false);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
      {/* ENCABEZADO DE LA ORDEN */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5, borderBottom: `1px solid ${COLORS.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography component="h2" sx={{ fontWeight: 700, fontSize: '1.25rem', color: COLORS.ink, mr: 'auto' }}>
            Orden actual
          </Typography>
          <Chip
            size="small"
            label={`${totales.articulos} artículo${totales.articulos === 1 ? '' : 's'}`}
            sx={{ fontWeight: 600, backgroundColor: COLORS.blueSoft, color: COLORS.blueText }}
          />
          <Tooltip title="Vaciar orden">
            <span>
              <IconButton aria-label="Vaciar orden" onClick={orden.vaciar} disabled={vacia} sx={{ color: COLORS.red }}>
                <DeleteSweepOutlined />
              </IconButton>
            </span>
          </Tooltip>
          <IconButton aria-label="Más opciones" onClick={(e) => setMenuAnchor(e.currentTarget)}>
            <MoreVert />
          </IconButton>
          {onClose && (
            <IconButton aria-label="Cerrar orden" onClick={onClose} sx={{ backgroundColor: COLORS.inputBg }}>
              <Close />
            </IconButton>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 1.25 }}>
          <ButtonBase
            onClick={() => {
              setClienteNombre(pedido.cliente ?? '');
              setClienteDialog(true);
            }}
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 44,
              px: 1.5,
              gap: 1,
              justifyContent: 'flex-start',
              borderRadius: 2,
              backgroundColor: COLORS.inputBg,
              fontSize: '0.85rem',
              color: COLORS.label,
            }}
          >
            <PersonOutlined fontSize="small" sx={{ color: COLORS.blueText }} />
            <Box component="span" sx={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pedido.cliente ?? 'Cliente General'} #{pedido.folio}
            </Box>
            <Box component="span" sx={{ fontWeight: 700, color: COLORS.blueText, whiteSpace: 'nowrap' }}>
              {pedido.cliente ? 'Cambiar' : '+ Asignar'}
            </Box>
          </ButtonBase>
          <ToggleButtonGroup
            exclusive
            value={pedido.servicio}
            onChange={(_, valor) => valor && orden.setServicio(valor)}
            aria-label="Tipo de servicio"
            sx={{
              p: 0.5,
              borderRadius: 2,
              backgroundColor: COLORS.inputBg,
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '8px !important',
                px: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                color: COLORS.label,
              },
              '& .Mui-selected': { backgroundColor: `${COLORS.blueText} !important`, color: '#fff !important' },
            }}
          >
            <ToggleButton value="aqui">Aquí</ToggleButton>
            <ToggleButton value="llevar">Llevar</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* LÍNEAS */}
      <Box sx={{ flex: 1, minHeight: 120, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {vacia ? (
          <Box sx={{ m: 'auto', textAlign: 'center', color: COLORS.muted, py: 4 }}>
            <ShoppingBagOutlined sx={{ fontSize: 48, opacity: 0.5 }} />
            <Typography sx={{ mt: 1, fontWeight: 600 }}>La orden está vacía</Typography>
            <Typography sx={{ fontSize: '0.85rem' }}>Toca un producto para agregarlo</Typography>
          </Box>
        ) : (
          pedido.lineas.map((linea) => (
            <OrdenLinea
              key={linea.lineId}
              linea={linea}
              onCantidad={(delta) => orden.cambiarCantidad(linea.lineId, delta)}
              onQuitar={() => orden.quitar(linea.lineId)}
              onModificar={() => onModificar(linea)}
            />
          ))
        )}

        {pedido.descuento && !vacia && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              p: 1.5,
              borderRadius: 3,
              backgroundColor: COLORS.yellowSoft,
            }}
          >
            <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', backgroundColor: COLORS.yellow, flexShrink: 0 }}>
              <ConfirmationNumberOutlined fontSize="small" sx={{ color: '#5c4a00' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: COLORS.ink }}>{pedido.descuento.nombre}</Typography>
              <Typography sx={{ fontSize: '0.78rem', color: COLORS.label }}>{pedido.descuento.detalle}</Typography>
            </Box>
            <Typography sx={{ fontWeight: 700, color: COLORS.red, whiteSpace: 'nowrap' }}>-{formatMoney(totales.descuento)}</Typography>
            <IconButton aria-label="Quitar descuento" size="small" onClick={() => orden.setDescuento(null)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* TOTALES Y MÉTODO DE PAGO (se desplaza si no cabe; el botón de cobro queda fijo abajo) */}
      <Box
        sx={{
          flexShrink: 1,
          minHeight: 0,
          overflowY: 'auto',
          px: 2,
          pt: 1.5,
          pb: 1.25,
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        <Box sx={{ display: 'grid', gap: 0.25, [PANTALLA_BAJA]: { display: 'none' } }}>
          <Fila label="Subtotal" value={formatMoney(totales.subtotal)} color={COLORS.label} />
          {totales.descuento > 0 && <Fila label="Descuento aplicado" value={`-${formatMoney(totales.descuento)}`} color={COLORS.red} />}
          <Fila label="IVA incluido (16%)" value={formatMoney(totales.iva)} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1, mb: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: COLORS.ink }}>
            TOTAL A PAGAR
            {totales.descuento > 0 && (
              <Box component="span" sx={{ display: 'none', [PANTALLA_BAJA]: { display: 'block' }, fontSize: '0.75rem', fontWeight: 500, color: COLORS.red }}>
                Incluye -{formatMoney(totales.descuento)}
              </Box>
            )}
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2rem' }, color: COLORS.red, lineHeight: 1 }}>
            {formatMoney(totales.total)}
          </Typography>
        </Box>

        {/* Método de pago */}
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${METODOS_PAGO_ACTIVOS.length}, 1fr)`, gap: 1 }}>
          {METODOS_PAGO_ACTIVOS.map((m) => {
            const activo = metodo === m.id;
            return (
              <ButtonBase
                key={m.id}
                onClick={() => onMetodo(m.id)}
                aria-pressed={activo}
                sx={{
                  minHeight: 56,
                  flexDirection: 'column',
                  gap: 0.25,
                  borderRadius: 2.5,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: activo ? '#fff' : COLORS.label,
                  backgroundColor: activo ? COLORS.blueText : COLORS.inputBg,
                }}
              >
                {ICONOS_PAGO[m.id]}
                <span>
                  {m.label}
                  <Box component="span" sx={{ display: { xs: 'none', md: 'inline' }, opacity: 0.75 }}>
                    {' '}
                    ({m.atajo})
                  </Box>
                </span>
              </ButtonBase>
            );
          })}
        </Box>

        {metodo === 'efectivo' && !vacia && (
          <>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, mt: 1.25 }}>
              <Typography sx={{ fontSize: '0.8rem', color: COLORS.label, mr: 0.25 }}>Recibido:</Typography>
              {sugeridos.map((monto, i) => (
                <Chip
                  key={monto}
                  label={i === 0 ? 'Exacto' : formatMoney(monto).replace('.00', '')}
                  onClick={() => onRecibido(monto)}
                  sx={{
                    height: 36,
                    fontWeight: 700,
                    borderRadius: 2,
                    backgroundColor: recibido === monto ? COLORS.blueText : COLORS.inputBg,
                    color: recibido === monto ? '#fff' : COLORS.label,
                    '&:hover': { backgroundColor: recibido === monto ? COLORS.blueText : '#e2e7ee' },
                  }}
                />
              ))}
            </Box>

            {/* Renglón fijo para que el cambio no mueva el resto del panel */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1,
                px: 1.5,
                minHeight: 40,
                borderRadius: 2,
                backgroundColor: cambio > 0 ? '#ecfdf3' : COLORS.inputBg,
              }}
            >
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: COLORS.label }}>Cambio</Typography>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: cambio > 0 ? '#15803d' : COLORS.muted }}>
                {formatMoney(cambio)}
              </Typography>
            </Box>
          </>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1.25, [PANTALLA_BAJA]: { display: 'none' } }}>
          <Button
            onClick={onGuardar}
            disabled={vacia}
            startIcon={<PauseCircleOutlined />}
            sx={{ minHeight: 44, borderRadius: 2, textTransform: 'none', fontWeight: 600, color: COLORS.label, backgroundColor: COLORS.inputBg }}
          >
            Guardar Orden
          </Button>
          <Button
            onClick={onPrecuenta}
            disabled={vacia}
            startIcon={<PrintOutlined />}
            sx={{ minHeight: 44, borderRadius: 2, textTransform: 'none', fontWeight: 600, color: COLORS.label, backgroundColor: COLORS.inputBg }}
          >
            Pre-cuenta
          </Button>
        </Box>
      </Box>

      {/* BOTÓN DE COBRO: siempre visible al pie del panel */}
      <Box
        sx={{
          flexShrink: 0,
          px: 2,
          pt: 1.25,
          pb: { xs: 'max(16px, env(safe-area-inset-bottom))', md: 2 },
          backgroundColor: '#fff',
          boxShadow: '0 -8px 20px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Button
          fullWidth
          variant="contained"
          disableElevation
          disabled={vacia || cobrando}
          onClick={onCobrar}
          startIcon={<PointOfSale />}
          sx={{
            minHeight: 60,
            px: 2.5,
            borderRadius: 3,
            fontWeight: 800,
            fontSize: '1.05rem',
            justifyContent: 'flex-start',
            backgroundColor: COLORS.red,
            boxShadow: '0 6px 16px rgba(227, 36, 59, 0.3)',
            '&:hover': { backgroundColor: COLORS.redHover },
            '&.Mui-disabled': { backgroundColor: '#f3a3ad', color: '#fff' },
          }}
        >
          <Box component="span" sx={{ flex: 1, textAlign: 'left' }}>
            {cobrando ? 'Procesando…' : 'Cobrar orden'}
          </Box>
          <span>{formatMoney(totales.total)}</span>
        </Button>
      </Box>

      {/* MENÚ ⋮ */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={cerrarMenu}>
        <Typography sx={{ px: 2, pt: 1, pb: 0.5, fontSize: '0.72rem', fontWeight: 700, color: COLORS.muted, letterSpacing: 0.6 }}>
          DESCUENTOS
        </Typography>
        {DESCUENTOS.map((d) => (
          <MenuItem
            key={d.id}
            selected={pedido.descuento?.id === d.id}
            onClick={() => {
              orden.setDescuento(d);
              cerrarMenu();
            }}
            sx={{ minHeight: 48 }}
          >
            <ListItemIcon>
              <ConfirmationNumberOutlined fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={d.nombre} secondary={d.tipo === 'porcentaje' ? `${d.valor}%` : `-${formatMoney(d.valor)}`} />
          </MenuItem>
        ))}
        <Divider />
        <MenuItem disabled={vacia} onClick={() => { cerrarMenu(); onGuardar(); }} sx={{ minHeight: 48 }}>
          <ListItemIcon>
            <PauseCircleOutlined fontSize="small" />
          </ListItemIcon>
          Guardar orden en espera
        </MenuItem>
        <MenuItem disabled={vacia} onClick={() => { cerrarMenu(); onPrecuenta(); }} sx={{ minHeight: 48 }}>
          <ListItemIcon>
            <PrintOutlined fontSize="small" />
          </ListItemIcon>
          Imprimir pre-cuenta
        </MenuItem>
        <MenuItem disabled={vacia} onClick={() => { cerrarMenu(); orden.vaciar(); }} sx={{ minHeight: 48, color: COLORS.red }}>
          <ListItemIcon>
            <DeleteSweepOutlined fontSize="small" sx={{ color: COLORS.red }} />
          </ListItemIcon>
          Vaciar orden
        </MenuItem>
      </Menu>

      {/* ASIGNAR CLIENTE */}
      <Dialog open={clienteDialog} onClose={() => setClienteDialog(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Asignar cliente</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Nombre del cliente"
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && asignarCliente()}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {pedido.cliente && (
            <Button onClick={() => { orden.setCliente(null); setClienteDialog(false); }} sx={{ mr: 'auto', textTransform: 'none' }}>
              Quitar
            </Button>
          )}
          <Button onClick={() => setClienteDialog(false)} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button variant="contained" disableElevation onClick={asignarCliente} sx={{ textTransform: 'none', minHeight: 44 }}>
            Asignar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdenPanel;
