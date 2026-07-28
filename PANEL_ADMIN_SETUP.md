# Panel de Administración CITROB — instalación y uso

## 1. Qué se implementó

Esta V1 reemplaza la pantalla de Decap CMS de `/admin/` por un panel propio. Permite iniciar sesión, cargar el catálogo desde GitHub, buscar, filtrar, crear, editar, eliminar y activar o desactivar productos. Los cambios de productos se mantienen localmente hasta pulsar **Guardar cambios**.

La subida de imágenes también se realiza de forma segura mediante una Netlify Function. El token de GitHub y la contraseña nunca se envían al navegador.

La tienda pública continúa leyendo `data/productos.json` y conserva `productosRespaldo` si el `fetch()` falla. Los productos con `activo: false` se ocultan del catálogo, destacados, buscador, modal y nuevas incorporaciones al carrito. Los productos antiguos, que no tienen `activo`, se consideran activos.

## 2. Arquitectura

```text
Navegador en /admin/
        │ cookie HttpOnly firmada
        ▼
Netlify Functions
        │ token solo en el servidor
        ▼
GitHub Contents API
        │ commit en GITHUB_BRANCH
        ▼
data/productos.json / imagenes/uploads/
        │
        ▼
Nuevo deploy de Netlify
```

- La contraseña se compara con un hash `scrypt`.
- La sesión dura 8 horas y se guarda en una cookie `HttpOnly`, `SameSite=Strict` y `Secure` en HTTPS.
- Las operaciones POST se limitan al mismo origen.
- El panel conserva el SHA del archivo. Si GitHub tiene otra versión, bloquea el guardado para evitar sobrescribir cambios.
- El backend valida nuevamente todos los productos; no confía solamente en el formulario.
- Las imágenes aceptadas son JPG, PNG o WEBP de hasta 3 MB, con firma binaria comprobada.

## 3. Archivos del panel

- `admin/index.html`: login, panel, tarjetas, formulario y confirmaciones.
- `admin/admin.css`: diseño responsive de CITROB.
- `admin/admin-core.js`: operaciones locales y validación reutilizable.
- `admin/admin.js`: sesión, interfaz y llamadas a las funciones.
- `netlify/functions/`: autenticación, lectura/guardado del catálogo y subida de imágenes.
- `netlify/functions/_lib/`: utilidades compartidas de seguridad, GitHub y validación.
- `scripts/generar-password-hash.js`: genera el hash de la contraseña sin mostrarla al escribir.
- `scripts/verificar-proyecto.js`: revisa sintaxis JavaScript y el JSON.
- `tests/`: pruebas automáticas sin commits reales.

`admin/config.yml` se conserva por seguridad, pero ya no se carga ni se utiliza. Puede eliminarse en una limpieza futura después de confirmar que no se necesita volver a Decap CMS.

## 4. Compatibilidad con el catálogo existente

Se conservaron las propiedades reales:

`id`, `nombre`, `categoria`, `descripcion`, `detalle`, `especificaciones`, `video`, `precioAnterior` opcional, `precio`, `stock`, `destacado` e `imagen`.

Aunque una idea inicial hablaba de stock numérico, el catálogo y la tienda actuales usan `stock` como booleano (`true` disponible, `false` agotado). Esta V1 lo mantiene así para no romper los 18 productos. Tampoco agrega SKU, varias imágenes ni campos nuevos masivamente.

El campo `activo` es opcional para compatibilidad:

- ausente o `true`: se muestra en la tienda;
- `false`: se oculta;
- al editar o crear desde el panel se guarda explícitamente.

## 5. Requisitos

- Node.js 24 (la versión fijada en `.nvmrc` y `package.json`).

Netlify ejecuta `npm run build` y publica únicamente `dist/`. Esa carpeta se
genera en cada build con la tienda, el panel, el catálogo y las imágenes; las
pruebas, scripts, documentación y fuentes de las Functions no se publican como
archivos estáticos.
- Un sitio de Netlify conectado al repositorio.
- Un token fine-grained de GitHub con acceso al repositorio.
- La rama `panel-admin` publicada como branch deploy para las primeras pruebas.

No hay dependencias npm de ejecución. `npm install` no es necesario para el código del proyecto.

## 6. Generar la contraseña administrativa

En la raíz del proyecto:

```powershell
npm.cmd run password:hash
```

