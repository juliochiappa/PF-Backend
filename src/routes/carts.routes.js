import { Router } from 'express';
import config from '../config.js';
import CartManager from '../controllers/cartsManager.js';
import ticketModel from '../models/tickets.models.js';
import { verifyMongoDBId, verifyToken, handlePolicies, generateUniqueTicketCode, calculateTotalAmount } from '../services/utils.js';


const cartsRouter = Router();
const manager = new CartManager();

cartsRouter.param('id', verifyMongoDBId);

cartsRouter.get('/', async (req, res) => {
    try {
        const process = await manager.getAllCarts();

        res.status(200).send({ origin: config.SERVER, payload: process });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

// Obtiene el carrito del usuario
cartsRouter.get('/mycart', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;         

        if (!userId) {
            return res.status(400).json({ message: 'Usuario no autenticado' });
        }

        const cart = await manager.getCartByUserId({ _user_id: userId });

        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }

        res.status(200).json({ payload: cart });
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ message: 'Error al obtener el carrito', error: error.message });
    }
});

// Ruta para finalizar la compra de un carrito
cartsRouter.post('/', verifyToken, async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await manager.getProductById(productId);
        // Verifica si el producto existe
        if (!product) {
            return res.status(404).send({ message: "Producto no encontrado." });
        }
        // Verifica si el usuario es premium y si es dueño del producto
        if (req.user.role === 'premium' && product.owner.toString() === req.user._id.toString()) {
            return res.status(403).send({ message: "No puedes agregar tu propio producto al carrito." });
        }
        // Agrega el producto al carrito
        const process = await manager.addCarts(req.body);

        res.status(200).send({ origin: config.SERVER, payload: process });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

cartsRouter.post('/:id/purchase', async (req, res) => {
    const cartId = req.params.id;

    try {
        const cart = await manager.getAllCarts(cartId).populate('products.product');

        if (!cart) {
            return res.status(404).json({ error: 'Carrito no encontrado' });
        }

        let insufficientStock = false;
        let productsPurchased = [];

        for (let item of cart.products) {
            const product = item.product;
            const requestedQuantity = item.quantity;

            if (product.stock >= requestedQuantity) {
                product.stock -= requestedQuantity;
                await product.save();
                productsPurchased.push(item);
            } else {
                insufficientStock = true;
            }
        }

        if (insufficientStock) {
            cart.products = cart.products.filter(item => !productsPurchased.includes(item));
            await cart.save();
            return res.status(400).json({ error: 'No hay suficiente stock para completar la compra' });
        }

        // Crea el ticket de compra
        const ticketData = {
            code: generateUniqueTicketCode(),
            purchase_datetime: new Date(),
            amount: calculateTotalAmount(productsPurchased),
            purchaser_id: req.user._id  
        };

        // Llama a la función para crear y guardar el ticket
        const newTicket = await createAndSaveTicket(ticketData);

        if (!newTicket) {
            return res.status(500).json({ error: 'Error al crear el ticket' });
        }
        cart.products = cart.products.filter(item => !productsPurchased.includes(item));
        await cart.save();
        res.json({ message: 'Compra realizada exitosamente', ticket: newTicket });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Función para crear y guardar ticket
async function createAndSaveTicket(ticketData) {
    try {
        const newTicket = new ticketModel(ticketData);
        const savedTicket = await newTicket.save();
        console.log('Ticket creado y guardado:', savedTicket);
        return savedTicket;
    } catch (error) {
        console.error('Error al guardar el ticket:', error);
    }
}

cartsRouter.put('/:id', async (req, res) => {
    try {
        const filter = { _id: req.params.id };
        const update = req.body;
        const options = { new: true };
        const process = await manager.updateCarts(filter, update, options);
        
        res.status(200).send({ origin: config.SERVER, payload: process });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

// Agrega un producto al carrito
cartsRouter.put('/:cid/products/:pid', verifyToken, handlePolicies(['self']), async (req, res) => {
    try {
        const cartId = req.params.cid;
        const productId = req.params.pid;

        // Verifica si el carrito y el producto existen antes de actualizar
        const cart = await manager.getCartById(cartId);
        if (!cart) {
            return res.status(404).send({ origin: config.SERVER, payload: null, error: 'Carrito no encontrado' });
        }

        const productInCart = cart.products.find(p => p.productId.toString() === productId);

        let update;
        if (productInCart) {
            update = { $inc: { 'products.$[elem].quantity': 1 } };
        } else {
            update = { $push: { products: { productId: productId, quantity: 1 } } };
        }

        const options = { new: true, arrayFilters: [{ 'elem.productId': productId }] };

        const updatedCart = await manager.updateCarts({ _id: cartId }, update, options);

        if (!updatedCart) {
            return res.status(404).send({ origin: config.SERVER, payload: null, error: 'Carrito no encontrado' });
        }

        res.status(200).send({ origin: config.SERVER, payload: `Producto ${productId} agregado al carrito ${cartId}`, cart: updatedCart });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

cartsRouter.delete('/:id', verifyToken, handlePolicies(['self']), async (req, res) => {
    try {
        const filter = { _id: req.params.id };
        const process = await manager.deleteCarts(filter);

        res.status(200).send({ origin: config.SERVER, payload: process });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});

cartsRouter.delete('/:id/products/:id', async (req, res) => {
    try {
        const filter = { _id: req.params.id }; 
        const process = await manager.deleteCartItem(filter); 

        res.status(200).send({ origin: config.SERVER, payload: process });
    } catch (err) {
        res.status(500).send({ origin: config.SERVER, payload: null, error: err.message });
    }
});


export default cartsRouter;