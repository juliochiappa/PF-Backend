import { Router } from "express";
import passport from "passport";
import config from "../config.js";
import { createHash, isValidPassword, verifyRequiredBody, createToken, verifyToken,} from "../services/utils.js";
import UserManager from "../controllers/usersManager.js";
import initAuthStrategies, { passportCall,} from "../auth/passport.strategies.js";
import { uploader } from "../services/uploader.js";
import multer from "multer";

const authRouter = Router();
const manager = new UserManager();
initAuthStrategies();

// Configuración de multer para almacenar los archivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../public/img'); // Directorio donde se almacenarán los archivos
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Nombra los archivos con un timestamp
    }
});

//const upload = multer({ storage: storage });

export const verifyAuthorization = (role) => {
  return async (req, res, next) => {
    if (!req.user)
      return res
        .status(401)
        .send({ origin: config.SERVER, payload: "Usuario no autenticado" });
    if (req.user.role !== role)
      return res
        .status(403)
        .send({
          origin: config.SERVER,
          payload: "No tiene permisos de Administrador para ingresar",
        });

    next();
  };
};

export const handlePolicies = (policies) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .send({ origin: config.SERVER, payload: "Usuario no autenticado" });
    }
    if (!policies.includes(req.user.role)) {
      return res
        .status(403)
        .send({
          origin: config.SERVER,
          payload: "No tiene permisos para acceder al recurso",
        });
    }
    next();
  };
};

// const adminAuth = (req, res, next) => {
//     if (req.session.user?.role !== 'admin') {
//         return res.status(403).send({ origin: config.SERVER, payload: 'Acceso no autorizado: se requiere autenticación y nivel de admin' });
//     }
//     next();
// }

authRouter.get("/counter", async (req, res) => {
  try {
    if (req.session.counter) {
      req.session.counter++;
      res
        .status(200)
        .send({
          origin: config.SERVER,
          payload: `El sitio ha sido visitado ${req.session.counter} veces`,
        });
    } else {
      req.session.counter = 1;
      res
        .status(200)
        .send({
          origin: config.SERVER,
          payload: `Bienvenido a nuestro sitio!!`,
        });
    }
  } catch (err) {
    res
      .status(500)
      .send({ origin: config.SERVER, payload: null, error: err.message });
  }
});

authRouter.get("/hash/:password", async (req, res) => {
  res
    .status(200)
    .send({ origin: config.SERVER, payload: createHash(req.params.password) });
});

authRouter.post(
  "/register",
  verifyRequiredBody(["firstName", "lastName", "email", "password"]),
  async (req, res) => {
    try {
      const { firstName, lastName, email, password } = req.body;
      const foundUser = await manager.getOne({ email: email });
      if (!foundUser) {
        const process = await manager.addUser({
          firstName,
          lastName,
          email,
          password: createHash(password),
        });
        res.status(200).send({ origin: config.SERVER, payload: process });
      } else {
        res
          .status(400)
          .send({
            origin: config.SERVER,
            payload: "El email ya se encuentra registrado",
          });
      }
    } catch (err) {
      res
        .status(500)
        .send({ origin: config.SERVER, payload: null, error: err.message });
    }
  }
);

