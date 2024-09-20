import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  _user_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'users' },
  products: [{
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'products' },
    stock: { type: Number, required: true }
  }]
});

const cartModel = mongoose.model('carts', cartSchema);

export default cartModel;
