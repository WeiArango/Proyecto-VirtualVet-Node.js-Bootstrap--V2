//Configuración librerías
import express from "express";
//Para poder ver las res obtenidas en consola
import morgan, { token } from "morgan";
import cookieParser from "cookie-parser";
//Fix para __dirname (como desplegamos type : module tenemos que generar estas tres lineas para importar archivos a este archivo)
import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import dotenv from "dotenv";
dotenv.config();
//Importación de la autenticación y la autorización
import { methods as authentication } from "./controllers/authentication.js";
import { methods as authorization } from "./middlewares/authorization.js";
//Importar nodemailer para enviar emails
import nodemailer from "nodemailer";
//Importar RESEND para enviar emails
import { Resend } from 'resend';
//Importar crypto para generar un token aleatorio y enviar al usuario por email y reestablecer la contraseña
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import JsonWebToken from "jsonwebtoken";
import bodyParser from "body-parser";
const app = express();



//Para realizar la consulta a la base de datos
import mysql from "mysql2";
import { console } from "inspector";

//Para realizar la conexión a la base de datos
const conexión = mysql.createConnection({
    host: process.env.host,
    database: process.env.database,
    user: process.env.user,
    password: process.env.password
})

//Configuración del puerto
app.listen(3000, function () {
    console.log(`Servidor http://localhost:3000 creado correctamente`);
});

//Para utilizar el motor de vistas ejs que fusiona el html con js
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Para servir el frame Bootstrap
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// Configuración de body-parser para manejar solicitudes JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//Configuración de archivos estáticos
app.use(express.static(__dirname, + "style"));//Para importar archivos de style
app.use(express.static(__dirname, + "style", "img"));//Para importar archivos de img
app.use(morgan("dev"));//Para mostrar las res en consola
app.use(cookieParser());//Para mostrar las cookies con express
//Para que el servidor reconozca los datos que vienen desde la página (esto debe estar antes de las rutas)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Para renderizar los archivos ejs
app.get("/",  authorization.soloPublico, (req, res) => res.render("login"));
app.get("/registro", authorization.soloPublico, (req, res) => res.render("registro"));
app.get("/recover_pass", authorization.soloPublico, (req, res) => res.render("recover_pass"));
app.get("/reset_pass/:token", authorization.soloPublico, (req, res) => res.render("reset_pass"));
app.get("/modificar_password", authorization.soloHomepage, (req, res) => res.render("modificar_password"));
app.get("/homepage", authorization.soloHomepage, (req, res) => res.render("homepage"));
app.get("/mascotas/:id_mascotas", authorization.soloHomepage, (req, res) => res.render("mascotas"));
app.get("/datos_personales/:username", authorization.soloHomepage, (req, res) => res.render("datos_personales"));
app.get("/eliminar_cuenta", authorization.soloHomepage, (req, res) => res.render("eliminar_cuenta"));
app.get("/admin", authorization.soloAdmin, (req, res) => res.render("admin"));
//Endpoints

//Configuración de la ruta para obtener datos del usuario

//Para validar la ruta del servidor
//REGISTRO DE USUARIOS
app.post("/registrar", authentication.registro, async function (req, res) {
     try {
         const datos = req.body;
         console.log(datos);

         const nombre = datos.nombre;
         const email = datos.email;
         const username = datos.username;
         const celular = datos.celular;
         const direccion = datos.direccion;
         const password = datos.password;
         const tipoIdentificacion = datos.tipoIdentificacion;
         const identificacion = datos.identificacion;
         const tipoUsuario = datos.tipoUsuario;

         // Verificar si el usuario ya existe
         const buscar = "SELECT * FROM usuario WHERE username = ?";
         const rows = await consultarBaseDeDatos(buscar, [username]);        

         if (rows.length > 0) {
             console.log("No se puede registrar, usuario ya existe");
             return res.status(400).send("Usuario ya existe");
         }
       
         const registrar = "INSERT INTO usuario (nombre, email, username, celular, direccion, password, tipoIdentificacion, identificacion, tipoUsuario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
         await consultarBaseDeDatos(registrar, [nombre, email, username, celular, direccion, password, tipoIdentificacion, identificacion, tipoUsuario]);

         console.log("Usuario registrado exitosamente");
         res.redirect("/homepage.ejs");
         res.status(201).send("Usuario registrado exitosamente");
     } catch (error) {
         console.error("Error durante el registro:", error);
         res.status(500).send("Error interno del servidor");
     }
});

