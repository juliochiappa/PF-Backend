import { Router } from 'express';
import config from '../config.js';
import CartManager from '../controllers/cartsManager.js';
import ProductManager from '../controllers/productsManager.js';
import ticketModel from '../models/tickets.models.js';
import { verifyMongoDBId, verifyToken, handlePolicies, generateUniqueTicketCode, calculateTotalAmount } from '../services/utils.js';


const cartsRouter = Router();
const manager = new CartManager();
const managerProduct = new ProductManager();

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
        const cart = await manager.getCartById({ _user_id: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado para el usuario autenticado' });
        }
        res.status(200).json({ payload: cart });
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ message: 'Error interno al obtener el carrito', error: error.message });
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
        const cart = await manager.getAllCarts(cartId).populate('products.productId');

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

// Aumentar o disminuir cantidad de un producto en el carrito
cartsRouter.put('/:cartId/product/:productId', verifyToken, handlePolicies(['self']), async (req, res) => {
    const { cartId, productId } = req.params;
    const { action } = req.body;

    try {
        const cart = await manager.getCartById(cartId);
        if (!cart) {
            console.error(`Carrito con ID ${cartId} no encontrado`);
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }

        const product = cart.products.find(p => p._id.toString() === productId);
        if (!product) {
            console.error(`Producto con ID ${productId} no encontrado en el carrito`);
            return res.status(404).json({ message: 'Producto no encontrado en el carrito' });
        }

        // Aquí sigue la lógica de actualización de stock...
    } catch (error) {
        console.error('Error al actualizar la cantidad:', error.message);
        res.status(500).json({ message: 'Error al actualizar la cantidad', error: error.message });
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

// Eliminar un producto del carrito
cartsRouter.delete('/:cartId/product/:productId', async (req, res) => {
    try {
      const { cartId, productId } = req.params;
      const result = await manager.deleteCartItem(cartId, productId);
      
      if (result.status === 404) {
        return res.status(404).send({ origin: config.SERVER, payload: null, error: result.message });
      }
      
      if (result.status === 500) {
        return res.status(500).send({ origin: config.SERVER, payload: null, error: result.message });
      }
  
      res.status(200).send({ origin: config.SERVER, payload: result.cart });
    } catch (error) {
      res.status(500).send({ origin: config.SERVER, payload: null, error: error.message });
    }
  });
  
  
export default cartsRouter;