import JsonWebToken from "jsonwebtoken";
import dotenv from "dotenv";
import mysql from "mysql2";

const conexión = mysql.createConnection({
    host: process.env.host,
    database: process.env.database,
    user: process.env.user,
    password: process.env.password
})

dotenv.config();


async function soloHomepage(req, res, next) {
    const logueado = await revisarCookie(req, res);

    // Verifica que el usuario esté logueado y que no tenga el rol 'admin'
    if (logueado && logueado.role === 'admin') {
        return res.redirect("/admin"); // Redirige al admin si el usuario es admin
    }

    if (logueado) { 
        return next(); // Permite acceso si es un usuario general
    } else {
        if (!res.headersSent) {
            return res.redirect("/"); // Redirige al login si no está logueado
        }
    }
}


async function soloPublico(req, res, next) {
    const logueado = await revisarCookie(req, res);
    if (!logueado) { 
        return next();       
    } else {
        if (!res.headersSent) {
            return res.redirect("/homepage");
        }
    }
}

async function soloAdmin(req, res, next) {
    const logueado = await revisarCookie(req, res);

    // Verifica que el usuario esté logueado y tenga rol 'admin'
    if (logueado && logueado.role === 'admin') {
        return next();
    } else {
        if (!res.headersSent) {
            return res.redirect("/"); // Redirige al login si no es admin o no está logueado
        }
    }
}


async function revisarCookie(req, res) {
    try {
        if (!req.headers.cookie) {
            console.log("No se encontró ninguna cookie.");
            return false;
        }

        // Obtener la cookie jwt
        const cookieJWT = req.headers.cookie.split("; ").find(cookie => cookie.startsWith("jwt=")).slice(4);
        console.log("COOKIE", cookieJWT);

        // Decodificar el JWT
        const decodificada = JsonWebToken.verify(cookieJWT, process.env.JWT_SECRET);
        console.log("Decodificado:", decodificada);

        // Consultar si el username existe en la tabla `admin`
        const buscarAdminQuery = "SELECT * FROM admin WHERE username = ?";
        const admin = await new Promise((resolve, reject) => {
            conexión.query(buscarAdminQuery, [decodificada.username], function(error, results) {
                if (error) {
                    console.error("Error al consultar la base de datos (admin):", error.message);
                    return reject(false);
                }
                resolve(results);
            });
        });

        if (admin && admin.length > 0) {
            console.log("Usuario encontrado en la tabla admin:", admin[0]);
            return { role: 'admin', username: decodificada.username }; // Si es admin, devolver rol
        }

        // Si no está en la tabla `admin`, buscar en la tabla `usuario`
        const buscarUsuarioQuery = "SELECT * FROM usuario WHERE username = ?";
        const usuario = await new Promise((resolve, reject) => {
            conexión.query(buscarUsuarioQuery, [decodificada.username], function(error, results) {
                if (error) {
                    console.error("Error al consultar la base de datos (usuario):", error.message);
                    return reject(false);
                }
                resolve(results);
            });
        });

        if (usuario && usuario.length > 0) {
            console.log("Usuario encontrado en la tabla usuario:", usuario[0]);
            return { role: 'user', username: decodificada.username }; // Si es usuario, devolver rol
        }

        // Si no se encuentra en ninguna de las tablas
        console.log("Usuario no encontrado en ninguna de las tablas.");
        return false;

    } catch (error) {
        console.error("Error al decodificar JWT:", error.message);
        return false;
    }
}

export const methods = {
    soloHomepage,
    soloPublico,
    soloAdmin
};
