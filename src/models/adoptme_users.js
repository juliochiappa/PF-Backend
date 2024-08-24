import mongoose from 'mongoose';

mongoose.pluralize(null);

const collection = 'adoptme_users';

const schema = new mongoose.Schema({
    firstName:{
        type: String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    role: {
        type:String,
        default:'user'
    },
    carts:{
        type:[
            {
                _id:{
                    type:mongoose.SchemaTypes.ObjectId,
                    ref:'carts'
                }
            }
        ],
        default:[]
    }
})

const adoptmeUserModel = mongoose.model(collection,schema);

export default adoptmeUserModel;