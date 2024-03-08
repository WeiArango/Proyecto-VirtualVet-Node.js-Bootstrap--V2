//Para mostrar error cuando hay un error
const mensajeError = document.getElementsByClassName("error")[0];

document.getElementById("register-form").addEventListener("submit", async(e) => {
    e.preventDefault();
//    console.log(e.target.children.name.value);
//    console.log(e.target.children.email.value);
//    console.log(e.target.children.phone.value);
//    console.log(e.target.children.adress.value);
//    console.log(e.target.children.password.value);
//    console.log(e.target.children.tipoUsuario.value);
  

   const res = await fetch("/registrar", {
    method:"POST",
    headers: {
        "content-Type" : "application/json"
        },
        body: JSON.stringify({
            name: e.target.children.name.value,
            email: e.target.children.email.value,
            phone: e.target.children.phone.value,
            adress: e.target.children.adress.value,
            password: e.target.children.password.value,        
            tipoIdentificacion: e.target.children.tipoIdentificacion.value, 
            numeroId: e.target.children.numeroId.value, 
            tipoUsuario: e.target.children.tipoUsuario.value        
        }) 
        
    }); 
    if(!res.ok) return mensajeError.classList.toggle("escondido", false);    
    const resJSON = await res.json();
    if(resJSON.redirect) {
        window.location.href = resJSON.redirect;
    }     
})
