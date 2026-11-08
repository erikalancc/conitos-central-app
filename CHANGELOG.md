# Bitácora de cambios — conitos-central-app

Registro de los cambios hechos al front. Lo más reciente va primero.
Cada entrada indica **qué** cambió, **dónde** y **por qué**, y si afecta al API o a datos.

---

## 2026-11-08

### Corte de caja: confirmación del conteo (`src/pages/CorteCaja.jsx`)

- Al dar **Siguiente** en el paso *Conteo* se abre el modal **Confirma tu conteo** con:
  - **Billetes** y **Monedas**: piezas por denominación (p. ej. *3 × $200.00*), total de piezas y subtotal de cada grupo.
  - **Total de efectivo contado**, **fondo para mañana** y **total de la terminal de tarjeta**.
  - Un aviso: *Al confirmar ya no podrás regresar a modificar el conteo.*
- **Revisar conteo** cierra el modal y deja seguir corrigiendo. **Confirmar** pasa al *Resultado*.
- En *Resultado* se quitó el botón **Volver al conteo**: una vez confirmado, el conteo ya no se modifica. Solo queda cerrar el turno.
- Nota: el bloqueo es de la pantalla. Si se recarga la página antes de cerrar el turno, el corte empieza de nuevo (el conteo no se guarda hasta el cierre Z).

### Corte de caja por pasos y vista limitada de ventas para el vendedor (front + API + base de datos)

**1 · El vendedor solo ve sus últimas ventas**
- En **Administración → Sucursales** hay un campo nuevo: **Últimas ventas visibles para el vendedor** (por defecto 5; 0 = ninguna; máx. 100).
- **Vendedor / Cajero:**
  - En **Corte de Caja** y en **Historial** solo ve las últimas N ventas de su sucursal (*"Últimas 5 ventas"*, sin filtros con totales).
  - *Historial* lo lleva directo al **día de hoy**. No ve el resumen por semanas, otros días ni cortes anteriores.
- El recorte lo hace el **API**, así que no se puede saltar desde el navegador:
  - `GET /caja/turno` (y apertura / movimientos) envía `ventas_detalle` recortado y `ventas_visibles`.
  - `GET /ventas` solo responde hoy y recortado.
  - `GET /ventas/resumen`, `GET /caja/cortes` y `GET /caja/cortes/{id}` responden `403` al vendedor.
  - Los **totales** del turno siempre son del turno completo. El front ahora los toma del API (`resumenDesdeTurno`) en vez de sumar la lista.

**2 · Corte de caja en 3 pasos** (`src/pages/CorteCaja.jsx`)
1. **Turno:** movimientos de efectivo y ventas. El administrador además ve totales, desglose y el pre-corte X. Botón **Iniciar corte de caja**, que explica los pasos.
2. **Conteo a ciegas:** no se muestra cuánto *debería* haber (buena práctica para que el conteo sea honesto). Se captura:
   - **Fondo para mañana:** cuánto efectivo se queda en gaveta. Se propone el fondo inicial; no puede ser mayor a lo contado.
   - **Conteo físico** de billetes y monedas.
   - **Total de la terminal de tarjeta** (cierre de lote).
   - Abajo se ve en vivo: *Efectivo contado · Dejas de fondo · Entregas a depósito*.
3. **Resultado:** *"Contaste $X"* y en grande **"Te faltaron $…" / "Te sobraron $…" / "Cuadra exacto"**, con el desglose:
   - **Efectivo:** fondo con que abriste + ventas en efectivo + entradas − retiros = **debías tener**, contra lo contado.
   - **Tarjeta:** ventas con tarjeta del sistema contra el total de la terminal (*coincide* / *marca más* / *marca menos*).
   - **Ventas del turno** (efectivo + tarjeta), **se queda en gaveta** y **entregas a depósito**.
   - **Observaciones**, obligatorias si hay diferencia. Luego **Cerrar turno e imprimir corte Z**.
- El fondo que se deja se guarda en el corte y **se propone como fondo inicial** al abrir caja la próxima vez (en Corte de Caja y en Inicio).
- El ticket Z incluye *Fondo para el siguiente turno* y *Entregado a depósito*. El diálogo final también los muestra.

**Base de datos** (migración `2026-11-08-100000_CorteVendedor`, ya aplicada): `sucursales.ventas_visibles_vendedor` y `cortes_caja.fondo_siguiente`.

