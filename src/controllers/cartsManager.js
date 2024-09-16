import cartModel from '../models/carts.models.js';
import userModel from '../models/users.model.js';
import productModel from '../models/products.models.js';

class CartManager {
    constructor() {
    }

    getAllCarts = async () => {
        try {
            return await cartModel.find()
            .populate({path: '_user_id', model: userModel})
            .populate({path: 'products._id', model: productModel})
            .lean();
        } catch (err) {
            return err.message;
        };
    };

    getCartById = async (cartId) => {
        try {
            return await cartModel.findById(cartId)
            .populate('_user_id', 'firstName lastName') 
            .populate('products._id', 'title price') 
            .lean();
        } catch (err) {
            throw new Error('Error al buscar el carrito: ' + err.message);
        }
    };
    
    addCarts = async (newData) => {
        try {
            return await cartModel.create(newData);
        } catch (err) {
            return err.message;
        };
    };

    updateCarts = async (filter, update, options) => {
        try {
            return await cartModel.findOneAndUpdate(filter, update, options);
        } catch (err) {
            return err.message;
        }
    };

    deleteCarts = async (filter) => {
        try {
            return await cartModel.findOneAndDelete(filter);
        } catch (err) {
            return err.message;
        };
    };

    deleteCartItem = async (filter) => {
        try {
            const cart = await cartModel.findOne(filter);
            if (!cart) {
                throw new Error('El producto no está en el carrito.');
            }
            // Elimina el producto del carrito
            const index = cart.items.findIndex(item => item._id.toString() === filter._id);
            if (index !== -1) {
                cart.items.splice(index, 1);
            }
            // Guarda el carrito actualizado
            await cart.save();
            return 'Producto eliminado del carrito exitosamente.';
        } catch (err) {
            throw new Error(err.message);
        }
    }
};

export default CartManager;

