import { Router } from 'express';
import passport from 'passport';
import config from '../config.js';
import { createHash, isValidPassword, verifyRequiredBody, createToken, verifyToken } from '../services/utils.js';
import UserManager from '../controllers/usersManager.js';
import initAuthStrategies, {passportCall} from '../auth/passport.strategies.js';


const authRouter = Router();
const manager = new UserManager();
initAuthStrategies();

export const verifyAuthorization = (role) => {
    return async (req, res, next) => {
        if (!req.user) return res.status(401).send({ origin: config.SERVER, payload: 'Usuario no autenticado' });
        if (req.user.role !== role) return res.status(403).send({ origin: config.SERVER, payload: 'No tiene permisos de Administrador para ingresar' });
        
        next();
    }
}

export const handlePolicies = policies => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).send({ origin: config.SERVER, payload: 'Usuario no autenticado' });
        }
        if (!policies.includes(req.user.role)) {
            return res.status(403).send({ origin: config.SERVER, payload: 'No tiene permisos para acceder al recurso' });
        }
        next();
    }
}

// const adminAuth = (req, res, next) => {
//     if (req.session.user?.role !== 'admin') {
//         return res.status(403).send({ origin: config.SERVER, payload: 'Acceso no autorizado: se requiere autenticación y nivel de admin' });
//     }
//     next();
// }

authRouter.get('/counter', async (req, res) => {
    try {
        if (req.session.counter) {
            req.session.counter++
            res.status(200).send({ origin: config.SERVER, payload: `El sitio ha sido visitado ${req.session.counter} veces` });
        } else {
            req.session.counter = 1;
            res.status(200).send({ origin: config.SERVER, payload: `Bienvenido a nuestro sitio!!` });
        }
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

authRouter.get('/hash/:password', async (req, res) => {
    res.status(200).send({ origin: config.SERVER, payload: createHash(req.params.password) });
});

authRouter.post('/register', verifyRequiredBody(['firstName', 'lastName', 'email', 'password']), async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const foundUser = await manager.getOne({ email: email });
        if (!foundUser) {
            const process = await manager.addUser({ firstName, lastName, email, password: createHash(password)});
            res.status(200).send({ origin: config.SERVER, payload: process });
        } else {
            res.status(400).send({ origin: config.SERVER, payload: 'El email ya se encuentra registrado' });
        }
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

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

authRouter.post('/pplogin', verifyRequiredBody(['email', 'password']), passport.authenticate('login', { failureRedirect: `/login?error=${encodeURI('Usuario inexistente o clave no válida')}`}), async (req, res) => {
    try {
        req.session.user = req.user;
        req.session.save(err => {
            if (err) return res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
        
            res.redirect('/realtime_products');
            //res.redirect('/profile');
        });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

authRouter.post('/jwtlogin', verifyRequiredBody(['email', 'password']), passport.authenticate('login', { failureRedirect: `/login?error=${encodeURI('Usuario inexistente o clave no válida')}`}), async (req, res) => {
    try {
        const token = createToken(req.user, '1h');
        //res.cookie(`${config.APP_NAME}_cookie`, token, { maxAge: 60 * 60 * 1000, httpOnly: true });
        //res.status(200).send({ origin: config.SERVER, payload: 'Usuario autenticado' });
        res.status(200).send({ origin: config.SERVER, payload: 'Usuario autenticado', token: token });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

authRouter.get('/ghlogin', passport.authenticate('ghlogin', {scope: ['user:email']}), async (req, res) => {
});

authRouter.get('/ghlogincallback', passport.authenticate('ghlogin', {failureRedirect: `/login?error=${encodeURI('Error al identificar con Github')}`}), async (req, res) => {
    try {
        req.session.user = req.user // req.user es inyectado AUTOMATICAMENTE por Passport al parsear el done()
        req.session.save(err => {
            if (err) return res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
            
            res.redirect('/realtime_products');
            //res.redirect('/profile');
        });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

        // Ruta /admin con veryfyAuthorization

authRouter.get('/admin', verifyToken, verifyAuthorization ('admin'), async (req, res) => {
    try {
        res.status(200).send({ origin: config.SERVER, payload: `Bienvenido ADMIN !!` });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

        // Ruta /ppadmin con veryfyAuthorization

//authRouter.get('/ppadmin', passport.authenticate('jwtlogin', { session: false }), verifyAuthorization('admin'), async (req, res) => {
authRouter.get('/ppadmin', passportCall('jwtlogin'), verifyAuthorization('admin'), async (req, res) => {
        try {
            res.status(200).send({ origin: config.SERVER, payload: 'Bienvenido ADMIN!' });
        } catch (err) {
            res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
        }
    });

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

authRouter.get('/logout', async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) return res.status(500).send({ origin: config.SERVER, payload: 'Error al ejecutar logout', error: err });
            res.redirect('/login');
        });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

export default authRouter;