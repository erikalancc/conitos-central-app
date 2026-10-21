import { useState } from 'react';
import { Box, InputBase, Typography } from '@mui/material';
import { COLORS } from '../../theme';
import { formatNumber } from '../../utils/format';

// Captura de un monto en pesos: muestra el valor formateado y edita el número sin formato
const MontoInput = ({ id, value, onChange, autoFocus, sx }) => {
  const [texto, setTexto] = useState(null);

  const handleChange = (e) => {
    const limpio = e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    setTexto(limpio);
    onChange(Math.round((Number(limpio) || 0) * 100) / 100);
  };

  return (
    <Box
      sx={[
        {
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          minHeight: 52,
          borderRadius: 2.5,
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          '&:focus-within': { borderColor: COLORS.blue, boxShadow: `0 0 0 1px ${COLORS.blue}` },
        },
        sx,
      ]}
    >
      <Typography sx={{ fontSize: '1.2rem', fontWeight: 600, color: COLORS.muted }}>$</Typography>
      <InputBase
        id={id}
        autoFocus={autoFocus}
        value={texto ?? (value ? formatNumber(value) : '')}
        placeholder="0.00"
        onFocus={() => setTexto(value ? String(value) : '')}
        onChange={handleChange}
        onBlur={() => setTexto(null)}
        slotProps={{ input: { inputMode: 'decimal' } }}
        sx={{ flex: 1, fontSize: '1.3rem', fontWeight: 700, color: COLORS.ink, fontVariantNumeric: 'tabular-nums' }}
      />
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: COLORS.muted }}>MXN</Typography>
    </Box>
  );
};

export default MontoInput;
