/*!
 * Reservas Marejada — módulo de citas para webs de servicios (peluquerías, barberías, estética…)
 * Uso:
 *   <script>window.MAREJADA_RESERVAS = { ...config }</script>
 *   <script src="reservas.js" defer></script>
 *   Cualquier elemento con [data-reservar] abre el panel (opcional data-servicio="id").
 *
 * Canales (config.canal):
 *   "whatsapp" → envía la solicitud por WhatsApp al número del negocio (config.whatsapp, formato 34XXXXXXXXX).
 *   "booksy"   → tras elegir, abre la ficha de Booksy del negocio (config.booksy). Si el negocio da su
 *                código de widget (Booksy Biz → Ajustes → Reserva online → Integración web), pégalo en config.booksyWidget.
 *   "cal"      → calendario real con confirmación automática: config.cal = "usuario/evento" de Cal.eu.
 *   "telefono" → muestra el resumen y el botón de llamar (negocios sin móvil ni sistema de citas).
 * Siempre es una SOLICITUD salvo en "cal"/"booksy": el negocio confirma la hora.
 */
(function () {
  'use strict';
  var C = window.MAREJADA_RESERVAS;
  if (!C) return;
  var D = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var M = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st = { servicio: null, dia: null, hora: null, nombre: '', tel: '' };

  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function hm(min) { return Math.floor(min / 60) + ':' + pad(min % 60); }
  function madrid() { return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' })); }

  /* ---------- estilos (heredan los colores de la web vía variables) ---------- */
  var css = '' +
    '.mr-ov{position:fixed;inset:0;z-index:200;background:rgba(10,10,10,.55);display:flex;justify-content:flex-end;opacity:0;transition:opacity .3s}' +
    '.mr-ov[hidden]{display:none!important}.mr-ov.on{opacity:1}' +
    '.mr-p{width:min(480px,100%);height:100%;overflow:auto;background:var(--mr-bg);color:var(--mr-fg);font-family:var(--mr-font,inherit);padding:24px;padding-top:calc(24px + env(safe-area-inset-top,0px));padding-bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(24px);transition:transform .45s cubic-bezier(.16,1,.3,1);box-shadow:-20px 0 60px rgba(0,0,0,.25)}' +
    '.mr-ov.on .mr-p{transform:none}' +
    '.mr-h{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:6px}' +
    '.mr-h b{font:var(--mr-title,700 22px/1.1 inherit)}' +
    '.mr-x{width:44px;height:44px;border-radius:50%;border:1px solid var(--mr-line);background:none;color:inherit;cursor:pointer;font-size:20px;line-height:1}' +
    '.mr-sub{color:var(--mr-muted);font-size:14px;margin:0 0 20px}' +
    '.mr-steps{display:flex;gap:6px;margin-bottom:22px}.mr-steps i{flex:1;height:3px;border-radius:3px;background:var(--mr-line)}.mr-steps i.on{background:var(--mr-accent)}' +
    '.mr-l{font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--mr-muted);margin:0 0 10px}' +
    '.mr-g{display:grid;gap:8px;margin-bottom:22px}.mr-g.c2{grid-template-columns:1fr 1fr}.mr-g.c4{grid-template-columns:repeat(4,1fr)}' +
    '.mr-o{border:1px solid var(--mr-line);background:var(--mr-card);color:inherit;border-radius:var(--mr-r,12px);padding:13px 14px;text-align:left;cursor:pointer;font:inherit;transition:border-color .2s,background .2s}' +
    '.mr-o:hover{border-color:var(--mr-accent)}.mr-o small{display:block;color:var(--mr-muted);font-size:12px;margin-top:2px}' +
    '.mr-o[aria-pressed="true"]{background:var(--mr-accent);border-color:var(--mr-accent);color:var(--mr-on-accent)}.mr-o[aria-pressed="true"] small{color:inherit;opacity:.8}' +
    '.mr-o:disabled{opacity:.35;cursor:not-allowed;text-decoration:line-through}' +
    '.mr-o.day{text-align:center;padding:10px 4px}.mr-o.day b{display:block;font-size:20px}' +
    '.mr-o.t{text-align:center;padding:11px 4px;font-variant-numeric:tabular-nums}' +
    '.mr-f{display:grid;gap:6px;margin-bottom:14px}.mr-f label{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--mr-muted)}' +
    '.mr-f input{width:100%;border:1px solid var(--mr-line);background:var(--mr-card);color:inherit;border-radius:var(--mr-r,12px);padding:13px 14px;font:inherit}' +
    '.mr-sum{border:1px solid var(--mr-line);border-radius:var(--mr-r,12px);padding:4px 16px;margin:4px 0 18px;background:var(--mr-card)}' +
    '.mr-sum div{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--mr-line);font-size:15px}.mr-sum div:last-child{border:0}.mr-sum span{color:var(--mr-muted)}' +
    '.mr-b{display:flex;width:100%;align-items:center;justify-content:center;gap:10px;min-height:54px;border:0;border-radius:99px;background:var(--mr-accent);color:var(--mr-on-accent);font:600 16px/1 inherit;cursor:pointer;text-decoration:none;margin-top:6px}' +
    '.mr-b.sec{background:none;border:1px solid var(--mr-line);color:inherit}' +
    '.mr-b:disabled{opacity:.4;cursor:not-allowed}' +
    '.mr-row{display:flex;gap:8px}.mr-row .mr-b{flex:1}' +
    '.mr-note{font-size:13px;color:var(--mr-muted);margin-top:14px}.mr-err{color:#c0392b;font-size:14px;min-height:1.2em}' +
    '.mr-ok{text-align:center;padding:20px 0}.mr-ok b{display:block;font:var(--mr-title,700 24px/1.15 inherit);margin:14px 0 8px}' +
    '.mr-ok .ic{width:64px;height:64px;border-radius:50%;margin:0 auto;display:grid;place-items:center;background:var(--mr-accent);color:var(--mr-on-accent);font-size:28px}' +
    '.mr-cal{min-height:520px;border-radius:var(--mr-r,12px);overflow:hidden;border:1px solid var(--mr-line)}' +
    '@media (prefers-reduced-motion:reduce){.mr-ov,.mr-p{transition:none}}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  /* ---------- panel ---------- */
  var ov = document.createElement('div');
  ov.className = 'mr-ov'; ov.hidden = true;
  ov.innerHTML = '<div class="mr-p" role="dialog" aria-modal="true" aria-labelledby="mr-t"><div class="mr-h"><b id="mr-t">Reservar cita</b><button class="mr-x" type="button" aria-label="Cerrar">×</button></div><p class="mr-sub">' + esc(C.negocio) + '</p><div class="mr-steps" aria-hidden="true"><i></i><i></i><i></i></div><div class="mr-body"></div></div>';
  document.body.appendChild(ov);
  var body = ov.querySelector('.mr-body'), steps = ov.querySelectorAll('.mr-steps i'), lastFocus = null;

  function open(servicioId) {
    lastFocus = document.activeElement;
    if (servicioId) st.servicio = (C.servicios || []).find(function (s) { return s.id === servicioId; }) || null;
    ov.hidden = false; requestAnimationFrame(function () { ov.classList.add('on'); });
    document.documentElement.style.overflow = 'hidden';
    st.servicio ? paso2() : paso1();
    setTimeout(function () { var f = ov.querySelector('.mr-o,.mr-b,input'); f && f.focus(); }, reduce ? 0 : 200);
  }
  function close() {
    ov.classList.remove('on'); document.documentElement.style.overflow = '';
    setTimeout(function () { ov.hidden = true; }, reduce ? 0 : 300);
    lastFocus && lastFocus.focus && lastFocus.focus();
  }
  ov.querySelector('.mr-x').addEventListener('click', close);
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && !ov.hidden) close(); });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-reservar]'); if (!t) return;
    e.preventDefault(); open(t.getAttribute('data-servicio'));
  });
  function prog(n) { for (var i = 0; i < steps.length; i++) steps[i].classList.toggle('on', i < n); }

  /* ---------- paso 1: servicio ---------- */
  function paso1() {
    prog(1);
    body.innerHTML = '<p class="mr-l">¿Qué te hacemos?</p><div class="mr-g">' + (C.servicios || []).map(function (s) {
      return '<button class="mr-o" type="button" data-s="' + esc(s.id) + '" aria-pressed="' + (st.servicio && st.servicio.id === s.id) + '">' + esc(s.nombre) + (s.info ? '<small>' + esc(s.info) + '</small>' : '') + '</button>';
    }).join('') + '</div>';
    body.querySelectorAll('[data-s]').forEach(function (b) {
      b.addEventListener('click', function () { st.servicio = C.servicios.find(function (s) { return s.id === b.getAttribute('data-s'); }); paso2(); });
    });
  }

  /* ---------- paso 2: día y hora (o calendario real) ---------- */
  function dias() {
    var out = [], d = madrid(); d.setHours(0, 0, 0, 0);
    for (var i = 0; out.length < (C.diasVista || 8) && i < 30; i++) {
      var x = new Date(d); x.setDate(d.getDate() + i);
      if ((C.horario[x.getDay()] || []).length) out.push(x);
    }
    return out;
  }
  function horas(dia) {
    var tramos = C.horario[dia.getDay()] || [], dur = (st.servicio && st.servicio.min) || C.intervalo || 30, paso = C.intervalo || 30, res = [];
    var ahora = madrid(), hoy = dia.toDateString() === ahora.toDateString(), mAhora = ahora.getHours() * 60 + ahora.getMinutes() + 30;
    tramos.forEach(function (t) { for (var m = t[0]; m + dur <= t[1]; m += paso) if (!hoy || m > mAhora) res.push(m); });
    return res;
  }
  function paso2() {
    prog(2);
    if (C.canal === 'cal' && C.cal) return calendario();
    var ds = dias();
    if (!st.dia || !ds.some(function (d) { return d.toDateString() === st.dia.toDateString(); })) st.dia = ds[0] || null;
    var hs = st.dia ? horas(st.dia) : [];
    body.innerHTML = '<p class="mr-l">' + esc(st.servicio ? st.servicio.nombre : '') + ' · elige día</p><div class="mr-g c4">' + ds.map(function (d, i) {
      return '<button class="mr-o day" type="button" data-d="' + i + '" aria-pressed="' + (st.dia && d.toDateString() === st.dia.toDateString()) + '"><small>' + D[d.getDay()].slice(0, 3) + '</small><b>' + d.getDate() + '</b><small>' + M[d.getMonth()] + '</small></button>';
    }).join('') + '</div><p class="mr-l">Hora</p>' + (hs.length ? '<div class="mr-g c4">' + hs.map(function (m) {
      return '<button class="mr-o t" type="button" data-h="' + m + '" aria-pressed="' + (st.hora === m) + '">' + hm(m) + '</button>';
    }).join('') + '</div>' : '<p class="mr-note">Ese día ya no quedan horas. Prueba otro.</p>') +
      '<div class="mr-row"><button class="mr-b sec" type="button" data-back>Atrás</button><button class="mr-b" type="button" data-next ' + (st.hora == null || hs.indexOf(st.hora) < 0 ? 'disabled' : '') + '>Continuar</button></div>' +
      '<p class="mr-note">Horas según el horario del local. ' + (C.canal === 'booksy' ? 'La disponibilidad real la confirmas en Booksy.' : 'El local te confirma la cita.') + '</p>';
    body.querySelectorAll('[data-d]').forEach(function (b) { b.addEventListener('click', function () { st.dia = ds[+b.getAttribute('data-d')]; st.hora = null; paso2(); }); });
    body.querySelectorAll('[data-h]').forEach(function (b) { b.addEventListener('click', function () { st.hora = +b.getAttribute('data-h'); paso2(); }); });
    body.querySelector('[data-back]').addEventListener('click', paso1);
    var nx = body.querySelector('[data-next]'); nx && nx.addEventListener('click', paso3);
  }

  /* ---------- Cal.eu: calendario real con confirmación ---------- */
  function calendario() {
    body.innerHTML = '<div class="mr-cal" id="mr-cal"></div><button class="mr-b sec" type="button" data-back>Atrás</button>';
    body.querySelector('[data-back]').addEventListener('click', paso1);
    var link = C.cal + (st.servicio && st.servicio.cal ? '' : '');
    if (st.servicio && st.servicio.cal) link = st.servicio.cal;
    (function (C2, A, L) { var p = function (a, ar) { a.q.push(ar); }; var d = C2.document; C2.Cal = C2.Cal || function () { var cal = C2.Cal; var ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; } if (ar[0] === L) { var api = function () { p(api, arguments); }; var n = ar[1]; api.q = api.q || []; if (typeof n === 'string') { cal.ns[n] = cal.ns[n] || api; p(cal.ns[n], ar); p(cal, ['initNamespace', n]); } else p(cal, ar); return; } p(cal, ar); }; })(window, (C.calOrigin || 'https://app.cal.eu') + '/embed/embed.js', 'init');
    window.Cal('init', { origin: C.calOrigin || 'https://app.cal.eu' });
    window.Cal('inline', { elementOrSelector: '#mr-cal', calLink: link, layout: 'column_view' });
  }

  /* ---------- paso 3: datos y envío ---------- */
  function texto() {
    return 'Hola, quiero pedir cita en ' + C.negocio + ':\n' +
      '• Servicio: ' + st.servicio.nombre + '\n' +
      '• Día: ' + D[st.dia.getDay()] + ' ' + st.dia.getDate() + ' de ' + M[st.dia.getMonth()] + '\n' +
      '• Hora: ' + hm(st.hora) + '\n' +
      '• Nombre: ' + st.nombre + (st.tel ? '\n• Teléfono: ' + st.tel : '') + '\n(Enviado desde la web)';
  }
  function paso3() {
    prog(3);
    var cta = C.canal === 'whatsapp' ? 'Enviar por WhatsApp' : C.canal === 'booksy' ? 'Confirmar en Booksy' : 'Ver cómo confirmarla';
    body.innerHTML = '<div class="mr-sum"><div><span>Servicio</span><b>' + esc(st.servicio.nombre) + '</b></div><div><span>Día</span><b>' + D[st.dia.getDay()] + ' ' + st.dia.getDate() + ' ' + M[st.dia.getMonth()] + '</b></div><div><span>Hora</span><b>' + hm(st.hora) + '</b></div></div>' +
      '<div class="mr-f"><label for="mr-n">Tu nombre</label><input id="mr-n" autocomplete="given-name" value="' + esc(st.nombre) + '"></div>' +
      '<div class="mr-f"><label for="mr-tel">Teléfono (opcional)</label><input id="mr-tel" type="tel" inputmode="tel" autocomplete="tel" value="' + esc(st.tel) + '"></div>' +
      '<p class="mr-err" role="alert"></p>' +
      '<div class="mr-row"><button class="mr-b sec" type="button" data-back>Atrás</button><button class="mr-b" type="button" data-send>' + cta + '</button></div>' +
      '<p class="mr-note">' + (C.aviso || 'Es una solicitud: el local te confirma la hora por el mismo canal.') + '</p>';
    body.querySelector('[data-back]').addEventListener('click', paso2);
    body.querySelector('[data-send]').addEventListener('click', function () {
      st.nombre = body.querySelector('#mr-n').value.trim(); st.tel = body.querySelector('#mr-tel').value.trim();
      if (!st.nombre) { body.querySelector('.mr-err').textContent = 'Dinos tu nombre para la cita.'; body.querySelector('#mr-n').focus(); return; }
      enviar();
    });
  }
  function enviar() {
    if (C.canal === 'whatsapp' && C.whatsapp) window.open('https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(texto()), '_blank', 'noopener');
    if (C.canal === 'booksy' && C.booksy) window.open(C.booksy, '_blank', 'noopener');
    var copiado = 'Copia este mensaje o díselo al llamar:';
    body.innerHTML = '<div class="mr-ok"><div class="ic" aria-hidden="true">✓</div><b>' +
      (C.canal === 'whatsapp' ? '¡Solicitud lista!' : C.canal === 'booksy' ? 'Termina en Booksy' : 'Llámanos para cerrarla') + '</b><p class="mr-sub" style="margin:0 auto;max-width:34ch">' +
      (C.canal === 'whatsapp' ? 'Se ha abierto WhatsApp con tu mensaje. Pulsa enviar y te confirmamos la hora.' :
        C.canal === 'booksy' ? 'Hemos abierto Booksy: elige allí ' + esc(st.servicio.nombre.toLowerCase()) + ' el ' + D[st.dia.getDay()] + ' a las ' + hm(st.hora) + ' y queda confirmada al momento.' :
          'Llama al ' + esc(C.telefonoTxt || '') + ' y te la apuntamos.') + '</p></div>' +
      (C.canal !== 'booksy' ? '<p class="mr-l">' + (C.canal === 'whatsapp' ? '¿No se abrió WhatsApp?' : copiado) + '</p><div class="mr-sum" style="white-space:pre-line;padding:14px 16px;font-size:14px" id="mr-txt">' + esc(texto()) + '</div>' : '') +
      (C.telefono ? '<a class="mr-b' + (C.canal === 'telefono' ? '' : ' sec') + '" href="tel:' + esc(C.telefono) + '">Llamar al ' + esc(C.telefonoTxt || C.telefono) + '</a>' : '') +
      (C.canal === 'whatsapp' && C.whatsapp ? '<a class="mr-b" href="https://wa.me/' + esc(C.whatsapp) + '?text=' + encodeURIComponent(texto()) + '" target="_blank" rel="noopener">Abrir WhatsApp</a>' : '') +
      (C.canal === 'booksy' && C.booksy ? '<a class="mr-b" href="' + esc(C.booksy) + '" target="_blank" rel="noopener">Abrir Booksy</a>' : '') +
      '<button class="mr-b sec" type="button" data-close>Cerrar</button>';
    body.querySelector('[data-close]').addEventListener('click', function () { st.hora = null; close(); });
  }
})();
