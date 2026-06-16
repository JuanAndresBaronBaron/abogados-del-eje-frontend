# Abogados del Eje — Sitio web

Sitio one-page interactivo para la firma Abogados del Eje (Pereira, Risaralda).
Paleta: azul navy · blanco · madera.

## Cómo verlo

No requiere build. Abre `index.html` directamente en el navegador, o sirve la carpeta:

```
npx serve .
```

> Requiere conexión a internet (GSAP, Lenis y las fuentes se cargan por CDN).

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
8. Extras: cursor personalizado, botones magnéticos, marquee infinito, barra de progreso de scroll, grain overlay, menú móvil, `prefers-reduced-motion` respetado

## Datos de contacto usados

- Tel/WhatsApp: 315 372 5973 (`wa.me/573153725973`)
- Dirección: Calle 39 # 7-19, Piso 2, Pereira, Risaralda
