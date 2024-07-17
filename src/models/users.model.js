import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

mongoose.pluralize(null);

const collection = 'users';
//const collection = 'users_aggregate';

const userSchema = new mongoose.Schema({
    firstName:{type: String, required: true},
    lastName:{type: String, required: true, index: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    role: {type: String, enum: ['admin', 'premium', 'user'], default: 'user'},
    cart_id: { type: mongoose.Schema.Types.ObjectId, required: true},
});

userSchema.plugin(mongoosePaginate);

const userModel = mongoose.model(collection, userSchema);

export default userModel;