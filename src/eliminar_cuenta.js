document.getElementById('eliminarCuenta').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (window.confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
        try {
            const response = await fetch('/eliminarCuenta', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (response.ok) {
                alert("Cuenta eliminada exitosamente");
                document.querySelector('.success').classList.remove('escondido');
                document.querySelector('.success').textContent = result.message;

                // Limpiar almacenamiento local
                localStorage.removeItem('jwt'); // Elimina el token JWT
                localStorage.removeItem('id_usuario'); // Elimina el ID de usuario
                localStorage.removeItem('username')
                window.location.href = result.redirect;

            } else {
                document.querySelector('.error').classList.remove('escondido');
                document.querySelector('.error').textContent = result.message;
            }
        } catch (error) {
            console.error('Error:', error);
            document.querySelector('.error').classList.remove('escondido');
            document.querySelector('.error').textContent = 'Error al eliminar la cuenta. Inténtalo de nuevo más tarde.';
        }
    }
});