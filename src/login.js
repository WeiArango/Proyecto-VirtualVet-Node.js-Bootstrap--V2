const mensajeError = document.getElementsByClassName("error")[0];

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    const password = formData.get("password");
    
    console.log(username);
    console.log(password);

    const res = await fetch("/validar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    });

    if (!username || !password) {
        alert("Por favor digita todos los campos")        
    } else if (!res.ok) {
        mensajeError.classList.toggle("escondido", false);       
    } else {
        const resJson = await res.json();
        localStorage.setItem('username', username);
        
        if (resJson.redirect) {
            // Almacenar el token, username, y id_usuario en el almacenamiento local
            localStorage.setItem("jwt", resJson.token);
            localStorage.setItem("username", username);
            localStorage.setItem('id_usuario', resJson.usuario.id_usuario);

            window.location.href = resJson.redirect;
        }
    }
});
