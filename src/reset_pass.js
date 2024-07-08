const mensajeError = document.getElementsByClassName("error")[0];
const mensajeExito = document.getElementsByClassName("succes")[0];

document.getElementById("resetPass-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Extraer el resetToken de localStorage
    const resetToken = localStorage.getItem("resetToken");
    
    const newPassword = e.target.elements.new_password.value;
    const repeatPassword = e.target.elements.repeat_password.value;

    // Verificar que las contraseñas coincidan
    if (newPassword !== repeatPassword) {
        mensajeError.textContent = "Las contraseñas no coinciden";
        mensajeError.classList.remove("escondido");
        return;
    }

    try {
        const res = await fetch("/cambiarPassword", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                new_password: newPassword,
                repeat_password: repeatPassword,
                resetToken: resetToken
            })             
        });

        let resJson;
        try {
            resJson = await res.json();
        } catch (err) {
            console.error('Error parsing JSON:', err);  // Añadir console.error
            mensajeError.textContent = "El token es inválido o ha expirado.";
            mensajeError.classList.remove("escondido");
            return;
        }

        if (!res.ok) {
            console.error('Respuesta del servidor no OK:', resJson);  // Añadir console.error
            mensajeError.textContent = resJson.message || "Hubo un problema con la solicitud. Inténtalo de nuevo más tarde.";
            mensajeError.classList.remove("escondido");
        } else {
            if (resJson.redirect) {
                window.location.href = resJson.redirect;
            } else {                
                mensajeExito.textContent = resJson.message || "Contraseña restablecida con éxito para usuario.";
                mensajeExito.classList.toggle("escondido", false);
                e.target.reset();
            }
        }
    } catch (error) {
        console.error('Fetch error:', error);  // Añadir console.error
        mensajeError.textContent = "Hubo un problema con la solicitud. Inténtalo de nuevo más tarde.";
        mensajeError.classList.remove("escondido");
    }
});
