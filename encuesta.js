/* ==========================================================================
   INVERSO INMOBILIARIO — Ficha de búsqueda
   Navegación por pasos, validación, envío AJAX y respaldo por correo.
   ========================================================================== */
(function () {
  'use strict';

  var form = document.getElementById('surveyForm');
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll('.encuesta-step'));
  var guideItems = Array.prototype.slice.call(document.querySelectorAll('[data-guide-step]'));
  var stepLabel = document.getElementById('surveyStepLabel');
  var stepName = document.getElementById('surveyStepName');
  var progressBar = document.getElementById('surveyBar');
  var progressTrack = document.getElementById('surveyProgressBar');
  var progress = document.getElementById('surveyProgress');
  var panel = document.getElementById('fichaPanel');
  var successPanel = document.getElementById('surveySuccess');
  var successName = document.getElementById('surveySuccessName');
  var successWa = document.getElementById('surveySuccessWa');
  var errorBox = document.getElementById('surveyError');
  var mailtoLink = document.getElementById('surveyMailto');
  var retryButton = document.getElementById('surveyRetry');
  var resetButton = document.getElementById('surveyReset');
  var submitButton = document.getElementById('surveySubmit');
  var submitLabel = document.getElementById('surveySubmitLabel');
  var sendingPanel = document.getElementById('surveySending');
  var replyToField = document.getElementById('surveyReplyTo');
  var nextField = document.getElementById('surveyNext');
  var tipoOtroField = document.getElementById('tipoOtroField');
  var tiposOtroInput = document.getElementById('tipo_propiedad_otro');
  var espaciosCualesField = document.getElementById('espaciosCualesField');
  var espaciosCualesInput = document.getElementById('espacios_cuales');
  var precioMin = document.getElementById('precio_min_uf');
  var precioMax = document.getElementById('precio_max_uf');
  var precioMinValor = document.getElementById('precioMinValor');
  var precioMaxValor = document.getElementById('precioMaxValor');
  var precioRangoTexto = document.getElementById('precioRangoTexto');
  var pisoField = document.getElementById('pisoField');
  var pisoInput = document.getElementById('piso');
  var pisoRow = document.getElementById('pisoRow');

  var endpoint = form.getAttribute('data-endpoint') || form.getAttribute('action');
  var sheetEndpoint = form.getAttribute('data-sheet-endpoint') || '';
  var stepNames = ['Tus datos', 'Tu búsqueda', 'La propiedad', 'Preferencias'];
  var currentStep = 1;
  var isSubmitting = false;
  var lastRaw = {};
  var lastData = {};

  var LABELS = {
    nombre: 'Nombre',
    apellido: 'Apellido',
    telefono: 'Teléfono',
    email: 'Email',
    cuando: '¿Para cuándo busca?',
    comuna_sector: 'Comuna y sector',
    tipo_propiedad: 'Tipo de propiedad',
    tipo_propiedad_otro: 'Tipo de propiedad (otro)',
    cocina: 'Tipo de cocina',
    orientacion: 'Orientaciones preferidas',
    precio_min_uf: 'Precio mínimo (UF)',
    precio_max_uf: 'Precio máximo (UF)',
    pie: '¿Cuentas con PIE?',
    preaprobacion: '¿Posees preaprobación bancaria?',
    metros: 'Metros cuadrados',
    dormitorios: 'Dormitorios',
    banos: 'Baños',
    piso: '¿Hasta qué piso busca?',
    estado: 'Propiedad nueva o usada',
    espacios_comunes: 'Espacios comunes',
    espacios_cuales: 'Espacios comunes (cuáles)',
    estacionamiento: 'Estacionamiento',
    bodega: 'Bodega',
    caracteristicas: 'Características adicionales',
    no_aceptaria: 'Característica que no aceptaría',
    consent: 'Autorización de contacto'
  };

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function formatUF(value) {
    var number = Number(value);
    if (!isFinite(number)) number = 0;
    return number.toLocaleString('es-CL') + ' UF';
  }

  function scrollToPanel() {
    if (!panel) return;
    var top = panel.getBoundingClientRect().top + window.pageYOffset - 104;
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion() ? 'auto' : 'smooth' });
  }

  function scrollToElement(element) {
    if (!element) return;
    element.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
  }

  function updateGuide() {
    guideItems.forEach(function (item) {
      var index = Number(item.getAttribute('data-guide-step'));
      var active = index === currentStep;
      item.classList.toggle('is-active', active);
      item.classList.toggle('is-complete', index < currentStep);
      if (active) {
        item.setAttribute('aria-current', 'step');
      } else {
        item.removeAttribute('aria-current');
      }
    });
  }

  function showStep(number, shouldScroll) {
    currentStep = Math.max(1, Math.min(steps.length, number));

    steps.forEach(function (step, index) {
      var active = index + 1 === currentStep;
      step.classList.toggle('is-active', active);
      step.hidden = !active;
    });

    if (stepLabel) stepLabel.textContent = 'Paso ' + currentStep + ' de ' + steps.length;
    if (stepName) stepName.textContent = stepNames[currentStep - 1] || '';

    var percentage = Math.round((currentStep / steps.length) * 100);
    if (progressBar) progressBar.style.width = percentage + '%';
    if (progressTrack) progressTrack.setAttribute('aria-valuenow', String(percentage));

    updateGuide();
    if (shouldScroll) scrollToPanel();
  }

  function controlsWithName(name) {
    if (!name) return [];
    return Array.prototype.filter.call(form.elements, function (element) {
      return element.name === name;
    });
  }

  function errorIdFor(control) {
    var group = control.closest('[data-error-id]');
    if (group) return group.getAttribute('data-error-id');
    return control.id ? 'error-' + control.id : '';
  }

  function showError(control, message) {
    var errorId = errorIdFor(control);
    var error = errorId ? document.getElementById(errorId) : null;
    var group = control.closest('.field--group') || control.closest('.field');

    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
    if (group) group.classList.add('is-invalid');

    controlsWithName(control.name).forEach(function (item) {
      item.setAttribute('aria-invalid', 'true');
    });
  }

  function clearError(control) {
    var errorId = errorIdFor(control);
    var error = errorId ? document.getElementById(errorId) : null;
    var group = control.closest('.field--group') || control.closest('.field');

    if (error) error.hidden = true;
    if (group) group.classList.remove('is-invalid');

    controlsWithName(control.name).forEach(function (item) {
      item.removeAttribute('aria-invalid');
    });
  }

  function clearStepErrors(step) {
    Array.prototype.forEach.call(step.querySelectorAll('input, select, textarea'), function (control) {
      clearError(control);
    });
  }

  function isConditionalHidden(control) {
    var field = control.closest('.field, .field--group');
    return !!field && field.hasAttribute('hidden');
  }

  function checkedValue(name) {
    var field = form.elements[name];
    return field && typeof field.value === 'string' ? field.value : '';
  }

  function focusFirstInvalid(step) {
    var invalid = step.querySelector('[aria-invalid="true"]');
    if (!invalid) return;
    invalid.focus({ preventScroll: true });
    var field = invalid.closest('.field, .field--group');
    scrollToElement(field || invalid);
  }

  function focusStepHeading(step) {
    if (!step) return;
    var heading = step.querySelector('.encuesta-step__head h3');
    if (!heading) return;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  }

  function validateStep(step, shouldFocus) {
    if (!step) return true;

    clearStepErrors(step);

    var required = step.querySelectorAll('[required]');
    var seenRadioGroups = {};
    var seenCheckboxGroups = {};
    var firstInvalid = null;

    Array.prototype.forEach.call(required, function (control) {
      if (control.disabled || isConditionalHidden(control)) return;

      if (control.type === 'radio') {
        if (seenRadioGroups[control.name]) return;
        seenRadioGroups[control.name] = true;

        if (!checkedValue(control.name)) {
          showError(control, control.getAttribute('data-error') || 'Selecciona una opción.');
          firstInvalid = firstInvalid || control;
        } else {
          clearError(control);
        }
        return;
      }

      if (control.type === 'checkbox') {
        var checkboxGroup = controlsWithName(control.name);

        if (checkboxGroup.length > 1) {
          if (seenCheckboxGroups[control.name]) return;
          seenCheckboxGroups[control.name] = true;

          var anyChecked = checkboxGroup.some(function (item) {
            return item.checked && !isConditionalHidden(item);
          });

          if (!anyChecked) {
            showError(control, control.getAttribute('data-error') || 'Marca al menos una opción.');
            firstInvalid = firstInvalid || control;
          } else {
            clearError(control);
          }
          return;
        }

        if (!control.checked) {
          showError(control, control.getAttribute('data-error') || 'Marca esta opción.');
          firstInvalid = firstInvalid || control;
        } else {
          clearError(control);
        }
        return;
      }

      var value = control.value.trim();
      var valid = true;
      var message = control.getAttribute('data-error') || 'Completa este campo.';

      if (!value) {
        valid = false;
      } else if (control.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        valid = false;
        message = 'Escribe un email válido.';
      } else if (control.type === 'tel' && value.replace(/\D/g, '').length < 8) {
        valid = false;
        message = 'Escribe un teléfono válido.';
      } else if (control.type === 'number') {
        var number = Number(value);
        if (!isFinite(number) || number <= 0) {
          valid = false;
          message = 'Indica un número válido.';
        } else if (control.min && number < Number(control.min)) {
          valid = false;
          message = 'Indica un valor de al menos ' + control.min + '.';
        } else if (control.max && number > Number(control.max)) {
          valid = false;
          message = 'Indica un valor de hasta ' + control.max + '.';
        }
      }

      if (!valid) {
        showError(control, message);
        firstInvalid = firstInvalid || control;
      } else {
        clearError(control);
      }
    });

    if (precioMin && precioMax && step.contains(precioMin)) {
      var minPrice = Number(precioMin.value);
      var maxPrice = Number(precioMax.value);
      if (!isFinite(minPrice) || !isFinite(maxPrice) ||
          minPrice < Number(precioMin.min) || maxPrice > Number(precioMax.max) ||
          minPrice > maxPrice) {
        showError(precioMin, 'Define un rango de precio válido.');
        firstInvalid = firstInvalid || precioMin;
      }
    }

    if (firstInvalid) {
      if (shouldFocus) {
        firstInvalid.focus({ preventScroll: true });
        scrollToElement(firstInvalid.closest('.field, .field--group') || firstInvalid);
      }
      return false;
    }

    return true;
  }

  function validateAll() {
    for (var index = 0; index < steps.length; index += 1) {
      if (!validateStep(steps[index], false)) {
        showStep(index + 1, false);
        focusFirstInvalid(steps[index]);
        return false;
      }
    }
    return true;
  }

  function toggleTipoOtro() {
    if (!tipoOtroField || !tiposOtroInput) return;
    var show = checkedValue('tipo_propiedad') === 'Otro';
    tipoOtroField.hidden = !show;
    tiposOtroInput.required = show;

    if (!show) {
      tiposOtroInput.value = '';
      clearError(tiposOtroInput);
    }
  }

  function toggleEspaciosCuales() {
    if (!espaciosCualesField || !espaciosCualesInput) return;
    var show = checkedValue('espacios_comunes') === 'Sí';
    espaciosCualesField.hidden = !show;
    espaciosCualesInput.required = show;

    if (!show) {
      espaciosCualesInput.value = '';
      clearError(espaciosCualesInput);
    }
  }

  function togglePisoField() {
    if (!pisoField || !pisoInput) return;

    var tipo = checkedValue('tipo_propiedad');
    var show = tipo === 'Departamento' || tipo === 'Indiferente';

    pisoField.hidden = !show;
    pisoInput.required = show;
    if (pisoRow) pisoRow.classList.toggle('form-row--single', !show);

    if (!show) {
      pisoInput.value = '';
      clearError(pisoInput);
    }
  }

  function updatePriceRange(changed) {
    if (!precioMin || !precioMax) return;

    var min = Number(precioMin.value);
    var max = Number(precioMax.value);

    if (!isFinite(min)) min = Number(precioMin.min) || 2000;
    if (!isFinite(max)) max = Number(precioMax.max) || 15000;

    if (min > max) {
      if (changed === 'min') {
        max = min;
        precioMax.value = String(max);
      } else {
        min = max;
        precioMin.value = String(min);
      }
    }

    precioMin.setAttribute('aria-valuetext', formatUF(min));
    precioMax.setAttribute('aria-valuetext', formatUF(max));
    if (precioMinValor) precioMinValor.textContent = formatUF(min);
    if (precioMaxValor) precioMaxValor.textContent = formatUF(max);
    if (precioRangoTexto) precioRangoTexto.textContent = formatUF(min) + ' – ' + formatUF(max);
  }

  function collectData() {
    var formData = new FormData(form);
    var raw = {};

    Object.keys(LABELS).forEach(function (key) {
      if (key === 'orientacion') {
        var orientations = formData.getAll(key).map(function (value) {
          return String(value).trim();
        }).filter(Boolean);
        if (orientations.length) raw[key] = orientations.join(', ');
        return;
      }

      var value = formData.get(key);
      if (value !== null) raw[key] = String(value).trim();
    });

    if (tipoOtroField && tipoOtroField.hidden) raw.tipo_propiedad_otro = '';
    if (espaciosCualesField && espaciosCualesField.hidden) raw.espacios_cuales = '';
    if (pisoField && pisoField.hidden) raw.piso = '';

    var labeled = {};
    Object.keys(LABELS).forEach(function (key) {
      if (key === 'precio_min_uf') return;
      if (key === 'precio_max_uf') {
        if (raw.precio_min_uf && raw.precio_max_uf) {
          labeled['Rango de precio (UF)'] = formatUF(raw.precio_min_uf) + ' – ' + formatUF(raw.precio_max_uf);
        }
        return;
      }
      if (raw[key]) labeled[LABELS[key]] = raw[key];
    });

    return { raw: raw, labeled: labeled };
  }

  function buildPayload(raw, labeled) {
    var payload = {};
    Object.keys(labeled).forEach(function (label) {
      payload[label] = labeled[label];
    });

    payload._subject = 'Nueva ficha de búsqueda: ' + (raw.nombre || '') + ' ' + (raw.apellido || '');
    payload._template = 'table';
    payload._captcha = 'false';
    payload._replyto = raw.email || '';
    payload._honey = '';

    return payload;
  }

  function getDeviceLabel() {
    var width = window.innerWidth || document.documentElement.clientWidth || 0;
    if (width <= 760) return 'Móvil';
    if (width <= 1024) return 'Tablet';
    return 'Escritorio';
  }

  function formatSheetPhone(value) {
    var phone = String(value || '').trim();
    if (!phone) return '';
    return "'" + phone.replace(/^'+/, '');
  }

  function buildSheetPayload(raw, labeled) {
    var honey = document.getElementById('surveyHoney');

    return {
      'Nombre': raw.nombre || '',
      'Apellido': raw.apellido || '',
      'Telefono': formatSheetPhone(raw.telefono),
      'Email': raw.email || '',
      '¿Para cuando busca?': raw.cuando || '',
      'Comuna y sector': raw.comuna_sector || '',
      'Tipo Propiedad': raw.tipo_propiedad || '',
      'Tipo Propiedad Otro': raw.tipo_propiedad_otro || '',
      'Tipo Cocina': raw.cocina || '',
      'Orientacion': raw.orientacion || '',
      'Rango de precio (UF)': labeled['Rango de precio (UF)'] || '',
      '¿Cuenta con pie?': raw.pie || '',
      '¿Posees preaprobación bancaria?': raw.preaprobacion || '',
      'Metros Cuadrados': raw.metros || '',
      'Dormitorios': raw.dormitorios || '',
      'Baños': raw.banos || '',
      'Preferencia de piso': raw.piso || '',
      'Propiedad nueva o usada': raw.estado || '',
      'Espacios comunes': raw.espacios_comunes || '',
      'Espacios comunes Cuáles': raw.espacios_cuales || '',
      'Estacionamiento': raw.estacionamiento || '',
      'Bodega': raw.bodega || '',
      'Caracterísitcas adicionales': raw.caracteristicas || '',
      'Características que no aceptaría': raw.no_aceptaria || '',
      'Autorización de contacto': raw.consent || '',
      'Dispositivo': getDeviceLabel(),
      '_honey': honey ? honey.value : ''
    };
  }

  function sendToSheet(raw, labeled) {
    if (!sheetEndpoint) return Promise.resolve();

    return fetch(sheetEndpoint, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(buildSheetPayload(raw, labeled))
    }).then(function (response) {
      return response.json().catch(function () {
        return null;
      }).then(function (json) {
        if (!response.ok) {
          throw new Error((json && json.message) || 'Error ' + response.status);
        }
        if (!json || json.success !== true) {
          throw new Error((json && json.message) || 'No se pudo registrar en Google Sheets.');
        }
      });
    });
  }

  function buildMailto(raw, labeled) {
    var name = ((raw.nombre || '') + ' ' + (raw.apellido || '')).trim();
    var subject = 'Ficha de búsqueda' + (name ? ' - ' + name : '');
    var lines = Object.keys(labeled).map(function (label) {
      return label + ': ' + labeled[label];
    });

    return 'mailto:contacto@inversoinmobiliario.cl?subject=' +
      encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
  }

  function buildWhatsAppMessage(raw) {
    if (!raw || !raw.nombre) {
      return 'Hola, acabo de enviar mi ficha de búsqueda y quiero conversar sobre mi búsqueda.';
    }

    var parts = ['Hola, soy ' + raw.nombre + (raw.apellido ? ' ' + raw.apellido : '') + '.'];
    if (raw.comuna_sector) parts.push('Acabo de enviar mi ficha de búsqueda para ' + raw.comuna_sector + '.');
    if (raw.tipo_propiedad) {
      var tipo = raw.tipo_propiedad === 'Otro'
        ? (raw.tipo_propiedad_otro || 'otro')
        : raw.tipo_propiedad;
      parts.push('Busco ' + tipo.toLowerCase() + '.');
    }
    if (raw.cuando) parts.push('Plazo: ' + raw.cuando + '.');
    if (raw.precio_min_uf && raw.precio_max_uf) {
      parts.push('Presupuesto: ' + formatUF(raw.precio_min_uf) + ' a ' + formatUF(raw.precio_max_uf) + '.');
    }
    return parts.join(' ');
  }

  function showSuccess(raw) {
    setBusyVisual(false);
    if (progress) progress.hidden = true;
    if (errorBox) errorBox.hidden = true;
    if (form) form.hidden = true;
    if (successPanel) successPanel.hidden = false;
    if (successName) successName.textContent = raw && raw.nombre ? ', ' + raw.nombre : '';
    if (successWa) {
      successWa.href = 'https://wa.me/56937386033?text=' + encodeURIComponent(buildWhatsAppMessage(raw || {}));
    }

    if (successPanel) {
      successPanel.focus({ preventScroll: true });
      scrollToElement(successPanel);
    }
  }

  function showSubmitError() {
    setBusyVisual(false);
    if (!errorBox) return;
    errorBox.hidden = false;
    if (mailtoLink) mailtoLink.href = buildMailto(lastRaw, lastData);
    scrollToElement(errorBox);
  }

  function setBusyVisual(value) {
    if (sendingPanel) sendingPanel.hidden = !value;
    document.body.classList.toggle('encuesta-submitting', value);
  }

  function setSubmitting(value) {
    isSubmitting = value;
    if (submitButton) submitButton.disabled = value;
    if (form) {
      form.setAttribute('aria-busy', value ? 'true' : 'false');
      if ('inert' in form) form.inert = value;
    }
    if (submitLabel) submitLabel.textContent = value ? 'Enviando…' : 'Enviar mi ficha';
    setBusyVisual(value);
  }

  function attemptSubmit() {
    if (isSubmitting) return;
    if (!validateAll()) return;

    var collected = collectData();
    lastRaw = collected.raw;
    lastData = collected.labeled;

    if (replyToField) replyToField.value = lastRaw.email || '';
    if (errorBox) errorBox.hidden = true;
    setSubmitting(true);

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(buildPayload(lastRaw, lastData))
    })
      .then(function (response) {
        return response.json().catch(function () {
          return null;
        }).then(function (json) {
          if (!response.ok) {
            throw new Error((json && json.message) || 'Error ' + response.status);
          }
          if (!json) {
            throw new Error('El servicio de envío no devolvió una respuesta válida.');
          }
          if (json.success === false || json.success === 'false') {
            throw new Error(json.message || 'No se pudo enviar la ficha.');
          }
        });
      })
      .then(function () {
        return sendToSheet(lastRaw, lastData).catch(function (sheetError) {
          console.error('[encuesta] No se pudo registrar en Google Sheets:', sheetError);
        });
      })
      .then(function () {
        showSuccess(lastRaw);
      })
      .catch(function (error) {
        console.error('[encuesta] No se pudo enviar la ficha:', error);
        showSubmitError();
      })
      .then(function () {
        setSubmitting(false);
      });
  }

  function resetSurvey() {
    form.reset();
    setBusyVisual(false);
    if ('inert' in form) form.inert = false;
    lastRaw = {};
    lastData = {};
    if (replyToField) replyToField.value = '';
    if (form) form.hidden = false;
    if (progress) progress.hidden = false;
    if (successPanel) successPanel.hidden = true;
    if (errorBox) errorBox.hidden = true;
    if (successName) successName.textContent = '';

    Array.prototype.forEach.call(form.querySelectorAll('input, select, textarea'), function (control) {
      clearError(control);
    });

    toggleTipoOtro();
    togglePisoField();
    toggleEspaciosCuales();
    updatePriceRange();
    showStep(1, true);

    var first = document.getElementById('nombre');
    if (first) first.focus({ preventScroll: true });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    attemptSubmit();
  });

  form.addEventListener('click', function (event) {
    var next = event.target.closest('[data-next]');
    var back = event.target.closest('[data-back]');

    if (next) {
      var activeStep = steps[currentStep - 1];
      if (validateStep(activeStep, true)) {
        showStep(currentStep + 1, true);
        focusStepHeading(steps[currentStep - 1]);
      }
      return;
    }

    if (back) {
      showStep(currentStep - 1, true);
      focusStepHeading(steps[currentStep - 1]);
    }
  });

  form.addEventListener('input', function (event) {
    var control = event.target;
    if (!control || !control.name) return;
    clearError(control);
    if (control.id === 'email' && replyToField) replyToField.value = control.value.trim();
  });

  form.addEventListener('change', function (event) {
    var control = event.target;
    if (!control || !control.name) return;

    clearError(control);

    if (control.name === 'tipo_propiedad') {
      toggleTipoOtro();
      togglePisoField();
    }
    if (control.name === 'orientacion') {
      var orientationInputs = controlsWithName('orientacion');
      if (control.value === 'Indiferente' && control.checked) {
        orientationInputs.forEach(function (item) {
          if (item !== control) item.checked = false;
        });
      } else if (control.checked) {
        orientationInputs.forEach(function (item) {
          if (item.value === 'Indiferente') item.checked = false;
        });
      }
    }
    if (control.name === 'espacios_comunes') toggleEspaciosCuales();
  });

  form.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'BUTTON') return;

    var step = event.target.closest('.encuesta-step');
    if (!step) return;

    var stepNumber = Number(step.getAttribute('data-step'));
    if (stepNumber < steps.length) {
      event.preventDefault();
      var next = step.querySelector('[data-next]');
      if (next) next.click();
    }
  });

  if (retryButton) retryButton.addEventListener('click', attemptSubmit);
  if (resetButton) resetButton.addEventListener('click', resetSurvey);

  if (precioMin) {
    precioMin.addEventListener('input', function () {
      updatePriceRange('min');
    });
  }
  if (precioMax) {
    precioMax.addEventListener('input', function () {
      updatePriceRange('max');
    });
  }

  if (nextField) {
    var nextUrl = window.location.origin + window.location.pathname + '?enviado=1';
    if (window.location.protocol !== 'file:') nextField.value = nextUrl;
  }

  toggleTipoOtro();
  togglePisoField();
  toggleEspaciosCuales();
  updatePriceRange();
  showStep(1, false);

  var params = new URLSearchParams(window.location.search);
  if (params.get('enviado') === '1') {
    showSuccess({});
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + '#ficha');
    }
  }
})();
