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


//Gestión de Usuarios
// Llamada a la API para obtener los usuarios registrados
document.addEventListener("DOMContentLoaded", cargarUsuarios);

function cargarUsuarios() {
    fetch('/admin/usuarios')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById("usuariosTableBody");
            tableBody.innerHTML = '';

            data.forEach(usuario => {
                const tr = document.createElement("tr");

                tr.innerHTML = `
                    <td>${usuario.id_usuario}</td>
                    <td>${usuario.nombre}</td>
                    <td>${usuario.email}</td>
                    <td>${usuario.username}</td>
                    <td>${usuario.celular}</td>
                    <td>${usuario.direccion}</td>
                    <td>${usuario.tipoIdentificacion}</td>
                    <td>${usuario.identificacion}</td>
                    <td>${usuario.tipoUsuario}</td>
                    <td><a href="#" class="editar" data-id="${usuario.id_usuario}"><i class="fas fa-edit"></i></a></td>
                    <td><a href="#" class="eliminar" data-id="${usuario.id_usuario}" data-nombre="${usuario.nombre}"><i class="fas fa-trash-alt"></i></a></td>
                `;
                tableBody.appendChild(tr);

                tr.querySelector('.editar').addEventListener('click', (event) => {
                    event.preventDefault();
                    editarUsuario(usuario.id_usuario);
                });

                tr.querySelector('.eliminar').addEventListener('click', (event) => {
                    event.preventDefault();
                    eliminarUsuario(usuario.id_usuario, usuario.nombre);
                });
            });
        })
        .catch(error => console.error('Error al obtener los usuarios:', error));
}

