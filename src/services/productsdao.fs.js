import fs from "fs";
import config from "../config.js";
import path from "path";

const productsFiles = path.join(config.DIRNAME, "./files/products.json");

const productManager = {

  getAllProducts: (req, res) => {
    try {
      const data = fs.readFileSync(productsFiles, "utf-8");
      const products = JSON.parse(data);
      res.json(products);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al obtener los productos");
    }
  },

  getProductById: (req, res) => {
    try {
      const data = fs.readFileSync(productsFiles, "utf-8");
      const products = JSON.parse(data);
      const product = products.find((p) => p.id === +req.params.pid);
      if (product) {
        res.json(product);
      } else {
        res.status(404).send("Producto no encontrado");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al obtener el producto");
    }
  },

  addProduct: (req, res) => {
    try {
      const data = fs.readFileSync(productsFiles, "utf-8");
      const products = JSON.parse(data);
      // Verifico si el código del nuevo producto ya existe
      const codeExists = products.some(product => product.code === req.body.code);
      if (codeExists) {
        return res.status(400).send({ error: "El código del producto ya está siendo utilizado" });
      }
      const newProduct = {
        id: products.length + 1,
        title: req.body.title,
        description: req.body.description,
        code: req.body.code,
        price: req.body.price,
        status: true,
        stock: req.body.stock,
        category: req.body.category,
        thumbnails: req.body.thumbnails || [],
      };
      products.push(newProduct);
      fs.writeFileSync(productsFiles, JSON.stringify(products, null, 2));
      res.status(201).send(newProduct);
    } catch (error) {
      res.status(500).send({ error: "Error al agregar el producto" });
    }
  },

  updateProduct: (req, res) => {
    try {
      const data = fs.readFileSync(productsFiles, "utf-8");
      let products = JSON.parse(data);
      const index = products.findIndex((p) => p.id === +req.params.pid);
      if (index !== -1) {
        products[index] = { ...products[index], ...req.body };
        fs.writeFileSync(
          productsFiles,
          JSON.stringify(products, null, 2),
          "utf-8"
        );
        res.json(products[index]);
      } else {
        res.status(404).send("Producto no encontrado");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al actualizar el producto");
    }
  },

  deleteProduct: (req, res) => {
    try {
      const data = fs.readFileSync(productsFiles, "utf-8");
      let products = JSON.parse(data);
      const index = products.findIndex((p) => p.id === +req.params.pid);
      if (index !== -1) {
        products.splice(index, 1);
        fs.writeFileSync(
          productsFiles,
          JSON.stringify(products, null, 2),
          "utf-8"
        );
        res.send("Producto eliminado correctamente");
      } else {
        res.status(404).send("Producto no encontrado");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al eliminar el producto");
    }
  },
};

export default productManager;
