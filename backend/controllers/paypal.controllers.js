// backend/controllers/paypal.controllers.js
import paypalClient from "../config/paypal.config.js";
import checkout from "@paypal/checkout-server-sdk";
import Order from "../models/order.model.js"; // update path if different
import dotenv from "dotenv";
dotenv.config();

// create order on PayPal and return orderId to frontend
export const createPayPalOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", orderIdFallback } = req.body;
    if (!amount) return res.status(400).json({ message: "amount required" });

    const request = new checkout.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: Number(amount).toFixed(2)
        }
      }],
      application_context: {
        brand_name: "Delivo",
        user_action: "PAY_NOW"
      }
    });

    const response = await paypalClient.execute(request);
    // response.result.id is the PayPal order id
    return res.status(200).json({ paypalOrderId: response.result.id, raw: response.result });
  } catch (err) {
    console.error("createPayPalOrder error:", err);
    return res.status(500).json({ message: "create paypal order error", error: err.message });
  }
};

// capture payment after client approves
export const capturePayPalOrder = async (req, res) => {
  try {
    const { paypalOrderId, localOrderId } = req.body;
    if (!paypalOrderId) return res.status(400).json({ message: "paypalOrderId required" });

    const request = new checkout.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});

    const capture = await paypalClient.execute(request);
    // check capture.result.status === 'COMPLETED' or 'APPROVED'
    const status = capture.result.status;

    // If you store order in DB: mark payment true
    if (localOrderId) {
      try {
        const order = await Order.findById(localOrderId);
        if (order) {
          order.payment = true;
          order.paypalOrderId = capture.result.id || paypalOrderId; // reuse field or store separate
          await order.save();
        }
      } catch (dbErr) {
        console.warn("Failed updating local order payment status:", dbErr.message);
      }
    }

    return res.status(200).json({ status, capture: capture.result });
  } catch (err) {
    console.error("capturePayPalOrder error:", err);
    return res.status(500).json({ message: "capture paypal order error", error: err.message });
  }
};
