import { fork } from 'child_process';
import { Router } from 'express';

import config from '../config.js';

const baseRouter = Router();

const listNumbers = (...numbers) => {
    numbers.forEach(number => {
        if (isNaN(number)) {
            console.log('Invalid parameters');
            process.exit(-4);
        } else {
            console.log(number);
        }
    });
}

const complexOp = () => {
    let result = 0;
    for (let i = 0; i <= 3e9; i++ ) result += i // 3 000 000 000
    return result;
}

baseRouter.get('/', async (req, res) => {
    res.status(200).send({ origin: config.SERVER, payload: `Servidor activo por ${process.uptime().toFixed(1)}` });
});

//Endpoint para ejecución de una función que dispara un exit.
baseRouter.get('/list', async (req, res) => {
    listNumbers(1, 2, 3, 4, 5);
    res.status(200).send({ origin: config.SERVER, payload: `La función esta siendo ejecutada` });
});

//Endpoint standard que ejecuta la llamada a una operación que tarda mucho tiempo.
baseRouter.get('/complexwrong', async (req, res) => {
    res.status(200).send({ origin: config.SERVER, payload: complexOp() });
});

//Endpoint con CHILD PROCESS.
baseRouter.get('/complexok', async (req, res) => {
    const child = fork('src/complex.js');
    child.send('start');
    child.on('message', result => {
        res.status(200).send({ origin: config.SERVER, payload: result });
    });
});

export default baseRouter;
