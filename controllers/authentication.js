import bcryptjs from "bcryptjs"; //Librería para encriptar los passwords
import JsonWebToken from "jsonwebtoken";//Librerías para generar pass (tokens) que el usuario nos va a proporcionar y poder verificar veracidad de información y además autorizar uso de datos, etc
import dotenv from "dotenv";
dotenv.config(); //Librería que nos ayuda a crear variables de entorno, osea un lugar para poner claves que no deberían publicarse nunca o no deberían estar a la vista del usuario final. Vamos a crear un archivo con el nombre .env en la carpeta raíz para poder crear este tipo de claves (Importante nunca compartir ese tipo de claves e ingresarla al archivo .gitignore junto)
//Para realizar la consulta a la base de datos
import mysql from "mysql";

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
    
    conexión.query(buscarUsuarioQuery, [username], async function(error, lista) {
        if (error) {
            throw error;
        } else {            
            if (lista.length > 0) {
                const usuario = lista[0];  
                const id_usuario = usuario.id_usuario;
                
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
                        secure: true        
                    };

                    res.cookie("jwt", token, cookieOption);

                    const responseData = {
                        status: "ok",
                        message: "Usuario Validado",
                        token: token,
                        redirect: "/homepage",
                        usuario: {
                            nombre: usuario.nombre,
                            username: usuario.username,
                            id_usuario: id_usuario
                        }                                              
                    };

                    return res.send(responseData);
                } else {
                    return res.status(401).send({ status: "Error", message: "Usuario o Contraseña incorrectos" });
                }
            } else {
                return res.status(404).send({ status: "Error", message: "Usuario no encontrado" });
            }                                           
        }    
    });
}

/* CONSULTA PARA BUSCAR EL USUARIO EN LA BASE DE DATOS
En este código, se realiza una consulta a la base de datos para buscar el usuario por su nombre (nombre). Luego se verifica que el usuario ingresado no exista en la base de datos */
/*Archivo Controlador de la autenticación*/
async function registro(req, res) { 
    //console.log(req.body);
    const nombre = req.body.nombre;
    const email = req.body.email;
    const username = req.body.username;
    const celular = req.body.celular;
    const direccion = req.body.direccion;
    const password = req.body.password;
    const tipoIdentificacion = req.body.tipoIdentificacion;
    const identificacion = req.body.identificacion;
    const tipoUsuario = req.body.tipoUsuario;
    if (!nombre || !email || !username || !celular || !direccion || !password || !tipoIdentificacion || !identificacion || !tipoUsuario) {
        return res.status(400).send({status:"Error", message: "Por favor digite todos los campos"});
    }
    //Consulta para verificar que el usuario no exista en la base de datos
    const buscarUsuarioQuery = "SELECT * FROM usuario WHERE username = ?";

    conexión.query(buscarUsuarioQuery, [username], async (error, rows) => {
        if (error) {
            throw error;
        } else {
            if (rows.length > 0) {
                const usuario = rows[{
                    nombre: rows.nombre,
                    email: rows.email,
                    username: rows.username,
                    celular: rows.celular,
                    direccion: rows.direccion,
                    password: rows.password,
                    tipoIdentificacion: rows.tipoIdentificacion,
                    identificacion: rows.identificacion,
                    tipoUsuario: rows.tipoUsuario
                }];
                console.log(usuario);
                
                // Si el usuario ya existe en la base de datos                
                return res.status(400).send({ status: "Error", message: "Este usuario ya existe" });
                } else {
                // Usuario no existe, proceder con el registro
                // Encriptar la contraseña
                const salt = await bcryptjs.genSalt(3);
                const hashPassword = await bcryptjs.hash(password, salt);   
                const nuevoUsuario = {
                    nombre,
                    email,
                    username,
                    celular,
                    direccion,
                    password: hashPassword,
                    tipoIdentificacion,
                    identificacion,
                    tipoUsuario
                }   
                console.log(nuevoUsuario),                
                usuario.push(nuevoUsuario);         

                // Insertar el nuevo usuario en la base de datos
                const registrarUsuario = "INSERT INTO usuario (nombre, email, username, celular, direccion, password, tipoIdentificacion, identificacion, tipoUsuario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

                conexión.query(registrarUsuario, [nombre, email, username, celular, direccion, hashPassword, tipoIdentificacion, identificacion, tipoUsuario], (error) => {
                    if (error) {
                        throw error;
                    } else {
                    console.log(`Usuario ${username} creado exitosamente`);
                    return res.status(201).send({ status: "ok", message: `Usuario ${nombre} creado exitosamente`, redirect: "/homepage" });
                    }
                });
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
        const edad = edadEnAnios.toFixed(1); // Redondear a un decimal

        let registrarMascota = "INSERT INTO mascotas (id_mascota, nombre, especie, raza, fecha_nto, edad_años, sexo, peso, vacunacion, desparasitacion, tipo_vivienda, tipo_alimentacion, trat_med_ant, alergias_med, cual) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        conexión.query(registrarMascota, [id_mascota, nombre, especie, raza, fecha_nto, edad, sexo, peso, vacunacion, desparasitacion, tipo_vivienda, tipo_alimentacion, trat_med_ant, alergias_med, cual], (error) => {
            if (error) {
                throw error;
            } else {
                const successMessage = `${nombre} fue registrado exitosamente`;
                res.status(200).send({ status: "Success", message: successMessage, resetForm: true, redirect: "/mascotas/${id_usuario}" });
                console.log(successMessage);
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
    reset_pass 
    
}







    