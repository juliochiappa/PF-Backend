import fs from "fs";
import path from "path";
import config from "../config.js";

const cartsFiles = path.join(config.DIRNAME, "./files/carts.json");

const cartManager = {

  getAllCarts: (req, res) => {
    try {
      const data = fs.readFileSync(cartsFiles, "utf-8");
      const carts = JSON.parse(data);
      res.json(carts);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al obtener los productos");
    }
  },

  createCart: (req, res) => {
    const data = fs.readFileSync(cartsFiles, "utf-8");
    const carts = JSON.parse(data);
    try {
      const newCart = {
        id: carts.length + 1,
        products: [],
      };
      carts.push(newCart);
      fs.writeFileSync(cartsFiles, JSON.stringify(carts, null, 2));
      res.status(201).send(newCart);
    } catch (error) {
      res.status(500).send({ error: "Error al crear el carrito" });
    }
  },

  getCartById: (req, res) => {
    try {
      const data = fs.readFileSync(cartsFiles, "utf-8");
      const carts = JSON.parse(data);
      const cart = carts.find((p) => p.id === +req.params.pid);
      if (cart) {
        res.json(cart);
      } else {
        res.status(404).send("Producto no encontrado");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al obtener el producto");
    }
  },

  addProductToCart: (req, res) => {
    try {
      const cartId = Number(req.params.cid);
      const productId = Number(req.params.pid);
      const quantity = req.body.quantity || 1;

      let carts = JSON.parse(fs.readFileSync(cartsFiles, "utf-8"));
      let cart = carts.find((cart) => cart.id === cartId);
      if (!cart) {
        return res.status(404).send({ error: "Carrito no encontrado" });
      }

      let productInCart = cart.products.find(
        (item) => item.product === productId
      );
      if (productInCart) {
        productInCart.quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }

      fs.writeFileSync(cartsFiles, JSON.stringify(carts, null, 2));
      res.send(cart);
    } catch (error) {
      res
        .status(500)
        .send({ error: "Error al agregar el producto al carrito" });
    }
  },
};

export default cartManager;
