import UsersService from '../services/users.dao.mdb.js';

const service = new UsersService();

class ProductsDTO {
    constructor(user) {
        this.user = user;
        if (this.user.title && typeof this.user.title === 'string') {
            this.user.title = this.user.title.toUpperCase();
        } 
    }
}

class UserManager {
    constructor() {
    }

    getAllUsers = async (limit = 0) => {
        try {
            if (limit === 0) {
                return await service.getAllUsers();
            } else {
                return await service.getAllUsers({}, { page: page, limit: limit, lean: true });
            }
        } catch (err) {
            return err.message;
        };
    };

    getUserById = async (id) => {
        try {
            return await service.getUserById(id);
        } catch (err) {
            return err.message;
        };
    };

    getOne = async (filter) => {
        try {
            return await service.getOne(filter);
        } catch (err) {
            return err.message;
        };
    };

    getAggregated = async (match, group, sort) => {
        try {
            return await service.getAggregated([
                { $match: match },
                { $group: group },
                { $sort: sort }
            ]);
        } catch (err) {
            return err.message;
        };
    };

    getPaginated = async (filter, options) => {
        try {
            return await service.getPaginated(filter, options);
        } catch (err) {
            return err.message;
        };
    };

    addUser = async (newData) => {
        try {
            const normalizedData = new ProductsDTO(newData);
            return await service.addUser(normalizedData.user);
        } catch (err) {
            return err.message;
        };
    };

    updateUser = async (filter, update, options) => {
        try {
            return await service.updateUser(filter, update, options);
        } catch (err) {
            return err.message;
        };
    };

    deleteUser = async (filter) => {
        try {
            return await service.deleteUser(filter);
        } catch (err) {
            return err.message;
        };
    };
}

export default UserManager;
