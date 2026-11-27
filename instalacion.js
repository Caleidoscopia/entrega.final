(() => {
  const cont = document.querySelector("[data-videos]");
  if (!cont) return;

  const pista = cont.querySelector(".videos__pista");
  const slides = [...pista.querySelectorAll(":scope > .video")];
  if (!slides.length) return;

  const contenedorPuntos = cont.querySelector(".carrusel__puntos");
  const prev = cont.querySelector("[data-prev]");
  const next = cont.querySelector("[data-next]");
  const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  let actual = 0;

  // Escala del elemento central y mínima de los laterales
  const ESCALA_MAX = 1.08;
  const ESCALA_MIN = 0.8;

  // Numeración accesible automática ("1 de 10", "2 de 10"...): no hace falta escribirla en el HTML
  slides.forEach((s, i) => s.setAttribute("aria-label", `${i + 1} de ${slides.length}`));

  // Posición de scroll que deja al elemento centrado
  const centrar = (slide) => slide.offsetLeft + slide.offsetWidth / 2 - pista.clientWidth / 2;

  // Un punto por elemento (foto o video)
  const puntos = slides.map((slide, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "punto";
    b.setAttribute("aria-label", "Ir a " + (slide.dataset.titulo || `elemento ${i + 1}`).toLowerCase());
    b.addEventListener("click", () => ir(i));
    contenedorPuntos.appendChild(b);
    return b;
  });

  function ir(i, suave = true) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    pista.scrollTo({ left: centrar(slides[i]), behavior: suave ? behavior : "auto" });
  }

  // El elemento activo es el que quedó más cerca del centro
  function masCercano() {
    const centro = pista.scrollLeft + pista.clientWidth / 2;
    let mejor = 0, distancia = Infinity;
    slides.forEach((s, n) => {
      const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - centro);
      if (d < distancia) { distancia = d; mejor = n; }
    });
    return mejor;
  }

  // Cuanto más cerca del centro está un elemento, más grande se ve
  function escalar() {
    const gap = parseFloat(getComputedStyle(pista).columnGap) || 0;
    const centroPista = pista.getBoundingClientRect().left + pista.clientWidth / 2;

    slides.forEach((s) => {
      const r = s.getBoundingClientRect();
      const distancia = Math.abs(r.left + r.width / 2 - centroPista);
      const t = Math.min(1, distancia / (s.offsetWidth + gap));
      const escala = ESCALA_MAX - (ESCALA_MAX - ESCALA_MIN) * t;
      s.style.transform = `scale(${escala.toFixed(3)})`;
    });
  }

  // El primer y el último elemento también tienen que poder quedar centrados.
  // Como cada uno tiene su propio ancho, el espacio lateral se calcula con el ancho real.
  function calcularEspacios() {
    const gap = parseFloat(getComputedStyle(pista).columnGap) || 0;
    const primero = slides[0];
    const ultimo = slides[slides.length - 1];
    const inicio = Math.max(0, (pista.clientWidth - primero.offsetWidth) / 2 - gap);
    const fin = Math.max(0, (pista.clientWidth - ultimo.offsetWidth) / 2 - gap);
    pista.style.setProperty("--espacio-inicio", inicio + "px");
    pista.style.setProperty("--espacio-fin", fin + "px");
  }

  function reubicar() {
    calcularEspacios();
    ir(actual, false);
    actualizar();
  }

  // Cada marco toma la proporción real de su foto o video: sin barras negras y sin recortes
  function ajustarProporcion(slide, ancho, alto) {
    if (!ancho || !alto) return;
    slide.style.setProperty("--ratio", (ancho / alto).toFixed(4));
    reubicar();
  }

  // Devuelve un video a su estado inicial: sin controles del navegador y con el botón de play grande
  function detener(slide) {
    slide.classList.remove("reproduciendo");
    const v = slide.querySelector("video");
    if (v) v.controls = false;
  }

  function actualizar() {
    actual = masCercano();
    puntos.forEach((p, n) => {
      p.classList.toggle("activo", n === actual);
      if (n === actual) p.setAttribute("aria-current", "true"); else p.removeAttribute("aria-current");
    });
    prev.disabled = actual === 0;
    next.disabled = actual === slides.length - 1;

    // Si te vas a otro elemento, el video anterior se pausa y vuelve a su estado inicial
    // (las fotos no tienen video: se ignoran)
    slides.forEach((s, n) => {
      if (n === actual) return;
      const v = s.querySelector("video");
      if (v && !v.paused) v.pause();
      if (s.classList.contains("reproduciendo")) detener(s);
    });

    escalar();
  }

  slides.forEach((slide, n) => {
    // Tocar un elemento que asoma a los costados lo trae al centro (fotos y videos)
    slide.addEventListener("click", () => { if (n !== actual) ir(n); });

    const video = slide.querySelector("video");
    if (!video) return;                    // es una foto: no hay nada más que configurar

    // Sin sonido: se activa con el atributo data-sin-sonido en el HTML
    if (slide.hasAttribute("data-sin-sonido")) {
      video.muted = true;
      video.addEventListener("volumechange", () => { if (!video.muted) video.muted = true; });
    }

    // Reproducir / pausar
    const boton = slide.querySelector(".video__play");
    if (boton) {
      boton.addEventListener("click", () => {
        if (n === actual) video.play().catch(() => {});
      });
    }

    // Al reproducir se muestran los controles del navegador y se oculta el botón grande.
    // No se escucha "pause": al mover la barra de tiempo el navegador pausa un instante el video,
    // y quitar los controles en ese momento cortaba la reproducción.
    video.addEventListener("play", () => {
      slide.classList.add("reproduciendo");
      video.controls = true;
    });
    // Al terminar vuelve el botón grande para reproducirlo de nuevo
    video.addEventListener("ended", () => detener(slide));
  });

  let pendiente = false;
  pista.addEventListener("scroll", () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { actualizar(); pendiente = false; });
  });
  window.addEventListener("resize", reubicar);

  prev.addEventListener("click", () => ir(actual - 1));
  next.addEventListener("click", () => ir(actual + 1));

  // Proporción real de cada archivo (se lee cuando carga; hasta entonces se usa 5:4)
  slides.forEach((slide) => {
    const img = slide.querySelector("img");
    if (img) {
      if (img.complete && img.naturalWidth) ajustarProporcion(slide, img.naturalWidth, img.naturalHeight);
      else img.addEventListener("load", () => ajustarProporcion(slide, img.naturalWidth, img.naturalHeight));
    }
    const video = slide.querySelector("video");
    if (video) {
      if (video.readyState >= 1) ajustarProporcion(slide, video.videoWidth, video.videoHeight);
      else video.addEventListener("loadedmetadata", () => ajustarProporcion(slide, video.videoWidth, video.videoHeight));
    }
  });

  reubicar();
})();