async function consultarBaseDeDatos(query, values) {
    return new Promise((resolve, reject) => {
        conexión.query(query, values, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result);
            }
        });
    });
}

//LOGIN DE USUARIOS
app.post("/validar", authentication.login);

//CONFIGURACIÓN DE RESEND PARA RESTABLECIMIENTO DE CONTRASEÑA
const resend = new Resend(process.env.API_KEY_RESEND);  // Asegúrate de reemplazar con tu API key

// RUTA PARA SOLICITAR RECUPERACIÓN DE CONTRASEÑA
app.post("/recuperarPassword", (req, res) => {
    const email = req.body.email;
    if (!email) {
        return res.status(400).send("Por favor digita tu Correo electrónico");
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    console.log("Generated resetToken:", resetToken); // Verificar que el token se genera cada vez

    const query = 'UPDATE usuario SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?';

    conexión.query(query, [resetToken, Date.now() + 3600000, email], async (err, result) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).send("Error al solicitar recuperación de contraseña");
        }
        if (result.affectedRows === 0) {
            return res.status(404).send("Email no encontrado");
        }

        const emailOptions = {
            from: 'VirtualVet <onboarding@resend.dev>', 
            to: email,
            subject: `Recuperación de contraseña para usuario ${email}`,
            html: `<p>Haga click en el siguiente enlace para restablecer su contraseña: <strong><a href="http://localhost:3000/reset_pass/${resetToken}">Restablecer contraseña</a><strong></p>`
        };

        try {
            const { data, error } = await resend.emails.send(emailOptions);
            if (error) {
                console.error("Error al enviar el correo:", error);
                return res.status(500).send("Error al enviar el correo de recuperación");
            }
            console.log(`Correo enviado a ${email}:`, data);
            return res.status(201).send({ status: "ok", message: `Correo de recuperación enviado a ${email}`, resetToken: resetToken });
        } catch (err) {
            console.error("Error en el envío del correo:", err);
            return res.status(500).send("Error al enviar el correo de recuperación");
        }
    });
});

// RUTA PARA REESTABLECER LA CONTRASEÑA
app.post('/cambiarPassword', (req, res) => {
    const { new_password, repeat_password, resetToken } = req.body;

    if (!new_password || !repeat_password) {
        return res.status(400).json({ message: 'Por favor, complete todos los campos' });
    }

    if (new_password !== repeat_password) {
        return res.status(400).json({ message: 'Las contraseñas no coinciden' });
    }

    const query = 'SELECT * FROM usuario WHERE resetPasswordToken = ? AND resetPasswordExpires > ?';
    conexión.query(query, [resetToken, Date.now()], (err, results) => {
    if (err) {
        console.error("Error en la consulta:", err);
        return res.status(500).json({ message: 'Error en la base de datos al verificar el token' });
    }
    
    if (results.length === 0) {
        return res.status(400).json({ message: 'El token es inválido o ha expirado' });
    }

    const usuario = results[0];

    // Validación adicional de la nueva contraseña podría incluirse aquí
    const hashedPassword = bcryptjs.hashSync(new_password, 10);

    const updateQuery = 'UPDATE usuario SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE email = ?';
    conexión.query(updateQuery, [hashedPassword, usuario.email], (err, result) => {
        if (err) {
            console.error("Error en la actualización:", err);
            return res.status(500).json({ message: 'Error al actualizar la contraseña en la base de datos' });
        }

        res.json({ message: `Contraseña actualizada exitosamente para usuario ${usuario.username}` });
        console.log(`Contraseña restablecida para usuario ${usuario.username}`);
        });
    });
});


