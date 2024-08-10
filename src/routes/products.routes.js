import {Router} from 'express';
import {uploader} from '../services/uploader.js';
import { verifyToken, handlePolicies, verifyRequiredBody } from '../services/utils.js';
import config from '../config.js';
import ProductManager from '../controllers/productsManager.js';


const productsRouter = Router();
const manager = new ProductManager();

productsRouter.param('id', (req, res, next, id) =>{
        if (config.MONGODB_ID_REGEX.test(id)) {
            req.validatedId = id; 
            next(); 
        } else {
            res.status(404).send({ origin: config.SERVER, payload: null, error: 'El ID ingresado no es válido' });
        }
});

productsRouter.get('/', async (req, res) => {
    try {
        const products = await manager.getAllProducts();
        
        res.status(200).send({ origin: config.SERVER, payload: products });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

productsRouter.get('/aggregate', async (req, res) => {
    try {
        const product = await manager.getAllProductsAggregate();
        
        res.status(200).send({ origin: config.SERVER, payload: product });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});


productsRouter.get('/one/:id', async (req, res) => {
    try {
        const product = await manager.getProductById(req.validatedId);

            res.status(200).send({ origin: config.SERVER, payload: product });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

productsRouter.post('/', verifyToken, handlePolicies(['admin', 'premium']), verifyRequiredBody(['title', 'code', 'price', 'stock']), uploader.single('thumbnail'), async (req, res) => {
    try {
        const socketServer = req.app.get('socketServer');

        const owner = req.user.role === 'premium' ? req.user._id : null;
        const process = await manager.addProduct(req.body, owner);
        
        res.status(200).send({ origin: config.SERVER, payload: process });

        socketServer.emit('newProduct', req.body);
    } catch (err) {
        if (err.code === 11000) {
            res
              .status(400)
              .send({ error: "El código del producto ya está siendo utilizado" });
            } else {
                console.error(err);
                res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
        } 
    }
});

productsRouter.put('/:id', verifyToken, handlePolicies('admin'), async (req, res) => {
    try {
        const filter = { _id: req.validatedId };
        const update = req.body;
        const options = { new: true };
        const process = await manager.updateProduct(filter, update, options);
        
        res.status(200).send({ origin: config.SERVER, payload: process });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
}),

// productsRouter.delete('/:id', verifyToken, handlePolicies(['admin', 'premium']), async (req, res) => {
//     try {
//         const filter = { _id: req.validatedId };
//         const process = await manager.deleteProduct(filter);

//         res.status(200).send({ origin: config.SERVER, payload: process });
//     } catch (err) {
//         res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
//     }
// });

productsRouter.delete('/:id', verifyToken, handlePolicies(['admin', 'premium']), async (req, res) => {
    try {
        const product = await manager.getProductById(req.params.id);
        // Verifica si el producto existe
        if (!product) {
            return res.status(404).send({ message: "Producto no encontrado." });
        }
        // Verifica si el usuario es 'premium' y dueño del producto, o si es 'admin'
        if (req.user.role === 'premium' && product.owner.toString() !== req.user._id.toString()) {
            return res.status(403).send({ message: "No tienes permiso para eliminar este producto." });
        }
        // Se elimina el producto si está todo correcto
        const filter = { _id: req.params.id };
        const process = await manager.deleteProduct(filter);

        res.status(200).send({ origin: config.SERVER, payload: process });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});


productsRouter.all ('*', async (req, res) => {
    res.status(404).send({ origin: config.SERVER, payload: null, error: 'No se encuentra la ruta solicitada' });
});

export default productsRouter;

