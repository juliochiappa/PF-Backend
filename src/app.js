import express from 'express';
import mongoose from 'mongoose';
import handlebars from 'express-handlebars';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import flash from 'express-flash';
import passport from 'passport';
//import FileStore from 'session-file-store';

import config from './config.js';
import productsRouter from './routes/products.routes.js';
import cartsRouter from './routes/carts.routes.js';
import usersRouter from './routes/users.routes.js';
import cookiesRouter from './routes/cookies.routes.js';
import authRouter from './routes/auth.routes.js';
import viewRouter from './routes/views.routes.js';
import initSocket from './services/sockets.js';
import TestRouter from './routes/test.routes.js';
import baseRouter from './routes/base.routes.js';
import MongoSingleton from './services/mongo.singleton.js';
import cors from 'cors';

const app = express();

const expressInstance = app.listen(config.PORT, async () => {
    //await mongoose.connect(config.MONGODB_URI);
    MongoSingleton.getInstance(); //Conecta a la ddbb a través de la clase MongoSingleton
});

const socketServer = initSocket(expressInstance);
app.set('socketServer', socketServer);

app.use (cors({origin:'*'})); //Acepta solicitudes de cualquier lugar de la Tierra porque esta abierta.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.SECRET));
app.use(flash());
app.use('/api/base', baseRouter);

// Habilito un listener por salidas inesperadas del proceso
process.on('exit', code => {
    if (code === -4) {
        console.log('Proceso finalizado por argumentación inválida en una función');
    }
});


//const fileStorage = FileStore(session);
app.use(session({
    //store: new fileStorage({ path: './sessions', ttl: 15, retries: 0 }),
    store: MongoStore.create({ mongoUrl: config.MONGODB_URI, ttl: 15 }),
    secret: config.SECRET,
    resave: true,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

app.engine('handlebars', handlebars.engine());
app.set('views', `${config.DIRNAME}/views`);
app.set('view engine', 'handlebars');

//Uso de plantilla de Handlebars
app.use('/', viewRouter);

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/users', usersRouter);
app.use('/api/cookies', cookiesRouter);
app.use('/api/auth', authRouter);
app.use('/api/test', new TestRouter().getRouter());
app.use('/static', express.static(`${config.DIRNAME}/public`));

console.log(`App activa en puerto ${config.PORT} enlazada a ddbb Atlas, PID: ${process.pid}, URI motor: ${config.MONGODB_URI}`);

app.get('/', (req, res) => {
    res.send(`
        <h1>¡Bienvenido a mi segunda entrega del Proyecto Final!</h1>
        <ul>
        <h2>Servidor express activo en puerto ${config.PORT}<h2>
        <ul>
        `);
    });