Escribe dos veces una contraseña fuerte de al menos 12 caracteres. El script mostrará solamente el hash final. Copia ese valor completo en `ADMIN_PASSWORD_HASH` de Netlify. No lo guardes en un archivo versionado.

Para crear un secreto de sesión aleatorio:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Copia el resultado en `SESSION_SECRET`. Debe tener al menos 32 caracteres y ser distinto de la contraseña.

## 7. Crear el token de GitHub

En GitHub:

1. Abre **Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Crea un token para el propietario correcto.
3. Limita **Repository access** únicamente al repositorio CITROB.
4. En **Repository permissions**, asigna **Contents: Read and write**.
5. No concedas permisos administrativos, de Actions, usuarios ni organizaciones.
6. Define una expiración y planifica su rotación.
7. Copia el token una sola vez a `GITHUB_TOKEN` en Netlify.

El repositorio utilizado por esta versión es `solarmec/citrob-platform`.

Referencias oficiales:

- GitHub Contents API: <https://docs.github.com/en/rest/repos/contents>
- Tokens fine-grained: <https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens>

## 8. Variables de entorno

Configura estas variables en Netlify. `.env.example` contiene solo los nombres:

```dotenv
ADMIN_PASSWORD_HASH=
SESSION_SECRET=
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=citrob-platform
GITHUB_BRANCH=panel-admin
```

Valores no secretos esperados para el repositorio detectado:

- `GITHUB_OWNER`: `solarmec`
- `GITHUB_REPO`: `citrob-platform`
- `GITHUB_BRANCH`: `panel-admin`

En Netlify:

1. Abre el sitio.
2. Ve a **Project configuration → Environment variables**.
3. Agrega las seis variables.
4. Asegura que estén disponibles para Functions y para el contexto del branch deploy.
5. Ejecuta un nuevo deploy después de modificarlas.

No pongas secretos en `netlify.toml`: Netlify no expone a Functions las variables sensibles declaradas allí y, además, quedarían en Git.

Referencia: <https://docs.netlify.com/build/functions/environment-variables/>

## 9. Prueba local

La forma correcta es usar Netlify CLI porque un servidor estático normal no ejecuta Functions:

```powershell
npx.cmd netlify-cli dev
```

Para una prueba local, crea un archivo `.env` no versionado con valores de desarrollo. `.gitignore` ya excluye `.env` y `.env.*`, salvo `.env.example`.

Abre la dirección que indique Netlify CLI, normalmente:

`http://localhost:8888/admin/`

Las funciones leen y escriben la rama configurada. Si no quieres generar commits durante pruebas locales, usa las pruebas automáticas (`npm test`), que simulan GitHub.

## 10. Publicar primero como branch deploy

1. Confirma en Netlify que los branch deploys estén habilitados.
2. Incluye `panel-admin` entre las ramas permitidas.
3. Configura las variables para ese contexto.
4. Sube la rama manualmente cuando hayas revisado los cambios.
5. Espera a que el deploy termine.
6. Abre `https://panel-admin--citrobchile.netlify.app/admin/` si ese sigue siendo el dominio de branch deploy.
7. Verifica también `https://panel-admin--citrobchile.netlify.app/data/productos.json`.

No cambies todavía la rama de producción. Tras validar la V1, puedes integrar `panel-admin` mediante el flujo Git que use el proyecto.

## 11. Uso diario

### Iniciar sesión

Abre `/admin/`, escribe la contraseña y pulsa **Ingresar**. La contraseña viaja por HTTPS a la Function, se valida y no se guarda en el navegador.

### Crear un producto

1. Pulsa **Nuevo producto**.
2. Completa todos los campos obligatorios.
3. Usa un ID estable, único, en minúsculas y con guiones.
4. Pulsa **Aplicar al catálogo**.
5. El producto aparecerá inmediatamente, pero seguirá pendiente.

### Editar o desactivar

Pulsa **Editar** en una tarjeta. El formulario conserva propiedades adicionales que pueda tener el producto. **Desactivar** lo oculta de la tienda cuando se guarde y despliegue, sin eliminarlo.

### Eliminar

Pulsa **Eliminar** y confirma. Solo se quita del arreglo local. La imagen no se borra y el cambio no llega a GitHub hasta guardar.

### Subir una imagen

