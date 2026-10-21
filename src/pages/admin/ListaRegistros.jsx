import { Box, Chip, IconButton, LinearProgress, Switch, Tooltip, Typography } from '@mui/material';
import { DeleteOutlined, EditOutlined, WarningAmberRounded } from '@mui/icons-material';
import { COLORS } from '../../theme';
import { formatMoney } from '../../utils/format';
import { estadoVitrina, nombreDia } from './recursos';

const chip = (label, bg, color) => ({ label, bg, color });

// Qué mostrar en la fila según el tipo de registro
const describir = (recurso, r, catalogo) => {
  switch (recurso) {
    case 'productos': {
      const categoria = catalogo.categorias.find((c) => c.id === r.id_categoria);
      const visibles = r.presentaciones.filter((p) => p.activo);
      return {
        chips: [
          chip(categoria?.nombre ?? 'Sin categoría', COLORS.blueSoft, COLORS.blueText),
          ...(r.requiere_sabor ? [chip(`Sabor: ${r.tipo_sabor ?? 'sin tipo'}`, COLORS.yellowSoft, COLORS.yellowText)] : []),
          ...(categoria && !categoria.activo ? [chip('Categoría inactiva', COLORS.redSoft, COLORS.redHover)] : []),
        ],
        detalle: [
          r.presentaciones.map((p) => `${p.nombre} ${formatMoney(p.precio_base)}${p.activo ? '' : ' (inactiva)'}`).join(' · '),
          r.extras.length ? `Extras: ${r.extras.map((id) => catalogo.extras.find((e) => e.id === id)?.nombre).filter(Boolean).join(', ')}` : null,
        ]
          .filter(Boolean)
          .join(' — '),
        valor: visibles.length ? formatMoney(Math.min(...visibles.map((p) => p.precio_base))) : '—',
        valorNota: visibles.length > 1 ? 'desde' : null,
      };
    }
    case 'sabores': {
      const vitrina = estadoVitrina(r.inventario);
      return {
        chips: [chip(r.tipo, COLORS.blueSoft, COLORS.blueText), ...(r.es_especial ? [chip('Especial', COLORS.yellowSoft, COLORS.yellowText)] : [])],
        detalle: r.recargos.length
          ? `Recargo: ${r.recargos
              .map((x) => {
                const presentacion = catalogo.productos.flatMap((p) => p.presentaciones.map((pr) => ({ ...pr, producto: p.nombre }))).find((pr) => pr.id === x.id_presentacion);
                return `+${formatMoney(x.monto)} en ${presentacion ? `${presentacion.producto} ${presentacion.nombre}` : 'presentación eliminada'}`;
              })
              .join(' · ')}`
          : 'Sin recargo',
        vitrina,
        inventario: r.inventario,
      };
    }
    case 'categorias':
      return { chips: [], detalle: `${r.productos} producto${r.productos === 1 ? '' : 's'}` };
    case 'extras':
      return { chips: [], detalle: null, valor: formatMoney(r.precio) };
    case 'promociones':
      return {
        chips: [chip(nombreDia(r.dia_semana), r.dia_semana ? COLORS.yellowSoft : COLORS.inputBg, r.dia_semana ? COLORS.yellowText : COLORS.label)],
        detalle: null,
        valor: formatMoney(r.precio_combo),
        valorNota: 'combo',
      };
    default:
      return { chips: [] };
  }
};

