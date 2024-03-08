//Configuración librerías
import express from "express";
//Para poder ver las res obtenidas en consola
import morgan from "morgan";
import cookieParser from "cookie-parser";
//Fix para __dirname (como desplegamos type : module tenemos que generar estas tres lineas para importar archivos a este archivo)
import path from "path";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import dotenv from "dotenv";
dotenv.config();
//Importación de la autenticación y la autorización
import { methods as authentication, usuario } from "./controllers/authentication.js";
import { methods as authorization } from "./middlewares/authorization.js";
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

//Para utilizar el motor de vistas ejs que fusiona el html con js
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Para servir el frame Bootstrap
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));


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
app.get("/homepage", authorization.soloHomepage, (req, res) => res.render("homepage"));
app.get("/mascotas", authorization.soloHomepage, (req, res) => res.render("mascotas"));
//Endpoints




//Para validar la ruta del servidor
//REGISTRO DE USUARIOS
app.post("/registrar", authentication.registro, async function (req, res) {
    try {
        const datos = req.body;
        //console.log(datos);

        const usuario = datos.name;
        const correo = datos.email;
        const telefono = datos.phone;
        const direccion = datos.adress;
        const contraseña = datos.password;
        const tipo_de_identificacion = datos.tipoIdentificacion;
        const numero_de_identificacion = datos.numeroId;
        const tipo_de_usuario = datos.tipoUsuario;

        // Verificar si el usuario ya existe
        const buscar = "SELECT * FROM usuario WHERE numeriId = ?";
        const rows = await consultarBaseDeDatos(buscar, [usuario]);        

        if (rows.length > 0) {
            console.log("No se puede registrar, usuario ya existe");
            return res.status(400).send("Usuario ya existe");
        }
       
        const registrar = "INSERT INTO usuario (name, email, phone, adress, password, tipoIdentificacion, numeroId, tipoUsuario) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        await consultarBaseDeDatos(registrar, [usuario, correo, telefono, direccion, contraseña, tipo_de_identificacion, numero_de_identificacion, tipo_de_usuario]);

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

    let usuario = datos.numeroId;    
    let contraseña = datos.password;    

    //Para buscar usuarios antes de login y comparar si ya existe
    let buscar = "SELECT * FROM usuario WHERE numeroId = ? AND password = ?";

    //Ejecutar la consulta de búsqueda
    conexión.query(buscar, [usuario, contraseña], (error, rows) => {
        if (error) {
            console.error("Error al buscar usuario:", error);
            return res.status(500).send({ status: "Error", message: "Error interno del servidor" });
        }

        // Verificar si hay resultados en la consulta
        if (rows.length > 0) {
            // El usuario existe, se puede realizar la acción de ingreso
            console.log(`Bienvenido ${usuario} a nuestro portal`);
            return res.send({ status: "ok", message: "Usuario Registrado", redirect: "/homepage.ejs" });
        } else {
            // El usuario no existe
            console.log("Usuario no encontrado");
            return res.status(404).send({ status: "Error", message: "Usuario no encontrado" });
        }
    });
});

//REGRISTRO DE MASCOTAS
app.post("/mascotas", authentication.mascotas, function(req, res){});

//Configuración del puerto
app.listen(3000, function () {
    console.log(`Servidor http://localhost:3000 creado correctamente`);
});

