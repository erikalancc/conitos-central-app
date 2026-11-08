// Imágenes de productos: el API guarda la ruta relativa (p. ej. "uploads/productos/abc.jpg")
// y el archivo vive en la carpeta public/ del API, junto a /api/v1.

// Raíz del API sin "/api/v1": "" en desarrollo (pasa por el proxy de Vite) o el dominio del API en producción
const RAIZ_API = (import.meta.env.VITE_API_URL ?? '').replace(/\/api\/v1\/?$/, '');

export const urlImagen = (ruta) => (ruta ? `${RAIZ_API}/${ruta.replace(/^\/+/, '')}` : null);

// Reglas de la imagen del producto (se validan al guardar)
export const IMAGEN_FORMATOS = ['image/jpeg', 'image/png', 'image/webp'];
export const IMAGEN_EXTENSIONES = ['jpg', 'jpeg', 'png', 'webp'];
export const IMAGEN_MAX_MB = 5;

// Devuelve el mensaje de error o null si la imagen es válida
export const validarImagen = (archivo) => {
  const extension = archivo.name.split('.').pop()?.toLowerCase();
  if (!IMAGEN_FORMATOS.includes(archivo.type) || !IMAGEN_EXTENSIONES.includes(extension)) {
    return 'La imagen debe ser JPG, JPEG, PNG o WEBP.';
  }
  if (archivo.size > IMAGEN_MAX_MB * 1024 * 1024) {
    return `La imagen pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB; el máximo es ${IMAGEN_MAX_MB} MB.`;
  }
  return null;
};
