const mensajeError = document.getElementsByClassName("error")[0];

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    const password = formData.get("password");

    if (!username || !password) {
        alert("Por favor, completa todos los campos");
        return;
    }

    try {
        const res = await fetch("/validar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const resJson = await res.json();

        if (!res.ok) {
            mensajeError.textContent = resJson.message || "Error al iniciar sesión";
            mensajeError.classList.toggle("escondido", false);
            return;
        }

        // Almacenar el token, username y redireccionar según el rol
        localStorage.setItem("jwt", resJson.token);
        localStorage.setItem("username", username);

        if (resJson.usuario) {
            // Es un usuario
            localStorage.setItem("id_usuario", resJson.usuario.id_usuario);
            console.log(`Usuario validado: ${resJson.usuario.nombre}`);
        } else if (resJson.admin) {
            // Es un administrador
            localStorage.setItem("id_admin", resJson.admin.id_admin);
            console.log(`Administrador validado: ${resJson.admin.nombre}`);
        }

        // Redirigir a la página correspondiente
        if (resJson.redirect) {
            window.location.href = resJson.redirect;
        }
    } catch (error) {
        console.error("Error durante el inicio de sesión:", error);
        mensajeError.textContent = "Ocurrió un error, por favor intenta de nuevo.";
        mensajeError.classList.toggle("escondido", false);
    }
});
