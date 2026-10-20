// Datos de prueba mientras no exista conexión con el API de CodeIgniter.

export const DUMMY_USER = {
  id: 1,
  nombre: 'Santiago Martínez',
  usuario: 'smartinez',
  password: '1234',
  rol: 'Cajero Principal',
  token: 'dummy-jwt-token-123456789',
};

export const TERMINAL = {
  numero: '01',
  sucursal: 'Sucursal Centro Histórico',
  version: 'v3.2.0-cloud',
};

export const TURNO = {
  numero: '01',
  nombre: 'Matutino',
  inicio: '09:00',
  fin: '17:00',
};

export const FONDO_SUGERIDO = 1000;

export const PROMO = {
  etiqueta: 'Promo de la tarde',
  horario: '16:00 – 18:00 hrs',
  titulo: '2×1 en Paletas de Agua',
  descripcion: 'Aplica en sabores limón, jamaica, mango y tamarindo en todas las terminales.',
};

export const TOP_VENTAS = [
  { id: 1, nombre: 'Cono Doble Vainilla / Fresa', vendidos: 54, precio: 75 },
  { id: 2, nombre: 'Paleta de Mango con Chile', vendidos: 42, precio: 38 },
  { id: 3, nombre: 'Sundae Choco-Avellana', vendidos: 31, precio: 85 },
];

export const CORTE_ANTERIOR = 14280;

export const LOTES_PENDIENTES = 8;

export const PROTOCOLO = [
  { id: 'termometro', texto: 'Termómetro de congelador a -18°C', hecho: true },
  { id: 'cucharas', texto: 'Cucharas dosificadoras sanitizadas', hecho: true },
  { id: 'barquillos', texto: 'Barquillos crujientes en vitrina', hecho: false },
];

// Puntos del checklist operativo de apertura (vendrán del API)
export const CHECKLIST_APERTURA = [
  {
    id: 'vitrina',
    titulo: 'Revisión de productos en vitrina',
    descripcion: 'Caducidad, consistencia cremosa, rotulación y frescura de helados',
    etiquetaOk: 'Conforme',
  },
  {
    id: 'insumos',
    titulo: 'Preparación de vegetales e insumos',
    descripcion: 'Tener listos los vegetales e ingredientes frescos (jícama, pepino picados y abastecidos en barra)',
    etiquetaOk: 'Listo',
  },
  {
    id: 'refrigeracion',
    titulo: 'Control de Refrigeración y Congeladores',
    descripcion: 'Revisar temperatura adecuada antes de comenzar el despacho',
    etiquetaOk: 'En rango',
  },
  {
    id: 'limpieza',
    titulo: 'Limpieza general y sanitización',
    descripcion: 'Mostrador, cucharas dosificadoras, piso de servicio y vitrinas desinfectadas',
    etiquetaOk: 'Sanitizado',
  },
  {
    id: 'delivery',
    titulo: 'Plataformas de Delivery Activas',
    descripcion: 'Apps conectadas con inventario y promociones activas sincronizadas',
    etiquetaOk: 'En línea',
    tag: 'Rappi & Uber Eats',
  },
];

export const ESTADOS_LOTE = [
  { value: 'conforme', label: 'Conforme y Aprobado' },
  { value: 'observaciones', label: 'Con observaciones' },
  { value: 'rechazado', label: 'Rechazado' },
];

// Rangos de temperatura aceptables en °C
export const RANGOS_TEMPERATURA = {
  congelador: { min: -30, max: -15 },
  refrigerador: { min: 0, max: 5 },
};
