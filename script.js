/* ==========================================================================
   INVERSO INMOBILIARIO — Interacciones
   ========================================================================== */
(function () {
  'use strict';

  function init() {
  var $ = function (selector, scope) { return (scope || document).querySelector(selector); };
  var $$ = function (selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = $('#header');
  var topbar = $('.topbar');
  var main = $('#contenido');
  var footer = $('.site-footer');
  var burger = $('#burger');
  var menu = $('#mobileMenu');
  var menuClose = $('#menuClose');
  var lastFocus = null;

  /* ===== HEADER AL HACER SCROLL ===== */
  var ticking = false;
  function updateHeader() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
  updateHeader();

  /* ===== MENÚ MÓVIL ===== */
  function setMenu(open, restoreFocus) {
    if (!menu || !burger) return;
    if (open) lastFocus = document.activeElement;

    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('no-scroll', open);

    [header, topbar, main, footer].forEach(function (el) {
      if (el) el.inert = open;
    });

    if (open) {
      window.setTimeout(function () { if (menuClose) menuClose.focus(); }, 60);
    } else if (restoreFocus !== false && lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }

  if (burger && menu) {
    burger.addEventListener('click', function () {
      setMenu(!menu.classList.contains('is-open'), true);
    });
    if (menuClose) menuClose.addEventListener('click', function () { setMenu(false, true); });

    $$('a', menu).forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false, false); });
    });

    document.addEventListener('keydown', function (e) {
      if (!menu.classList.contains('is-open')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setMenu(false, true);
        return;
      }

      if (e.key !== 'Tab') return;
      var focusable = $$('a[href], button:not([disabled])', menu).filter(function (el) {
        return el.offsetWidth > 0 || el.offsetHeight > 0;
      });
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    var desktop = window.matchMedia('(min-width: 1001px)');
    var closeOnDesktop = function (e) {
      if (e.matches && menu.classList.contains('is-open')) setMenu(false, false);
    };
    if (desktop.addEventListener) desktop.addEventListener('change', closeOnDesktop);
    else if (desktop.addListener) desktop.addListener(closeOnDesktop);
  }

  /* ===== REVELADO SUAVE ===== */
  var revealEls = $$('[data-reveal]');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealEls.forEach(function (el) { el.classList.add('will-reveal'); });
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ===== PARALLAX SUAVE =====
     Solo en piezas visuales concretas (hero, comunas, nosotros y el agua
     tipográfica de costo). Se desactiva en tablet/móvil y con movimiento
     reducido para no comprometer legibilidad ni rendimiento. */
  var parallaxEls = $$('[data-parallax]');
  var parallaxMobile = window.matchMedia('(max-width: 980px)');
  var parallaxReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var parallaxTicking = false;

  function parallaxAllowed() {
    return !parallaxMobile.matches && !parallaxReduced.matches;
  }

  function updateParallax() {
    if (!parallaxEls.length) return;

    if (!parallaxAllowed()) {
      parallaxEls.forEach(function (el) { el.style.transform = ''; });
      parallaxTicking = false;
      return;
    }

    var viewport = window.innerHeight;

    parallaxEls.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.bottom < -120 || rect.top > viewport + 120) return;

      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.05;
      var center = rect.top + rect.height / 2 - viewport / 2;
      var offset = Math.max(-28, Math.min(28, -center * speed));

      el.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0)';
    });

    parallaxTicking = false;
  }

  function requestParallax() {
    if (!parallaxTicking) {
      window.requestAnimationFrame(updateParallax);
      parallaxTicking = true;
    }
  }

  if (parallaxEls.length) {
    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', requestParallax);
    window.addEventListener('load', requestParallax);

    [parallaxMobile, parallaxReduced].forEach(function (mq) {
      if (mq.addEventListener) mq.addEventListener('change', requestParallax);
      else if (mq.addListener) mq.addListener(requestParallax);
    });

    requestParallax();
  }

  /* ===== CARRUSELES DE NUEVO VS USADO =====
     Cada tarjeta muestra tres imágenes. La flecha circular avanza al
     siguiente slide y vuelve al primero después del tercero. */
  $$('[data-carousel]').forEach(function (carousel) {
    var slides = $$('[data-carousel-slide]', carousel);
    var next = $('[data-carousel-next]', carousel);
    var counter = $('[data-carousel-count]', carousel);
    var status = $('[data-carousel-status]', carousel);
    if (!slides.length) return;

    var index = 0;

    function pad(number) {
      return number < 10 ? '0' + number : String(number);
    }

    function show(nextIndex, announce) {
      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        var active = slideIndex === index;
        slide.classList.toggle('is-active', active);
        if (active) slide.removeAttribute('aria-hidden');
        else slide.setAttribute('aria-hidden', 'true');
      });

      if (counter) counter.textContent = pad(index + 1) + ' / ' + pad(slides.length);

      if (announce && status) {
        status.textContent = 'Imagen ' + (index + 1) + ' de ' + slides.length +
          ': ' + (slides[index].getAttribute('alt') || '');
      }
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1, true);
      });
    }

    show(0, false);
  });

  /* ===== COMUNAS =====
     La galería reacciona con CSS a :hover y :focus-visible: en escritorio la
     tarjeta activa se expande en ancho y las demás se reajustan. En móvil y
     tablet funciona como carrusel horizontal con scroll-snap, sin tabs ni pines. */

  /* ===== FORMULARIO EN DOS PASOS ===== */
  var form = $('#advisoryForm');
  var steps = $$('.form-step', form);
  var progress = $('#formProgress');
  var stepLabel = $('#formStepLabel');
  var formBar = $('#formBar');
  var nextBtn = $('#nextStep');
  var backBtn = $('#backStep');
  var submitBtn = $('#submitBtn');
  var submitLabel = $('#submitLabel');
  var success = $('#formSuccess');
  var successName = $('#successName');
  var successWa = $('#successWa');
  var resetBtn = $('#resetForm');
  var currentStep = 1;

  function errorOf(name) { return document.getElementById('error-' + name); }

  function setError(name, message) {
    var error = errorOf(name);
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
    var controls = $$('[name="' + name + '"]', form);
    controls.forEach(function (control) { control.setAttribute('aria-invalid', 'true'); });
    var group = error && error.closest('.field--group');
    if (group) group.classList.add('is-invalid');
    return controls[0] || null;
  }

  function clearError(name) {
    var error = errorOf(name);
    if (error) error.hidden = true;
    $$('[name="' + name + '"]', form).forEach(function (control) {
      control.removeAttribute('aria-invalid');
    });
    var group = error && error.closest('.field--group');
    if (group) group.classList.remove('is-invalid');
  }

  var comunaSelect = $('#comuna');
  var comunaOtraField = $('#comunaOtraField');
  var comunaOtraInput = $('#comunaOtra');

  function syncComunaOtra(shouldFocus) {
    if (!comunaSelect || !comunaOtraField || !comunaOtraInput) return;

    var isOther = comunaSelect.value === 'Otra comuna';
    comunaOtraField.hidden = !isOther;

    if (isOther) {
      comunaOtraInput.required = true;
      comunaOtraInput.setAttribute('aria-required', 'true');
      if (shouldFocus) comunaOtraInput.focus({ preventScroll: true });
    } else {
      comunaOtraInput.required = false;
      comunaOtraInput.removeAttribute('aria-required');
      comunaOtraInput.value = '';
      clearError('comunaOtra');
    }
  }

  function validateStep1() {
    var firstInvalid = null;
    var control;

    var momento = $('input[name="momento"]:checked', form);
    if (!momento) {
      control = setError('momento', 'Elige una opción para continuar.');
      if (!firstInvalid) firstInvalid = control;
    } else {
      clearError('momento');
    }

    var comuna = $('#comuna');
    if (!comuna.value) {
      control = setError('comuna', 'Selecciona una comuna.');
      if (!firstInvalid) firstInvalid = control;
    } else {
      clearError('comuna');
    }

    if (comuna.value === 'Otra comuna') {
      var comunaOtra = $('#comunaOtra');
      if (comunaOtra.value.trim().length < 2) {
        control = setError('comunaOtra', 'Escribe el nombre de la comuna.');
        if (!firstInvalid) firstInvalid = control;
      } else {
        clearError('comunaOtra');
      }
    } else {
      clearError('comunaOtra');
    }

    var presupuesto = $('#presupuesto');
    if (!presupuesto.value) {
      control = setError('presupuesto', 'Selecciona un rango de presupuesto.');
      if (!firstInvalid) firstInvalid = control;
    } else {
      clearError('presupuesto');
    }

    var ahorro = $('input[name="ahorro_pie"]:checked', form);
    if (!ahorro) {
      control = setError('ahorro_pie', 'Indica si tienes ahorro para el pie.');
      if (!firstInvalid) firstInvalid = control;
    } else {
      clearError('ahorro_pie');
    }

    var preaprobacion = $('input[name="preaprobacion"]:checked', form);
    if (!preaprobacion) {
      control = setError('preaprobacion', 'Indica si ya tienes preaprobación bancaria.');
      if (!firstInvalid) firstInvalid = control;
    } else {
      clearError('preaprobacion');
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  function validateStep2() {
    var firstInvalid = null;
    var control;

    var nombre = $('#nombre');
    if (nombre.value.trim().length < 2) {
      control = setError('nombre', 'Escribe tu nombre.');
      if (!firstInvalid) firstInvalid = control;
    } else {
      clearError('nombre');
    }

    var whatsapp = $('#whatsapp');
    var digits = whatsapp.value.replace(/\D/g, '');
    if (digits.length < 8) {
      control = setError('whatsapp', 'Escribe un número válido, con código de país.');
      if (!firstInvalid) firstInvalid = control;
    } else {
      clearError('whatsapp');
    }

    var email = $('#email');
    var emailValue = email.value.trim();
    if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      control = setError('email', 'Revisa el formato del email.');
      if (!firstInvalid) firstInvalid = control;
    } else {
      clearError('email');
    }

    var consent = $('#consent');
    if (!consent.checked) {
      control = setError('consent', 'Necesitamos tu autorización para contactarte.');
      if (!firstInvalid) firstInvalid = control;
    } else {
      clearError('consent');
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  function setStep(step, moveFocus) {
    currentStep = step;
    steps.forEach(function (el) {
      var active = Number(el.getAttribute('data-step')) === step;
      el.hidden = !active;
      el.classList.toggle('is-active', active);
    });
    if (stepLabel) stepLabel.textContent = 'Paso ' + step + ' de 2';
    if (formBar) formBar.style.width = step === 1 ? '50%' : '100%';

    if (moveFocus !== false) {
      var target = step === 1 ? $('input[name="momento"]', form) : $('#nombre');
      if (target) target.focus({ preventScroll: true });
    }
  }

  if (form) {
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (validateStep1()) setStep(2);
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', function () { setStep(1); });
    }

    if (comunaSelect) {
      comunaSelect.addEventListener('change', function () {
        syncComunaOtra(comunaSelect.value === 'Otra comuna');
      });
      syncComunaOtra(false);
    }

    form.addEventListener('input', function (e) {
      if (e.target.name) clearError(e.target.name);
    });

    form.addEventListener('change', function (e) {
      if (e.target.name) clearError(e.target.name);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (currentStep === 1) {
        if (validateStep1()) setStep(2);
        return;
      }

      if (!validateStep2()) return;

      var comunaValue = $('#comuna').value;
      var comunaFinal = comunaValue === 'Otra comuna'
        ? $('#comunaOtra').value.trim()
        : comunaValue;

      var data = {
        nombre: $('#nombre').value.trim(),
        whatsapp: $('#whatsapp').value.trim(),
        email: $('#email').value.trim(),
        momento: (form.querySelector('input[name="momento"]:checked') || {}).value || '',
        comuna: comunaFinal,
        presupuesto: $('#presupuesto').value,
        ahorroPie: (form.querySelector('input[name="ahorro_pie"]:checked') || {}).value || '',
        preaprobacion: (form.querySelector('input[name="preaprobacion"]:checked') || {}).value || ''
      };

      if (submitBtn) submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = 'Enviando…';

      /* Demo sin backend: aquí se conecta el endpoint real del CRM o correo. */
      window.setTimeout(function () {
        if (successName) successName.textContent = data.nombre.split(/\s+/)[0] || 'vecino';

        if (successWa) {
          var message = 'Hola, soy ' + data.nombre + '. Busco ' + data.momento.toLowerCase() +
            ' en ' + data.comuna + ', con presupuesto ' + data.presupuesto +
            '. Ahorro para el pie: ' + data.ahorroPie +
            '. Preaprobación bancaria: ' + data.preaprobacion +
            '. Quiero agendar una asesoría.';
          successWa.href = 'https://wa.me/56937386033?text=' + encodeURIComponent(message);
        }

        if (form) form.hidden = true;
        if (progress) progress.hidden = true;
        if (success) {
          success.hidden = false;
          success.focus();
        }

        if (submitBtn) submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Quiero que me asesoren';
      }, 700);
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        form.reset();
        form.hidden = false;
        if (progress) progress.hidden = false;
        if (success) success.hidden = true;
        ['momento', 'comuna', 'comunaOtra', 'presupuesto', 'ahorro_pie', 'preaprobacion', 'nombre', 'whatsapp', 'email', 'consent'].forEach(clearError);
        setStep(1, false);
        syncComunaOtra(false);
        var first = $('input[name="momento"]', form);
        if (first) first.focus({ preventScroll: true });
      });
    }
  }

  /* ===== OCULTAR ACCIONES FLOTANTES EN CONTACTO ===== */
  var contact = $('#contacto');
  var waFloat = $('#waFloat');
  var mobileBar = $('#mobileBar');

  if (contact && 'IntersectionObserver' in window) {
    var floatObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var hide = entry.isIntersecting;
        if (waFloat) waFloat.classList.toggle('is-hidden', hide);
        if (mobileBar) mobileBar.classList.toggle('is-hidden', hide);
      });
    }, { threshold: 0.08 });
    floatObserver.observe(contact);
  }

  /* ===== AÑO ===== */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();
  }

  if (window.partialsReady && typeof window.partialsReady.then === 'function') {
    window.partialsReady.then(init, init);
  } else {
    init();
  }
})();
