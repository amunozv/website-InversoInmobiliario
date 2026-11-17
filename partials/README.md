# Header y footer compartidos

El sitio carga el header y el footer desde archivos separados para reutilizarlos en nuevas páginas.

## Archivos

- `partials/header.html`: barra superior, header principal, menú móvil y sprite de iconos.
- `partials/footer.html`: footer principal, botón flotante de WhatsApp y barra móvil.
- `partials.js`: carga los archivos anteriores dentro de los contenedores `data-include`.

## Página nueva en la raíz

Copia esta estructura base y coloca el contenido dentro de `<main id="contenido">`:

```html
<!DOCTYPE html>
<html lang="es-CL">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Nueva página | Inverso Inmobiliario</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div data-include="partials/header.html"></div>

  <main id="contenido">
    <!-- Contenido de la página -->
  </main>

  <div data-include="partials/footer.html"></div>

  <script src="partials.js"></script>
  <script src="script.js"></script>
</body>
</html>
```

`script.js` es necesario para el menú móvil, el header con scroll y el año del footer.

## Página dentro de una subcarpeta

Si la página está en una carpeta como `pages/nueva.html`, ajusta las rutas y agrega `data-base`:

```html
<div data-include="../partials/header.html" data-base="../"></div>
...
<div data-include="../partials/footer.html" data-base="../"></div>
<script src="../partials.js"></script>
<script src="../script.js"></script>
```

`data-base` reescribe automáticamente los enlaces e imágenes relativas de los partials.

## Páginas legales

La página legal usa los mismos partials. Su contenido va dentro de `<main class="legal-main container" id="contenido">` y también debe incluir `script.js` para el menú móvil y el año del footer:

```html
<div data-include="partials/header.html"></div>
<main class="legal-main container" id="contenido">...</main>
<div data-include="partials/footer.html"></div>
<script src="partials.js"></script>
<script src="script.js"></script>
```

## Enlaces

Los enlaces de los partials apuntan a `index.html#seccion` y `legal.html#seccion`, por lo que funcionan desde cualquier página del sitio. Si cambias el nombre de una sección o de una página, actualiza esas rutas en los partials.

## Importante

Los partials se cargan por HTTP mediante `fetch`. Para verlos correctamente, abre el sitio desde el servidor local, no directamente como archivo `file://`.
