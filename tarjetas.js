(() => {
  const carrusel = document.querySelector("[data-carrusel]");
  if (!carrusel) return;

  const pista = carrusel.querySelector(".carrusel__pista");
  if (!pista) return;

  const slides = [...pista.querySelectorAll(":scope > .slide")]; // solo las tarjetas directas de la pista
  if (!slides.length) return;

  slides.forEach((slide) => {
    // Cuenta las fotos de cada tarjeta; el CSS elige el acomodo según este número
    slide.dataset.fotos = slide.querySelectorAll("img").length;

    // Botón opcional: solo aparece en las tarjetas que tienen data-enlace en el HTML
    const url = slide.dataset.enlace;
    if (url) {
      const boton = document.createElement("a");
      boton.className = "slide__boton";
      boton.href = url;
      boton.target = "_blank";
      boton.rel = "noopener";
      boton.textContent = slide.dataset.enlaceTexto || "Ingresar";
      const textoContenedor = slide.querySelector(".slide__texto");
      if (textoContenedor) textoContenedor.appendChild(boton);
    }
  });

  const contenedorPuntos = carrusel.querySelector(".carrusel__puntos");
  const prev = carrusel.querySelector("[data-prev]");
  const next = carrusel.querySelector("[data-next]");
  const enlaces = [...document.querySelectorAll(".lineup__lista a")];
  const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  // Un punto por tarjeta
  const puntos = contenedorPuntos
    ? slides.map((slide, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "punto";
        b.setAttribute("aria-label", "Ir a " + (slide.dataset.titulo || `tarjeta ${i + 1}`));
        b.addEventListener("click", () => ir(i));
        contenedorPuntos.appendChild(b);
        return b;
      })
    : [];

  function getIndiceActual() {
    if (!pista.clientWidth) return 0;
    const idx = Math.round(pista.scrollLeft / pista.clientWidth);
    return Math.max(0, Math.min(slides.length - 1, idx));
  }

  function ir(i) {
    if (!slides.length) return;
    const idx = Math.max(0, Math.min(slides.length - 1, Number(i) || 0));
    const destino = slides[idx];
    if (!destino) return;
    pista.scrollTo({ left: destino.offsetLeft, behavior });
  }

  function actualizar() {
    const i = getIndiceActual();
    const slideActual = slides[i];

    puntos.forEach((p, n) => {
      p.classList.toggle("activo", n === i);
      if (n === i) p.setAttribute("aria-current", "true");
      else p.removeAttribute("aria-current");
    });

    enlaces.forEach((a) => {
      if (slideActual && a.getAttribute("href") === "#" + slideActual.id) {
        a.setAttribute("aria-current", "true");
      } else {
        a.removeAttribute("aria-current");
      }
    });

    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i === slides.length - 1;
  }

  // Se actualiza al deslizar con el dedo, el trackpad, las flechas o los puntos
  let pendiente = false;
  pista.addEventListener("scroll", () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      actualizar();
      pendiente = false;
    });
  });

  window.addEventListener("resize", () => {
    ir(getIndiceActual());
    actualizar();
  });

  if (prev) prev.addEventListener("click", () => ir(getIndiceActual() - 1));
  if (next) next.addEventListener("click", () => ir(getIndiceActual() + 1));

  // Cada palabra del line-up lleva a su tarjeta
  enlaces.forEach((a) => {
    a.addEventListener("click", (e) => {
      const i = slides.findIndex((s) => "#" + s.id === a.getAttribute("href"));
      if (i === -1) return;
      e.preventDefault();
      ir(i);
      carrusel.scrollIntoView({ behavior, block: "nearest" });
    });
  });

  actualizar();
})();