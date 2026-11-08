import { Box } from '@mui/material';

/**
 * Imagen de producto que se ve completa en cualquier espacio (vertical, horizontal o cuadrada):
 * - al frente, la imagen entera con object-fit: contain (no se recorta);
 * - detrás, la misma imagen ampliada y difuminada para llenar los huecos sin que se vea vacío.
 * Ocupa el 100 % del contenedor; el tamaño y la proporción los define quien la usa.
 */
const ImagenProducto = ({ src, alt = '', sx }) => (
  <Box sx={[{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }, sx]}>
    <Box
      component="img"
      src={src}
      alt=""
      aria-hidden
      sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(14px) saturate(1.1)', transform: 'scale(1.2)', opacity: 0.55 }}
    />
    <Box component="img" src={src} alt={alt} sx={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
  </Box>
);

export default ImagenProducto;
