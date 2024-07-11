document.getElementById("modificarPassword").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const clave_actual = formData.get("clave_actual");
    const new_password = formData.get("new_password");
    const repeat_password = formData.get("repeat_password");
    const username = localStorage.getItem('username');  // Obtener el username del localStorage
    const token = localStorage.getItem('token');  // Obtener el token de autenticación del localStorage

    const mensajeError = document.getElementsByClassName("error")[0];
    const mensajeSuccess = document.getElementsByClassName("success")[0];

    try {
        const res = await fetch("/modificarPassword", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`  // Enviar el token de autenticación en el encabezado
            },
            body: JSON.stringify({
                clave_actual: clave_actual,
                new_password: new_password,
                repeat_password: repeat_password,
                username: username  // Enviar el username en el cuerpo de la solicitud
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            mensajeError.textContent = errorData.message;
            mensajeError.classList.remove("escondido");
            mensajeSuccess.classList.add("escondido");
        } else {
            const resJson = await res.json();
            mensajeSuccess.textContent = resJson.message;
            alert("Contraseña actualizada exitosamente");
            window.location.href = resJson.redirect;
            mensajeSuccess.classList.remove("escondido");
            mensajeError.classList.add("escondido");            
        }
    } catch (error) {
        console.error('Hubo un problema con la actualización:', error);
        mensajeError.textContent = "Error al actualizar la contraseña";
        mensajeError.classList.remove("escondido");
        mensajeSuccess.classList.add("escondido");
    }
});
