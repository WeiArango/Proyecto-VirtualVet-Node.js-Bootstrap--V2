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
    console.log(req.body);
    const numeroId = req.body.numeroId;
    const password = req.body.password;
    
    if (!numeroId || !password) {
        return res.status(400).send({status:"Error", message: "Por favor digite todos los campos"});
    }

    const buscarUsuarioQuery = "SELECT * FROM usuario WHERE numeroId = ?";
    
    conexión.query(buscarUsuarioQuery, [numeroId], async function(error, lista) {
        if (error) {
            throw error;
        } else {            
            if (lista.length > 0) {
                const usuario = lista[0];
                console.log("usuario", usuario);                

                // Comparar la contraseña ingresada con la contraseña almacenada en la base de datos
                const passwordMatch = await bcryptjs.compare(password, usuario.password);
                if (passwordMatch) {
                    // Generar tokens cuando el login sea correcto
                    const token = JsonWebToken.sign(
                        { numeroId: usuario.numeroId },
                        process.env.JWT_SECRET, 
                        { expiresIn: process.env.JWT_EXPIRATION }
                    );
                    console.log("Este es el token", token)
                    console.log("Este es el passwordMatch", passwordMatch)
                    

                    // Configurar la cookie
                    const cookieOption = {
                        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 5000),
                        path: "/",
                        sameSite: "None",
                        secure: true        
                    }
                    console.log("Esta es la cookieOption", cookieOption)

                    // Enviar la cookie al usuario
                    res.cookie("jwt", token, cookieOption);

                    // Contraseña válida, el usuario puede autenticarse
                    return res.send({ status: "ok", message: "Usuario Registrado", redirect: "/homepage" });
                } else {
                    // Contraseña no válida
                    return res.status(401).send({ status: "Error", message: "Usuario o Contraseña incorrectos" });
                }
            } else {
                // Usuario no encontrado
                return res.status(404).send({ status: "Error", message: "Usuario no encontrado" });
            }                                           
        }    
    });
}



/* CONSULTA PARA BUSCAR EL USUARIO EN LA BASE DE DATOS
En este código, se realiza una consulta a la base de datos para buscar el usuario por su nombre (name). Luego se verifica que el usuario ingresado no exista en la base de datos */
/*Archivo Controlador de la autenticación*/
async function registro(req, res) { 
    //console.log(req.body);
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const adress = req.body.adress;
    const password = req.body.password;
    const tipoIdentificacion = req.body.tipoIdentificacion;
    const numeroId = req.body.numeroId;
    const tipoUsuario = req.body.tipoUsuario;
    if (!name || !email || !phone || !adress || !password || !tipoIdentificacion || !numeroId || !tipoUsuario) {
        return res.status(400).send({status:"Error", message: "Por favor digite todos los campos"});
    }
    //Consulta para verificar que el usuario no exista en la base de datos
    const buscarUsuarioQuery = "SELECT * FROM usuario WHERE numeroId = ?";

    conexión.query(buscarUsuarioQuery, [numeroId], async (error, rows) => {
        if (error) {
            throw error;
        } else {
            if (rows.length > 0) {
                const usuario = rows[{
                    name: rows.name,
                    email: rows.email,
                    phone: rows.phone,
                    adress: rows.adress,
                    password: rows.password,
                    tipoIdentificacion: rows.tipoIdentificacion,
                    numeroId: rows.numeroId,
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
                    name,
                    email,
                    phone,
                    adress,
                    password: hashPassword,
                    tipoIdentificacion,
                    numeroId,
                    tipoUsuario
                }   
                console.log(nuevoUsuario),                
                usuario.push(nuevoUsuario);         

                // Insertar el nuevo usuario en la base de datos
                const registrarUsuario = "INSERT INTO usuario (name, email, phone, adress, password, tipoIdentificacion, numeroId, tipoUsuario) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

                conexión.query(registrarUsuario, [name, email, phone, adress, hashPassword, tipoIdentificacion, numeroId, tipoUsuario], (error) => {
                    if (error) {
                        throw error;
                    } else {
                    console.log(`Usuario ${name} creado exitosamente`);
                    return res.status(201).send({ status: "ok", message: `Usuario ${name} creado exitosamente`, redirect: "/homepage" });
                    }
                });
            }
        }                      
    });    
}    

async function mascotas(req, res) {
     console.log("autenticacion", req.body);
     const name = req.body.name;    
     if(!name){
         res.status(400).send({status: "Error", message: "Por favor digita el nombre de tu mascota"})
     } else {

     const datos = req.body;
     console.log(datos);
 
     let nombre = datos.name;
     let raza = datos.race;
     let edad = datos.birthDate;
     let peso = datos.weight;
     let especie = datos.species;
     let sexo = datos.sex;
     let alimento = datos.food;
     let vacunacion = datos.vaccination;
     let desparasitacion = datos.deworming;
     let vivienda = datos.livingPlace;
     let alergias = datos.allergies;
     let cual = datos.which; 

     let registrarMascota = "INSERT INTO mascotas (name, race, birthDate, weight, species, sex, food, vaccination, deworming, livingPlace, allergies, which) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

     conexión.query(registrarMascota, [nombre, raza, edad, peso, especie, sexo, alimento, vacunacion, desparasitacion, vivienda, alergias, cual], (error) => {
        if(error) {
            throw error;
        } else {
            console.log(`${nombre} fué registrado exitosamente`);
        }
     })
    }
}

export const usuario = []
export const methods = {
    login, 
    registro,
    mascotas 
         
}







    