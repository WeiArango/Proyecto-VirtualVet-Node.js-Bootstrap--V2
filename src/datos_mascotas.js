document.addEventListener('DOMContentLoaded', () => {
    const id_usuario = localStorage.getItem('id_usuario');
    const url = `/mascotas?id_usuario=${encodeURIComponent(id_usuario)}`;
    const mascotasTableBody = document.getElementById('mascotasTableBody');
    const editPetForm = document.getElementById('editPetForm');
    const formEditarMascota = document.getElementById('formEditarMascota');

    // Fetch de datos de mascotas
    fetch(url)
        .then(response => response.ok ? response.json() : Promise.reject('Error en la respuesta de la red'))
        .then(data => {
            mascotasTableBody.innerHTML = ''; // Limpiar contenido previo
            data.forEach(mascota => {
                const row = document.createElement('tr');
            
                // Calcular la edad en años con decimales
                const nacimiento = new Date(mascota.fecha_nto);
                const hoy = new Date();
                const edadEnMilisegundos = hoy - nacimiento;
                const edadEnAnios = edadEnMilisegundos / (1000 * 60 * 60 * 24 * 365.25);
                const edadenanios = edadEnAnios.toFixed(1); // Redondear a un decimal
            
                row.innerHTML = `
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
                mascotasTableBody.appendChild(row);

                // Event listener para el botón "Editar"
                row.querySelector('.editar').addEventListener('click', (event) => {
                    event.preventDefault();
                    const mascotaId = mascota.primary_key;                    
                    const selectedMascota = data.find(m => m.primary_key == mascotaId);

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

                // Event listener para el botón "Eliminar"
                row.querySelector('.eliminar').addEventListener('click', (event) => {
                    event.preventDefault();
                    const mascotaId = mascota.primary_key;

                    // Confirmar eliminación
                    if (confirm(`¿Estás seguro de que deseas eliminar a ${mascota.nombre}?`)) {
                        fetch(`/datos_mascotas/${mascotaId}`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                        .then(response => {
                            if (response.ok) {
                                alert(`La mascota ${mascota.nombre} ha sido eliminada exitosamente.`);
                                row.remove(); // Eliminar la fila del DOM
                            } else {
                                alert('Hubo un problema al eliminar la mascota.');
                            }
                        })
                        .catch(error => console.error('Error al eliminar la mascota:', error));
                    }
                });
            });
        })
        .catch(error => console.error('Hubo un problema con la operación fetch:', error));

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
});
