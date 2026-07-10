import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";

const app = express();
const PORT = process.env.PORT || 4000;

const initializeServices = () => {
  connectDB();
  connectCloudinary();
};

const registerMiddlewares = (app) => {
  app.use(express.json());
  app.use(cors());
};

const registerRoutes = (app) => {
  app.use("/api/user", userRouter);
  app.use("/api/product", productRouter);

  app.get("/", (_req, res) => {
    res.send("API is running...");
  });
};

initializeServices();
registerMiddlewares(app);
registerRoutes(app);

app.listen(PORT, () => {
  console.log(`Server is running on at http://localhost:${PORT}`);
});
