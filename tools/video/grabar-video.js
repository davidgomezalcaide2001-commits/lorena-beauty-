#!/usr/bin/env node
/*
 * Graba un vídeo de presentación de una web de Marejada Estudio.
 *   node tools/video/grabar-video.js <ruta-o-url> <salida-sin-extension> "<Nombre del negocio>" [movil|escritorio|ambos]
 * Genera <salida>-movil.mp4 (vertical, para WhatsApp/Instagram) y/o <salida>-escritorio.mp4.
 * Estructura: portada (2,5 s) → web con su animación de entrada → recorrido con scroll suave →
 * panel de reservas si existe → cierre con "Web por Marejada Estudio" (3 s).
 * En el sandbox los CDN de GSAP/Lenis están bloqueados: se sirven desde tools/video/node_modules.
 */
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');

const [src, out, negocio = 'Tu negocio', modo = 'ambos'] = process.argv.slice(2);
if (!src || !out) { console.error('Uso: grabar-video.js <ruta-o-url> <salida> "<Negocio>" [movil|escritorio|ambos]'); process.exit(1); }
const HERE = __dirname, NM = path.join(HERE, 'node_modules');
if (!fs.existsSync(path.join(NM, 'gsap'))) execFileSync('npm', ['install', '--no-audit', '--no-fund', '--prefix', HERE, 'gsap@3.12.5', 'lenis@1.1.13'], { stdio: 'inherit' });
const LIBS = { 'gsap.min.js': 'gsap/dist/gsap.min.js', 'ScrollTrigger.min.js': 'gsap/dist/ScrollTrigger.min.js', 'lenis.min.js': 'lenis/dist/lenis.min.js' };
const url = /^https?:/.test(src) ? src : 'file://' + path.resolve(src);