// //CONFIGURACIÓN DE NODEMAILER PARA RESTABLECIMIENTO DE CONTRASEÑA CON SERVICIOS DE GOOGLE CLOUD
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         type: 'OAuth2',
//         user: process.env.usergmail,
//         pass: process.env.pass,
//         clientId: process.env.OAUTH_CLIENTID,
//         clientSecret: process.env.OAUTH_CLIENT_SECRET,
//         refreshToken: process.env.OAUTH_REFRESH_TOKEN
//     }
// });

// //RUTA PARA SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// app.post("/recuperarPassword", (req, res) => {
//     const email = req.body.email;
//     if (!email) {
//         return res.status(400).send("Por favor digita tu Correo electrónico");
//     }

//     const resetToken = crypto.randomBytes(20).toString('hex');
//     console.log("Generated resetToken:", resetToken); // Verificar que el token se genera cada vez

//     const query = 'UPDATE usuario SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?';

//     conexión.query(query, [resetToken, Date.now() + 3600000, email], (err, result) => {
//         if (err) {
//             console.error("Error en la consulta:", err);
//             return res.status(500).send("Error al solicitar recuperación de contraseña");
//         }
//         if (result.affectedRows === 0) {
//             return res.status(404).send("Email no encontrado");
//         }

//         const mailOptions = {
//             from: 'wei21bedoya@gmail.com',
//             to: email,
//             subject: "Recuperación de contraseña",
//             text: `Haga click en el siguiente enlace para restablecer su contraseña: http://localhost:3000/reset_pass/${resetToken}`
//         };

//         transporter.sendMail(mailOptions, (err, info) => {
//             if (err) {
//                 console.error("Error al enviar el correo:", err);
//                 return res.status(500).send("Error al enviar el correo de recuperación");
//             }            
//             console.log(`Correo enviado a ${email}:`, info.response);
//             return res.status(201).send({ status: "ok", message: `Correo de recuperación enviado a ${email}`, resetToken: resetToken }); 
//         });
//     });
// });



// // RUTA PARA REESTABLECER LA CONTRASEÑA
// app.post('/cambiarPassword', (req, res) => {
//     const { new_password, repeat_password, resetToken } = req.body;

//     if (!new_password || !repeat_password) {
//         return res.status(400).json({ message: 'Por favor, complete todos los campos' });
//     }

//     if (new_password !== repeat_password) {
//         return res.status(400).json({ message: 'Las contraseñas no coinciden' });
//     }

//     const query = 'SELECT * FROM usuario WHERE resetPasswordToken = ? AND resetPasswordExpires < ?';
//     conexión.query(query, [resetToken, Date.now()], (err, results) => {
//         if (err) {
//             console.error("Error en la consulta:", err);
//             return res.status(500).json({ message: 'Error al restablecer la contraseña' });
//         }
//         if (results.length === 0) {
//             return res.status(400).send('El token es inválido o ha expirado');
//         }

//         const usuario = results[0];
//         const hashedPassword = bcryptjs.hashSync(new_password, 10);

//         const updateQuery = 'UPDATE usuario SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE email = ?';
//         conexión.query(updateQuery, [hashedPassword, usuario.email], (err, result) => {
//             if (err) {
//                 console.error("Error en la actualización:", err);
//                 return res.status(500).json({ message: 'Error al actualizar la contraseña' });
//             }
//             res.json({ message: `Contraseña actualizada exitosamente para usuario ${usuario.username}` });
//             console.log(`Contraseña restablecida para usuario ${usuario.username}`)
//         });
//     });
// });

//REGISTRO DE MASCOTAS

app.post("/mascotas", authentication.mascotas, function(req, res){
});

//RUTA PARA OBETENER DATOS DEL USUARIO
app.get('/datos_personales', (req, res) => {
    const user = req.query.username; // Usar req.query para obtener el parámetro de consulta
    console.log('Nombre de usuario recibido:', user); // Debugging
    if (!user) {
        res.status(400).send('Falta el parámetro username');
        return;
    }
    const sql = `SELECT * FROM usuario WHERE username = ?`;
  
    conexión.query(sql, [user], (err, result) => {
      if (err) {
        console.error('Error en la base de datos:', err); // Debugging
        res.status(500).send('Error en la base de datos');
        return;
      }
      if (result.length > 0) {
        res.json(result[0]);
      } else {
        res.status(404).send('Usuario no encontrado');
      }
    });
});