authRouter.post('/login', verifyRequiredBody(['email', 'password']), async (req, res) => {
    try {
        const { email, password } = req.body;
        const foundUser = await manager.getOne({ email: email });
        if (foundUser && isValidPassword(password, foundUser.password)) {
            const { password, ...filteredFoundUser } = foundUser;
            req.session.user = filteredFoundUser;
            req.session.save(err => {
                if (err) return res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
                //res.redirect('/realtime_products');
                res.redirect('/profile');
            });
        } else {
            res.status(401).send({ origin: config.SERVER, payload: 'Datos de acceso no válidos' });
        }
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

authRouter.post(
  "/pplogin",
  verifyRequiredBody(["email", "password"]),
  passport.authenticate("login", {
    failureRedirect: `/login?error=${encodeURI(
      "Usuario inexistente o clave no válida"
    )}`,
  }),
  async (req, res) => {
    try {
      req.session.user = req.user;
      req.session.save((err) => {
        if (err)
          return res
            .status(500)
            .send({ origin: config.SERVER, payload: null, error: err.message });

        res.redirect("/realtime_products");
        //res.redirect('/profile');
      });
    } catch (err) {
      res
        .status(500)
        .send({ origin: config.SERVER, payload: null, error: err.message });
    }
  }
);

// Ruta para solicitar restablecimiento de contraseña
authRouter.post(
  "/forgot-password",
  verifyRequiredBody(["email"]),
  async (req, res) => {
    try {
      const { email } = req.body;
      const user = await manager.getOne({ email: email });

      if (!user) {
        return res
          .status(400)
          .send({ message: "No se encontró una cuenta con ese email." });
      }

      const token = generateResetToken(); // Genera el token
      await storeResetToken(user, token); // Guarda el token en la base de datos

      const resetLink = generateResetLink(req, token); // Genera el enlace de restablecimiento

      await sendResetEmail(user.email, resetLink); // Envía el enlace por correo

      res
        .status(200)
        .send({
          message:
            "Se ha enviado un enlace de restablecimiento de contraseña a tu email.",
        });
    } catch (err) {
      res
        .status(500)
        .send({ error: "Error en el servidor. Inténtalo de nuevo más tarde." });
    }
  }
);

// Ruta para manejar el restablecimiento de contraseña
authRouter.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await manager.getOne({ resetPasswordToken: token });

    if (!user || user.resetPasswordExpires < Date.now()) {
      return res
        .status(400)
        .send({
          message: "El enlace ha expirado. Por favor, solicita uno nuevo.",
        });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res
        .status(400)
        .send({
          message: "No puedes usar la misma contraseña. Elige una nueva.",
        });
    }

    user.password = await bcrypt.hash(newPassword, 10); // Hash de la nueva contraseña
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).send({ message: "Contraseña restablecida con éxito." });
  } catch (err) {
    res
      .status(500)
      .send({ error: "Error en el servidor. Inténtalo de nuevo más tarde." });
  }
});

// authRouter.post('/jwtlogin', verifyRequiredBody(['email', 'password']), passport.authenticate('login', { failureRedirect: `/login?error=${encodeURI('Usuario inexistente o clave no válida')}`}), async (req, res) => {
//     try {
//         const token = createToken(req.user, '1h');
         //res.cookie(`${config.APP_NAME}_cookie`, token, { maxAge: 60 * 60 * 1000, httpOnly: true });
         //res.status(200).send({ origin: config.SERVER, payload: 'Usuario autenticado' });
//         res.status(200).send({ origin: config.SERVER, payload: 'Usuario autenticado', token: token });
//     } catch (err) {
//         res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
//     }
// });

// authRouter.post('/jwtlogin', verifyRequiredBody(['email', 'password']), passport.authenticate('login', { failureRedirect: `/login?error=${encodeURI('Usuario inexistente o clave no válida. ¿Olvidaste tu contraseña? Puedes restablecerla aquí: /forgot-password')}`}), async (req, res) => {
//         try {
//             const token = createToken(req.user, '1h');
//             res.status(200).send({ origin: config.SERVER, payload: 'Usuario autenticado', token: token });
//         } catch (err) {
//             res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
//         }
//     }
// );


// Ruta con passport y multer

// authRouter.post('/jwtlogin', uploader.array('documents', 4), verifyRequiredBody(['email', 'password']),
//         passport.authenticate('login', {failureRedirect: `/login?error=${encodeURI('Usuario inexistente o clave no válida. ¿Olvidaste tu contraseña? Puedes restablecerla aquí: /forgot-password')}`}), 
//     async (req, res) => {
//         try {
//           // Si se subieron archivos, procesar la información
//             if (req.files && req.files.length > 0) {
//                 const documents = req.files.map(file => ({
//                     name: file.originalname,
//                     reference: file.path
//                 }));
//               // Guardar los documentos en el usuario autenticado
//                 req.user.documents = documents;
//                 await req.user.save();
//             }
//           // Generar el token JWT
//             const token = createToken(req.user, '1h');
//             res.status(200).send({ origin: config.SERVER, payload: 'Usuario autenticado', token: token });
//         } catch (err) {
//             res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
//         }
//     }
// );

