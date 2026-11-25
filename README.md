# Inverso Inmobiliario

Sitio web estático de Inverso Inmobiliario, con páginas de propiedades, información legal y una ficha de búsqueda conectada a correo y Google Sheets.

## Páginas principales

- `index.html`: página de inicio → `/`
- `nunoa.html`: página de Ñuñoa → `/nunoa`
- `legal.html`: política de privacidad y condiciones → `/legal`
- `encuesta.html`: ficha de búsqueda de propiedad → `/encuesta`

## Estructura

- `assets/`: imágenes y logos.
- `partials/`: header y footer compartidos.
- `.htaccess`: URLs limpias, HTTPS y bloqueo de `.git`.
- `robots.txt` y `sitemap.xml`: configuración para buscadores.
- `styles.css`: estilos generales del sitio.
- `encuesta.css`: estilos de la ficha.
- `script.js`: interacciones generales.
- `encuesta.js`: validación y envío de la ficha.
- `partials.js`: carga de header y footer.

## Ejecutar localmente

Las URLs limpias necesitan un servidor con `mod_rewrite` y el archivo `.htaccess`, como Apache (XAMPP, WAMP o el propio Hostgator).

Un servidor estático simple, como `python -m http.server` o Live Server, no aplica `.htaccess`; en ese caso hay que abrir directamente `index.html`, `nunoa.html`, `encuesta.html` o `legal.html`, y los enlaces limpios pueden dar 404.

Para probar el sitio con URLs limpias en local, usa Apache apuntando la carpeta del proyecto como document root.

## URLs limpias

El sitio usa URLs sin `.html`:

- `/`
- `/nunoa`
- `/encuesta`
- `/legal`

El archivo `.htaccess` redirige las URLs antiguas con `.html` a su versión limpia y sirve internamente los archivos `.html` correspondientes. También incluye la redirección a HTTPS y el bloqueo de la carpeta `.git`.

Las rutas de imágenes, estilos, scripts y parciales son absolutas desde la raíz (`/assets`, `/partials`, `/styles.css`). El sitio debe publicarse en la raíz de `web.inversoinmobiliario.cl`; si se mueve a una subcarpeta, hay que ajustar esas rutas.

Para SEO se incluyen:

- `sitemap.xml`
- `robots.txt`
- Etiquetas `canonical` y `og:url` con las URLs limpias.

## Formulario

La ficha envía los datos a:

- FormSubmit, para recibir el correo con la ficha.
- Un Web App de Google Apps Script, para agregar la fila al final de la hoja `prospectos`.

Los endpoints están configurados en `encuesta.html` y `encuesta.js`.

## Ramas de trabajo

- `main`: rama de **producción**. Es la que se publica en Hostgator. Solo debe recibir cambios revisados desde `dev`.
- `dev`: rama de **desarrollo**. Aquí se suben las modificaciones y pruebas antes de pasar a producción.

### Trabajar en desarrollo

```powershell
git switch dev
# hacer cambios...
git add .
git commit -m "Descripción del cambio"
git push origin dev
```

### Pasar cambios a producción

En GitHub, abre un Pull Request desde `dev` hacia `main`. Revisa los cambios y mergea el Pull Request.

También se puede hacer localmente:

```powershell
git switch main
git pull origin main
git merge --no-ff dev
git push origin main
git switch dev
git merge main
```

Nunca trabajes directamente sobre `main`.

## Publicación

El sitio se publica en Hostgator desde la rama `main`, en la carpeta raíz del dominio:

```text
https://web.inversoinmobiliario.cl/
```

Hostgator usa Apache, por lo que el archivo `.htaccess` permite las URLs limpias, la redirección a HTTPS y el bloqueo de `.git`.

GitHub Pages no aplica reglas de `.htaccess`, así que las URLs limpias no funcionan allí. La publicación oficial es Hostgator.
