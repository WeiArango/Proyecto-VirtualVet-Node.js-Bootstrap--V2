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
//Importar crypto para generar un token aleatorio y enviar al usuario por email y reestablecer la contraseña
import crypto from "crypto";
import bcryptjs from "bcryptjs";
import bodyParser from "body-parser";
const app = express();


//Para realizar la consulta a la base de datos
import mysql from "mysql";

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
app.get("/homepage", authorization.soloHomepage, (req, res) => res.render("homepage"));
app.get("/mascotas", authorization.soloHomepage, (req, res) => res.render("mascotas"));
app.get("/datos_personales/:username", authorization.soloHomepage, (req, res) => res.render("datos_personales"));
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
app.post("/validar", authentication.login, (req, res) => {
     const datos = req.body;
     console.log(datos);

     let username = datos.numeroId;    
     let password = datos.password;    

     //Para buscar usuarios antes de login y comparar si ya existe
     let buscar = "SELECT * FROM usuario WHERE numeroId = ? AND password = ?";

     //Ejecutar la consulta de búsqueda
     conexión.query(buscar, [username, password], (error, rows) => {
         if (error) {
             console.error("Error al buscar usuario:", error);
             return res.status(500).send({ status: "Error", message: "Error interno del servidor" });
         }

         // Verificar si hay resultados en la consulta
         if (rows.length > 0) {
             // El usuario existe, se puede realizar la acción de ingreso
             console.log(`Bienvenido ${username} a nuestro portal`);
             return res.send({ status: "ok", message: "Usuario Registrado", token: `${token}`, redirect: "/homepage.ejs" });
         } else {
             // El usuario no existe
             console.log("Usuario no encontrado");
             return res.status(404).send({ status: "Error", message: "Usuario no encontrado" });
         }
     });
});

//CONFIGURACIÓN DE NODEMAILER
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.usergmail,
        pass: process.env.pass,
        clientId: process.env.OAUTH_CLIENTID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN
    }
});

//RUTA PARA SOLICITAR RECUPERACIÓN DE CONTRASEÑA
app.post("/recuperarPassword", (req, res) => {
    const email = req.body.email;
    if (!email) {
        return res.status(400).send("Por favor digita tu Correo electrónico");
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    console.log("Generated resetToken:", resetToken); // Verificar que el token se genera cada vez

    const query = 'UPDATE usuario SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?';

    conexión.query(query, [resetToken, Date.now() + 3600000, email], (err, result) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).send("Error al solicitar recuperación de contraseña");
        }
        if (result.affectedRows === 0) {
            return res.status(404).send("Email no encontrado");
        }

        const mailOptions = {
            from: 'wei21bedoya@gmail.com',
            to: email,
            subject: "Recuperación de contraseña",
            text: `Haga click en el siguiente enlace para restablecer su contraseña: http://localhost:3000/reset_pass/${resetToken}`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Error al enviar el correo:", err);
                return res.status(500).send("Error al enviar el correo de recuperación");
            }            
            console.log(`Correo enviado a ${email}:`, info.response);
            return res.status(201).send({ status: "ok", message: `Correo de recuperación enviado a ${email}`, resetToken: resetToken }); 
        });
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

    const query = 'SELECT * FROM usuario WHERE resetPasswordToken = ? AND resetPasswordExpires < ?';
    conexión.query(query, [resetToken, Date.now()], (err, results) => {
        if (err) {
            console.error("Error en la consulta:", err);
            return res.status(500).json({ message: 'Error al restablecer la contraseña' });
        }
        if (results.length === 0) {
            return res.status(400).send('El token es inválido o ha expirado');
        }

        const usuario = results[0];
        const hashedPassword = bcryptjs.hashSync(new_password, 10);

        const updateQuery = 'UPDATE usuario SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE email = ?';
        conexión.query(updateQuery, [hashedPassword, usuario.email], (err, result) => {
            if (err) {
                console.error("Error en la actualización:", err);
                return res.status(500).json({ message: 'Error al actualizar la contraseña' });
            }
            res.json({ message: `Contraseña actualizada exitosamente para usuario ${usuario.username}` });
            console.log(`Contraseña restablecida para usuario ${usuario.username}`)
        });
    });
});




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















