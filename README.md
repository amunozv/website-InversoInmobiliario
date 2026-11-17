# Inverso Inmobiliario

Sitio web estático de Inverso Inmobiliario, con páginas de propiedades, información legal y una ficha de búsqueda conectada a correo y Google Sheets.

## Páginas principales

- `index.html`: página de inicio.
- `nunoa.html`: página de Ñuñoa.
- `legal.html`: política de privacidad y condiciones.
- `encuesta.html`: ficha de búsqueda de propiedad.

## Estructura

- `assets/`: imágenes y logos.
- `partials/`: header y footer compartidos.
- `styles.css`: estilos generales del sitio.
- `encuesta.css`: estilos de la ficha.
- `script.js`: interacciones generales.
- `encuesta.js`: validación y envío de la ficha.
- `partials.js`: carga de header y footer.

## Ejecutar localmente

Abre una terminal en esta carpeta y ejecuta:

```powershell
python -m http.server 4173
```

Luego abre `http://localhost:4173/`.

También puedes usar cualquier servidor estático, por ejemplo la extensión Live Server de VS Code.

## Formulario

La ficha envía los datos a:

- FormSubmit, para recibir el correo con la ficha.
- Un Web App de Google Apps Script, para agregar la fila al final de la hoja `prospectos`.

Los endpoints están configurados en `encuesta.html` y `encuesta.js`.

## Publicación

El proyecto está preparado para publicarse con GitHub Pages desde la rama `main` y la carpeta raíz del repositorio.

La URL quedará con el formato:

```text
https://TU-USUARIO.github.io/NOMBRE-REPO/
```
