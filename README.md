# Abogados del Eje — Sitio web

Sitio one-page interactivo para la firma Abogados del Eje (Pereira, Risaralda).
Paleta: azul navy · blanco · madera.

## Cómo verlo

No requiere build. Abre `index.html` directamente en el navegador, o sirve la carpeta:

```
npx serve .
# o bien
python3 -m http.server 8000
```

> GSAP y Lenis están en `vendor/` (servidos desde el propio dominio). Solo las fuentes se cargan desde Google Fonts.
> Usa `npx serve .` (no abras el archivo directo): las rutas de scripts y estilos son absolutas.

## Stack

- HTML + CSS + JavaScript vanilla
- [GSAP 3](https://gsap.com) + ScrollTrigger — animaciones scroll-driven, secciones pinned
- [Lenis](https://lenis.darkroom.engineering) — smooth scrolling
- Canvas 2D — partículas del hero y dibujo de la balanza ligado al scroll

## Secciones / efectos

1. **Preloader** — letras animadas + barra de progreso
2. **Hero** — constelación de partículas en canvas (reacciona al mouse), titular con reveal palabra a palabra, salida con parallax
3. **Manifesto** — sección pinned; las palabras se "encienden" con el scroll
4. **Áreas de práctica** — scroll horizontal pinned con las 7 áreas
5. **La Balanza** — scrollytelling: canvas que dibuja una balanza de la justicia a medida que se hace scroll, con 3 mensajes por etapas
6. **La Firma** — columna sticky + tarjetas de valores + contadores animados
7. **Contacto** — tarjetas de llamada, WhatsApp y mapa
8. **Cobertura** — mapa SVG de Colombia (Natural Earth, dominio público): presencial en Risaralda, Caldas y Quindío; virtual en el resto del país
9. **Preguntas frecuentes** — acordeón animado
10. **Temas** — oscuro, intermedio y claro (`html[data-theme]`), guardado en `localStorage`, con transición circular
11. **Páginas de servicio** — una carpeta por servicio (`/abogado-laboral-pereira/`, etc.) con su propio SEO y datos estructurados
12. Extras: cursor personalizado, botones magnéticos, marquee infinito, barra de progreso de scroll, grain overlay, menú móvil, `prefers-reduced-motion` respetado

## Archivos compartidos

- `styles.css` — estilos de todas las páginas (tokens por tema en `:root`, `[data-theme="mid"]`, `[data-theme="light"]`). Se publica sin minificar para que sea fácil de editar.
- `site.js` — comportamiento común sin dependencias: temas, menú móvil (modal con foco atrapado y fondo `inert`), acordeón FAQ, fade-ins, barra de contacto móvil y año del footer.
- `app.js` — solo portada: preloader, Lenis (solo escritorio), GSAP/ScrollTrigger. En móviles (≤ 900 px) no hay secciones "pinned": el manifiesto se ilumina al entrar, las áreas son un carrusel nativo y la balanza se dibuja una vez.
- `_headers` — caché y seguridad en Cloudflare Pages (HSTS, `X-Frame-Options`, `Permissions-Policy`, Early Hints con `Link: rel=preload/preconnect`). No hay CSP de scripts porque el script de tema y el JSON-LD van en línea.

### Clases disponibles para las páginas

| Clase | Uso |
| --- | --- |
| `.skip-link` | Primer elemento del `<body>`: `<a class="skip-link" href="#contenido">Saltar al contenido</a>`, con `<main id="contenido" tabindex="-1">`. |
| `.mobile-cta` | Barra fija WhatsApp / Llamar en móviles. La crea `site.js`; el texto de WhatsApp sale de `<body data-wa="…">` (URL completa o solo el mensaje) o del primer enlace `wa.me` de la página. `<body data-no-mobile-cta>` la desactiva. Se oculta arriba del todo y mientras se ven `#contacto` o `.cta-band`. |
| `.footer-h`, `.footer-title` | Títulos de columna del footer sin usar `<h4>` (p. ej. `<p class="footer-h">Servicios</p>`). |
| `.footer-inner-4` | Footer de 4 columnas (marca + 3). |
| `.footer-cta`, `.footer-social`, `.footer-legal`, `.footer-hours` | Botón bajo la marca, icono redondo de red social (44 px), fila legal (privacidad) y horario. |
| `.svc-more` | Enlace "Ver más →" dentro de una `.svc-card`. Las tarjetas de `.svc-grid` se numeran solas (01, 02…). |
| `.prose` | Texto largo (política de privacidad, 404): `h2`, `h3`, listas y enlaces. |
| `.areas-hint` | Pista "Desliza para ver las 7 áreas →" (la inserta `app.js`). |

### Accesibilidad

- Foco visible en todos los temas (`:focus-visible`, contorno de 2 px en `--accent`).
- Contrastes AA: `--wood-grad` no baja de `#B07A44` (texto navy encima ≥ 4.7:1), `.cta-band` y la tarjeta destacada usan `--cta-grad`, `--text-mute` y `--inv-accent` subieron, y en el tema claro `--accent` es `#7F5226`.
- `prefers-reduced-motion`: sin preloader, sin pins, todos los pasos de la balanza visibles.
- Sin GSAP (`html.no-gsap`) o si `app.js` falla, un fail-safe en CSS retira el preloader a los 6 s.
- Estilos de impresión (`@media print`).

## Datos de contacto usados

- Tel/WhatsApp: +57 315 372 5973 (`wa.me/573153725973`)
- Dirección: Carrera 17A # 83-09, barrio La Villa, Pereira, Risaralda
