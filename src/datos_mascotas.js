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
                    <td>${mascota.edad_años} años</td>
                    <td>${mascota.sexo}</td>
                    <td>${mascota.peso}</td>
                    <td>${mascota.vacunacion}</td>
                    <td>${mascota.desparasitacion}</td>
                    <td>${mascota.tipo_vivienda}</td>
                    <td>${mascota.tipo_alimentacion}</td>
                    <td>${mascota.trat_med_ant}</td>
                    <td>${mascota.alergias_med}</td>
                    <td>${mascota.cual}</td>
                `;
                mascotasTableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Hubo un problema con la operación fetch:', error);
        });
});
