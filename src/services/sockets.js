import { Server } from 'socket.io';
import cartModel from '../models/carts.models.js'; 

const initSocket = (server) => {
    const io = new Server(server);

    // Establece conexión con un cliente
    io.on('connection', (socket) => {
        console.log('Nuevo cliente conectado:', socket.id);

       // Evento para agregar productos
       socket.on('addProduct', async (productData) => {
        try {
            const newProduct = await productModel.create(productData); 
            console.log('Producto creado en la base de datos:', newProduct); 
            io.emit('newProduct', newProduct); 
        } catch (err) {
            console.error('Error al crear el producto:', err);
            socket.emit('error', { message: 'Error al agregar el producto.' });
        }
    });
    

        // Escucha cuando un cliente quiere actualizar la cantidad de un producto en el carrito
        socket.on('updateQuantity', async ({ cartId, productId, action }) => {
            try {
                const cart = await cartModel.findById(cartId);
                if (!cart) {
                    return socket.emit('error', { message: 'Carrito no encontrado.' });
                }
        
                const product = cart.products.find(p => p._id.toString() === productId); 
        
                if (!product) {
                    return socket.emit('error', { message: 'Producto no encontrado en el carrito.' });
                }
        
                if (action === 'increase') {
                    product.stock = (product.stock || 0) + 1; 
                } else if (action === 'decrease' && product.stock > 0) {  
                    product.stock -= 1;  
                }
        
                await cart.save();
                socket.emit('cartUpdated', { cartId }); 
            } catch (err) {
                console.error(err);
                socket.emit('error', { message: 'Error actualizando la cantidad del producto.' });
            }
        });
        
        
        // Escucha cuando un cliente quiere eliminar un producto del carrito
        socket.on('removeProduct', async ({ cartId, productId }) => {
            try {
                const cart = await cartModel.findById(cartId);
                if (!cart) {
                    return socket.emit('error', { message: 'Carrito no encontrado.' });
                }
        
                cart.products = cart.products.filter(p => p._id.toString() !== productId); 
        
                await cart.save();
                socket.emit('cartUpdated', { cartId }); 
            } catch (err) {
                console.error(err);
                socket.emit('error', { message: 'Error eliminando el producto del carrito.' });
            }
        });
        
        
        // Escucha un nuevo mensaje 
        socket.on('newMessage', (message) => {
            console.log('Mensaje recibido:', message);
            io.emit('messageArrived', message);
        });

        // Desconexión de un cliente
        socket.on('disconnect', () => {
            console.log('Cliente desconectado:', socket.id);
        });
    });

    return io;
};

export default initSocket;
