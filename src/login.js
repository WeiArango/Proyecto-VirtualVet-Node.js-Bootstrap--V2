const mensajeError = document.getElementsByClassName("error")[0];

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log(e.target.children.username.value);
    console.log(e.target.children.password.value);
  
    const res = await fetch("/validar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: e.target.children.username.value,
        password: e.target.children.password.value
      })
    });
  
    if (!res.ok) {
      mensajeError.classList.toggle("escondido", false);
    } else {
      const resJson = await res.json();
      if (resJson.redirect) {
        // Almacenar el token en el almacenamiento local
        localStorage.setItem("jwt", resJson.token);
  
        window.location.href = resJson.redirect;
      }
    }
  });


 

 
