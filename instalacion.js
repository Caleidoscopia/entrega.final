(() => {
  const cont = document.querySelector("[data-videos]");
  if (!cont) return;

  const pista = cont.querySelector(".videos__pista");
  const slides = [...pista.querySelectorAll(":scope > .video")];
  const contenedorPuntos = cont.querySelector(".carrusel__puntos");
  const prev = cont.querySelector("[data-prev]");
  const next = cont.querySelector("[data-next]");
  const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  let actual = 0;

  // Escala del video central y mínima de los laterales
  const ESCALA_MAX = 1.08;
  const ESCALA_MIN = 0.8;

  // Posición de scroll que deja al video centrado
  const centrar = (slide) => slide.offsetLeft + slide.offsetWidth / 2 - pista.clientWidth / 2;

  // Un punto por video
  const puntos = slides.map((slide, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "punto";
    b.setAttribute("aria-label", "Ir al " + slide.dataset.titulo.toLowerCase());
    b.addEventListener("click", () => ir(i));
    contenedorPuntos.appendChild(b);
    return b;
  });

  function ir(i, suave = true) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    pista.scrollTo({ left: centrar(slides[i]), behavior: suave ? behavior : "auto" });
  }

  // El video activo es el que quedó más cerca del centro
  function masCercano() {
    const centro = pista.scrollLeft + pista.clientWidth / 2;
    let mejor = 0, distancia = Infinity;
    slides.forEach((s, n) => {
      const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - centro);
      if (d < distancia) { distancia = d; mejor = n; }
    });
    return mejor;
  }

  // Cuanto más cerca del centro está un video, más grande se ve
  function escalar() {
    const gap = parseFloat(getComputedStyle(pista).columnGap) || 0;
    const centroPista = pista.getBoundingClientRect().left + pista.clientWidth / 2;

    slides.forEach((s) => {
      const r = s.getBoundingClientRect();
      const distancia = Math.abs(r.left + r.width / 2 - centroPista);
      // t va de 0 (centrado) a 1 (a un paso o más del centro)
      const t = Math.min(1, distancia / (s.offsetWidth + gap));
      const escala = ESCALA_MAX - (ESCALA_MAX - ESCALA_MIN) * t;
      s.style.transform = `scale(${escala.toFixed(3)})`;
    });
  }

  function actualizar() {
    actual = masCercano();
    puntos.forEach((p, n) => {
      p.classList.toggle("activo", n === actual);
      if (n === actual) p.setAttribute("aria-current", "true"); else p.removeAttribute("aria-current");
    });
    prev.disabled = actual === 0;
    next.disabled = actual === slides.length - 1;

    // Si te vas a otro video, el anterior se pausa
    slides.forEach((s, n) => {
      const v = s.querySelector("video");
      if (v && n !== actual && !v.paused) v.pause();
    });

    escalar();
  }

  // Reproducir / pausar
  slides.forEach((slide, n) => {
    const video = slide.querySelector("video");
    const boton = slide.querySelector(".video__play");
    if (!video || !boton) return;

    boton.addEventListener("click", () => {
      if (n === actual) video.play().catch(() => {});
    });

    video.addEventListener("play", () => {
      slide.classList.add("reproduciendo");
      video.controls = true;
    });
    const detenido = () => {
      slide.classList.remove("reproduciendo");
      video.controls = false;
    };
    video.addEventListener("pause", detenido);
    video.addEventListener("ended", detenido);

    // Tocar un video que asoma a los costados lo trae al centro
    slide.addEventListener("click", () => { if (n !== actual) ir(n); });
  });

  let pendiente = false;
  pista.addEventListener("scroll", () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { actualizar(); pendiente = false; });
  });
  window.addEventListener("resize", () => { ir(actual, false); actualizar(); });

  prev.addEventListener("click", () => ir(actual - 1));
  next.addEventListener("click", () => ir(actual + 1));

  actualizar();
})();