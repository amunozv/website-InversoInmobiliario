/* ==========================================================================
   INVERSO INMOBILIARIO — Carga de header y footer compartidos
   Uso:
   <div data-include="partials/header.html"></div>
   <div data-include="partials/footer.html"></div>
   ========================================================================== */
(function () {
  'use strict';

  var placeholders = Array.prototype.slice.call(document.querySelectorAll('[data-include]'));

  function scrollToHash() {
    if (!window.location.hash) return;

    var id = window.location.hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch (error) {
      /* Si el hash no está codificado correctamente, se usa tal cual. */
    }

    var target = document.getElementById(id);
    if (!target) return;

    var html = document.documentElement;
    var previousBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    target.scrollIntoView({ block: 'start' });
    html.style.scrollBehavior = previousBehavior;
  }

  if (!placeholders.length) {
    window.partialsReady = Promise.resolve().then(scrollToHash);
    return;
  }

  function rewriteRelativeUrls(root, base) {
    if (!base) return;

    root.querySelectorAll('[href], [src]').forEach(function (element) {
      ['href', 'src'].forEach(function (attribute) {
        var value = element.getAttribute(attribute);
        if (!value) return;
        if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(value)) return;
        element.setAttribute(attribute, base + value);
      });
    });
  }

  function loadInclude(placeholder) {
    var source = placeholder.getAttribute('data-include');
    var base = placeholder.getAttribute('data-base') || '';

    return fetch(source, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('No se pudo cargar ' + source + ' (' + response.status + ')');
        }
        return response.text();
      })
      .then(function (html) {
        var template = document.createElement('template');
        template.innerHTML = html.trim();

        rewriteRelativeUrls(template.content, base);
        placeholder.parentNode.replaceChild(template.content, placeholder);
      })
      .catch(function (error) {
        console.error('[partials] ' + error.message);
        placeholder.setAttribute('data-include-error', 'true');
      });
  }

  window.partialsReady = Promise.all(placeholders.map(loadInclude)).then(function () {
    document.dispatchEvent(new CustomEvent('partials:ready'));
    scrollToHash();
  });
})();
