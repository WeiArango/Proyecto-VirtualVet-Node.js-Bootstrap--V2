const mensajeError = document.getElementsByClassName("error")[0];
const mensajeExito = document.getElementsByClassName("succes")[0];

document.getElementById("recoverPass-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.elements.email.value;

    // Verificar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mensajeError.textContent = "Por favor, introduce un correo electrónico válido.";
        mensajeError.classList.toggle("escondido", false);
        return;
    }

    try {
        const res = await fetch("/recuperarPassword", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("Error en la respuesta del servidor:", errorText);  // Mostrar error en consola
            mensajeError.textContent = errorText || "Error en la recuperación de la contraseña.";
            mensajeError.classList.toggle("escondido", false);
        } else {
            const resJson = await res.json();
            if (resJson.status === "ok") {
                // Mostrar mensaje de éxito
                mensajeExito.textContent = `Correo de recuperación enviado a ${email} Revisa tu bandeja de entrada.`;
                mensajeExito.classList.toggle("escondido", false);
                e.target.reset();

                // Opcional: Almacenar el resetToken en localStorage
                localStorage.setItem("resetToken", resJson.resetToken);
            } else {
                // Manejar cualquier otro estado de respuesta que no sea "ok"
                mensajeError.textContent = "Error en la recuperación de la contraseña.";
                mensajeError.classList.toggle("escondido", false);
            }
        }
    } catch (error) {
        console.error("Error en la solicitud fetch:", error);  // Mostrar error en consola
        mensajeError.textContent = "Hubo un problema con la solicitud. Inténtalo de nuevo más tarde.";
        mensajeError.classList.toggle("escondido", false);
    }
});
