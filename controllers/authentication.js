import bcryptjs from "bcryptjs"; //Librería para encriptar los passwords
import JsonWebToken from "jsonwebtoken";//Librerías para generar pass (tokens) que el usuario nos va a proporcionar y poder verificar veracidad de información y además autorizar uso de datos, etc
import dotenv from "dotenv";
dotenv.config(); //Librería que nos ayuda a crear variables de entorno, osea un lugar para poner claves que no deberían publicarse nunca o no deberían estar a la vista del usuario final. Vamos a crear un archivo con el nombre .env en la carpeta raíz para poder crear este tipo de claves (Importante nunca compartir ese tipo de claves e ingresarla al archivo .gitignore junto)
//Para realizar la consulta a la base de datos
import mysql from "mysql2";

// Configuración y creación de la conexión a la base de datos
const conexión = mysql.createConnection({
    host: process.env.host,
    database: process.env.database,
    user: process.env.user,
    password: process.env.password
})


/* CONSULTA PARA BUSCAR EL USUARIO EN LA BASE DE DATOS
En este código, se realiza una consulta a la base de datos para buscar el usuario por su nombre (name). Luego, se compara la contraseña proporcionada con la contraseña almacenada en la base de datos utilizando bcryptjs.compare. Si las contraseñas coinciden, se considera un inicio de sesión exitoso; de lo contrario, se informa al usuario sobre la contraseña incorrecta o la falta de coincidencia del usuario.*/
/*Archivo Controlador de la autenticación*/


async function login(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).send({ status: "Error", message: "Por favor digite todos los campos" });
    }

    const buscarUsuarioQuery = "SELECT * FROM usuario WHERE username = ?";
    const buscarAdminQuery = "SELECT * FROM admin WHERE username = ?";

    try {
        // Buscar en la tabla `usuario`
        const [usuario] = await new Promise((resolve, reject) => {
            conexión.query(buscarUsuarioQuery, [username], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });

        if (usuario) {
            const passwordMatch = await bcryptjs.compare(password, usuario.password);
            if (passwordMatch) {
                const token = JsonWebToken.sign(
                    { username: usuario.username },
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRATION }
                );

                const cookieOption = {
                    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                    path: "/",
                    sameSite: "None",
                    secure: true,
                };

                res.cookie("jwt", token, cookieOption);

                return res.json({
                    status: "ok",
                    message: "Usuario Validado",
                    token,
                    redirect: "/homepage", // Redirige a la página de usuario
                    usuario: {
                        nombre: usuario.nombre,
                        username: usuario.username,
                        id_usuario: usuario.id_usuario,
                    },
                });
            } else {
                return res.status(401).send({ status: "Error", message: "Usuario o Contraseña incorrectos" });
            }
        }

        // Si no se encuentra en `usuario`, buscar en la tabla `admin`
        const [admin] = await new Promise((resolve, reject) => {
            conexión.query(buscarAdminQuery, [username], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });

        if (admin) {
            const passwordMatch = await bcryptjs.compare(password, admin.password);
            if (passwordMatch) {
                const token = JsonWebToken.sign(
                    { username: admin.username },
                    process.env.JWT_SECRET,
                    { expiresIn: process.env.JWT_EXPIRATION }
                );

                const cookieOption = {
                    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                    path: "/",
                    sameSite: "None",
                    secure: true,
                };

                res.cookie("jwt", token, cookieOption);

                return res.json({
                    status: "ok",
                    message: "Admin Validado",
                    token,
                    redirect: "/admin", // Redirige a la página de admin
                    admin: {
                        nombre: admin.nombre,
                        username: admin.username,
                        id_admin: admin.id_admin,
                    },
                });
            } else {
                return res.status(401).send({ status: "Error", message: "Usuario o Contraseña incorrectos" });
            }
        }

        // Si no se encuentra en ninguna tabla
        return res.status(404).send({ status: "Error", message: "Usuario no encontrado" });

    } catch (error) {
        console.error("Error al validar usuario/admin:", error);
        return res.status(500).send({ status: "Error", message: "Error interno del servidor" });
    }
}



