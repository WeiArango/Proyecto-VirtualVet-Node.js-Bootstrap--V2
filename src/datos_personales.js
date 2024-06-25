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

    document.getElementById('guardar').addEventListener('click', () => {
        // Aquí podrías agregar la lógica para enviar los datos modificados al backend
    });

    document.getElementById('cancelar').addEventListener('click', () => {
        // Aquí podrías agregar la lógica para manejar el botón de cancelar, si es necesario
    });

    document.getElementById('modificarContraseña').addEventListener('click', () => {
        // Aquí podrías agregar la lógica para manejar la modificación de la contraseña
    });
});