const Vitrina = ({ vitrina, inventario }) => (
  <Box sx={{ width: { xs: '100%', sm: 130 }, flexShrink: 0 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 600, color: vitrina.critico ? COLORS.red : COLORS.label }}>
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
        {vitrina.critico && <WarningAmberRounded sx={{ fontSize: 14 }} />}
        Vitrina
      </Box>
      <span>{Math.round(vitrina.porcentaje)}%</span>
    </Box>
    <LinearProgress
      variant="determinate"
      value={vitrina.porcentaje}
      sx={{ my: 0.5, height: 6, borderRadius: 3, backgroundColor: COLORS.inputBg, '& .MuiLinearProgress-bar': { backgroundColor: vitrina.vitrinaBaja ? COLORS.red : COLORS.blue } }}
    />
    <Typography sx={{ fontSize: '0.7rem', textAlign: 'right', color: vitrina.reservaBaja ? COLORS.red : COLORS.muted }}>
      {inventario.botes_reserva} bote{inventario.botes_reserva === 1 ? '' : 's'} en reserva
    </Typography>
  </Box>
);

const Fila = ({ recurso, registro, catalogo, seleccionado, cambiando, onEditar, onActivo, onEliminar }) => {
  const info = describir(recurso.id, registro, catalogo);
  const activo = registro[recurso.campoActivo];
  const bloqueo = recurso.bloqueado(registro);

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
        opacity: activo ? 1 : 0.7,
      }}
    >
      <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: 0 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: COLORS.ink }}>{registro.nombre}</Typography>
          {info.chips.map((c) => (
            <Chip key={c.label} size="small" label={c.label} sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, backgroundColor: c.bg, color: c.color }} />
          ))}
          {!activo && <Chip size="small" label="Inactivo" sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, backgroundColor: COLORS.inputBg, color: COLORS.muted }} />}
        </Box>
        {info.detalle && <Typography sx={{ mt: 0.25, fontSize: '0.8rem', color: COLORS.muted }}>{info.detalle}</Typography>}
      </Box>

      {info.vitrina && <Vitrina vitrina={info.vitrina} inventario={info.inventario} />}

      {info.valor && (
        <Box sx={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
          {info.valorNota && <Typography sx={{ fontSize: '0.7rem', color: COLORS.muted }}>{info.valorNota}</Typography>}
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: COLORS.blueText, fontVariantNumeric: 'tabular-nums' }}>{info.valor}</Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: { xs: 'auto', sm: 0 }, flexShrink: 0 }}>
        <Tooltip title={activo ? 'Visible en el POS' : 'Oculto en el POS'}>
          <Switch checked={activo} disabled={cambiando} onChange={(e) => onActivo(e.target.checked)} slotProps={{ input: { 'aria-label': `${registro.nombre} activo` } }} />
        </Tooltip>
        <Tooltip title="Editar">
          <IconButton aria-label={`Editar ${registro.nombre}`} onClick={onEditar} sx={{ color: COLORS.blueText }}>
            <EditOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={bloqueo ?? 'Eliminar'}>
          <span>
            <IconButton aria-label={`Eliminar ${registro.nombre}`} disabled={Boolean(bloqueo)} onClick={onEliminar} sx={{ color: COLORS.red }}>
              <DeleteOutlined fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

const ListaRegistros = ({ recurso, registros, catalogo, seleccionadoId, cambiandoId, onEditar, onActivo, onEliminar }) =>
  registros.length ? (
    <Box sx={{ display: 'grid', gap: 1.25 }}>
      {registros.map((r) => (
        <Fila
          key={r.id}
          recurso={recurso}
          registro={r}
          catalogo={catalogo}
          seleccionado={r.id === seleccionadoId}
          cambiando={r.id === cambiandoId}
          onEditar={() => onEditar(r)}
          onActivo={(valor) => onActivo(r, valor)}
          onEliminar={() => onEliminar(r)}
        />
      ))}
    </Box>
  ) : (
    <Box sx={{ py: 6, textAlign: 'center', color: COLORS.muted, borderRadius: 3, border: `1px dashed ${COLORS.border}` }}>
      <Typography sx={{ fontWeight: 600 }}>Sin resultados</Typography>
      <Typography sx={{ fontSize: '0.85rem' }}>Ajusta la búsqueda o los filtros</Typography>
    </Box>
  );

export default ListaRegistros;
