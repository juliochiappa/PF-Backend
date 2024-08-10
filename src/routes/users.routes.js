import { Router } from 'express';
import config from '../config.js';
import UserManager from '../controllers/usersManager.js';
import nodemailer from 'nodemailer';
import { verifyToken, handlePolicies } from '../services/utils.js';

const usersRouter = Router();
const manager = new UserManager();

usersRouter.get('/aggregate/:role', async (req, res) => {
    try {
        if (req.params.role === 'admin' || req.params.role === 'premium' || req.params.role === 'user') {
            const match = { role: req.params.role };
            const group = { _id: '$region', totalGrade: {$sum: '$grade'} };
            const sort = { totalGrade: -1 };

            const process = await manager.getAggregated(match, group, sort);

            res.status(200).send({ origin: config.SERVER, payload: process });
        } else {
            res.status(200).send({ origin: config.SERVER, payload: null, error: 'role: solo se acepta admin, premium o user' });
        }
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

usersRouter.get('/paginate/:page/:limit', async (req, res) => {
    try {
        const filter = { role: 'admin' };
        const options = { page: req.params.page, limit: req.params.limit, sort: { lastName: 1 } };

        const process = await manager.getPaginated(filter, options);

        res.status(200).send({ origin: config.SERVER, payload: process });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

usersRouter.post('/', async (req, res) => {
    try {
        const process = await manager.addUser(req.body);
        
        res.status(200).send({ origin: config.SERVER, payload: process });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

usersRouter.put('/:id', async (req, res) => {
    try {
        const filter = { _id: req.params.id };
        const update = req.body;
        const options = { new: true };

        const process = await manager.updateUser(filter, update, options);
        
        res.status(200).send({ origin: config.SERVER, payload: process });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

usersRouter.put('/premium/:uid', verifyToken, handlePolicies(['admin']), async (req, res) => {
    try {
        const userId = req.params.uid;
        const user = await manager.getUserById(userId);
        // Verifica si el usuario existe
        if (!user) {
            return res.status(404).send({ message: "Usuario no encontrado." });
        }
        // Alterna el rol del usuario entre 'user' y 'premium'
        user.role = user.role === 'user' ? 'premium' : 'user';
        await user.save();
        res.status(200).send({ message: `El rol del usuario ha sido cambiado a ${user.role}` });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});


usersRouter.delete('/:id', async (req, res) => {
    try {
        const filter = { _id: req.params.id };
        const process = await manager.deleteUser(filter);

        res.status(200).send({ origin: config.SERVER, payload: process });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});


//Mailing con nodemailer
export function sendResetEmail(to, resetLink) {
    const transport = nodemailer.createTransport({
        service: 'gmail',
        port: 587,
        auth: {
            user: config.GMAIL_APP_USER,
            pass: config.GMAIL_APP_PASS
        }
    });

    return transport.sendMail({
        from: `Sistema CIEC <${config.GMAIL_APP_USER}>`,
        to: to,
        subject: 'Restablecimiento de contraseña',
        text: `Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetLink}`
    });
}

//Endpoint prueba de Mailing
usersRouter.get('/mail', async (req, res) => {
    try {
        const resetLink = 'http://tudominio.com/reset-password/4fddf31f5b849e0a0e93b8e6e8c7b32d'; // Link de prueba
        const confirmation = await sendResetEmail('juliochiappa@hotmail.com', resetLink);
        
        res.status(200).send({ status: 'OK', data: confirmation });
    } catch (err) {
        res.status(500).send({ status: 'ERR', data: err.message });
    }
});


export default usersRouter;
