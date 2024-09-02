import winston from 'winston';
import config from '../config.js';

//Defino Transporte (a donde se va a mostrar) y Nivel de errores (verbose en adelante)
const devLogger = winston.createLogger({
    transports: [
        new winston.transports.Console({ level: 'debug' }),
    ]
});

const prodLogger = winston.createLogger({
    transports: [
        new winston.transports.Console({ level: 'debug' }),
        new winston.transports.File({ level: 'error', filename: `${config.DIRNAME}/logs/errors.log` })
    ]
});


const addLogger = (req, res, next) => {
    //req.logger = devLogger;
    req.logger = config.MODE === 'dev' ? devLogger : prodLogger;
    req.logger.error(`${new Date().toDateString()} ${req.method} ${req.url}`);

    next();
}

export default addLogger;

