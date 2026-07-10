import express from "express";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import seedRouter from "./routes/seedRoutes.js";
import productRouter from "./routes/productRoutes.js";
import userRouter from "./routes/userRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err.message);
  });

const app = express();
const __dirname = path.resolve();
const port = process.env.PORT || 4000;

const registerMiddlewares = (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
};

const registerKeyRoutes = (app) => {
  app.get("/api/keys/paypal", (req, res) => {
    res.send(process.env.PAYPAL_CLIENT_ID || "sb");
  });

  app.get("/api/keys/google", (req, res) => {
    res.send({ key: process.env.GOOGLE_API_KEY || "" });
  });
};

const registerApiRoutes = (app) => {
  app.use("/api/upload", uploadRouter);
  app.use("/api/seed", seedRouter);
  app.use("/api/products", productRouter);
  app.use("/api/users", userRouter);
  app.use("/api/orders", orderRouter);
};

const registerStaticRoutes = (app) => {
  app.use(express.static(path.join(__dirname, "/frontend/build")));
  app.get("*", (req, res) =>
    res.sendFile(path.join(__dirname, "/frontend/build/index.html"))
  );
};

const registerErrorHandler = (app) => {
  app.use((err, req, res, next) => {
    res.status(500).send({ message: err.message });
  });
};

registerMiddlewares(app);
registerKeyRoutes(app);
registerApiRoutes(app);
registerStaticRoutes(app);
registerErrorHandler(app);

app.listen(port, () => {
  console.log(`serve at http://localhost:${port}`);
});