//RUTA PARA ACTUALIZAR DATOS PERSONALES
app.put('/datos_personales', async function (req, res) {
    try {
        const datos = req.body;

        const nombre = datos.nombre;
        const email = datos.email;
        const username = datos.username;
        const celular = datos.celular;
        const direccion = datos.direccion;

        // Verificar si el usuario existe
        const buscar = "SELECT * FROM usuario WHERE username = ?";
        const rows = await consultarBaseDeDatos(buscar, [username]);

        if (rows.length === 0) {
            console.log(`Usuario ${username} no encontrado`);
            return res.status(404).send(`Usuario ${username} no encontrado`);
        }

        // Consulta para actualizar los datos del usuario
        const actualizar = `
            UPDATE usuario 
            SET nombre = ?, email = ?, celular = ?, direccion = ? 
            WHERE username = ?
        `;
        await consultarBaseDeDatos(actualizar, [nombre, email, celular, direccion, username]);

        console.log(`Datos del usuario ${username} actualizados exitosamente`);
        res.status(200).send(`Datos del usuario ${username} actualizados exitosamente`);
    } catch (error) {
        console.error("Error al actualizar los datos del usuario:", error);
        res.status(500).send("Error interno del servidor");
    }
});

//RUTA PARA QUE EL USUARIO PUEDA MODIFICAR SU CONTRASEÑA
app.post("/modificarPassword", async (req, res) => {
    try {
        const datos = req.body;
        const { clave_actual, new_password, repeat_password, username } = datos;

        // Verificar que las contraseñas nuevas coincidan
        if (new_password !== repeat_password) {
            return res.status(400).send({ status: "Error", message: "Las contraseñas nuevas no coinciden" });
        }

        // Buscar la contraseña actual en la base de datos
        const buscar = "SELECT password FROM usuario WHERE username = ?";
        const rows = await consultarBaseDeDatos(buscar, [username]);

        if (rows.length === 0) {
            return res.status(404).send({ status: "Error", message: "Usuario no encontrado" });
        }

        const user = rows[0];

        // Verificar que la contraseña actual sea correcta
        const contraseñaValida = await bcryptjs.compare(clave_actual, user.password);
        if (!contraseñaValida) {
            return res.status(401).send({ status: "Error", message: "Contraseña actual incorrecta" });
        }

        // Encriptar la nueva contraseña
        const salt = await bcryptjs.genSalt(3);
        const hashPassword = await bcryptjs.hash(new_password, salt);

        // Actualizar la contraseña del usuario
        const actualizar = "UPDATE usuario SET password = ? WHERE username = ?";
        await consultarBaseDeDatos(actualizar, [hashPassword, username]);

        console.log(`Contraseña del usuario ${username} modificada exitosamente`);
        res.status(200).send({ status: "ok", message: `Contraseña modificada exitosamente para usuario ${username}`, redirect: "/homepage" });
    } catch (error) {
        console.error("Error al modificar la contraseña:", error);
        res.status(500).send({ status: "Error", message: "Error interno del servidor" });
    }
});


//RUTA PARA OBTENER DATOS DE MASCOTAS
app.get('/mascotas', (req, res) => {
    const idUsuario = req.query.id_usuario; // Usar req.query para obtener el parámetro de consulta
    console.log('Id usuario recibido:', idUsuario); 
    if (!idUsuario) {
        res.status(400).send('Falta el parámetro id_usuario');
        return;
    }
    const sql = `SELECT * FROM mascotas WHERE id_mascota = ?`;

    conexión.query(sql, [idUsuario], (err, result) => {
        if (err) {
            console.error('Error en la base de datos:', err); // Debugging
            res.status(500).send('Error en la base de datos');
            return;
        }
        if (result.length > 0) {
            res.json(result);
        } else {
            res.status(404).send('Mascotas no encontradas');
        }
    });
});

