import mongoose from 'mongoose';

mongoose.pluralize(null);

const collection = 'carts';

const cartSchema = new mongoose.Schema({
  _user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'users' },
  products: [{ 
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products' }, 
    quantity: { type: Number, required: true, default: 1 } 
  }]
});

const cartModel = mongoose.model(collection, cartSchema);

export default cartModel;