/* CONSULTA PARA BUSCAR EL USUARIO EN LA BASE DE DATOS
En este código, se realiza una consulta a la base de datos para buscar el usuario por su nombre (nombre). Luego se verifica que el usuario ingresado no exista en la base de datos */
/*Archivo Controlador de la autenticación*/
async function registro(req, res) {
    const {
        nombre,
        email,
        username,
        celular,
        direccion,
        password,
        tipoIdentificacion,
        identificacion,
        tipoUsuario // Este es el valor "Administrador" o "Usuario"
    } = req.body;

    // Validación de campos requeridos
    if (!email || !username || !password || !tipoUsuario) {
        return res.status(400).send({ status: "Error", message: "Por favor digite todos los campos obligatorios" });
    }

    // Asegurar que tipoUsuario es válido
    if (!['Administrador', 'Usuario', 'Médico Veterinario', 'Auxiliar Veterinario', 'Estilista de Mascotas', 'Paseador Canino'].includes(tipoUsuario)) {
        return res.status(400).send({ status: "Error", message: "Tipo de usuario inválido" });
    }

    // Verificar si ya existe el correo o el nombre de usuario
    const buscarUsuarioQuery = "SELECT * FROM usuario WHERE email = ? OR username = ? UNION SELECT * FROM admin WHERE email = ? OR username = ?";
    const valoresConsulta = [email, username, email, username];

    conexión.query(buscarUsuarioQuery, valoresConsulta, async (error, rows) => {
        if (error) {
            console.error("Error al buscar usuarios:", error.message);
            return res.status(500).send({ status: "Error", message: "Error del servidor" });
        }

        if (rows.length > 0) {
            // Comprobamos si el email o username ya existen
            const existingUser = rows[0];
            if (existingUser.email === email) {
                return res.status(400).send({ status: "Error", message: "Este correo electrónico ya está registrado" });
            } else if (existingUser.username === username) {
                return res.status(400).send({ status: "Error", message: "Este nombre de usuario ya está en uso" });
            }
        } else {
            // Crear nuevo usuario
            try {
                const salt = await bcryptjs.genSalt(10);
                const hashPassword = await bcryptjs.hash(password, salt);

                // Seleccionar tabla según tipoUsuario
                const tabla = tipoUsuario === 'Administrador' ? 'admin' : 'usuario';

                const registrarUsuario = `
                    INSERT INTO ${tabla} (nombre, email, username, celular, direccion, password, tipoIdentificacion, identificacion, tipoUsuario)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const valoresRegistro = [
                    nombre,
                    email,
                    username,
                    celular,
                    direccion,
                    hashPassword,
                    tipoIdentificacion,
                    identificacion,
                    tipoUsuario,
                ];

                conexión.query(registrarUsuario, valoresRegistro, (error) => {
                    if (error) {
                        console.error("Error al registrar usuario:", error.message);
                        return res.status(500).send({ status: "Error", message: "Error al registrar el usuario" });
                    } else {
                        console.log(`Usuario ${username} registrado exitosamente como ${tipoUsuario}`);
                        const successMessage = `${nombre} fue registrado exitosamente como ${tipoUsuario}`;
                        res.status(201).send({ status: "ok", message: successMessage, resetForm: true, redirect: "/" });
                    }
                });
            } catch (error) {
                console.error("Error al encriptar contraseña:", error.message);
                res.status(500).send({ status: "Error", message: "Error interno del servidor" });
            }
        }
    });
}


async function recover_pass(req, res) {
    console.log("autenticacion", req.body);
    const email = req.body.email;

    if (!email) {
        res.status(400).send({ status: "Error", message: "Por favor digita tu email" });      
    } 
    
    const tokenResetPass = crypto.randomBytes(20).toString('hex');
    const buscarEmailQuery = "UPDATE usuario SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?"

    
     conexión.query(buscarEmailQuery, [tokenResetPass, Date.now() + 3600000, email], async function (error, result) {
        if (error) {
            console.error("Error en la consulta:", error);
            return res.status(500).send("Error al solicitar recuperación de contraseña");
        }
        if (result.affectedRows > 0) {
            const cookieOption = {
                expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                path: "/recover_pass",
                sameSite: "None",
                secure: true
            };

            res.cookie("jwt", tokenResetPass, cookieOption);

            const responseData = {
                status: "ok",
                message: `Correo de recuperación enviado a ${email}`,
                token: tokenResetPass,
                redirect: "/"
            };
            return res.send(responseData);
        } else {
            return res.status(401).send({ status: "Error", message: "Email no encontrado" });
        }
    });
}

async function reset_pass(req, res) {
    console.log("autenticacion", req.body);
    const { new_password, repeat_password } = req.body;

    if (!new_password || !repeat_password) {
        return res.status(400).send({ status: "Error", message: "Por favor digita todos los campos" });
    } else {
        const datos = req.body;
        console.log(datos);        
}}

// async function datos_personales(req, res) {
//     const username = req.body.username;    
    
//     if (!username) {
//         return res.status(400).send({status: "Error", message: "Username no encontrado"});
//     }

//     const buscarUsuarioQuery = "SELECT * FROM usuario WHERE username = ?";        
    
//     conexión.query(buscarUsuarioQuery, [username], async function(error, lista) {
//         if (error) {
//             throw error;
//         } else {            
//             if (lista.length > 0) {
//                 const usuario = lista[0];                 

//                     const responseData = {
//                         status: "ok",
//                         message: "Usuario Validado",
//                         redirect: "/datos_personales",
//                         usuario: {
//                             username: usuario.username // Incluir el nombre de usuario en la respuesta
//                         }                                              
//                     };
//                     return res.send(responseData);
//                 } else {
//                     return res.status(401).send({ status: "Error", message: "Usuario incorrecto" });
//                 }                                                       
//         }    
//     });
// }

async function mascotas(req, res) {
    console.log("autenticacion", req.body);
    const nombre = req.body.nombre;

    if (!nombre) {
        res.status(400).send({ status: "Error", message: "Por favor digita el nombre de tu mascota" });
    } else {
        const datos = req.body;
        console.log(datos);

        let id_mascota = datos.id_mascota;
        let nombre = datos.nombre;
        let especie = datos.especie;
        let raza = datos.raza;       
        let fecha_nto = datos.fecha_nto;
        let sexo = datos.sexo;
        let peso = datos.peso;
        let vacunacion = datos.vacunacion;
        let desparasitacion = datos.desparasitacion;
        let tipo_vivienda = datos.tipo_vivienda;
        let tipo_alimentacion = datos.tipo_alimentacion;
        let trat_med_ant = datos.trat_med_ant;
        let alergias_med = datos.alergias_med;
        let cual = datos.cual;

        // Calcular la edad en años con decimales
        const nacimiento = new Date(fecha_nto);
        const hoy = new Date();
        const edadEnMilisegundos = hoy - nacimiento;
        const edadEnAnios = edadEnMilisegundos / (1000 * 60 * 60 * 24 * 365.25);
        const edadenanios = edadEnAnios.toFixed(1); // Redondear a un decimal       

        let registrarMascota = "INSERT INTO mascotas (id_mascota, nombre, especie, raza, edadenanios, fecha_nto, sexo, peso, vacunacion, desparasitacion, tipo_vivienda, tipo_alimentacion, trat_med_ant, alergias_med, cual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        conexión.query(registrarMascota, [id_mascota, nombre, especie, raza, edadenanios, fecha_nto, sexo, peso, vacunacion, desparasitacion, tipo_vivienda, tipo_alimentacion, trat_med_ant, alergias_med, cual], (error) => {
            if (error) {
                throw error;
            } else {
                const successMessage = `${nombre} fue registrado exitosamente`;
                res.status(200).send({ status: "Success", message: successMessage, resetForm: true, redirect: "/mascotas/${id_usuario}" });
                console.log(successMessage);
                console.log("La edad de " + nombre + " es de " + edadenanios + " años")
            }
        });
    }
}




export const usuario = []
export const methods = {
    login, 
    registro,
    mascotas,
    recover_pass,
    reset_pass,
    conexión     
}







    