1. Selecciona JPG, PNG o WEBP de hasta 3 MB.
2. Revisa la vista previa.
3. Pulsa **Confirmar y subir imagen**.
4. La Function crea un commit de la imagen en `imagenes/uploads/`.
5. La ruta devuelta se escribe en el formulario.
6. Aplica el producto y guarda el catálogo.

Importante: la imagen se sube en un commit independiente. Si cierras el formulario después de subirla, puede quedar una imagen sin usar; esta V1 no la borra automáticamente.

### Guardar

Pulsa **Guardar cambios**. El panel:

1. valida todo el catálogo;
2. compara el SHA cargado con el SHA actual;
3. crea el commit `admin: actualizar catálogo de productos`;
4. muestra el resultado;
5. avisa que Netlify puede tardar algunos segundos.

Si hay conflicto, no sobrescribas: revisa los cambios locales, recarga desde GitHub y vuelve a aplicarlos.

## 12. Comprobar GitHub y Netlify

Después de guardar:

1. En GitHub, abre la rama indicada en `GITHUB_BRANCH`.
2. Revisa el historial de commits.
3. Abre `data/productos.json` y confirma el producto.
4. Si subiste una imagen, comprueba `imagenes/uploads/`.
5. En Netlify, abre **Deploys** y espera el estado publicado.
6. Revisa primero el JSON desplegado y después la tienda pública.

## 13. Recuperación

Si un cambio fue incorrecto:

1. No continúes editando desde otra sesión.
2. Identifica el último commit correcto en GitHub.
3. Usa la opción de revertir el commit o restaura manualmente `data/productos.json` desde esa versión.
4. Conserva el JSON con la raíz `{ "productos": [...] }`.
5. Espera el deploy y comprueba la tienda.

El arreglo `productosRespaldo` sigue en `js/productos-data.js`; si el JSON publicado no puede cargarse, la tienda usa ese respaldo. El respaldo no se actualiza automáticamente desde el panel y solo sirve como contingencia temporal.

## 14. Pruebas

Ejecuta:

```powershell
npm.cmd test
npm.cmd run check
```

Las pruebas usan mocks y nunca escriben en GitHub. Antes de producción realiza además:

- login correcto e incorrecto;
- cierre y vencimiento de sesión;
- crear, editar, eliminar, activar y desactivar;
- búsqueda y filtro;
- carga de una imagen válida y rechazo de una inválida;
- conflicto abriendo dos sesiones;
- tienda, destacados, categorías, buscador, modal, ofertas, carrito, total y WhatsApp;
- vista en teléfono y computador;
- consola del navegador sin errores.

## 15. Seguridad operativa

- No compartas el token ni el hash.
- Usa HTTPS.
- Rota el token y `SESSION_SECRET` periódicamente.
- Al cambiar `SESSION_SECRET` se invalidan todas las sesiones existentes.
- Limita quién puede ver o cambiar variables en Netlify.
- Revisa los commits generados por el panel.
- No uses un token clásico con permisos amplios si GitHub permite un token fine-grained.

## 16. Limitaciones de la V1

- Un solo nivel de administrador y una sola contraseña compartida.
- No hay usuarios individuales, recuperación de contraseña ni segundo factor.
- La sesión es stateless; para cerrar todas las sesiones hay que rotar `SESSION_SECRET`.
- El catálogo completo se guarda en una operación.
- Las imágenes se confirman en un commit independiente y no se limpian automáticamente.
- `stock` indica disponibilidad, no cantidad.
- El respaldo estático no se sincroniza automáticamente.
- La auditoría depende del historial de GitHub.
- La protección frente a intentos masivos de login debe complementarse con las reglas de seguridad o rate limiting disponibles en Netlify.

## 17. Recomendaciones para una V2

1. Identidad por usuario con Netlify Identity, proveedor OIDC o servicio equivalente.
2. Roles y segundo factor.
3. Registro de auditoría por administrador.
4. Cantidades de inventario si la tienda realmente las necesita.
5. Gestor de imágenes con borrado seguro y detección de archivos sin uso.
6. Sincronización automatizada del respaldo o generación durante build.
7. Pruebas end-to-end ejecutadas en CI.
8. Rate limiting persistente para login y operaciones sensibles.
9. Edición por producto si el catálogo crece lo suficiente para no guardar el arreglo completo.
