import { useState } from 'react';
import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import Panel from '../../components/Panel';
import { PROTOCOLO } from '../../data/dummy';
import { COLORS } from '../../theme';

const Protocolo = () => {
  const [items, setItems] = useState(PROTOCOLO);

  const toggle = (id) => setItems((prev) => prev.map((item) => (item.id === id ? { ...item, hecho: !item.hecho } : item)));

  return (
    <Panel component="section">
      <Typography
        component="h2"
        sx={{ mb: 0.5, fontSize: '0.78rem', fontWeight: 600, letterSpacing: 0.8, color: COLORS.muted, textTransform: 'uppercase' }}
      >
        Protocolo de Mostrador
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item) => (
          <FormControlLabel
            key={item.id}
            control={<Checkbox checked={item.hecho} onChange={() => toggle(item.id)} />}
            label={item.texto}
            sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '0.88rem', color: COLORS.label } }}
          />
        ))}
      </Box>
    </Panel>
  );
};

export default Protocolo;
