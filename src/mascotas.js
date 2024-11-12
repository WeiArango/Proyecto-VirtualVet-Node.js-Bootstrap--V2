document.getElementById("registerPet-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = e.target.children.nombre.value;

    if (!nombre) {
        // Muestra un alerta si el nombre está vacío
        alert("Por favor digita el nombre de tu mascota");
        return;
    }

    // Obtener id_usuario del localStorage
    const id_usuario = localStorage.getItem("id_usuario");

    try {
        const res = await fetch("http://localhost:3000/mascotas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({     
                id_mascota: id_usuario,  // Usar id_usuario como id_mascota            
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



      
    

