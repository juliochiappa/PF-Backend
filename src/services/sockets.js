import { Server } from 'socket.io';

const initSocket = (server) => {
    const io = new Server(server);

    // Establece conexión con un cliente
    io.on('connection', (socket) => {
        console.log('Nuevo cliente conectado:', socket.id);

        // Escucha cuando un cliente envía un nuevo mensaje
        socket.on('newMessage', (message) => {
            console.log('Mensaje recibido:', message);

            // Emiti el mensaje a todos los clientes conectados
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
