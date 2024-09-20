import express from 'express';
import handlebars from 'express-handlebars';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import flash from 'express-flash';
import passport from 'passport';
import { faker } from '@faker-js/faker';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUiExpress from 'swagger-ui-express';


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
import errorsHandler from './services/errors.handler.js';
import addLogger from './services/logger.js';
import twilio from 'twilio';
import { uploader } from './services/uploader.js';

const app = express();

const expressInstance = app.listen(config.PORT, async () => {
    MongoSingleton.getInstance(); 
});

const socketServer = initSocket(expressInstance);
app.set('socketServer', socketServer);

const uploadRouter = express.Router();

uploadRouter.post('/products', uploader.array('productImages', 3), (req, res) => {
    res.status(200).send({ status: 'OK', payload: 'Imágenes subidas', files: req.files });
});
uploadRouter.post('/profiles', uploader.array('profileImages', 2), (req, res) => {
    res.status(200).send({ status: 'OK', payload: 'Imágenes subidas', files: req.files });
});
uploadRouter.post('/documents', uploader.array('documents', 3), (req, res) => {
    res.status(200).send({ status: 'OK', payload: 'Documentos subidos', files: req.files });
});

//SMS con Twilio
const twilioClient = twilio(config.TWILIO_SID, config.TWILIO_TOKEN);

//Mocking con faker
const generateFakeProducts = async (qty) => {
    const products = [];
    const DESCRIPTIONS = [
        'Crema masajes',
        'Limpieza de cutis',
        'Reducción grasa abdominal'
    ];
    const CATEGORIES = ['Nacional', 'Importado'];

    for (let i = 0; i < qty; i++) {
        const title = faker.commerce.productName();
        const description = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
        const code = faker.string.uuid(); 
        const price = faker.number.int({ min: 10, max: 10000 }); 
        const stock = faker.number.int({ min: 1, max: 500 }); 
        const status = faker.datatype.boolean(); 
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

        products.push({ title, description, code, price, status, stock, category });
    }
    return products;
};

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

app.use(session({
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

app.use(addLogger);

//Uso de plantilla de Handlebars
app.use('/', viewRouter);
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/users', usersRouter);
app.use('/api/cookies', cookiesRouter);
app.use('/api/auth', authRouter);
app.use('/api/test', new TestRouter().getRouter());
app.use('/upload', uploadRouter);
app.get('/upload', (req, res) => {
    res.render('upload'); 
});

app.use('/static', express.static(`${config.DIRNAME}/public`));
app.use(errorsHandler);

//Endpoint del Logger Test
app.get('/loggerTest', async (req, res) => {
    req.logger.info(`${new Date().toDateString()} ${req.method} ${req.url}`);
    res.status(200).send({ message: `Register received` });
});

//Endpoint del Mocking con faker
app.get('/mockingproducts/:qty', async (req, res) => {
    const data = await generateFakeProducts(parseInt(req.params.qty));
    res.status(200).send({ status: 'OK', payload: data });
});

//Endpoint prueba de SMS
app.get('/sms', async (req, res) => {
    try {
        const confirmation = await twilioClient.messages.create({
            body: 'Mensaje enviado con servicio de Twilio',
            from: config.TWILIO_PHONE,
            to: '+543517069105'
        });
        res.status(200).send({ status: 'OK', data: confirmation });
    } catch (err) {
        res.status(500).send({ status: 'ERR', data: err.message });
    }
});

// Endpoint para servir la documentación de las rutas users y products
const swaggerOptions = {
    definition: {
        openapi: '3.0.1',
        info: {
            title: 'Documentación sistema CIEC',
            description: 'Esta documentación cubre toda la API habilitada para CIEC -"Centro Integral de Estética Corporal"-',
        },
    },
    apis: ['./src/docs/**/*.yaml'], 
};
const specs = swaggerJSDoc(swaggerOptions);
app.use('/api/docs', swaggerUiExpress.serve, swaggerUiExpress.setup(specs));


//Endpoint de Login de la app que se va a mostrar en el deploy
app.get('/', (req, res) => {
    res.redirect('/login');
    });


console.log(`App activa en http//localhost:${config.PORT} enlazada a ddbb Atlas, PID: ${process.pid}, URI motor: ${config.MONGODB_URI}`);