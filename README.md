# Abogados del Eje — Sitio web

Sitio one-page interactivo para la firma Abogados del Eje (Pereira, Risaralda).
Paleta: azul navy · blanco · madera.

## Cómo verlo

No requiere build. Abre `index.html` directamente en el navegador, o sirve la carpeta:

```
npx serve .
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

## Datos de contacto usados

- Tel/WhatsApp: +57 315 372 5973 (`wa.me/573153725973`)
- Dirección: Carrera 17A # 83-09, barrio La Villa, Pereira, Risaralda