**API:**
- `BaseApiController`: `esVendedor()`, `limiteVentas()` y `ventasVisibles()`, compartidos por Caja, Ventas y Checklist.
- `Caja.php`: `fondo_siguiente` obligatorio al cerrar, `fondo_sugerido` con la caja cerrada y bloqueo de cortes al vendedor.
- `Ventas.php` y `Sucursales.php` actualizados.
- Documentado en `docs/endpoints/caja.md`, `ventas.md`, `sucursales.md`, `BASE_DE_DATOS.md` y `esquema.sql`.

**Front (otros archivos):**
- `ConteoEfectivo.jsx`: modo a ciegas (sin `esperado` solo muestra el total contado).
- `MovimientosEfectivo.jsx`: `aCiegas` oculta ventas en efectivo y el esperado.
- `VentasDelDia.jsx`: modo *Últimas N ventas*.
- `Historial.jsx` y `HistorialDia.jsx`: vista del vendedor.
- `AperturaCaja.jsx`: propone el fondo del último corte.
- `SucursalForm.jsx`: campo nuevo.
- `corteService.js` y `ventasService.js` actualizados.
- Se eliminó `ConciliacionTarjeta.jsx` (mostraba el total del sistema mientras se contaba).

**Pruebas realizadas** (tokens temporales del vendedor y del administrador):
- El vendedor recibe los totales completos y la lista recortada. Con el límite de Qro en 1 vio 1 de 2 ventas; después se regresó a 5.
- `/ventas` de otro día, `/ventas/resumen` y `/caja/cortes` dan 403 al vendedor y 200 al administrador.
- Cerrar sin fondo, o con un fondo mayor a lo contado, se rechaza sin cerrar el turno.
- **No se probó un cierre completo** para no cerrar el turno real abierto hoy (#2).

---

## 2026-11-07

### Sucursales: ya no se validan las temperaturas mínima y máxima de los equipos

- **API** (`Sucursales.php`): se quitó la regla *"la máxima debe ser mayor que la mínima"* y el límite de -60 a 30 °C. Solo se pide que cada temperatura sea un número, porque la base no acepta el campo vacío.
- **Checklist** (`Checklist.php` y `ChecklistApertura.jsx`): el rango permitido se toma de lo más bajo a lo más alto. Si se capturaron al revés (p. ej. mínima -1 y máxima -10), una lectura de -5 °C se sigue considerando en rango.
- Prueba: se guardó un equipo con mínima -1 y máxima -10 en Qro (aceptado). Después se restauraron los equipos de Qro (*Congelador* -30 a -15, *Refrigerador* 0 a 5). Como la prueba reemplazó la lista, se recrearon con ids nuevos (9 y 10). No había lecturas de checklist ligadas a los ids anteriores.

### Checklist de apertura obligatorio solo para Vendedor / Cajero

**Qué cambia**
- **Vendedor / Cajero:** al iniciar el día, el checklist se muestra **en cualquier pantalla** (no solo en Inicio) mientras su sucursal no tenga uno **completado** hoy. **No tiene botón de cerrar ni "Omitir"**, no se cierra con Esc ni con clic fuera, y solo desaparece al guardarlo. Se vuelve a revisar al cambiar de pantalla, así que al empezar un nuevo día se pide de nuevo aunque no se cierre sesión. Un checklist "omitido" de antes también debe completarse.
- **Administrador, Productor y Compras:** ya no se les abre el checklist.
- En *Control de Refrigeración y Congeladores* se indica de qué sucursal son los equipos: *Equipos de Conitos Central Qro (2)*. Son los configurados en Administración → Sucursales; hoy Qro y Hgo tienen los dos equipos iniciales (*Congelador* y *Refrigerador*).

**Front**
- `src/pages/inicio/ChecklistObligatorio.jsx` (nuevo): consulta el checklist del vendedor y lo muestra en modo obligatorio. Se monta en `src/layouts/AppLayout.jsx`.
- `src/pages/inicio/ChecklistApertura.jsx`: props `obligatorio` (oculta ✕ y *Omitir*, y muestra *Es obligatorio al iniciar el día: guárdalo para continuar*) y `sucursal`.
- `src/pages/Inicio.jsx`: ya no abre el checklist (lo hace el layout, solo para el vendedor).

**API**
- `POST /checklist/apertura/omitir`: responde `403` al Vendedor / Cajero (*El checklist de apertura es obligatorio para el vendedor…*).

**Prueba** (token temporal del vendedor Sharon Michel, Qro): el checklist trae los equipos de Qro y *omitir* responde 403. No se creó ningún registro.

### Checklist de apertura: congeladores y refrigeradores por sucursal (front + API + base de datos)

**Qué cambia para el usuario**
- En **Administración → Sucursales → editar** hay una sección nueva: **Congeladores y refrigeradores**. Por cada equipo se captura nombre, tipo (congelador / refrigerador), **temperatura mínima y máxima** en °C, y si está activo. Se pueden agregar o quitar equipos. Una sucursal nueva arranca con un congelador (-30 a -15) y un refrigerador (0 a 5).
- En el **Checklist operativo de apertura → Control de Refrigeración y Congeladores** aparecen los equipos **activos de la sucursal del usuario**, cada uno con su rango a la vista (p. ej. *Congelador paletas · -25.5 a -18 °C*). Si una lectura sale del rango, se marca *Fuera de rango* y se pide describir la incidencia, igual que antes.
- **Temperaturas negativas:** el campo tiene un botón **±** para cambiar el signo (el teclado numérico de celulares y tablets no trae "-"). Con teclado físico también se puede escribir "-". Acepta punto o coma decimal (máx. 2 decimales).
- El checklist ahora es **uno por día por sucursal**. Antes, si una sucursal lo completaba, las demás ya no podían.

**Base de datos** (migración `2026-11-07-120000_EquiposFrioPorSucursal`, ya aplicada)
- Tabla nueva `equipos_frio` (por sucursal, con `temp_min` / `temp_max` que admiten negativos). Qro y Hgo arrancaron con *Congelador* (-30 a -15) y *Refrigerador* (0 a 5), los mismos rangos que antes eran fijos.
- `checklist_registros.id_sucursal`, con la llave única `(fecha, id_sucursal)`. El registro anterior (2026-10-20) quedó en Qro.
- `checklist_temperaturas`: `id_equipo`, `temp_min` y `temp_max`. Cada lectura guarda el rango vigente, así que el historial no cambia si luego se edita el equipo.

**API**
- `GET/POST/PUT /admin/sucursales`: `equipos_frio`, con validación de nombre único por sucursal, tipo, rango entre -60 y 30 °C y mínima < máxima (`SucursalModel`, `Sucursales.php`).
- `GET /checklist/apertura`: `sucursal` y, en el punto de temperaturas, `config.sensores` con los equipos de la sucursal. `POST` valida y guarda por equipo. `omitir` también es por sucursal (`Checklist.php`, `ChecklistRegistroModel`).
- Documentado en `docs/endpoints/sucursales.md`, `checklist.md`, `BASE_DE_DATOS.md` y `esquema.sql`.

**Front**
- `src/components/CampoTemperatura.jsx` (nuevo): campo de °C con botón ±, que acepta negativos.
- `src/pages/admin/SucursalForm.jsx`: sección *Congeladores y refrigeradores*.
- `src/pages/inicio/ChecklistApertura.jsx`: cada equipo con su nombre, ícono por tipo y rango; aviso si la sucursal no tiene equipos.

**Pruebas realizadas** (token temporal): el checklist de Qro mostró sus equipos. Al agregar *Congelador paletas* (-25.5 a -18) apareció en el checklist. Se rechazaron mínima > máxima y nombres repetidos. Se guardó un checklist con -18.5 °C (en rango) y un refrigerador a -1 °C (fuera de rango, pidió comentario). Las lecturas quedaron con equipo y rango. Después se borró ese registro de prueba y se restauraron los equipos.

### Productos y precios por sucursal (front + API + base de datos)

**Idea:** el producto se da de alta **una sola vez**. Por sucursal solo se decide si **se vende ahí** y, si cambia, **su precio** por presentación. Al iniciar sesión, el POS muestra los productos y precios de la **sucursal asignada al usuario** (Administración → Usuarios). Si el usuario no tiene sucursal, o la suya está desactivada, se usa la matriz.

**Base de datos** (migración `2026-11-07-100000_CatalogoPorSucursal`, ya aplicada)
- `productos_sucursales (id_producto, id_sucursal)`: dónde se vende cada producto. Sin fila = no se vende ahí.
- `precios_sucursales (id_presentacion, id_sucursal, precio)`: solo los precios **distintos** al general. Sin fila = precio general.
- Al migrar, los 17 productos quedaron en las 2 sucursales (Qro y Hgo) con su precio general, así que el POS se ve igual que antes hasta que se ajuste algo.

**API**
- Sesión: `UsuarioModel::buscarActivo` resuelve la sucursal de trabajo; `Sesion::idSucursal()`. `POST /auth/login` y `GET /auth/me` devuelven `id_sucursal` y `sucursal` (nombre).
- `GET /catalogo`: trae `sucursal: { id, nombre }`, solo los productos que se venden en esa sucursal y `precio_base` con el precio de la sucursal.
- `POST /ventas`: recalcula con el precio de la sucursal del vendedor y rechaza un producto que no se vende ahí (*"X no se vende en esta sucursal."*).
- `GET /admin/catalogo`: `sucursales`, `productos[].sucursales` y `presentaciones[].precios_sucursal`.
- `POST/PUT /admin/productos`: reciben `sucursales: [ids]` (al menos una) y `presentaciones[i].precios_sucursal: { id_sucursal: precio }`. Un producto nuevo sin `sucursales` se vende en todas.
- `POST /admin/sucursales`: una sucursal nueva arranca vendiendo todos los productos con su precio general.
- Documentado en `docs/endpoints/admin-catalogo.md`, `catalogo.md`, `BASE_DE_DATOS.md` y `esquema.sql`.

**Front**
- `src/pages/admin/ProductoForm.jsx`: sección **Sucursales y precios**. Por cada sucursal hay un interruptor *se vende aquí* y, si está activo, un precio opcional por presentación (vacío = *General*; el precio general se muestra al lado).
- `src/pages/admin/ListaRegistros.jsx`: chips *Solo en: …* (si no se vende en todas) y *Precio por sucursal* (si tiene precios propios).
- `src/layouts/AppLayout.jsx`: el menú lateral muestra la sucursal real del usuario en lugar del dato de prueba.
- El POS no necesitó cambios: ya recibe del API los productos y precios de la sucursal.

**Prueba realizada** (con un token temporal de 10 min, sin cambiar contraseñas): con *Paleta de Agua*, un precio propio en Qro hizo que el POS de Qro cobrara $30 en vez de $25. Al dejarla solo en Hgo, desapareció del POS de Qro. Un producto sin sucursales se rechazó. Al final el producto quedó como estaba.

**Pendiente / fuera de alcance:** la caja (cortes) y el historial de ventas todavía no se separan por sucursal, y las promociones aplican en todas las sucursales.

### Imagen de productos: también se acepta WEBP (front + API)

- Formatos permitidos: **JPG, JPEG, PNG y WEBP** (máx. 5 MB, sin cambio).
- **Front** (`src/utils/imagen.js`): `image/webp` y la extensión `.webp` se agregaron a la validación que corre al presionar Guardar. El mensaje ahora dice *La imagen debe ser JPG, JPEG, PNG o WEBP.*
- **API** (`CatalogoAdmin.php`): reglas `mime_in` y `ext_in` con `image/webp` / `webp`, y mensajes actualizados. Se verificó que el PHP 8.3 de WAMP detecta `.webp` como `image/webp`.
- Documentación del API actualizada (`docs/README.md`, `docs/endpoints/admin-catalogo.md`).
- No requiere cambios en la base de datos. Los navegadores actuales muestran WEBP sin problema.

---

## 2026-11-06

### Imagen de productos: se ve completa sin recortarse

**Problema:** las imágenes se mostraban con `object-fit: cover`. Por eso una foto vertical (p. ej. una paleta) en el espacio horizontal de la tarjeta del POS (16:10) se recortaba arriba y abajo.

**Solución:** nuevo componente `src/components/ImagenProducto.jsx`:
- Al frente, la imagen **completa** con `object-fit: contain` (no se recorta ni se deforma).
- Detrás, la misma imagen ampliada, difuminada y semitransparente, para llenar los huecos laterales o superiores y que el recuadro no se vea vacío.
- Funciona con imágenes verticales, horizontales o cuadradas sin tener que editarlas antes de subirlas.

Se usa en la tarjeta del producto del POS (`ProductoCard.jsx`), el encabezado de *Personalizar* (`PersonalizarDialog.jsx`) y la vista previa de *Administración → Producto* (`ProductoForm.jsx`), para que la vista previa al crear o editar muestre lo mismo que el POS.

### Sabores: no se pueden repetir (front + API + base de datos)

Se revisó la regla de sabores únicos. El API ya rechazaba nombres iguales; se reforzó en tres niveles. Se consideran iguales los nombres que solo cambian en **mayúsculas, acentos o espacios** (`limon` = `Limón`, `pina` = `Piña`).
- **Base de datos:** índice único `uq_sabores_nombre` en `sabores.nombre` (migración `2026-11-06-140000_SaboresNombreUnico`, ya aplicada). La migración se detiene si encuentra repetidos. Hoy no había ninguno. Agregado a `docs/esquema.sql`.
- **API** (`CatalogoAdmin.php`): el mensaje ahora dice cuál sabor ya existe: *Ya existe el sabor "Limón". No se pueden repetir sabores.* Si el índice de la BD rechaza un duplicado (p. ej. dos guardados al mismo tiempo), se responde `400` en `nombre` en lugar de error 500.
- **Front** (`SaborForm.jsx`): al presionar Guardar se compara contra los sabores del catálogo con la misma regla. Si se repite, se marca el campo *Nombre* con el aviso y no se envía.

### Administración · Sabores (`src/pages/Administracion.jsx`)

**El editor se cierra al guardar con éxito**
- Al crear o editar un sabor, si el API responde bien, se cierra el panel o cajón del formulario y se muestra el aviso (*Sabor creado* / *Cambios guardados*).
- Si hay errores de validación, el editor sigue abierto con los mensajes.
- Los demás recursos (productos, categorías, extras, promociones) siguen igual: el editor se queda abierto con el registro guardado.

### Sabores: varios tipos por sabor (front + API + base de datos)

Antes cada sabor tenía **un solo** tipo (Helado, Paleta Agua, Agua Fresca…). Ahora un sabor puede aplicar a **varios** (p. ej. Chocolate para Helado y Paleta Crema).

**Base de datos** (`conitos_central_pos`)
- Nueva tabla `sabores_tipos (id_sabor, tipo_sabor)`: llave primaria compuesta y llave foránea a `sabores` con borrado en cascada.
- La migración `2026-11-06-130000_SaboresTipos` copió el tipo que ya tenía cada sabor (11 sabores) y **quitó la columna `sabores.tipo_sabor`**. Ya está aplicada en local. Su `down()` regresa la columna con el primer tipo de cada sabor.
- `productos.tipo_sabor` no cambia: cada producto sigue pidiendo sabores de **un** tipo.

**API**
- `POST/PUT /admin/sabores`: recibe `tipos: string[]` en lugar de `tipo_sabor` (al menos uno, máx. 30 caracteres cada uno; se quitan vacíos y repetidos). El error va en `messages.tipos`.
- `GET /catalogo` y `GET /admin/catalogo`: cada sabor trae `tipos: [...]` en lugar de `tipo`. `tipos_sabor` reúne los tipos de sabores y productos, en orden alfabético.
- `POST /ventas`: el sabor es válido si **alguno** de sus tipos coincide con el `tipo_sabor` del producto.
- `SaborModel::tiposPorSabor()` arma los tipos de cada sabor.
- Documentación actualizada: `docs/esquema.sql`, `docs/BASE_DE_DATOS.md` y `docs/endpoints/admin-catalogo.md`, `catalogo.md`, `ventas.md`.

**Front**
- `src/pages/admin/SaborForm.jsx`: el campo *Aplica para* es de **selección múltiple** con chips. Se elige de los tipos existentes o se escribe uno nuevo (con Enter, o al salir del campo).
- `src/pages/admin/ListaRegistros.jsx`: la lista muestra un chip por cada tipo del sabor.
- `src/pages/admin/recursos.js`: la búsqueda encuentra el sabor por cualquiera de sus tipos.
- `src/pages/admin/ProductoForm.jsx`: el conteo *(N activos)* por tipo considera sabores con varios tipos.
- `src/pages/pos/catalogoPos.js`: el POS ofrece en cada producto los sabores que incluyen su tipo.

### Imagen de productos (front + API + base de datos)

**Base de datos** (`conitos_central_pos`)
- Nueva columna `productos.imagen VARCHAR(255) NULL` (ruta relativa, p. ej. `uploads/productos/producto-3-a1b2c3.jpg`). Migración del API: `2026-11-06-120000_ProductosImagen.php` (ya aplicada en local con `php spark migrate`). También se agregó a `docs/esquema.sql`.

**API** (`conitos-central-api`)
- `POST /api/v1/admin/productos/{id}/imagen` (multipart, campo `imagen`): valida **JPG / JPEG / PNG** y **máx. 5 MB**, guarda el archivo en `public/uploads/productos/` (dentro del proyecto del API), escribe la ruta en la BD y borra la imagen anterior.
- `DELETE /api/v1/admin/productos/{id}/imagen`: quita la imagen y borra el archivo. Borrar un producto también borra su imagen.
- `GET /catalogo` y `GET /admin/catalogo` devuelven `imagen` en cada producto.
- `.gitignore`: los archivos subidos no se versionan (se conserva la carpeta con `.gitkeep`).
- Documentado en `docs/README.md` y `docs/endpoints/admin-catalogo.md`.
- **PHP de WAMP 8.3.28**: `upload_max_filesize` subió de 2M a **6M** en `php.ini` y `phpForApache.ini` (respaldos `*.bak-conitos`). Hay que reiniciar `spark serve` para que lo tome. En producción (Hostinger) revisar que `upload_max_filesize` ≥ 6M.

**Front**
- `src/pages/admin/ProductoForm.jsx`: bloque *Imagen del producto* con vista previa, *Subir / Cambiar imagen* y *Quitar imagen*. El formato y el tamaño **se validan al presionar Guardar**; si no cumplen, se muestra el error y no se guarda nada.
- `src/pages/Administracion.jsx`: al guardar, primero se guarda el producto y después se sube o se quita la imagen (un producto nuevo necesita su id). Si la imagen falla, el producto queda guardado y se avisa.
- `src/services/catalogoAdminService.js`: `subirImagenProducto` y `quitarImagenProducto`.
- `src/utils/imagen.js` (nuevo): `urlImagen` (arma la URL a partir de `VITE_API_URL`) y `validarImagen`.
- Donde se muestra la imagen: **tarjeta del producto en el POS** (`ProductoCard.jsx`, ya lo soportaba) y **encabezado del diálogo Personalizar** (`PersonalizarDialog.jsx`). Si el producto no tiene imagen se sigue viendo el emoji. En el resto de pantallas (orden, tickets, historial, lista de Administración) no cambia nada.
- `vite.config.js`: el proxy también reenvía `/uploads` al API.

### Layout general · Menú lateral (`src/layouts/AppLayout.jsx`)

**Se reemplazó el encabezado superior y el pie de página por un menú lateral izquierdo**
- Se quitaron la barra azul superior y el pie de página. El contenido de cada pantalla ahora ocupa **todo el alto** y el resto del ancho.
- **Riel lateral** (siempre visible, azul de la marca, 72 px en escritorio / 60 px en celular), de arriba a abajo:
  botón ☰ *Abrir menú*, logo, accesos directos a cada módulo (solo ícono, con tooltip; el módulo activo va en blanco), y abajo *Modo día/noche*, *Bloquear* y el avatar del usuario.
  - Íconos: *Terminal POS* (caja), *Corte de Caja* (recibo), *Historial* (reloj), *Administración* (escudo).
  - Hacer clic en cualquier parte libre del riel abre el menú completo; los íconos de módulo navegan directo.
- **Menú completo** (cajón desde la izquierda, mismo azul y estilos que el encabezado anterior):
  marca y terminal, chip *En Línea • Conectado*, reloj y fecha, tarjeta del usuario, sección *MÓDULOS* con nombre e ícono, botones *Modo noche/día* y *Bloquear terminal*, y al pie el estado del equipo (versión, impresora, gaveta y ©) que antes estaba en el pie de página.
  - Se cierra con ✕, tocando fuera o al elegir un módulo.
- Los permisos por rol no cambian: el riel y el menú muestran solo los módulos que el usuario puede abrir (`puedeEntrar`).

### POS · Venta completada (`src/pages/pos/VentaCompletadaDialog.jsx`)

**Reacomodo del encabezado y del renglón de pago**
- *CAMBIO A ENTREGAR* ahora va arriba, en el lugar de la palomita, cuando hay cambio.
- Cuando no hay cambio (pago con **tarjeta** o efectivo exacto) se muestra la **palomita verde**.
- *Método* y *Recibido* quedaron en el mismo renglón (método a la izquierda, recibido a la derecha; con tarjeta solo aparece el método).

**Detalle de artículos más grande (~50 % del modal)**
- La lista *DETALLE · N ARTÍCULOS* tenía un tope de 260 px. Ahora mide `42dvh` (aprox. la mitad del modal) y hace scroll si hay más artículos.
- En pantallas bajas se encoge para que el modal no se salga de la pantalla (mínimo 120 px). El resto de los elementos no cambió.

**El renglón *Método* muestra solo *Tarjeta***
- Antes mostraba el nombre del API (*Tarjeta de Débito* / *Tarjeta de Crédito*). Ahora muestra la forma de pago del POS: *Efectivo* o *Tarjeta*. Si el método no se reconoce, se usa el nombre del API como respaldo.
- Solo cambia lo que se ve; en la base la venta sigue guardada como Débito.

### POS · Panel de la orden (`src/pages/pos/OrdenPanel.jsx`)

**Se quitó el selector *Tipo de tarjeta* (Débito / Crédito)**
- Al elegir *Tarjeta* en el método de pago ya no aparece el renglón *Tipo de tarjeta*.
- `src/pages/Pos.jsx`: el estado `tipoTarjeta` pasó a ser la constante `'debito'` y ya no se pasan `tipoTarjeta` / `onTipoTarjeta` al panel.
- **Datos:** todo cobro con tarjeta se registra en el API con el método de pago **Débito** (`metodos_pago` id 2). Los reportes ya no distinguen débito de crédito en las ventas nuevas.

**Botones más compactos desde *Total a pagar* hacia abajo**
- Métodos de pago (*Efectivo*, *Tarjeta*): ahora **solo muestran el ícono**; el nombre y el atajo (F4 / F5) aparecen en un tooltip al pasar el mouse y se conservan en `aria-label`. Altura 56 px → 40 px.
- Alturas reducidas: *Débito / Crédito* 36 → 30 px, montos sugeridos de *Recibido* 36 → 30 px, renglón de *Cambio* 40 → 34 px, *Guardar Orden* / *Pre-cuenta* 44 → 36 px, *Cobrar orden* 60 → 48 px.
- Solo cambia la presentación; el ancho de los botones y la lógica de cobro son los mismos.

**Se quitó la sección de cliente y el selector Aquí / Llevar**
- Se eliminó el botón *"Cliente General #folio · + Asignar"*, el diálogo *Asignar cliente* y el selector *Aquí / Llevar* del encabezado de la orden.
- El encabezado quedó solo con: título *Orden actual*, contador de artículos, *Vaciar orden* y menú ⋮. Se redujo su relleno vertical (`pt: 2, pb: 1.5` → `py: 1`) para recuperar ese espacio.
- **Datos:** la venta se sigue enviando al API con `cliente: null` y `servicio: 'llevar'` (valores por defecto de `pedido.js`), así que el API no cambia. El diálogo de venta completada siempre mostrará *"Para llevar"*.
- La lógica de `setCliente` / `setServicio` en `pedido.js` se conserva por si se vuelve a habilitar.

**Tarjetas de producto de la orden al 80 %**
- En `OrdenLinea` se redujeron al 80 % los tamaños de texto, el indicador de cantidad, los botones (*Modificar*, quitar, −, +: de 40 px a 32 px), los íconos, los rellenos y el radio de las esquinas.
- La separación entre tarjetas bajó de `1.25` a `1`.

### Entorno de desarrollo

**Acceso por IP desde la red local** (`vite.config.js`, `.env.development`)
- `vite.config.js`: `server.host: true` (escucha en la red, p. ej. `http://192.168.100.32:5173`) y proxy de `/api` → `http://localhost:8080`.
- `.env.development`: `VITE_API_URL=/api/v1` (relativa, pasa por el proxy). Antes: `http://localhost:8080/conitos-central-api/v1`, ruta que no existe.
- Con el proxy no hace falta exponer el puerto 8080 ni agregar la IP a `cors.origins` del API.
