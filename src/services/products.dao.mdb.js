import productModel from '../models/products.models.js';

class ProductsService {
    constructor() {
       
    }
 
    getAllProducts = async (limit = 0, page = 1) => {
      try {
          if (limit === 0) {
              return await productModel.find().lean();
          } else {
              return await productModel.paginate({}, { page: page, limit: limit, lean: true });
          }
      } catch (err) {
          return err.message;
      };
    };
  
    getAllProductsAggregate = async () => {
        try {
          return await productModel.aggregate([
              { $match: { category: 'Nacional'}},
              { $group: {_id: '$description', totalStock: { $sum: '$stock'}}},
              { $sort: {totalStock: -1 }}
          ]);
        } catch (err) {
            return err.message;
        };
    };
  
    getProductById = async (id) => {
        try {
            return await productModel.findById(id).lean();
        } catch (err) {
            return err.message;
        };
    };
  
    addProduct = async (newData) => {
        try {
            return await productModel.create(newData);
        } catch (err) {
            return err.message;
        };
    };
  
    updateProduct = async (filter, update, options) => {
        try {
            return await productModel.findOneAndUpdate(filter, update, options);
        } catch (err) {
            return err.message;
        };
    };
  
    deleteProduct = async (id) => {
      try {
        return productModel.findOneAndDelete(id);
      } catch (err) {
        return err.message;
      };
    };
  };

export default ProductsService;
