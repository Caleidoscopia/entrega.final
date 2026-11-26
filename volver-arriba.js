(() => {
  const boton = document.querySelector(".volver-arriba");
  if (!boton) return;

  const INACTIVIDAD = 1500; // ms sin movimiento antes de ocultarlo
  let timer = null;

  // Muestra el botón y lo vuelve a ocultar si no hay más movimiento
  function mostrar() {
    boton.classList.add("visible");
    clearTimeout(timer);
    timer = setTimeout(() => boton.classList.remove("visible"), INACTIVIDAD);
  }

  ["scroll", "mousemove", "wheel", "touchmove"].forEach((evento) => {
    window.addEventListener(evento, mostrar, { passive: true });
  });

  boton.addEventListener("click", () => {
    const suave = !matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: suave ? "smooth" : "auto" });
  });
})();