// backend/config/paypal.config.js
import checkout from "@paypal/checkout-server-sdk";
import dotenv from "dotenv";
dotenv.config();

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_SECRET;
const mode = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";

const Environment = mode === "live"
  ? checkout.core.LiveEnvironment
  : checkout.core.SandboxEnvironment;

const client = new checkout.core.PayPalHttpClient(
  new Environment(clientId, clientSecret)
);

export default client;