const card = (titulo, sub, w, h) => 'data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=Geist:wght@400;500&display=swap" rel="stylesheet">
<style>html,body{margin:0;height:100%;background:#0f1312;color:#ece6da;font-family:Geist,system-ui,sans-serif}
.c{height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 ${w > 700 ? 120 : 34}px;gap:18px;animation:in 1s cubic-bezier(.16,1,.3,1) both}
.k{font-size:${w > 700 ? 14 : 12}px;letter-spacing:.24em;text-transform:uppercase;color:#d9b37a}
h1{margin:0;font:300 ${w > 700 ? 92 : 50}px/1 Fraunces,serif;letter-spacing:-.03em}
h1 em{color:#d9b37a}
p{margin:0;color:rgba(236,230,218,.65);font-size:${w > 700 ? 20 : 16}px}
.w{position:absolute;left:${w > 700 ? 120 : 34}px;bottom:${w > 700 ? 60 : 48}px;display:flex;align-items:center;gap:10px;font-size:13px;color:rgba(236,230,218,.5)}
.w svg{display:block}
@keyframes in{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}</style></head>
<body><div class="c"><span class="k">${sub}</span><h1>${titulo}</h1></div>
<div class="w"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d9b37a" stroke-width="2" stroke-linecap="round"><path d="M2 14c3-4 5-4 8 0s5 4 8 0 3-3 4-2"/></svg>Marejada Estudio · Rincón de la Victoria</div></body></html>`);

async function grabar(tipo) {
  const movil = tipo === 'movil';
  // Móvil: 360×640 a densidad 3 = vídeo vertical 1080×1920 (9:16, pantalla completa en cualquier teléfono)
  const vw = movil ? 360 : 1440, vh = movil ? 640 : 900, dsf = movil ? 3 : 1;
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'mrj-'));
  const browser = await chromium.launch();
  // El grabador de Playwright no respeta la densidad de píxeles (deja la web en una esquina):
  // en móvil se graba con el screencast de Chrome, que entrega los fotogramas a resolución real.
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dsf, isMobile: movil, hasTouch: movil,
    ...(movil ? {} : { recordVideo: { dir: tmp, size: { width: vw, height: vh } } }) });
  await ctx.route('**/*', r => {
    const u = r.request().url(); const k = Object.keys(LIBS).find(k => u.endsWith(k));
    if (k) return r.fulfill({ path: path.join(NM, LIBS[k]), contentType: 'application/javascript' });
    return r.continue();
  });
  const page = await ctx.newPage();
  const frames = []; let cdp = null;
  if (movil) {
    cdp = await ctx.newCDPSession(page);
    cdp.on('Page.screencastFrame', f => {
      const file = path.join(tmp, 'f' + String(frames.length).padStart(6, '0') + '.jpg');
      fs.writeFileSync(file, Buffer.from(f.data, 'base64')); frames.push({ file, t: f.metadata.timestamp });
      cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: vw * dsf, maxHeight: vh * dsf, everyNthFrame: 1 });
  }
  const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  // 1. portada
  await page.goto(card(`Una web para<br><em>${esc(negocio)}</em>`, 'Propuesta', vw, vh)); await page.waitForTimeout(2600);
  // 2. la web con su entrada
  await page.goto(url, { waitUntil: 'load' }).catch(() => {});
  await page.waitForTimeout(4200);
  // 3. scroll suave por toda la página
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const dur = Math.min(movil ? 24000 : 20000, Math.max(12000, H * (movil ? 2.2 : 2.4)));
  if (movil) {
    await page.evaluate(async ({ H, dur }) => {
      const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const t0 = performance.now();
      await new Promise(res => { const step = () => { const t = Math.min(1, (performance.now() - t0) / dur); scrollTo(0, H * ease(t)); t < 1 ? requestAnimationFrame(step) : res(); }; step(); });
    }, { H, dur });
  } else {
    await page.mouse.move(vw / 2, vh / 2);
    const t0 = Date.now(); let done = 0;
    while (done < H + 300 && Date.now() - t0 < dur + 8000) { const px = (H + 300) / (dur / 50); await page.mouse.wheel(0, px); done += px; await page.waitForTimeout(50); }
  }
  await page.waitForTimeout(1200);
  // 4. panel de reservas (si la web lo tiene)
  const res = await page.$('[data-reservar]');
  if (res) {
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelector('[data-reservar]').click()); await page.waitForTimeout(1300);
    const o = await page.$('.mr-o'); if (o) { await o.click(); await page.waitForTimeout(1100); }
    const t = await page.$$('.mr-o.t'); if (t[2]) { await t[2].click(); await page.waitForTimeout(1400); }
  }
  // 5. cierre
  await page.goto(card(`${esc(negocio)}<br><em>ya online.</em>`, 'Web + ficha de Google · desde 50 €/mes', vw, vh)); await page.waitForTimeout(3200);
  const mp4 = `${out}-${movil ? 'movil' : 'escritorio'}.mp4`;
  if (movil) {
    await cdp.send('Page.stopScreencast').catch(() => {}); await ctx.close(); await browser.close();
    // cada fotograma dura hasta el siguiente (Chrome solo manda fotogramas cuando algo cambia)
    const lines = [];
    frames.forEach((f, i) => { const d = i < frames.length - 1 ? Math.max(0.001, frames[i + 1].t - f.t) : 0.5; lines.push(`file '${f.file}'`, `duration ${d.toFixed(4)}`); });
    lines.push(`file '${frames[frames.length - 1].file}'`);
    const list = path.join(tmp, 'list.txt'); fs.writeFileSync(list, lines.join('\n'));
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', `fps=30,scale=${vw * dsf}:${vh * dsf}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-movflags', '+faststart', mp4]);
  } else {
    const v = page.video(); await ctx.close(); await browser.close();
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', await v.path(), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', '30', mp4]);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('vídeo:', mp4, (fs.statSync(mp4).size / 1048576).toFixed(1) + ' MB');
}

(async () => {
  if (modo !== 'escritorio') await grabar('movil');
  if (modo !== 'movil') await grabar('escritorio');
})();
