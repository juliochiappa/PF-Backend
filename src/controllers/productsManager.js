import ProductsService from '../services/products.dao.mdb.js';
//import ProductsService from '../services/products.dao.fs.js';
//import ProductsService from '../services/dao.factory.js';

const service = new ProductsService();

class ProductsDTO {
    constructor(product) {
        this.product = product;
        this.product.title = this.product.title.toUpperCase();
    }
}

class ProductManager {
  constructor() {
  }
  
  getAllProducts = async (limit = 0, page = 1) => {
    try {
        if (limit === 0) {
            return await service.getAllProducts();
        } else {
            return await service.getAllProducts({}, { page: page, limit: limit, lean: true });
        }
    } catch (err) {
        return err.message;
    };
  };

  getAllProductsAggregate = async () => {
      try {
        return await service.getAllProductsAggregate([
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
          return await service.getProductById(id);
      } catch (err) {
          return err.message;
      };
  };

  addProduct = async (newData) => {
      try {
        const normalizedData = new ProductsDTO(newData);
        return await service.addProduct(normalizedData.product);
      } catch (err) {
          return err.message;
      };
  };

  updateProduct = async (filter, update, options) => {
      try {
          return await service.updateProduct(filter, update, options);
      } catch (err) {
          return err.message;
      };
  };

  deleteProduct = async (id) => {
    try {
      return service.deleteProduct(id);
    } catch (err) {
      return err.message;
    };
  };
};

export default ProductManager;
