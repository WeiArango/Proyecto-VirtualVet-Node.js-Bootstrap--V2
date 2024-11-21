const mensajeExito = document.getElementsByClassName("navUser")[0];
const mensajeError = document.getElementsByClassName("navUser")[0];

// Recuperar el username desde el localStorage
const username = localStorage.getItem("username");

if (username) {
    mensajeExito.textContent = `Bienvenido ${username.toUpperCase()}`;
    mensajeError.classList.toggle("escondido", false);
}

// Programar el botón cerrar sesión
document.getElementsByTagName("button")[0].addEventListener("click", () => {
    // Generamos una cookie que ya esté expirada y cuando el navegador detecte que tiene una cookie que ya expiró, la borra automaticamente
    document.cookie='jwt=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.location.href = "/";
    
    // Limpiar el localStorage
    //localStorage.removeItem("jwt");
    localStorage.removeItem("username");
    localStorage.removeItem("id_usuario");
    localStorage.removeItem("resetPasswordToken");
    localStorage.removeItem("resetToken");
});
