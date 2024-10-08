import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import { errorsDictionary } from '../config.js';
import CustomError from './customError.class.js';


export const verifyMongoDBId = (id) => {
    return (req, res, next) => {
        if (!config.MONGODB_ID_REGEX.test(req.params.id)){
            return res.status(400).send({ origin: config.SERVER, payload: null, error: 'El ID ingresado no es válido'});
        }
        next();
    }
}

export const createHash = password => bcrypt.hashSync(password, bcrypt.genSaltSync(10));

export const isValidPassword = (passwordToVerify, storedHash) => bcrypt.compareSync(passwordToVerify, storedHash);

export const createToken = (payload, duration) => jwt.sign(payload, config.SECRET, { expiresIn: duration });

export const verifyToken = (req, res, next) => {
    const headerToken = req.headers.authorization ? req.headers.authorization.split(' ')[1] : undefined;
    const cookieToken = req.cookies && req.cookies[`${config.APP_NAME}_cookie`] ? req.cookies[`${config.APP_NAME}_cookie`] : undefined;
    const queryToken = req.query.access_token ? req.query.access_token : undefined;
    const receivedToken = headerToken || cookieToken || queryToken;

    if (!receivedToken) return res.status(401).send({ origin: config.SERVER, payload: 'Se requiere token' });

    jwt.verify(receivedToken, config.SECRET, (err, payload) => {
        if (err) {
            return res.status(403).send({ origin: config.SERVER, payload: 'Token no válido' });
        }
        req.user = payload;
        next();
    });
};

export const verifyRequiredBody = (requiredFields) => {
    return (req, res, next) => {
        const allOk = requiredFields.every(field => 
            req.body.hasOwnProperty(field) && req.body[field] !== '' && req.body[field] !== null && req.body[field] !== undefined
        );
        
        if (!allOk) throw new CustomError(errorsDictionary.FEW_PARAMETERS); //Lo toma desde el control central de errores
      next();
    };
};

export const verifyDbConn = (req, res, next) => {
    MongoSingleton.getInstance();
    next();
}

export const handlePolicies = policies => {
    return async (req, res, next) => {
        console.log(req.user);
        if (!req.user) return res.status(401).send({ origin: config.SERVER, payload: 'Usuario no autenticado' });
        if (policies.includes('self') && req.user.cart_id === req.params.id) return next();
        if (policies.includes(req.user.role)) return next();
        res.status(403).send({ origin: config.SERVER, payload: 'No tiene permisos para acceder al recurso' });
    }
}

// Función para generar un código único para el ticket
export function generateUniqueTicketCode() {
    return 'TCKT' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

// Función para calcular el monto total de la compra
export function calculateTotalAmount(products) {
    let total = 0;
    products.forEach(item => {
        total += item.product.price * item.quantity;
    });
    return total;
}

