import cartModel from "../models/carts.models.js";
import userModel from "../models/users.model.js";
import productModel from "../models/products.models.js";

class CartsService {
  constructor() {}

  // Función reutilizable para agregar los populate
  populateCartData = (query) => {
    return query
      .populate({ path: "_user_id", select: "firstName lastName", model: userModel })
      .populate({ path: "products._id", select: "title price", model: productModel });
  };

  getAllCarts = async () => {
    try {
      const query = cartModel.find().lean();
      return await populateCartData(query);
    } catch (err) {
      return { error: err.message };
    }
  };

  getCartById = async (cartId) => {
    try {
        const query = cartModel.findById(cartId).lean();
        return await populateCartData(query);
    } catch (err) {
        console.error("Error al obtener el carrito:", err);
        return { error: err.message };
    }
};

  addCarts = async (newData) => {
    try {
      return await cartModel.create(newData);
    } catch (err) {
      return err.message;
    }
  };

  updateCarts = async (filter, update, options) => {
    try {
      return await cartModel.findOneAndUpdate(filter, update, { ...options, new: true });
    } catch (err) {
      return err.message;
    }
  };

  deleteCarts = async (filter) => {
    try {
      return cartModel.findOneAndDelete(filter);
    } catch (err) {
      return err.message;
    }
  };

  deleteCartItem = async (cartId, productId) => {
    try {
      const cart = await cartModel.findById(cartId);
      if (!cart) return { status: 404, message: 'Carrito no encontrado' };
  
      cart.products = cart.products.filter(p => p._id.toString() !== productId);
  
      await cart.save();
      return { status: 200, message: 'Producto eliminado del carrito correctamente', cart };
    } catch (error) {
      return { status: 500, message: 'Error al eliminar el producto', error: error.message };
    }
  };
};

export default CartsService;