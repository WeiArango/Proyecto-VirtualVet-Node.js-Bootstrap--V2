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


//Registro de Usuarios
document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target; // Simplificar acceso al formulario
    const formData = {
        nombre: form.nombre.value,
        email: form.email.value,
        username: form.username.value,
        celular: form.celular.value,
        direccion: form.direccion.value,
        password: form.password.value,
        tipoIdentificacion: form.tipoIdentificacion.value,
        identificacion: form.identificacion.value,
        tipoUsuario: form.tipoUsuario.value // Esto debe ser 'Administrador' o 'Usuario'
    };

    try {
        const res = await fetch("/registrar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        });

        const resJSON = await res.json();

        if (res.ok) {
            alert(resJSON.message || "Registro exitoso");
            // Reinicia el formulario
            form.reset();
            
        } else {
            alert(resJSON.message || "Error al registrar usuario");
        }

        if (!res.ok) {
            mensajeError.classList.toggle("escondido", false);       
        }

    } catch (error) {
        console.error("Error al registrar usuario:", error);
        alert("Ocurrió un error inesperado. Intenta nuevamente más tarde.");
    }
});

//Registro de mascotas
document.getElementById("registerPet-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = e.target.children.nombre.value;

    if (!nombre) {
        // Muestra un alerta si el nombre está vacío
        alert("Por favor digita el nombre de tu mascota");
        return;
    }    

    try {
        const res = await fetch("http://localhost:3000/mascotas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({     
                id_mascota: e.target.children.id_mascota.value,  // Usar id_usuario como id_mascota            
                nombre: e.target.children.nombre.value,
                especie: e.target.children.especie.value,
                raza: e.target.children.raza.value,
                fecha_nto: e.target.children.fecha_nto.value,
                sexo: e.target.children.sexo.value,
                peso: e.target.children.peso.value,
                vacunacion: e.target.children.vacunacion.value,
                desparasitacion: e.target.children.desparasitacion.value,
                tipo_vivienda: e.target.children.tipo_vivienda.value,
                tipo_alimentacion: e.target.children.tipo_alimentacion.value,
                trat_med_ant: e.target.children.trat_med_ant.value,
                alergias_med: e.target.children.alergias_med.value,
                cual: e.target.children.cual.value,                
            })
        });

        if (!res.ok) {
            console.error('Error en la respuesta del servidor:', res);
            return;
        }

        const resJson = await res.json();
        console.log('Respuesta del servidor:', resJson);

        if (resJson.message) {
            // Si la respuesta contiene un mensaje, muestra un alerta
            alert(resJson.message);
        }

        if (resJson.resetForm) {
            // Reiniciar el formulario
            e.target.reset();
        }

        if (resJson.redirect) {
            // Redirigir después de un breve retraso para asegurar que el formulario se haya reiniciado
            setTimeout(() => {
                window.location.href = resJson.redirect;
            }, 500); // Ajusta el tiempo según sea necesario
        }
    } catch (error) {
        console.error('Error durante la solicitud:', error);
    }
});


//Gestión de Mascotas
// Llamada a la API para obtener las mascotas registradas
fetch('/admin/mascotas')
  .then(response => response.json())
  .then(data => {
    const tableBody = document.getElementById("mascotasTableBody");
    tableBody.innerHTML = '';
    data.forEach(mascota => {
      const tr = document.createElement("tr");

        // Calcular la edad en años con decimales
        const nacimiento = new Date(mascota.fecha_nto);
        const hoy = new Date();
        const edadEnMilisegundos = hoy - nacimiento;
        const edadEnAnios = edadEnMilisegundos / (1000 * 60 * 60 * 24 * 365.25);
        const edadenanios = edadEnAnios.toFixed(1); // Redondear a un decimal

      tr.innerHTML = `
        <td>${mascota.id_mascota}</td>
        <td>${mascota.nombre}</td>
        <td>${mascota.especie}</td>
        <td>${mascota.raza}</td>
        <td>${edadenanios}</td>
        <td>${mascota.sexo}</td>
        <td>${mascota.peso}</td>
        <td>${mascota.vacunacion}</td>
        <td>${mascota.desparasitacion}</td>
        <td>${mascota.tipo_vivienda}</td>
        <td>${mascota.tipo_alimentacion}</td>
        <td>${mascota.trat_med_ant}</td>
        <td>${mascota.alergias_med}</td>
        <td>${mascota.cual}</td>
        <td><a href="#" class="editar"><i class="fas fa-edit"></i></a></td>
        <td><a href="#" class="eliminar"><i class="fas fa-trash-alt"></i></a></td>
      `;
      tableBody.appendChild(tr);
    });
  })
  .catch(error => console.error('Error al obtener las mascotas:', error));


