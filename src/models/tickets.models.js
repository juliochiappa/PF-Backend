import mongoose from 'mongoose';

mongoose.pluralize(null);

const collection = 'tickets';

const schema = new mongoose.Schema({
  code: { type: String, unique: true },
  purchase_datetime: { type: Date, default: Date.now, required: true },
  amount: { type: Number, required: true, default: 0.0 },
  purchaser_id: { type: mongoose.Schema.Types.ObjectId, required: true},
});


const ticketModel = mongoose.model(collection, schema);

export default ticketModel;