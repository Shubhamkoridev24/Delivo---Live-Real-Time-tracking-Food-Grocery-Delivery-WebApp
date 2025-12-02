// backend/routes/payment.routes.js
import express from "express";
import { createPayPalOrder, capturePayPalOrder } from "../controllers/paypal.controllers.js";
import authMiddleware from "../middlewares/isAuth.js"; // if you require auth (optional)

const router = express.Router();

router.post("/create-paypal-order", /* authMiddleware, */ createPayPalOrder);
router.post("/capture-paypal-order", /* authMiddleware, */ capturePayPalOrder);

export default router;
