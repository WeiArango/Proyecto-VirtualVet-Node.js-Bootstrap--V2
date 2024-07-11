document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    
    // Asegúrate de que la URL incluye el parámetro username
    const url = `/datos_personales?username=${encodeURIComponent(username)}`;
    console.log('Fetching data from URL:', url); // Debugging

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta de la red');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('nombre').value = data.nombre;
            document.getElementById('email').value = data.email;
            document.getElementById('username').value = data.username;
            document.getElementById('celular').value = data.celular;
            document.getElementById('direccion').value = data.direccion;
        })
        .catch(error => {
            console.error('Hubo un problema con la operación fetch:', error);
        });

    document.getElementById('guardar').addEventListener('click', async (event) => {
        event.preventDefault(); // Evita el envío del formulario por defecto

        const datosActualizados = {
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            username: document.getElementById('username').value,
            celular: document.getElementById('celular').value,
            direccion: document.getElementById('direccion').value
        };

        try {
            const response = await fetch('/datos_personales', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosActualizados)
            });

            if (!response.ok) {
                throw new Error('Error en la actualización de los datos');
            }

            const mensaje = await response.text();
            console.log(mensaje);
            alert("Datos actualizados exitosamente");
            window.location.href = '/homepage';
        } catch (error) {
            console.error('Hubo un problema con la actualización:', error);
            alert("Error al actualizar los datos");
        }
    });

    document.getElementById('cancelar').addEventListener('click', () => {
        // Aquí podrías agregar la lógica para manejar el botón de cancelar
        window.location.href = '/homepage';
    });

    document.getElementById('modificarContraseña').addEventListener('click', () => {
        // Aquí podrías agregar la lógica para manejar la modificación de la contraseña
        window.location.href = '/modificar_password';
    });
});
