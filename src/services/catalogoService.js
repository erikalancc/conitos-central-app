import axiosClient from '../api/axiosClient';

// GET /catalogo — categorías, productos con presentaciones, sabores, extras, promociones y métodos de pago (solo lo activo)
export const obtenerCatalogo = async () => {
  const { data } = await axiosClient.get('/catalogo');
  return data.data;
};
