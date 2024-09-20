import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

mongoose.pluralize(null);

const collection = 'products';

const schema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, enum: ['Crema masajes', 'Limpieza de cutis', 'Reducción grasa abdominal'], default: 'Crema masajes'},
  code: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  status: { type: Boolean, default: true },
  stock: { type: Number, required: true },
  category: { type: String, enum: ['Nacional', 'Importado'], default: 'Nacional', index: true },
  thumbnails: { type: [String], default: [], require: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: 'admin' }
});

schema.plugin(mongoosePaginate);

const productModel = mongoose.model(collection, schema);

export default productModel;