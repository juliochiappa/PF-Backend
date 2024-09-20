import CartsService from "../services/carts.dao.mdb.js";

const service = new CartsService();

class CartManager {
    constructor() {
    }
    
    getAllCarts = async () => {
        try {
            return await service.getAllCarts()
        } catch (err) {
            return err.message;
        }
    };
   
    getCartById = async (cartId) => {
        try {
            return await service.getCartById(cartId);
        } catch (err) {
            return { error: err.message };
        }
    };
   
    addCarts = async (newData) => {
        try {
            return await service.addCarts(newData);
        } catch (err) {
            return err.message;
        };
    };

    updateCarts = async (filter, update, options) => {
        try {
            return await service.updateCarts(filter, update, options);
        } catch (err) {
            return err.message;
        }
    };

    deleteCarts = async (filter) => {
        try {
            return await service.deleteCarts(filter);
        } catch (err) {
            return err.message;
        };
    };

    deleteCartItem = async (cartId, productId) => {
        try {
            return await service.deleteCartItem(cartId, productId);
        } catch (err) {
            throw new Error(err.message);
        }
    }
};

export default CartManager;

