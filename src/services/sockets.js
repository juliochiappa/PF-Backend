// import { Server } from 'socket.io';

// const initSocket = (server) => {
//     const io = new Server(server);

//     // Establece conexión con un cliente
//     io.on('connection', (socket) => {
//         console.log('Nuevo cliente conectado:', socket.id);

//         // Escucha cuando un cliente envía un nuevo mensaje
//         socket.on('newMessage', (message) => {
//             console.log('Mensaje recibido:', message);

//             // Emiti el mensaje a todos los clientes conectados
//             io.emit('messageArrived', message);
//         });

//         // Desconexión de un cliente
//         socket.on('disconnect', () => {
//             console.log('Cliente desconectado:', socket.id);
//         });
//     });

//     return io;
// };

// export default initSocket;
import { Server } from 'socket.io';
import cartModel from '../models/carts.models.js'; 

const initSocket = (server) => {
    const io = new Server(server);

    // Establece conexión con un cliente
    io.on('connection', (socket) => {
        console.log('Nuevo cliente conectado:', socket.id);

        // Escucha cuando un cliente quiere actualizar la cantidad de un producto en el carrito
        socket.on('updateQuantity', async ({ cartId, productId, action }) => {
            try {
                const cart = await cartModel.findById(cartId);
                const product = cart.products.find(p => p._id.toString() === productId);

                if (!product) {
                    return socket.emit('error', { message: 'Producto no encontrado en el carrito.' });
                }

                if (action === 'increase') {
                    product.stock += 1; 
                } else if (action === 'decrease' && product.stock > 1) {
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

                cart.products = cart.products.filter(p => p._id.toString() !== productId);

                await cart.save();
                socket.emit('cartUpdated', { cartId }); // Emitir evento de carrito actualizado
            } catch (err) {
                console.error(err);
                socket.emit('error', { message: 'Error eliminando el producto del carrito.' });
            }
        });

        // Escucha un nuevo mensaje (ya implementado)
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
