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
    if (logueado) { 
        return next();
    } else {
        if (!res.headersSent) {
            return res.redirect("/");
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

        // Consulta directa a la base de datos para verificar si el usuario existe
        const buscarUsuarioQuery = "SELECT * FROM usuario WHERE username = ?";

        return new Promise((resolve, reject) => {
            conexión.query(buscarUsuarioQuery, [decodificada.username], function(error, lista) {
                if (error) {
                    console.error("Error al consultar la base de datos:", error.message);
                    return reject(false);
                }

                if (lista.length > 0) {
                    console.log("Usuario existente:", lista[0]);
                    return resolve(true); // El usuario existe, continuar con la ejecución
                } else {
                    console.log("Usuario no encontrado en la base de datos.");
                    return resolve(false); // El usuario no existe, redirigir
                }
            });
        });

    } catch (error) {
        console.error("Error al decodificar JWT:", error.message);
        return false;
    }
}

export const methods = {
    soloHomepage,
    soloPublico
};
