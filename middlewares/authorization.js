//Archivo para la autorización de usuarios para permanecer o no en homepage, register o login si están loggeados o no
// Los middlewares son códigos que se interponen entre la req y la res y nos permiten hacer cosas en el medio. En este caso vamos a revisar antes de mandar la respuesta si esta persona tiene acceso para estar en ese lugar y eso lo hacemos desde index.js en Routing
import JsonWebToken from "jsonwebtoken";
import dotenv from "dotenv";
import { usuario } from "../controllers/authentication.js";

dotenv.config();

function soloHomepage(req, res, next) { //Next en los middwares es lo que ejecutamos para decir que siga adelante en la linea de procesos que tiene que hacer, osea que pase al próximo middware
    const logueado = revisarCookie(req);
        if(logueado) { 
            return next();
         } else {
            return res.redirect("/");     
    }
}

function soloPublico(req, res, next) {
    const logueado = revisarCookie(req);
        if(!logueado) { 
            return next();
        } else {
            return res.redirect("homepage");  
    }
}

function revisarCookie(req) {
    try {
        if (!req.headers.cookie) {
            return false;
        }
        //Para mostar la cookie 
        const cookieJWT = req.headers.cookie.split("; ").find(cookie => cookie.startsWith("jwt=")).slice(4);
        console.log("COOKIE", cookieJWT);

        // Para decodificar la cookie
        const decodificada = JsonWebToken.verify(cookieJWT, process.env.JWT_SECRET);
        console.log("Decodificado:", decodificada);

        // Verificar si el usuario existe en la base de datos o en tu array de usuarios
        const usuarioExistente = usuario.find(usuario => usuario.username === decodificada.username);
        console.log("Usuario existente:", usuarioExistente);

        return usuarioExistente !== undefined; // Retorna true si el usuario existe, de lo contrario false
    } catch (error) {
        console.error("Error al decodificar JWT:", error);
        return false;
    }
}

export const methods = {
    soloHomepage,
    soloPublico
}