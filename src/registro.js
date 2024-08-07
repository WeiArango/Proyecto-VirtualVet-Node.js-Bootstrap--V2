const mensajeError = document.getElementsByClassName("error")[0];

document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const res = await fetch("/registrar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nombre: e.target.children.nombre.value,
            email: e.target.children.email.value,
            username: e.target.children.username.value,
            celular: e.target.children.celular.value,
            direccion: e.target.children.direccion.value,
            password: e.target.children.password.value,
            tipoIdentificacion: e.target.children.tipoIdentificacion.value,
            identificacion: e.target.children.identificacion.value,
            tipoUsuario: e.target.children.tipoUsuario.value
        })
    });

    if (!res.ok) {
        mensajeError.classList.toggle("escondido", false);
        const resJSON = await res.json();
        if (resJSON.message) {
            mensajeError.textContent = resJSON.message;
        }
    } else {
        const resJSON = await res.json();
        if (resJSON.redirect) {
            window.location.href = resJSON.redirect;
        }
    }
});
