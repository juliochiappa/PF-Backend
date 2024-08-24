import adoptmeUserModel from '../models/adoptme_users.js';

class AdoptmeUsersService {
    constructor() {
    }

    getAllUsers = async (limit = 0) => {
        try {
            return limit === 0 ? await adoptmeUserModel.find().lean(): await adoptmeUserModel.find().limit(limit).lean();
        } catch (err) {
            return err.message;
        };
    };

    getUserById = async (id) => {
        try {
                return await adoptmeUserModel.findById(id).lean();
            } catch (err) {
            return err.message;
        };
    };

    addUser = async (newData) => {
        try {
            return await adoptmeUserModel.create(newData);  
        } catch (err) {
            return err.message;
        };
    };
    
    updateUser = async (filter, update) => {
        try {
            return await adoptmeUserModel.findOneAndUpdate(filter, update, { new: true }).lean();
        } catch (err) {
            return err.message;
        };
    };
    

    deleteUser = async (filter) => {
        try {
            return await adoptmeUserModel.findOneAndDelete(filter);
        } catch (err) {
            return err.message;
        };
    };
}

export default AdoptmeUsersService;