authRouter.post('/jwtlogin', uploader.array('documents', 3), verifyRequiredBody(['email', 'password']),
    passport.authenticate('login', { 
        failureRedirect: `/login?error=${encodeURI('Usuario inexistente o clave no válida. ¿Olvidaste tu contraseña? Puedes restablecerla aquí: /forgot-password')}` 
    }), 
    async (req, res) => {
        try {
            // Si se subieron archivos, procesar la información
            let documents = [];
            if (req.files && req.files.length > 0) {
                documents = req.files.map(file => ({
                    name: file.originalname,
                    reference: file.path
                }));
            }

            // Filtrar el usuario por su ID (req.user._id)
            const filter = { _id: req.user._id };

            // Actualizar los documentos y el campo last_connection del usuario
            const update = {
                documents, 
                last_connection: new Date() // Actualiza la última conexión a la fecha actual
            };

            // Opciones: devolver el documento actualizado y correr validaciones
            const options = { new: true, runValidators: true };

            // Actualizar los documentos y la última conexión en la base de datos
            const updatedUser = await manager.updateUser(filter, update, options);
            
            if (!updatedUser) {
                return res.status(404).send({ origin: config.SERVER, payload: null, error: 'Usuario no encontrado' });
            }

            // Generar el token JWT
            const token = createToken(req.user, '1h');
            res.status(200).send({ origin: config.SERVER, payload: 'Usuario autenticado', token: token });
        } catch (err) {
            res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
        }
    }
);

authRouter.get(
  "/ghlogin",
  passport.authenticate("ghlogin", { scope: ["user:email"] }),
  async (req, res) => {}
);

authRouter.get(
  "/ghlogincallback",
  passport.authenticate("ghlogin", {
    failureRedirect: `/login?error=${encodeURI(
      "Error al identificar con Github"
    )}`,
  }),
  async (req, res) => {
    try {
      req.session.user = req.user; // req.user es inyectado AUTOMATICAMENTE por Passport al parsear el done()
      req.session.save((err) => {
        if (err)
          return res
            .status(500)
            .send({ origin: config.SERVER, payload: null, error: err.message });

        res.redirect("/realtime_products");
        //res.redirect('/profile');
      });
    } catch (err) {
      res
        .status(500)
        .send({ origin: config.SERVER, payload: null, error: err.message });
    }
  }
);

// Ruta /admin con veryfyAuthorization

authRouter.get(
  "/admin",
  verifyToken,
  verifyAuthorization("admin"),
  async (req, res) => {
    try {
      res
        .status(200)
        .send({ origin: config.SERVER, payload: `Bienvenido ADMIN !!` });
    } catch (err) {
      res
        .status(500)
        .send({ origin: config.SERVER, payload: null, error: err.message });
    }
  }
);

// Ruta /ppadmin con veryfyAuthorization

//authRouter.get('/ppadmin', passport.authenticate('jwtlogin', { session: false }), verifyAuthorization('admin'), async (req, res) => {
authRouter.get(
  "/ppadmin",
  passportCall("jwtlogin"),
  verifyAuthorization("admin"),
  async (req, res) => {
    try {
      res
        .status(200)
        .send({ origin: config.SERVER, payload: "Bienvenido ADMIN!" });
    } catch (err) {
      res
        .status(500)
        .send({ origin: config.SERVER, payload: null, error: err.message });
    }
  }
);

// Ruta /admin con handlePolicies

// authRouter.get('/admin', verifyToken, handlePolicies(['admin']), async (req, res) => {
//            try {
//                res.status(200).send({ origin: config.SERVER, payload: 'Bienvenido ADMIN!' });
//            } catch (err) {
//                res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
//            }
//        });

// Ruta /ppadmin con handlePolicies

// authRouter.get('/ppadmin', passportCall('jwtlogin'), handlePolicies(['admin']), async (req, res) => {
//            try {
//                res.status(200).send({ origin: config.SERVER, payload: 'Bienvenido ADMIN!' });
//            } catch (err) {
//                res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
//            }
//        });

authRouter.get("/logout", async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err)
        return res
          .status(500)
          .send({
            origin: config.SERVER,
            payload: "Error al ejecutar logout",
            error: err,
          });
      res.redirect("/login");
    });
  } catch (err) {
    res
      .status(500)
      .send({ origin: config.SERVER, payload: null, error: err.message });
  }
});

authRouter.get("/current", verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (!user)
      return res
        .status(401)
        .send({ origin: config.SERVER, payload: "Usuario no autenticado" });
    res.status(200).send({ status: "success", payload: user });
  } catch (err) {
    res
      .status(500)
      .send({ origin: config.SERVER, payload: null, error: err.message });
  }
});

export default authRouter;
