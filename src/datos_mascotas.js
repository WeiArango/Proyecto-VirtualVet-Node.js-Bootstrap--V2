document.addEventListener('DOMContentLoaded', () => {
    const id_usuario = localStorage.getItem('id_usuario');
    
    const url = `/mascotas?id_usuario=${encodeURIComponent(id_usuario)}`;
    console.log('Fetching data from URL:', url); // Debugging

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la red');
            }
            return response.json();
        })
        .then(data => {
            const mascotasTableBody = document.getElementById('mascotasTableBody');
            mascotasTableBody.innerHTML = ''; // Limpiar cualquier contenido previo

            data.forEach(mascota => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${mascota.nombre}</td>
                    <td>${mascota.especie}</td>
                    <td>${mascota.raza}</td>
                    <td>${mascota.edadenanios} años</td>
                    <td>${mascota.sexo}</td>
                    <td>${mascota.peso}</td>
                    <td>${mascota.vacunacion}</td>
                    <td>${mascota.desparasitacion}</td>
                    <td>${mascota.tipo_vivienda}</td>
                    <td>${mascota.tipo_alimentacion}</td>
                    <td>${mascota.trat_med_ant}</td>
                    <td>${mascota.alergias_med}</td>
                    <td>${mascota.cual}</td>
                    <td><a href="#" class="editar" data-id="${mascota.id_mascota}"><i class="fas fa-edit"></i></a></td>
                    <td><a href="#" class="eliminar"><i class="fas fa-trash-alt"></i></a></td>
                `;
                mascotasTableBody.appendChild(row);
            });

            // Agregar event listeners a los botones de editar
            document.querySelectorAll('.editar').forEach(button => {
                button.addEventListener('click', (event) => {
                    event.preventDefault(); // Evita el envío del formulario por defecto
                    const mascotaId = button.getAttribute('id_mascota');
                    const mascota = data.find(m => m.id == mascotaId);

                    // Puedes añadir un campo oculto con el ID de la mascota si es necesario
                    document.getElementById('id_mascota').value = mascota.id_mascota;

                    // Rellenar el formulario con los datos de la mascota seleccionada
                    document.getElementById('nombre').value = mascota.nombre;
                    document.getElementById('especie').value = mascota.especie;
                    document.getElementById('raza').value = mascota.raza;
                    document.getElementById('fecha_nto').value = mascota.fecha_nato;
                    document.getElementById('sexo').value = mascota.sexo;
                    document.getElementById('peso').value = mascota.peso;
                    document.getElementById('vacunacion').value = mascota.vacunacion;
                    document.getElementById('desparasitacion').value = mascota.desparasitacion;
                    document.getElementById('vivienda').value = mascota.tipo_vivienda;
                    document.getElementById('alimento').value = mascota.tipo_alimentacion;
                    document.getElementById('trat_previos').value = mascota.trat_med_ant;
                    document.getElementById('allergias').value = mascota.alergias_med;
                    document.getElementById('cual').value = mascota.cual;

                    
                });
            });
        })
        .catch(error => {
            console.error('Hubo un problema con la operación fetch:', error);
        });
});
