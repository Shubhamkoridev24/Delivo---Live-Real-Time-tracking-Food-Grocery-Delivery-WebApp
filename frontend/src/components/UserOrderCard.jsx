import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";

function UserOrderCard({ data }) {
  const navigate = useNavigate();
  const [selectedRating, setSelectedRating] = useState({})
  // ❌ agar data hi galat hai → kuch bhi render mat kar
  if (
    !data ||
    !data._id ||
    !Array.isArray(data.shopOrders) ||
    data.shopOrders.length === 0
  ) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleRating = async (itemId, rating) => {
    try {
      const result = await axios.post(`${serverUrl}/api/item/rating`, { itemId, rating }, { withCredentials: true })
      setSelectedRating(prev => ({
        ...prev, [itemId]: rating
      }))
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      {/* HEADER */}
      <div className="flex justify-between border-b pb-2">
        <div>
          <p className="font-semibold">
            Order #{String(data._id).slice(-6)}
          </p>
          <p className="text-sm text-gray-500">
            Date: {formatDate(data.createdAt)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-gray-500">
            {data.paymentMethod?.toUpperCase() || "COD"}
          </p>
          <p className="font-medium text-blue-600">
            {data.shopOrders[0]?.status || "Pending"}
          </p>
        </div>
      </div>

      {/* SHOP ORDERS */}
      {data.shopOrders.map((shopOrder, index) => {
        if (!shopOrder) return null;

        return (
          <div
            key={index}
            className="border rounded-lg p-3 bg-[#fffaf7] space-y-3"
          >
            <p className="font-medium">
              {shopOrder.shop?.name || "Shop"}
            </p>

            <div className="flex space-x-4 overflow-x-auto pb-2">
              {(shopOrder.shopOrderItems || []).map((item, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-40 border rounded-lg p-2 bg-white"
                >
                  <img
                    src={item.image || item.item?.image}
                    alt={item.name}
                    className="w-full h-24 object-cover rounded"
                  />
                  <p className="text-sm font-semibold mt-1">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Qty: {item.quantity} × ₹{item.price}
                  </p>

                  {shopOrder.status == "delivered" && <div className='flex space-x-1 mt-2'>
                    {[1,2,3,4,5].map((star) => (
  <button
    key={star}
    onClick={() => handleRating(item.item._id, star)}
    className={`${
      selectedRating[item.item._id] >= star
        ? "text-yellow-400"
        : "text-gray-400"
    }`}
  >
    ★
  </button>
))}

                  </div>}
                </div>
              ))}
            </div>


            <div className="flex justify-between items-center border-t pt-2">
              <p className="font-semibold">
                Subtotal: ₹{shopOrder.subTotal || shopOrder.subtotal || 0}
              </p>
              <span className="text-sm font-medium text-blue-600">
                {shopOrder.status || "Pending"}
              </span>
            </div>
          </div>
        );
      })}

      {/* FOOTER */}
      <div className="flex justify-between items-center border-t pt-2">
        <p className="font-semibold">
          Total: ₹{data.totalAmount || 0}
        </p>
        <button
          className="bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm"
          onClick={() => navigate(`/track-order/${data._id}`)}
        >
          Track Order
        </button>
      </div>
    </div>
  );
}

export default UserOrderCard;
