document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById("popup-descuento");

  // Mostrar el popup solo si no ha sido visto
  if (!sessionStorage.getItem("popupShown")) {
    popup.classList.remove("hidden");
    sessionStorage.setItem("popupShown", "true");
  }

  // Cerrar el popup al hacer clic afuera o en un botón cerrar
  popup.addEventListener("click", function (e) {
    if (e.target.id === "popup-descuento" || e.target.classList.contains("popup-descuento-close")) {
      popup.classList.add("hidden");
    }
  });
});
