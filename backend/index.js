import express from "express";
import dotenv from "dotenv";
dotenv.config()
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";

import cors from "cors";
import userRouter from "./routes/user.routes.js";
import itemRouter from "./routes/item.routes.js";
import shopRouter from "./routes/shop.routes.js";
import orderRouter from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

console.log("DEBUG: process.cwd() =", process.cwd());
console.log("DEBUG: Loaded MONGODB_URL =", process.env.MONGODB_URL); // <= important

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,        // <-- correct option name
}));

app.use(express.json())

app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);
app.use("/api/payment", paymentRoutes);


// Connect to DB first
connectDb();

app.get("/", (req, res) => res.send("Delivo backend running"));

app.listen(PORT, () => {
  console.log(`🚀 Server started at http://localhost:${PORT}`);
});
