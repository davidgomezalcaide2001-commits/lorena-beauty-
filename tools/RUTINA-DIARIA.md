# Rutina diaria de Marejada Estudio — una web nueva cada mañana

Objetivo: cada día, antes de que David empiece, tener **1 negocio estudiado + 1 web publicada + 2 vídeos + el mensaje listo para enviar**. David no tiene tiempo de visitar: el vídeo va por WhatsApp/Instagram al negocio.

Repositorio: `davidgomezalcaide2001-commits/lorena-beauty-`, rama `claude/premium-web-skills-i1rxtb`.
Panel de negocios: https://claude.ai/artifact/UDWmxdG8cHpifgGHmNKeqx (colección `negocios`, herramienta ArtifactData).
Vercel: equipo `team_gcROcnVNrRVARNr0Qqd7jtaf`.

## 1. Elegir el negocio (investigación)
1. Lee la colección `negocios` del panel para **no repetir** ninguno ya trabajado.
2. Busca en la web (WebSearch, modo extended) negocios de **Rincón de la Victoria, La Cala del Moral, Torre de Benagalbón, Benagalbón, Totalán o Málaga Este** que:
   - tengan **buena valoración (≥4,5) y bastantes reseñas (≥40)**: ya tienen clientes, les falta escaparate;
   - **no tengan web propia** (solo Facebook, Instagram, Booksy, Tripadvisor o directorios). Compruébalo con una búsqueda del nombre.
3. Prioridad de sector (rotar para no repetir el mismo dos días): peluquería/barbería/estética/uñas → taberna/bar/restaurante/chiringuito → fisioterapia/pilates/yoga → talleres, fontaneros y oficios.
4. Recoge solo **datos reales** con su fuente: nombre exacto, dirección, teléfono, horario, valoración y nº de reseñas, redes, sistema de reservas (Booksy, Fresha, TheFork…). Lo que no se encuentre queda como `[PENDIENTE]` en la web. **Nunca inventes reseñas, cifras, premios ni platos.**

## 2. Estudio profesional (informe corto)
Escribe `informes/AAAA-MM-DD-<slug>.md` con:
- **Ficha**: datos y fuentes.
- **Por qué es buen cliente**: valoración, reseñas, qué le falta online.
- **Idea de marca**: una sola idea sacada de su nombre o de lo que repiten sus reseñas (como "la cancela", "el degradado" o "la pizarra").
- **Dirección de arte**: paleta, tipografías (no repetir la pareja del día anterior) y el único momento wow.
- **Qué venderle**: plan de 50 €/mes (web + ficha de Google), o el de 99 € si encaja con reservas o carta semanal.
- **Mensaje para enviar con el vídeo** (WhatsApp/Instagram, cercano, sin presión y mencionando algo concreto del negocio).

## 3. Construir la web (con todas las skills)
Carga y sigue, en este orden: `demo-web-negocio-local`, `direccion-creativa-awwwards`, `web-design-engineer`, `web-hosteleria-premium` (si es hostelería) o `editorial-service-booking` (si es de cita), `high-end-visual-design`, `web-cinematica-marejada`, `gsap-animaciones`, `copywriting`, `cro`, `schema`, `seo-local-negocio`, `impeccable-craft`.
- Carpeta nueva: `<slug>/index.html` (un solo archivo, como `barberia-cancela/` o `the-cut-shop-622/`). Copia `barberia-cancela/vercel.json` (cabecera noindex).
- Obligatorio: etiqueta "Propuesta de Marejada Estudio", `noindex`, estado abierto/cerrado con hora de Madrid, barra fija en móvil, JSON-LD del tipo correcto, huecos marcados para fotos, precios y reseñas.
- **Reservas** (negocios de cita): copia `shared/reservas.js` a la carpeta y configura `window.MAREJADA_RESERVAS` con su canal: `booksy` si usa Booksy, `whatsapp` si tiene móvil, `telefono` si solo tiene fijo. Pon `data-reservar` en los botones de reserva. Mira cómo está hecho en `the-cut-shop-622/` y `barberia-cancela/`.
- Prueba con Playwright a 390 px y 1440 px. Los CDN de GSAP y Lenis están bloqueados en el sandbox: sírvelos desde `tools/video/node_modules` (instala `gsap@3.12.5 lenis@1.1.13` ahí si hace falta). Sin errores de consola y sin scroll horizontal; revisa las capturas.
- Añade una tarjeta en `index.html` (la portada de la colección).

## 4. Publicar
1. Commit y push a `claude/premium-web-skills-i1rxtb` (con las líneas de autoría habituales).
2. Vercel: `create_deployment` con `gitSource` (org `davidgomezalcaide2001-commits`, repo `lorena-beauty-`, ref la rama, sha del commit), `name` = slug, `target: "production"` y `projectSettings.rootDirectory` = slug, `framework: null`. Si Vercel responde 429 por GitHub, espera unos minutos y reintenta.
3. `update_project` con `ssoProtection: {deploymentType: "preview"}` para que el enlace principal sea público (las versiones de prueba siguen protegidas).
4. Comprueba con `get_deployment` que está READY y anota la URL `https://<slug>.vercel.app`.

**Si la sesión no tiene las herramientas de Vercel** (`mcp__Vercel__*`): haz igualmente el commit y el push, graba el vídeo desde el archivo local y entrega todo a David. Dile en una línea que falta publicar `<slug>` en Vercel y que basta con pedirlo en cualquier sesión que tenga el conector.

## 5. Vídeo de presentación
```bash
node tools/video/grabar-video.js <slug>/index.html <scratchpad>/videos/<slug> "<Nombre del negocio>" ambos
```
Genera `<slug>-movil.mp4` (vertical, para WhatsApp) y `<slug>-escritorio.mp4`. Revisa 3–4 fotogramas con ffmpeg antes de enviarlos.

## 6. Panel y entrega a David
1. Añade el negocio a `negocios` en el panel: `estado: "demo"`, `demo` con la URL, `siguiente: "Enviar vídeo por WhatsApp/Instagram"`, `fecha` = hoy, y en notas el resumen del estudio.
2. Envía a David con SendUserFile los dos vídeos y el informe (`status: "proactive"`).
3. Mensaje final corto: negocio y por qué, enlace a la web, el mensaje listo para copiar y lo que falta confirmar con el negocio.

Si algo falla (Vercel, GitHub, búsqueda), entrega igualmente lo que esté hecho y di exactamente qué falta.
