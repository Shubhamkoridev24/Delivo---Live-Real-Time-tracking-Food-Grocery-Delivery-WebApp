import React, { useEffect } from "react";
import axios from "axios";

function loadScript(src) {
  return new Promise((resolve) => {
    const tag = document.createElement("script");
    tag.src = src;
    tag.onload = () => resolve(true);
    document.body.appendChild(tag);
  });
}

export default function PayPalButton({ amount, onSuccess, onError, orderLocalId }) {
  useEffect(() => {
    const init = async () => {
      await loadScript(
        `https://www.paypal.com/sdk/js?client-id=${
          import.meta.env.VITE_PAYPAL_CLIENT_ID
        }&currency=USD`
      );

      if (!window.paypal) return;

      window.paypal
        .Buttons({
          createOrder: async () => {
            const resp = await axios.post(
              "/api/payment/create-paypal-order",
              { amount },
              { withCredentials: true }
            );

            return resp.data.paypalOrderId;
          },

          onApprove: async (data) => {
            const captureResp = await axios.post(
              "/api/payment/capture-paypal-order",
              {
                paypalOrderId: data.orderID,
                localOrderId: orderLocalId
              },
              { withCredentials: true }
            );

            if (captureResp.data.status === "COMPLETED") {
              onSuccess(captureResp.data);
            } else {
              onError(captureResp.data);
            }
          },

          onError: (err) => onError(err)
        })
        .render("#paypal-button-container");
    };

    init();
  }, []);

  return <div id="paypal-button-container"></div>;
}
