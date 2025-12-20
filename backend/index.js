import express from "express";
import dotenv from "dotenv";
dotenv.config();

import http from "http";
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import shopRouter from "./routes/shop.routes.js";
import itemRouter from "./routes/item.routes.js";
import orderRouter from "./routes/order.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

// 🔥 SOCKET
import { initSocket } from "./socket.js";

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// -------------------- MIDDLEWARE --------------------
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// -------------------- ROUTES --------------------
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);
app.use("/api/payment", paymentRoutes);

// -------------------- DB --------------------
connectDb();

// -------------------- SOCKET INIT (🔥 FIX) --------------------
const io = initSocket(server);
app.set("io", io);

app.get("/", (req, res) => res.send("Delivo backend running 🚀"));

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