function editarUsuario(id_usuario) {
    fetch(`/admin/usuarios/editar/${id_usuario}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("primary_key").value = data.id_usuario;
            document.getElementById("nombre").value = data.nombre;
            document.getElementById("email").value = data.email;
            document.getElementById("username").value = data.username;
            document.getElementById("celular").value = data.celular;
            document.getElementById("direccion").value = data.direccion;
            document.getElementById("tipoIdentificacion").value = data.tipoIdentificacion;
            document.getElementById("identificacion").value = data.identificacion;
            document.getElementById("tipoUsuario").value = data.tipoUsuario;

            document.getElementById("editUserForm").style.display = "block";
        })
        .catch(error => console.error('Error al cargar los datos del usuario:', error));
}

document.getElementById("formEditarUsuario").addEventListener('submit', function (event) {
    event.preventDefault();    

    const id_usuario = document.getElementById("primary_key").value;
    const updatedData = {
        id_usuario,
        nombre: document.getElementById("nombre").value,
        email: document.getElementById("email").value,
        username: document.getElementById("username").value,
        celular: document.getElementById("celular").value,
        direccion: document.getElementById("direccion").value,
        tipoIdentificacion: document.getElementById("tipoIdentificacion").value,
        identificacion: document.getElementById("identificacion").value,
        tipoUsuario: document.getElementById("tipoUsuario").value
    };

    fetch('/admin/usuarios/editar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
    })
    
        .then(response => {            
            if (response.ok) {
                alert("Usuario actualizado exitosamente.");
                document.getElementById("editUserForm").style.display = "none";
                res.status(201).send({ status: "ok", resetForm: true, redirect: "/admin" });
                cargarUsuarios();
            } else {
                alert("Error al actualizar el usuario.");
            }
        })
        .catch(error => console.error('Error al actualizar el usuario:', error));
});

function cerrarFormulario() {
    const formulario = document.querySelector('#editUserForm'); 
    cargarUsuarios();
    formulario.style.display = 'none'; // Oculta el formulario
}

function eliminarUsuario(id_usuario, nombre) {
    if (confirm(`¿Estás seguro de eliminar a ${nombre}?`)) {
        fetch(`/admin/delete/usuarios/${id_usuario}`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    alert(`Usuario ${nombre} eliminado.`);
                    cargarUsuarios();
                } else {
                    alert("Error al eliminar el usuario.");
                }
            })
            .catch(error => console.error('Error al eliminar el usuario:', error));
    }
}

// Función para cargar la tabla de mascotas
function cargarMascotas() {
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
                    <td>${edadenanios} años</td>
                    <td>${mascota.sexo}</td>
                    <td>${mascota.peso}</td>
                    <td>${mascota.vacunacion}</td>
                    <td>${mascota.desparasitacion}</td>
                    <td>${mascota.tipo_vivienda}</td>
                    <td>${mascota.tipo_alimentacion}</td>
                    <td>${mascota.trat_med_ant}</td>
                    <td>${mascota.alergias_med}</td>
                    <td>${mascota.cual}</td>
                    <td><a href="#" class="editar" data-id="${mascota.primary_key}"><i class="fas fa-edit"></i></a></td>
                    <td><a href="#" class="eliminar" data-id="${mascota.primary_key}"><i class="fas fa-trash-alt"></i></a></td>
                `;
                tableBody.appendChild(tr);

                // Función para cargar los datos de la mascota en el formulario de edición
                // Event listener para el botón "Editar"
                tr.querySelector('.editar').addEventListener('click', (event) => {
                    event.preventDefault();
                    const mascotaId = mascota.primary_key;                    
                    const selectedMascota = data.find(m => m.primary_key == mascotaId);

                    const name = document.getElementById("nombre").value;
                    const mensajeExito = document.getElementsByClassName("editPet")[0];

                    if (name) {
                        mensajeExito.textContent = `Editar mascota ${name.toUpperCase()}`;        
                    }

                    if (selectedMascota) {
                        // Mostrar formulario de edición y rellenarlo con los datos de la mascota seleccionada
                        editPetForm.style.display = 'block';
                        document.getElementById('primary_key').value = selectedMascota.primary_key;
                        document.getElementById('nombre').value = selectedMascota.nombre;
                        document.getElementById('especie').value = selectedMascota.especie;
                        document.getElementById('raza').value = selectedMascota.raza;
                        document.getElementById('fecha_nto').value = selectedMascota.fecha_nto;
                        document.getElementById('sexo').value = selectedMascota.sexo;
                        document.getElementById('peso').value = selectedMascota.peso;
                        document.getElementById('vacunacion').value = selectedMascota.vacunacion;
                        document.getElementById('desparasitacion').value = selectedMascota.desparasitacion;
                        document.getElementById('vivienda').value = selectedMascota.tipo_vivienda;
                        document.getElementById('alimento').value = selectedMascota.tipo_alimentacion;
                        document.getElementById('trat_previos').value = selectedMascota.trat_med_ant;
                        document.getElementById('allergias').value = selectedMascota.alergias_med;
                        document.getElementById('cual').value = selectedMascota.cual;
                    }
                });

// Función para ocultar el formulario de edición
window.cancelEdit = () => {
    editPetForm.style.display = 'none';
    formEditarMascota.reset();
};

// Event listener para guardar cambios al enviar el formulario de edición
formEditarMascota.addEventListener('submit', (event) => {
    event.preventDefault();

    const mascotaId = document.getElementById('primary_key').value;        
    const updatedData = {
        primary_key: mascotaId,
        nombre: document.getElementById('nombre').value,
        especie: document.getElementById('especie').value,
        raza: document.getElementById('raza').value,
        fecha_nto: document.getElementById('fecha_nto').value,
        sexo: document.getElementById('sexo').value,
        peso: document.getElementById('peso').value,
        vacunacion: document.getElementById('vacunacion').value,
        desparasitacion: document.getElementById('desparasitacion').value,
        tipo_vivienda: document.getElementById('vivienda').value,
        tipo_alimentacion: document.getElementById('alimento').value,
        trat_med_ant: document.getElementById('trat_previos').value,
        alergias_med: document.getElementById('allergias').value,
        cual: document.getElementById('cual').value,
    };

    fetch('/datos_mascotas', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
    })
    .then(response => {
        if (response.ok) {
            alert(`Datos de la mascota ${updatedData.nombre} actualizados exitosamente`);        
            editPetForm.style.display = 'none';
            formEditarMascota.reset();  
            location.reload();   
        } else {
            alert('Hubo un problema al actualizar la mascota.');
        }
    })        
    .catch(error => console.error('Error al actualizar los datos de la mascota:', error));
});

                // Añadir listener para el botón de eliminación
                tr.querySelector('.eliminar').addEventListener('click', (event) => {
                    event.preventDefault();
                    const mascotaId = event.target.closest('.eliminar').dataset.id;
                    const mascotaNombre = event.target.closest('.eliminar').dataset.nombre;

                    // Confirmar eliminación
                    if (confirm(`¿Estás seguro de que deseas eliminar a ${mascotaNombre}?`)) {
                        fetch(`/datos_mascotas/${mascotaId}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                            .then(response => {
                                if (response.ok) {
                                    alert(`La mascota ${mascotaNombre} ha sido eliminada exitosamente.`);
                                    cargarMascotas(); // Recargar la tabla
                                } else {
                                    alert('Hubo un problema al eliminar la mascota.');
                                }
                            })
                            .catch(error => console.error('Error al eliminar la mascota:', error));
                    }
                });
            });
        })
        .catch(error => console.error('Error al obtener las mascotas:', error));
}

// Cargar la tabla de mascotas al cargar la página
document.addEventListener("DOMContentLoaded", cargarMascotas); 