//Ruta para editar datos de mascotas
app.put('/datos_mascotas', async function (req, res) {
    try {
        const datos = req.body;
        const primary_key = datos.primary_key; // Usar primary_key aquí
        const {
            nombre, especie, raza, fecha_nto, sexo, peso, vacunacion, 
            desparasitacion, tipo_vivienda, tipo_alimentacion, trat_med_ant, 
            alergias_med, cual
        } = datos;

        // Verificar si la mascota existe usando primary_key
        const buscar = "SELECT * FROM mascotas WHERE primary_key = ?";
        const rows = await consultarBaseDeDatos(buscar, [primary_key]);

        if (rows.length === 0) {
            console.log(`Mascota ${primary_key} no encontrada`);
            return res.status(404).send(`Mascota ${primary_key} no encontrada`);
        }

        // Consulta para actualizar los datos de la mascota
        const actualizar = `
            UPDATE mascotas
            SET nombre = ?, especie = ?, raza = ?, fecha_nto = ?, sexo = ?, peso = ?, 
                vacunacion = ?, desparasitacion = ?, tipo_vivienda = ?, tipo_alimentacion = ?, 
                trat_med_ant = ?, alergias_med = ?, cual = ?
            WHERE primary_key = ?
        `;

        await consultarBaseDeDatos(actualizar, [
            nombre, especie, raza, fecha_nto, sexo, peso, vacunacion, 
            desparasitacion, tipo_vivienda, tipo_alimentacion, trat_med_ant, 
            alergias_med, cual, primary_key // Primary_key como último valor en la lista
        ]);

        console.log(`Datos de la mascota ${nombre} actualizados exitosamente`);
        res.status(200).send(`Datos de la mascota ${nombre} actualizados exitosamente`);
    } catch (error) {
        console.error("Error al actualizar los datos de la mascota:", error);
        res.status(500).send("Error interno del servidor");
    }
});

//Ruta para eliminar una mascota
app.delete('/datos_mascotas/:id', async function (req, res) {
    try {
        const primary_key = req.params.id;

        // Consulta para eliminar la mascota por primary_key
        const eliminarQuery = "DELETE FROM mascotas WHERE primary_key = ?";
        const result = await consultarBaseDeDatos(eliminarQuery, [primary_key]);

        if (result.affectedRows === 0) {
            return res.status(404).send(`Mascota con id ${primary_key} no encontrada`);
        }

        res.status(200).send(`Mascota con id ${primary_key} eliminada exitosamente`);
    } catch (error) {
        console.error("Error al eliminar la mascota:", error);
        res.status(500).send("Error interno del servidor");
    }
});

// RUTA PARA ELIMINAR LA CUENTA DE USUARIO
app.post("/eliminarCuenta", async (req, res) => {
    try {
        const { email, password } = req.body;
        const buscar = "SELECT email, password FROM usuario WHERE email = ?";
        const rows = await consultarBaseDeDatos(buscar, [email]);

        if (rows.length === 0) {
            return res.status(404).send({ status: "Error", message: "Usuario y/o contraseña incorrectos" });
        }

        const user = rows[0];
        const contraseñaValida = await bcryptjs.compare(password, user.password);
        if (!contraseñaValida) {
            return res.status(401).send({ status: "Error", message: "Usuario y/o contraseña incorrectos" });
        }

        const eliminar = "DELETE FROM usuario WHERE email = ?";
        await consultarBaseDeDatos(eliminar, [email]);

        const emailOptions = {
            from: 'VirtualVet <onboarding@resend.dev>',
            to: email,
            subject: `Cuenta Eliminada para ${user.email}`,
            html: `<p>Su cuenta ha sido eliminada exitosamente de VirtualVet.</p>`
        };

        const { data, error } = await resend.emails.send(emailOptions);
        if (error) {
            console.error("Error al enviar el correo:", error);
            return res.status(500).send("Error al enviar el correo de confirmación");
        }

        console.log(`Correo enviado a ${email}:`, data);
        console.log(`La cuenta del usuario ${email} fue eliminada exitosamente`);
        res.status(200).send({ status: "ok", message: `Cuenta eliminada exitosamente para usuario ${email}`, redirect: "/" });
    } catch (error) {
        console.error("Error al eliminar la cuenta:", error);
        res.status(500).send({ status: "Error", message: "Error interno del servidor" });
    }
});















